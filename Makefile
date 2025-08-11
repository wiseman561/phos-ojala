SHELL := /bin/bash

.PHONY: dev dev-fe dev-be restore build test

detect-pm = bash -lc 'd="$(1)"; if [ -f "$$d/pnpm-lock.yaml" ] || [ -f "$$d/pnpm-workspace.yaml" ]; then echo pnpm; elif [ -f "$$d/package-lock.json" ]; then echo npm; elif [ -f "$$d/yarn.lock" ]; then echo yarn; else echo npm; fi'

dev:
	@echo "Starting PHOS (frontend + backend) with defaults..."
	@echo "Ensure Postgres/Redis are running locally or via Docker."
	@echo "Frontend:"
	@if [ -f "src/frontend/phos-web/package.json" ]; then \
	  PM=$$(eval $(call detect-pm,src/frontend/phos-web)); \
	  echo "Using $$PM in src/frontend/phos-web"; \
	  case "$$PM" in \
	    pnpm) (cd src/frontend/phos-web && pnpm dev || pnpm start || npm run dev || yarn dev) & ;; \
	    npm)  (cd src/frontend/phos-web && npm run dev || npm start || yarn dev) & ;; \
	    yarn) (cd src/frontend/phos-web && yarn dev || yarn start || npm run dev) & ;; \
	  esac; \
	else \
	  echo "No default frontend found at src/frontend/phos-web"; \
	fi; \
	echo "Backend: build & run"; \
	if [ -f "Phos.sln" ]; then \
	  dotnet build Phos.sln -c Debug && \
	  echo "Start your API(s) with 'dotnet run' in their projects."; \
	else \
	  echo "No solution found; open individual projects and run 'dotnet run'."; \
	fi

restore:
	@if [ -f "Phos.sln" ]; then \
	  dotnet restore Phos.sln; \
	else \
	  if compgen -G "src/backend/**/*.csproj" > /dev/null; then \
	    find src/backend -name "*.csproj" -print0 | xargs -0 -I{} dotnet restore "{}"; \
	  fi; \
	fi
	@if compgen -G "src/frontend/*/package.json" > /dev/null; then \
	  for pkg in src/frontend/*/package.json; do \
	    app_dir="$$(dirname "$$pkg")"; \
	    PM=$$(eval $(call detect-pm,$$app_dir)); \
	    echo "Installing deps in $$app_dir using $$PM"; \
	    case "$$PM" in \
	      pnpm) (cd "$$app_dir" && (corepack enable || true) && (corepack prepare pnpm@latest --activate || true) && pnpm install) ;; \
	      npm)  (cd "$$app_dir" && (npm ci || npm install)) ;; \
	      yarn) (cd "$$app_dir" && yarn install) ;; \
	    esac; \
	  done; \
	fi

build:
	@if compgen -G "src/frontend/*/package.json" > /dev/null; then \
	  for pkg in src/frontend/*/package.json; do \
	    app_dir="$$(dirname "$$pkg")"; \
	    PM=$$(eval $(call detect-pm,$$app_dir)); \
	    echo "Building $$app_dir using $$PM"; \
	    case "$$PM" in \
	      pnpm) (cd "$$app_dir" && pnpm build || npm run build || yarn build) ;; \
	      npm)  (cd "$$app_dir" && npm run build || yarn build || pnpm build) ;; \
	      yarn) (cd "$$app_dir" && yarn build || npm run build || pnpm build) ;; \
	    esac; \
	  done; \
	fi
	@if [ -f "Phos.sln" ]; then \
	  dotnet build Phos.sln -c Release; \
	fi

test:
	@if [ -f "Phos.sln" ]; then \
	  dotnet test Phos.sln -c Release --no-build; \
	else \
	  if compgen -G "tests/**/*Tests*.csproj" > /dev/null; then \
	    find tests -name "*Tests*.csproj" -print0 | xargs -0 -I{} dotnet test "{}" -c Release --no-build; \
	  else \
	    echo "No .NET test projects found."; \
	  fi; \
	fi

#!/usr/bin/env bash
set -e

corepack enable || true
corepack prepare pnpm@latest --activate || true

detect_pm() {
  local dir="$1"
  if [ -f "$dir/pnpm-lock.yaml" ] || [ -f "$dir/pnpm-workspace.yaml" ]; then
    echo "pnpm"
  elif [ -f "$dir/package-lock.json" ]; then
    echo "npm"
  elif [ -f "$dir/yarn.lock" ]; then
    echo "yarn"
  else
    echo "npm"
  fi
}

install_frontend_deps() {
  local dir="$1"
  local pm
  pm=$(detect_pm "$dir")
  echo "Detected package manager '$pm' in $dir"
  case "$pm" in
    pnpm)
      (cd "$dir" && pnpm install) ;;
    npm)
      (cd "$dir" && (npm ci || npm install)) ;;
    yarn)
      (cd "$dir" && yarn install) ;;
  esac
}

# Frontend: install dependencies for each app under src/frontend/*
if compgen -G "src/frontend/*/package.json" > /dev/null; then
  for pkg in src/frontend/*/package.json; do
    app_dir="$(dirname "$pkg")"
    echo "Installing frontend deps in $app_dir"
    install_frontend_deps "$app_dir"
  done
fi

# Backend: restore all .csproj under src/backend and tests
if compgen -G "src/backend/**/*.csproj" > /dev/null; then
  find src/backend -name "*.csproj" -print0 | xargs -0 -I{} dotnet restore "{}"
fi
if compgen -G "tests/**/*.csproj" > /dev/null; then
  find tests -name "*.csproj" -print0 | xargs -0 -I{} dotnet restore "{}"
fi

echo "Devcontainer post-create completed."

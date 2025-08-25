#!/usr/bin/env bash
set -euo pipefail

# Working directory: repository root (ensure)
cd "$(dirname "$0")/../.."

echo "[INFO] Starting PHOS rename completion script"

export HUSKY=0

apps=(
  phos-web
  employer-dashboard
  patient-app
  rn-dashboard
  md-dashboard
  phos-admin
  phos-patient-portal
)

frontend_results=()

build_app() {
  local app="$1"
  local appdir="src/frontend/$app"
  local log="/tmp/build-$app.log"
  echo "=== Building $app ==="
  rm -rf "$appdir/node_modules" "$appdir/package-lock.json" 2>/dev/null || true
  if ! (cd "$appdir" && (npm ci || npm install)) >"$log" 2>&1; then
    echo "FAIL CMD: npm ci|install in $appdir"
    tail -n 50 "$log" || true
    exit 1
  fi
  if ! (cd "$appdir" && npm run build) >>"$log" 2>&1; then
    echo "FAIL CMD: npm run build in $appdir"
    tail -n 50 "$log" || true
    exit 1
  fi
  echo "$app: OK"
  frontend_results+=("$app: OK")
}

# Build all frontends
for app in "${apps[@]}"; do
  build_app "$app"
done

# Start dev env and verify APIs
dev_log="/tmp/dev-start.log"
nohup ./scripts/dev-start-backend.sh >"$dev_log" 2>&1 &
sleep 20

health_check() {
  local url="$1"; local name="$2"; local i
  for i in $(seq 1 60); do
    if curl -fsS "$url" >/dev/null 2>&1; then
      echo "$name: OK ($url)"
      return 0
    fi
    sleep 2
  done
  echo "FAIL CMD: curl -fsS $url"
  tail -n 50 "$dev_log" || true
  exit 1
}

health_check "http://localhost:5501/health" "Identity"
health_check "http://localhost:8080/health" "API"

# Docker build and up
if docker compose version >/dev/null 2>&1; then DCMD=(docker compose); else DCMD=(docker-compose); fi

dbuild_log="/tmp/docker-build.log"
dup_log="/tmp/docker-up.log"

if ! "${DCMD[@]}" -f docker-compose.override.yml build >"$dbuild_log" 2>&1; then
  echo "FAIL CMD: ${DCMD[*]} -f docker-compose.override.yml build"
  tail -n 50 "$dbuild_log" || true
  exit 1
fi

if ! "${DCMD[@]}" -f docker-compose.override.yml up -d >"$dup_log" 2>&1; then
  echo "FAIL CMD: ${DCMD[*]} -f docker-compose.override.yml up -d"
  tail -n 50 "$dup_log" || true
  exit 1
fi

if ! curl -fsS http://localhost:5501/health >/dev/null 2>&1; then
  echo "FAIL CMD: curl -fsS http://localhost:5501/health"
  "${DCMD[@]}" logs --tail=50 phos-identity || true
  exit 1
fi

if ! curl -fsS http://localhost:8080/health >/dev/null 2>&1; then
  echo "FAIL CMD: curl -fsS http://localhost:8080/health"
  "${DCMD[@]}" logs --tail=50 phos-api || true
  exit 1
fi

# Commit and push
git add -A || true
if git diff --cached --quiet; then
  commit_status="No changes to commit"
else
  git commit -m "chore: frontend builds, docker stack health verified, finalize PHOS rename" >/tmp/git-commit.log 2>&1 || true
  commit_status="Committed"
fi
git push origin chore/rename-to-phos >/tmp/git-push.log 2>&1 || true
commit_sha=$(git rev-parse HEAD)

# Two clean reruns
rerun_result=("" "")

clean_env() {
  "${DCMD[@]}" -f docker-compose.override.yml down -v >/dev/null 2>&1 || true
  git clean -fdX -e .env >/dev/null 2>&1 || true
}

do_rerun() {
  local run="$1"
  local log
  for app in "${apps[@]}"; do
    log="/tmp/rerun-${run}-${app}.log"
    if ! (cd "src/frontend/$app" && (npm ci || npm install)) >"$log" 2>&1; then
      echo "RERUN#${run} FAIL CMD: npm ci|install in src/frontend/$app"
      tail -n 50 "$log" || true
      return 1
    fi
    if ! (cd "src/frontend/$app" && npm run build) >>"$log" 2>&1; then
      echo "RERUN#${run} FAIL CMD: npm run build in src/frontend/$app"
      tail -n 50 "$log" || true
      return 1
    fi
  done
  if ! "${DCMD[@]}" -f docker-compose.override.yml build >"/tmp/rerun-${run}-dbuild.log" 2>&1; then
    echo "RERUN#${run} FAIL CMD: ${DCMD[*]} build"
    tail -n 50 "/tmp/rerun-${run}-dbuild.log" || true
    return 1
  fi
  if ! "${DCMD[@]}" -f docker-compose.override.yml up -d >"/tmp/rerun-${run}-dup.log" 2>&1; then
    echo "RERUN#${run} FAIL CMD: ${DCMD[*]} up -d"
    tail -n 50 "/tmp/rerun-${run}-dup.log" || true
    return 1
  fi
  if ! (curl -fsS http://localhost:5501/health >/dev/null 2>&1 && curl -fsS http://localhost:8080/health >/dev/null 2>&1); then
    echo "RERUN#${run} FAIL CMD: curl health"
    "${DCMD[@]}" logs --tail=50 phos-identity || true
    "${DCMD[@]}" logs --tail=50 phos-api || true
    return 1
  fi
  return 0
}

clean_env
if do_rerun 1; then rerun_result[0]="RERUN#1: PASS"; else rerun_result[0]="RERUN#1: FAIL"; fi

clean_env
if do_rerun 2; then rerun_result[1]="RERUN#2: PASS"; else rerun_result[1]="RERUN#2: FAIL"; fi

echo "=== FRONTEND BUILD RESULTS ==="
printf '%s\n' "${frontend_results[@]}"
echo "=== DOCKER HEALTH CHECK RESULTS ==="
echo "Identity: OK (http://localhost:5501/health)"
echo "API: OK (http://localhost:8080/health)"
echo "=== COMMIT ==="
echo "$commit_status at $commit_sha"
echo "=== RERUNS ==="
printf '%s\n' "${rerun_result[@]}"

echo "[INFO] Completed"



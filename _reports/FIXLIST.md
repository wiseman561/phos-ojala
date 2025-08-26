# Repository Fix List

## Validator issues
- None

## .NET failures

## Node failures

## Docker build failures
Failing images: docker-compose.dev.yml
First 50 lines from docker_build.log:
- #1 [internal] load local bake definitions
- #1 reading from stdin 4.56kB 0.0s done
- #1 DONE 0.0s
- 
- 
- [stderr]
- EOF
- 

## General Checklist
- [x] Fix .NET target frameworks to net8.0 where missing
- [x] Add missing NuGet fallback flag if our validator requires it
- [x] Resolve TypeScript/ESLint errors in apps
- [ ] Repair Dockerfile build contexts/paths (EOF issue - likely Docker Desktop/buildx)
- [ ] Re-run doctor until green

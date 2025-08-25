# Repository Doctor Status

## Validator
- Status: Passed âœ…
- Notes: Validator succeeded

- [x] Repository structure valid

## .NET Builds
| Service | Status | Errors (first lines) |
|---|---|---|
| AuthControllerManualTest | Failed âŒ | MSBUILD : error MSB1009: Project file does not exist. |
| AuthControllerTestRunner | Failed âŒ | MSBUILD : error MSB1009: Project file does not exist. |
| AuthControllerTests.Simple | Failed âŒ | MSBUILD : error MSB1009: Project file does not exist. |
| MigrationHelper | Failed âŒ | MSBUILD : error MSB1009: Project file does not exist. |
| Phos.Api | Failed âŒ | MSBUILD : error MSB1009: Project file does not exist. |
| Phos.Api.Tests | Failed âŒ | MSBUILD : error MSB1009: Project file does not exist. |
| Phos.ApiGateway | Failed âŒ | MSBUILD : error MSB1009: Project file does not exist. |
| Phos.Data | Failed âŒ | MSBUILD : error MSB1009: Project file does not exist. |
| Phos.HealthScore | Failed âŒ | MSBUILD : error MSB1009: Project file does not exist. |
| Phos.Identity | Failed âŒ | MSBUILD : error MSB1009: Project file does not exist. |
| Phos.Services | Failed âŒ | MSBUILD : error MSB1009: Project file does not exist. |

### .NET Checklist
- [ ] AuthControllerManualTest
- [ ] AuthControllerTestRunner
- [ ] AuthControllerTests.Simple
- [ ] MigrationHelper
- [ ] Phos.Api
- [ ] Phos.Api.Tests
- [ ] Phos.ApiGateway
- [ ] Phos.Data
- [ ] Phos.HealthScore
- [ ] Phos.Identity
- [ ] Phos.Services

## Node Builds
| App | Status | Errors (first lines) |
|---|---|---|
| api-gateway | Failed âŒ | Exception: Exception calling "Start" with "0" argument(s): "The system cannot find the file specified" |
| phos-ui | Failed âŒ | Exception: Exception calling "Start" with "0" argument(s): "The system cannot find the file specified" |

### Node Checklist
- [ ] api-gateway
- [ ] phos-ui

## Docker Build
- Status: Failed âŒ
- Errors:
  - Compose file not found: phos/docker-compose.yml

- [ ] Docker compose build

## Summary
- Overall: Failed âŒ
- Fail count: 14
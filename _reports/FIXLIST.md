## Fix List

- [ ] Fix .NET target frameworks to net8.0 where missing
- [ ] Add missing NuGet fallback flag if our validator requires it
- [ ] Resolve TypeScript/ESLint errors in apps
- [ ] Repair Dockerfile build contexts/paths
- [ ] Re-run doctor until green

### Validator issues

Validator passed.

### .NET failures

#### AuthControllerManualTest

```text
MSBUILD : error MSB1009: Project file does not exist.
```

- Failing files/paths:
  - `src/backend/AuthControllerManualTest/AuthControllerManualTest.csproj`

#### AuthControllerTestRunner

```text
MSBUILD : error MSB1009: Project file does not exist.
```

- Failing files/paths:
  - `src/backend/AuthControllerTestRunner/AuthControllerTestRunner.csproj`

#### AuthControllerTests.Simple

```text
MSBUILD : error MSB1009: Project file does not exist.
```

- Failing files/paths:
  - `src/backend/AuthControllerTests.Simple/AuthControllerTests.Simple.csproj`

#### MigrationHelper

```text
MSBUILD : error MSB1009: Project file does not exist.
```

- Failing files/paths:
  - `src/backend/MigrationHelper/MigrationHelper.csproj`

#### Phos.Api

```text
MSBUILD : error MSB1009: Project file does not exist.
Switch:  C:\Users\15612\Desktop\Repositories\Ojala-healthcare_new\src\backend\Phos.Api\Phos.Api.csproj 
```

- Failing files/paths:
  - `src/backend/Phos.Api/Phos.Api.csproj`

#### Phos.Api.Tests

```text
MSBUILD : error MSB1009: Project file does not exist.
```

- Failing files/paths:
  - `src/backend/Phos.Api.Tests/Phos.Api.Tests.csproj`

#### Phos.ApiGateway

```text
MSBUILD : error MSB1009: Project file does not exist.
```

- Failing files/paths:
  - `src/backend/Phos.ApiGateway/Phos.ApiGateway.csproj`

#### Phos.Data

```text
MSBUILD : error MSB1009: Project file does not exist.
```

- Failing files/paths:
  - `src/backend/Phos.Data/Phos.Data.csproj`

#### Phos.HealthScore

```text
MSBUILD : error MSB1009: Project file does not exist.
```

- Failing files/paths:
  - `src/backend/Phos.HealthScore/Phos.HealthScore.csproj`

#### Phos.Identity

```text
MSBUILD : error MSB1009: Project file does not exist.
Switch:  C:\Users\15612\Desktop\Repositories\Ojala-healthcare_new\src\backend\Phos.Identity\Phos.Identity.csproj 
```

- Failing files/paths:
  - `src/backend/Phos.Identity/Phos.Identity.csproj`

#### Phos.Services

```text
MSBUILD : error MSB1009: Project file does not exist.
```

- Failing files/paths:
  - `src/backend/Phos.Services/Phos.Services.csproj`

### Node failures

Node builds are currently silenced unless both apps exist and npm is available. If you intend to build these apps locally, ensure directories exist and Node/npm are installed; then re-run the doctor.

### Docker build

Skipped if compose file doesn't exist. Add `phos/docker-compose.yml` to enable.



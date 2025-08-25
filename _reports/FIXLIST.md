## Fix List

- [ ] Fix .NET target frameworks to net8.0 where missing
- [ ] Add missing NuGet fallback flag if our validator requires it
- [ ] Resolve TypeScript/ESLint errors in apps
- [ ] Repair Dockerfile build contexts/paths
- [ ] Re-run doctor until green

### Validator issues

```text
At C:\Users\15612\Desktop\Repositories\Ojala-healthcare_new\validate-repository-structure.ps1:87 char:42
Missing closing '}' in statement block or type definition.
At C:\Users\15612\Desktop\Repositories\Ojala-healthcare_new\validate-repository-structure.ps1:71 char:37
Missing closing '}' in statement block or type definition.
At C:\Users\15612\Desktop\Repositories\Ojala-healthcare_new\validate-repository-structure.ps1:44 char:48
Missing closing '}' in statement block or type definition.
```

### .NET failures

#### Phos.GenomeKit

```text
MSBUILD : error MSB1009: Project file does not exist.
Switch:  C:\Users\15612\Desktop\Repositories\Ojala-healthcare_new\phos\services\genome-kit\Phos.GenomeKit.csproj 
```

- Failing files/paths:
  - `phos/services/genome-kit/Phos.GenomeKit.csproj`

#### Phos.LabInterpreter

```text
MSBUILD : error MSB1009: Project file does not exist.
Switch:  C:\Users\15612\Desktop\Repositories\Ojala-healthcare_new\phos\services\lab-interpreter\Phos.LabInterpreter.csproj 
```

- Failing files/paths:
  - `phos/services/lab-interpreter/Phos.LabInterpreter.csproj`

#### Phos.MicrobiomeKit

```text
MSBUILD : error MSB1009: Project file does not exist.
Switch:  C:\Users\15612\Desktop\Repositories\Ojala-healthcare_new\phos\services\microbiome-kit\Phos.MicrobiomeKit.csproj 
```

- Failing files/paths:
  - `phos/services/microbiome-kit/Phos.MicrobiomeKit.csproj`

#### Phos.NutritionKit

```text
MSBUILD : error MSB1009: Project file does not exist.
Switch:  C:\Users\15612\Desktop\Repositories\Ojala-healthcare_new\phos\services\nutrition-kit\Phos.NutritionKit.csproj 
```

- Failing files/paths:
  - `phos/services/nutrition-kit/Phos.NutritionKit.csproj`

#### Phos.PhosCore

```text
MSBUILD : error MSB1009: Project file does not exist.
Switch:  C:\Users\15612\Desktop\Repositories\Ojala-healthcare_new\phos\services\phos-core\Phos.PhosCore.csproj 
```

- Failing files/paths:
  - `phos/services/phos-core/Phos.PhosCore.csproj`

#### Phos.SleepKit

```text
MSBUILD : error MSB1009: Project file does not exist.
Switch:  C:\Users\15612\Desktop\Repositories\Ojala-healthcare_new\phos\services\sleep-kit\Phos.SleepKit.csproj 
```

- Failing files/paths:
  - `phos/services/sleep-kit/Phos.SleepKit.csproj`

### Node failures

#### api-gateway

```text
Exception: Exception calling "Start" with "0" argument(s): "The system cannot find the file specified"
```

#### phos-ui

```text
Exception: Exception calling "Start" with "0" argument(s): "The system cannot find the file specified"
```

### Docker build failures

- Summary: compose file not found or bad path

```text
open C:\Users\15612\Desktop\Repositories\Ojala-healthcare_new\ phos\docker-compose.dev.yml: The system cannot find the path specified.
```



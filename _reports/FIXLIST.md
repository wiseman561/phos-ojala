## Fix List

- [ ] Fix .NET target frameworks to net8.0 where missing
- [ ] Add missing NuGet fallback flag if our validator requires it
- [ ] Resolve TypeScript/ESLint errors in apps
- [ ] Repair Dockerfile build contexts/paths
- [ ] Re-run doctor until green

### Validator issues

Validator passed.

### .NET failures

(OK)

### Node failures

#### api-gateway
```text
The `npm ci` command can only install with an existing package-lock.json.
Generate package-lock.json (npm install) or add lockfile, then retry.
```

#### phos-ui
```text
The `npm ci` command can only install with an existing package-lock.json.
Generate package-lock.json (npm install) or add lockfile, then retry.
```

### Docker build

Skipped or passed.



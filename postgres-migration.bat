@echo off
echo ========================================
echo Phos PostgreSQL Migration Script
echo ========================================

echo Setting environment variable...
set DB_CONNECTION_STRING=Host=localhost;Database=phos_dev;Username=postgres;Password=postgres

echo.
echo Step 1: Generating PostgreSQL migrations...
dotnet ef migrations add InitialPostgresSchema --project src/backend/Phos.Data --startup-project src/backend/Phos.Data -c PhosDbContext
if %ERRORLEVEL% NEQ 0 (
    echo FAILED: Migration generation failed with error %ERRORLEVEL%
    pause
    exit /b %ERRORLEVEL%
)
echo SUCCESS: PostgreSQL migrations generated

echo.
echo Step 2: Cleaning solution...
dotnet clean PhosHealthcarePlatform.sln
if %ERRORLEVEL% NEQ 0 (
    echo FAILED: Clean failed with error %ERRORLEVEL%
    pause
    exit /b %ERRORLEVEL%
)
echo SUCCESS: Solution cleaned

echo.
echo Step 3: Restoring packages...
dotnet restore PhosHealthcarePlatform.sln
if %ERRORLEVEL% NEQ 0 (
    echo FAILED: Restore failed with error %ERRORLEVEL%
    pause
    exit /b %ERRORLEVEL%
)
echo SUCCESS: Packages restored

echo.
echo Step 4: Building solution...
dotnet build PhosHealthcarePlatform.sln -c Release
if %ERRORLEVEL% NEQ 0 (
    echo FAILED: Build failed with error %ERRORLEVEL%
    pause
    exit /b %ERRORLEVEL%
)
echo SUCCESS: Solution built

echo.
echo Step 5: Running tests...
dotnet test PhosHealthcarePlatform.sln
if %ERRORLEVEL% NEQ 0 (
    echo FAILED: Tests failed with error %ERRORLEVEL%
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo ========================================
echo SUCCESS: PostgreSQL migration completed!
echo ========================================
echo - SQL Server packages: REMOVED
echo - PostgreSQL packages: CONFIGURED
echo - UseSqlServer calls: REPLACED with UseNpgsql
echo - Migrations: REGENERATED for PostgreSQL
echo - Build: PASSED
echo - Tests: PASSED
echo ========================================
pause

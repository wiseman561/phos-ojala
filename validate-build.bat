@echo off
echo ========================================
echo Phos Healthcare Platform Build Validation
echo ========================================

echo.
echo Step 1: Restoring packages...
dotnet restore PhosHealthcarePlatform.sln
if %ERRORLEVEL% NEQ 0 (
    echo FAILED: Package restore failed with error %ERRORLEVEL%
    pause
    exit /b %ERRORLEVEL%
)
echo SUCCESS: Package restore completed

echo.
echo Step 2: Building solution in Release mode...
dotnet build PhosHealthcarePlatform.sln -c Release
if %ERRORLEVEL% NEQ 0 (
    echo FAILED: Build failed with error %ERRORLEVEL%
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo ========================================
echo SUCCESS: All validation steps passed!
echo ========================================
echo - NU1008 (Version conflicts): RESOLVED
echo - NU1102 (Identity package): RESOLVED
echo - Missing dependencies: RESOLVED
echo ========================================
pause

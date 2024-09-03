@echo off
call :log Starting script...
cls
echo.
echo ========================================================
echo    Daqroc Test Manager by Flynn Research Group
echo        University of Michigan, Ben Datsko
echo ========================================================
echo.
call :log Initializing...
timeout /t 2 >nul
set "SYSTEM_NAME=DaqrocSystem"
:: Navigate to the project root directory
cd /d "%~dp0"

:: Check if we're in the correct directory
if not exist "webapp" (
    call :log Error: webapp directory not found.
    goto :error
)
if not exist "api" (
    call :log Error: api directory not found.
    goto :error
)

call :log Building Test Benches

:: Run PlatformIO upload
platformio init
call :log Starting PlatformIO upload...
pushd "%PIO_PROJECT_DIR%"
echo [%time%] [TESTSERVICE] pio run -t upload
if %errorlevel% neq 0 (
    call :log Error: PlatformIO upload failed.
    popd
    goto :error
)
popd
call :log PlatformIO upload completed successfully.

:: Run both npm commands concurrently with labels
call :log Starting webapp and api...
concurrently --names "WEBAPP,API" -c "magenta,cyan" "cd webapp && npm run dev" "cd api && npm start"

:: If we get here, everything ran successfully
call :log Script completed successfully.
goto :end

:error
call :log An error occurred. Exiting...
pause
goto :end

:end
call :log Script ended.
pause
endlocal

:log
echo [%time%] [%SYSTEM_NAME%] %*
>> logfile.txt echo [%time%] [%SYSTEM_NAME%] %*
exit /b

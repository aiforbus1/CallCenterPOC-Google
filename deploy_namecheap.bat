@echo off
setlocal EnableDelayedExpansion
title AI Call Center - Namecheap Deployment Packager ^& Deployer
color 0B

echo ==============================================================================
echo    AI CALL CENTER (POLICE 122 HOTLINE) - NAMECHEAP DEPLOYMENT TOOL
echo ==============================================================================
echo.

if /I "%1"=="build" goto BUILD_ONLY
if /I "%1"=="deploy" goto BUILD_AND_DEPLOY
if /I "%1"=="open" goto OPEN_DIST

:MENU
set "CHOICE=1"
echo Choose an action:
echo   [1] Build and Package Latest App (API + Web Portal for cPanel / VPS)
echo   [2] Build and Direct Deploy via SSH / SCP to Namecheap Server
echo   [3] Open Packages Folder (dist\namecheap) in Windows Explorer
echo   [4] Exit
echo.
set /p CHOICE="Enter choice (1-4) [default: 1]: "

if "%CHOICE%"=="1" goto BUILD_ONLY
if "%CHOICE%"=="2" goto BUILD_AND_DEPLOY
if "%CHOICE%"=="3" goto OPEN_DIST
if "%CHOICE%"=="4" goto EXIT
echo Invalid selection. Please choose 1, 2, 3, or 4.
goto EXIT

:BUILD_ONLY
echo.
echo ==============================================================================
echo  [STEP 1/3] Building Web Frontend (Next.js Static Export)...
echo ==============================================================================
cd /d "%~dp0apps\web"
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Web frontend build failed! Check errors above.
    pause
    goto MENU
)
cd /d "%~dp0"

echo.
echo ==============================================================================
echo  [STEP 2/3] Packaging Python Backend API for Namecheap...
echo ==============================================================================
python scripts\package_namecheap.py
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Backend packaging failed! Check errors above.
    pause
    goto MENU
)

echo.
echo ==============================================================================
echo  [STEP 3/3] Packaging Web Frontend for Namecheap...
echo ==============================================================================
python scripts\package_web.py
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Web packaging failed! Check errors above.
    pause
    goto MENU
)

echo.
echo ==============================================================================
echo  [SUCCESS] All production packages generated successfully!
echo ==============================================================================
echo Output Files:
echo   Backend API:  %~dp0dist\namecheap\callcenter_api_namecheap.zip
echo   Web Portal:   %~dp0dist\namecheap\admin_portal_namecheap.zip
echo.
echo These files are ready to be uploaded to your Namecheap cPanel or VPS.
if not "%1"=="" goto EXIT
goto PROMPT_EXPLORER

:BUILD_AND_DEPLOY
call :BUILD_ONLY_SILENT
if %BUILD_FAILED%==1 goto MENU

echo.
echo ==============================================================================
echo  Remote SSH / SCP Deployment Configuration
echo ==============================================================================
set /p SSH_HOST="Enter Namecheap Host/IP (e.g., yourdomain.com or 198.54.120.x): "
if "%SSH_HOST%"=="" (
    echo [ERROR] Hostname cannot be empty.
    pause
    goto MENU
)

set /p SSH_USER="Enter cPanel/SSH Username: "
if "%SSH_USER%"=="" (
    echo [ERROR] Username cannot be empty.
    pause
    goto MENU
)

set /p SSH_PORT="Enter SSH Port [default: 21098 for Namecheap cPanel, 22 for VPS]: "
if "%SSH_PORT%"=="" set SSH_PORT=21098

set /p REMOTE_APP_DIR="Enter Backend App Directory [default: callcenter_api]: "
if "%REMOTE_APP_DIR%"=="" set REMOTE_APP_DIR=callcenter_api

set /p REMOTE_WEB_DIR="Enter Web Directory [default: public_html/122Nagda]: "
if "%REMOTE_WEB_DIR%"=="" set REMOTE_WEB_DIR=public_html/122Nagda

echo.
echo Deploying to %SSH_USER%@%SSH_HOST%:%SSH_PORT% ...
echo 1. Creating remote temporary folders...
ssh -p %SSH_PORT% %SSH_USER%@%SSH_HOST% "mkdir -p ~/tmp_deploy ~/%REMOTE_APP_DIR% ~/%REMOTE_WEB_DIR%"

echo 2. Uploading deployment packages via SCP...
scp -P %SSH_PORT% "%~dp0dist\namecheap\callcenter_api_namecheap.zip" "%~dp0dist\namecheap\admin_portal_namecheap.zip" %SSH_USER%@%SSH_HOST%:~/tmp_deploy/

echo 3. Unpacking and restarting remote services...
ssh -p %SSH_PORT% %SSH_USER%@%SSH_HOST% "unzip -o ~/tmp_deploy/callcenter_api_namecheap.zip -d ~/%REMOTE_APP_DIR%/ && unzip -o ~/tmp_deploy/admin_portal_namecheap.zip -d ~/%REMOTE_WEB_DIR%/ && mkdir -p ~/%REMOTE_APP_DIR%/tmp && touch ~/%REMOTE_APP_DIR%/tmp/restart.txt && rm -rf ~/tmp_deploy && echo 'Deployment completed successfully!'"

echo.
echo ==============================================================================
echo  [DONE] Remote deployment finished!
echo ==============================================================================
pause
goto MENU

:BUILD_ONLY_SILENT
set BUILD_FAILED=0
echo.
echo [1/3] Building Web Frontend...
cd /d "%~dp0apps\web"
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Web build failed!
    set BUILD_FAILED=1
    cd /d "%~dp0"
    exit /b
)
cd /d "%~dp0"

echo [2/3] Packaging Backend...
python scripts\package_namecheap.py
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Backend package failed!
    set BUILD_FAILED=1
    exit /b
)

echo [3/3] Packaging Web...
python scripts\package_web.py
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Web package failed!
    set BUILD_FAILED=1
    exit /b
)
exit /b

:PROMPT_EXPLORER
set /p OPEN_EXP="Would you like to open the output folder in Windows Explorer? (Y/N) [default: Y]: "
if "%OPEN_EXP%"=="" set OPEN_EXP=Y
if /I "%OPEN_EXP%"=="Y" (
    explorer "%~dp0dist\namecheap"
)
pause
goto MENU

:OPEN_DIST
explorer "%~dp0dist\namecheap"
goto MENU

:EXIT
echo Exiting...
endlocal

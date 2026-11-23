@echo off
setlocal EnableDelayedExpansion
title AI Call Center - Google VPS (Ubuntu 24) Deployment Tool
color 0A

echo ==============================================================================
echo    AI CALL CENTER (POLICE 122) - GOOGLE VPS (UBUNTU 24.04) DEPLOYER
echo ==============================================================================
echo.

if /I "%1"=="build" goto BUILD_ONLY
if /I "%1"=="deploy" goto BUILD_AND_DEPLOY
if /I "%1"=="open" goto OPEN_DIST

:MENU
set "CHOICE=1"
echo Choose an action:
echo   [1] Package Application for Google VPS (dist\google_vps\callcenter_google_vps.tar.gz)
echo   [2] Package and Direct Deploy to Google VPS via SCP/SSH
echo   [3] Open Packages Folder in Windows Explorer
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
echo  Generating Google VPS Production Package...
echo ==============================================================================
python scripts\package_vps.py
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Packaging failed! Check errors above.
    pause
    goto MENU
)
echo.
echo [SUCCESS] Package created at dist\google_vps\callcenter_google_vps.tar.gz
if not "%1"=="" goto EXIT
goto PROMPT_EXPLORER

:BUILD_AND_DEPLOY
call :BUILD_ONLY_SILENT
if %BUILD_FAILED%==1 goto MENU

echo.
echo ==============================================================================
echo  Remote SSH / SCP Deployment Configuration (Google Cloud VPS)
echo ==============================================================================
set /p SSH_HOST="Enter Google VPS External IP: "
if "%SSH_HOST%"=="" (
    echo [ERROR] IP address cannot be empty.
    pause
    goto MENU
)

set /p SSH_USER="Enter SSH Username (default: ubuntu): "
if "%SSH_USER%"=="" set "SSH_USER=ubuntu"

set /p REMOTE_DIR="Enter Remote Target Directory [default: /CiscoCallTranscription_Google]: "
if "%REMOTE_DIR%"=="" set "REMOTE_DIR=/CiscoCallTranscription_Google"

echo.
echo Transferring package to %SSH_USER%@%SSH_HOST%...
scp dist\google_vps\callcenter_google_vps.tar.gz %SSH_USER%@%SSH_HOST%:/tmp/
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] SCP upload failed. Check network or SSH keys.
    pause
    goto MENU
)

echo.
echo Extracting and initializing on remote server...
ssh %SSH_USER%@%SSH_HOST% "sudo mkdir -p %REMOTE_DIR% && sudo tar -xzf /tmp/callcenter_google_vps.tar.gz -C %REMOTE_DIR% && sudo chown -R %SSH_USER%:%SSH_USER% %REMOTE_DIR% && rm /tmp/callcenter_google_vps.tar.gz && cd %REMOTE_DIR% && chmod +x infrastructure/scripts/*.sh"

echo.
echo Would you like to run server preparation and deployment now?
set /p RUN_SETUP="Run setup and deploy on VPS? (Y/N) [default: Y]: "
if /I "%RUN_SETUP%"=="N" goto FINISH_DEPLOY

ssh -t %SSH_USER%@%SSH_HOST% "cd %REMOTE_DIR% && sudo bash infrastructure/scripts/setup_ubuntu24.sh && bash infrastructure/scripts/deploy.sh"

:FINISH_DEPLOY
echo.
echo ==============================================================================
echo  Deployment sequence completed!
echo ==============================================================================
pause
goto MENU

:BUILD_ONLY_SILENT
set "BUILD_FAILED=0"
python scripts\package_vps.py
if %ERRORLEVEL% NEQ 0 (
    set "BUILD_FAILED=1"
    echo [ERROR] Build failed.
)
exit /b

:OPEN_DIST
if not exist "dist\google_vps" mkdir "dist\google_vps"
start explorer "%~dp0dist\google_vps"
goto MENU

:PROMPT_EXPLORER
set /p OPEN_EXP="Open packages folder in Windows Explorer? (Y/N) [default: N]: "
if /I "%OPEN_EXP%"=="Y" goto OPEN_DIST
goto EXIT

:EXIT
echo Exiting...

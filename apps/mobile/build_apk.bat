@echo off
set "JAVA_HOME=C:\java17\jdk-17.0.10+7"
set "ANDROID_HOME=C:\Users\pc\AppData\Local\Android\Sdk"
set "PATH=C:\flutter\bin;%JAVA_HOME%\bin;%ANDROID_HOME%\cmdline-tools\latest\bin;%ANDROID_HOME%\platform-tools;%PATH%"

cd /d C:\Projects\CallCenterPOC-Google\apps\mobile
echo [INFO] Running flutter build apk --debug with Temurin JDK 17...
call C:\flutter\bin\flutter.bat build apk --debug

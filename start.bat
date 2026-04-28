@echo off
title StreamForge AI Bot
color 0A
setlocal enabledelayedexpansion

echo.
echo  ============================================
echo       StreamForge AI Bot - One-Click Start
echo        KI-Chat-Bot fuer Twitch und Kick
echo  ============================================
echo.

:: ============================================
:: Step 1: Check Node.js
:: ============================================
where node >nul 2>&1
if !errorlevel! neq 0 (
    color 0C
    echo  [FEHLER] Node.js nicht gefunden!
    echo.
    echo  Bitte installiere Node.js 20+ von: https://nodejs.org/
    echo  Waehle dabei die LTS Version aus.
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%v in ('node --version') do set NODE_VER=%%v
echo  [OK] Node.js %NODE_VER% gefunden
echo.

:: ============================================
:: Step 2: Check .env file
:: ============================================
if exist ".env" goto step3_setup_done

if not exist ".env.example" (
    color 0C
    echo  [FEHLER] .env.example nicht gefunden!
    echo  Projekt beschaedigt oder nicht komplett heruntergeladen.
    pause
    exit /b 1
)

echo  [SETUP] Erstelle Konfigurationsdatei .env ...
copy ".env.example" ".env" >nul
echo.
color 0E
echo  !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
echo  !! WICHTIG: Bearbeite .env Datei!!     !!
echo  !! Trage deinen Twitch-Token ein!!      !!
echo  !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
echo.
echo  1. Gehe zu: https://twitchapps.com/tmi/
echo  2. Autorisiere mit deinem Bot-Account
echo  3. Kopiere den Token in die .env Datei
echo  4. Trage auch deinen Kanalnamen ein
echo.
start notepad ".env"
echo.
echo  Druecke eine Taste wenn du fertig bist ...
pause >nul
color 0A
echo.

:step3_setup_done

:: ============================================
:: Step 3: Check if install needed
:: ============================================
if exist "node_modules" goto step4_check_build

echo  [INSTALL] Installiere Abhaengigkeiten ...
echo  Das kann beim ersten Mal 1-2 Minuten dauern ...
echo.
call npm install
if !errorlevel! neq 0 goto error_install
echo.
echo  [OK] Abhaengigkeiten installiert

:: ============================================
:: Step 4: Check if build needed
:: ============================================
:step4_check_build
if exist "packages\bot\dist\index.js" goto step5_start

echo.
echo  [BUILD] Baue das Projekt ...
echo  Das kann 1-3 Minuten dauern ...
echo.
call npm run build
if !errorlevel! neq 0 goto error_build
echo.
echo  [OK] Build erfolgreich!
echo.

:: ============================================
:: Step 5: Create data directory and start
:: ============================================
:step5_start
if not exist "data" mkdir data

echo  ============================================
echo         STARTING STREAMFORGE AI ...
echo  ============================================
echo.
echo  Druecke STRG+C zum Beenden.
echo.

node "packages\bot\dist\index.js"

if !errorlevel! neq 0 (
    echo.
    color 0C
    echo  [FEHLER] Bot ist abgestuerzt!
    echo.
    echo  Tipp: Wenn sich das Projekt nicht startet, versuche:
    echo    1. Starte "install.bat" fuer eine saubere Neuinstallation
    echo    2. Oder loesche den Ordner "node_modules" manuell
    echo    3. Dann starte "start.bat" erneut
    echo.
)

echo.
pause
exit /b 0

:: ============================================
:: Error Handlers
:: ============================================
:error_install
color 0C
echo.
echo  [FEHLER] npm install fehlgeschlagen!
echo.
echo  Loesungsvorschlaege:
echo    1. Stelle sicher, dass du eine stabile Internetverbindung hast
echo    2. Starte "install.bat" fuer eine saubere Neuinstallation
echo    3. Node.js neu installieren: https://nodejs.org/
echo.
pause
exit /b 1

:error_build
color 0C
echo.
echo  [FEHLER] Build fehlgeschlagen!
echo.
echo  Loesungsvorschlaege:
echo    1. Starte "install.bat" fuer eine saubere Neuinstallation
echo    2. Loesche die Ordner "node_modules" und "dist" manuell
echo    3. Starte "start.bat" erneut
echo.
pause
exit /b 1

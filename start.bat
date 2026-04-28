@echo off
title StreamForge AI Bot
color 0A
chcp 65001 >nul 2>&1

echo.
echo  ╔══════════════════════════════════════════════╗
echo  ║       StreamForge AI Bot - One-Click Start   ║
echo  ║      KI-Chat-Bot fuer Twitch und Kick       ║
echo  ╚══════════════════════════════════════════════╝
echo.

:: ============================================
:: Step 1: Check Node.js
:: ============================================
where node >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo  [FEHLER] Node.js nicht gefunden!
    echo.
    echo  Bitte installiere Node.js 20+ von: https://nodejs.org/
    echo  Waehle dabei "LTS" Version aus.
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
if not exist ".env" (
    if exist ".env.example" (
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
    ) else (
        color 0C
        echo  [FEHLER] .env.example nicht gefunden! Projekt beschaeidgt?
        pause
        exit /b 1
    )
)

:: ============================================
:: Step 3: Check if first run (need install)
:: ============================================
if not exist "node_modules" (
    echo  [INSTALL] Installiere Abhaengigkeiten ...
    echo  Das kann beim ersten Mal 1-2 Minuten dauern ...
    call npm install
    if %errorlevel% neq 0 (
        color 0C
        echo  [FEHLER] npm install fehlgeschlagen!
        pause
        exit /b 1
    )
    echo.
    echo  [OK] Abhaengigkeiten installiert
    echo.

    :: Build everything
    echo  [BUILD] Baue das Projekt ...
    call npm run build
    if %errorlevel% neq 0 (
        color 0C
        echo  [FEHLER] Build fehlgeschlagen!
        pause
        exit /b 1
    )
    echo.
    echo  [OK] Build erfolgreich!
    echo.
)

:: ============================================
:: Step 4: Check if rebuild needed
:: ============================================
if not exist "packages\bot\dist" (
    echo  [BUILD] Bot Engine muss noch gebaut werden ...
    call npm run build
    if %errorlevel% neq 0 (
        color 0C
        echo  [FEHLER] Build fehlgeschlagen!
        pause
        exit /b 1
    )
    echo.
)

:: ============================================
:: Step 5: Create data directory
:: ============================================
if not exist "data" mkdir data

:: ============================================
:: Step 6: Start the Bot!
:: ============================================
echo  ╔══════════════════════════════════════════════╗
echo  ║          STARTING STREAMFORGE AI ...         ║
echo  ╚══════════════════════════════════════════════╝
echo.
echo  Druecke STRG+C zum Beenden.
echo.

node packages\bot\dist\index.js

if %errorlevel% neq 0 (
    echo.
    color 0C
    echo  [FEHLER] Bot ist abgestuerzt!
    echo.
    echo  Tipp: Wenn sich das Projekt nicht startet, versuche:
    echo    1. Loesche den Ordner "node_modules"
    echo    2. Starte "start.bat" erneut (baut alles neu)
    echo.
)

echo.
pause

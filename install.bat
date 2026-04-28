@echo off
title StreamForge AI - Neuinstallation
color 0B
chcp 65001 >nul 2>&1

echo.
echo  ╔══════════════════════════════════════════════╗
echo  ║     StreamForge AI - Saubere Neuinstallation  ║
echo  ║      KI-Chat-Bot fuer Twitch und Kick        ║
echo  ╚══════════════════════════════════════════════╝
echo.

:: ============================================
:: Check Node.js
:: ============================================
where node >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo  [FEHLER] Node.js nicht gefunden!
    echo  Bitte installiere Node.js 20+: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%v in ('node --version') do set NODE_VER=%%v
echo  [OK] Node.js %NODE_VER% gefunden
echo.

:: ============================================
:: Clean old build artifacts
:: ============================================
echo  [CLEAN] Entferne alte Build-Dateien ...
if exist "node_modules" (
    echo  - Loesche node_modules ...
    rmdir /s /q "node_modules" 2>nul
)
if exist "packages\bot\dist" (
    echo  - Loesche bot/dist ...
    rmdir /s /q "packages\bot\dist" 2>nul
)
if exist "packages\shared\dist" (
    echo  - Loesche shared/dist ...
    rmdir /s /q "packages\shared\dist" 2>nul
)
if exist "packages\admin\.next" (
    echo  - Loesche admin/.next ...
    rmdir /s /q "packages\admin\.next" 2>nul
)
if exist "packages\admin\out" (
    echo  - Loesche admin/out ...
    rmdir /s /q "packages\admin\out" 2>nul
)
echo  [OK] Aufgeraeumt
echo.

:: ============================================
:: Install dependencies
:: ============================================
echo  [INSTALL] Installiere alle Abhaengigkeiten ...
echo  Das kann 1-3 Minuten dauern ...
echo.
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

:: ============================================
:: Build project
:: ============================================
echo  [BUILD] Baue das gesamte Projekt ...
echo.
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

:: ============================================
:: Create .env if needed
:: ============================================
if not exist ".env" (
    if exist ".env.example" (
        copy ".env.example" ".env" >nul
        echo  [SETUP] .env Datei erstellt
    )
)

:: ============================================
:: Create data directory
:: ============================================
if not exist "data" mkdir data

:: ============================================
:: Done
:: ============================================
echo  ╔══════════════════════════════════════════════╗
echo  ║      INSTALLATION ERFOLGREICH!               ║
echo  ╚══════════════════════════════════════════════╝
echo.
echo  Naechster Schritt:
echo.
echo  1. Bearbeite .env und trage deine Twitch-Daten ein:
echo     notepad .env
echo.
echo  2. Starte den Bot:
echo     start.bat
echo.
echo  3. Oeffne das Admin Interface:
echo     http://localhost:3001
echo     Benutzer: admin
echo     Passwort: streamforge
echo.

if not exist ".env" (
    echo  ACHTUNG: Du musst zunaechst deine .env bearbeiten!
    start notepad ".env"
) else (
    findstr /C:"your_twitch_token_here" ".env" >nul 2>&1
    if %errorlevel% equ 0 (
        echo  ACHTUNG: Du musst zunaechst deinen Twitch-Token in .env eintragen!
        start notepad ".env"
    )
)

echo.
pause

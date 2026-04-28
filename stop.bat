@echo off
title StreamForge AI Bot - STOP
color 0C

echo.
echo  ============================================
echo         STOPPING STREAMFORGE AI ...
echo  ============================================
echo.

taskkill /f /im node.exe >nul 2>&1

echo  [OK] StreamForge AI Bot wurde gestoppt.
echo.
timeout /t 3 >nul

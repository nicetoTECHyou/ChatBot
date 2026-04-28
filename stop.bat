@echo off
title nicetoAIyou Bot - STOP
color 0C

echo.
echo  ============================================
echo         STOPPING NICETOAIYOU AI ...
echo  ============================================
echo.

taskkill /f /im node.exe >nul 2>&1

echo  [OK] nicetoAIyou Bot wurde gestoppt.
echo.
timeout /t 3 >nul

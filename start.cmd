@echo off
cd /d "%~dp0"
title Solar System Explorer
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is required. Please install Node.js first.
  pause
  exit /b 1
)
node scripts\serve.mjs --open
if errorlevel 1 pause

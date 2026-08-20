@echo off
cd /d "%~dp0"
set "PROJECT_ROOT=%CD%"

start "BloomCare web server" /d "%PROJECT_ROOT%" /b python -m http.server 8080
start "BloomCare payment API" /d "%PROJECT_ROOT%" /b python server\payment_api.py

echo BloomCare is running at http://127.0.0.1:8080
echo The local payment API is running at http://127.0.0.1:8787

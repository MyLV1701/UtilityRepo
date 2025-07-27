@echo off
cd /d "%~dp0"
echo Starting vocabulary app server...
echo Open http://localhost:3000 in your browser
python -m http.server 3000
pause
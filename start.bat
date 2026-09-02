@echo off
echo Starting CHEREVICHKA local development server...
echo Access the site in your browser at: http://localhost:8000
start http://localhost:8000
python -m http.server 8000
pause

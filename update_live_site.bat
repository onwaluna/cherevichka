@echo off
echo ===================================================
echo   CHEREVICHKA - Updating Live Site on cherevichka.com
echo ===================================================
echo.
git add .
git commit -m "Update content and styles"
git push origin main
echo.
echo ===================================================
echo   SUCCESS! Your live site cherevichka.com is updated!
echo ===================================================
pause

@echo off
REM Nextsells Configuration Setup Script - Windows
REM This script helps configure your environment variables

echo.
echo 🚀 Nextsells Configuration Setup
echo ==================================
echo.

REM Check if .env.local exists
if exist .env.local (
    echo ⚠️  .env.local already exists
    set /p overwrite="Do you want to overwrite it? (y/n): "
    if /i not "%overwrite%"=="y" (
        echo Skipping .env.local creation
        exit /b 1
    )
)

REM Create .env.local with prompts
echo 📝 Enter your configuration details:
echo.

set /p DATABASE_URL="Neon Database URL (postgresql://...): "
set /p AUTH0_CLIENT_ID="Auth0 Client ID: "
set /p AUTH0_CLIENT_SECRET="Auth0 Client Secret: "
set /p AUTH0_ISSUER_BASE_URL="Auth0 Issuer Base URL (https://your-domain.auth0.com): "
set /p AUTH0_BASE_URL="Auth0 Base URL (http://localhost:3000): "
set /p CLOUDINARY_CLOUD_NAME="Cloudinary Cloud Name: "
set /p CLOUDINARY_API_KEY="Cloudinary API Key: "
set /p CLOUDINARY_API_SECRET="Cloudinary API Secret: "

REM Generate random secrets (using PowerShell)
for /f %%i in ('powershell -Command "[guid]::NewGuid().ToString('N').Substring(0,32)"') do set AUTH0_SECRET=%%i
for /f %%i in ('powershell -Command "[guid]::NewGuid().ToString('N').Substring(0,32)"') do set NEXTAUTH_SECRET=%%i

REM Create .env.local
(
    echo # DATABASE - NEON
    echo DATABASE_URL=%DATABASE_URL%
    echo.
    echo # AUTHENTICATION - AUTH0
    echo AUTH0_SECRET=%AUTH0_SECRET%
    echo AUTH0_BASE_URL=%AUTH0_BASE_URL%
    echo AUTH0_ISSUER_BASE_URL=%AUTH0_ISSUER_BASE_URL%
    echo AUTH0_CLIENT_ID=%AUTH0_CLIENT_ID%
    echo AUTH0_CLIENT_SECRET=%AUTH0_CLIENT_SECRET%
    echo NEXTAUTH_SECRET=%NEXTAUTH_SECRET%
    echo.
    echo # CLOUDINARY - IMAGE STORAGE
    echo NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=%CLOUDINARY_CLOUD_NAME%
    echo CLOUDINARY_API_KEY=%CLOUDINARY_API_KEY%
    echo CLOUDINARY_API_SECRET=%CLOUDINARY_API_SECRET%
    echo.
    echo # APPLICATION
    echo APP_URL=http://localhost:3000
    echo NODE_ENV=development
    echo.
    echo # ADMIN CONFIGURATION
    echo ADMIN_EMAIL=admin@nextsells.com
) > .env.local

echo.
echo ✅ .env.local created successfully!
echo.
echo 📋 Next steps:
echo 1. Run: npm install
echo 2. Run: node scripts/init-db.js (to initialize database^)
echo 3. Run: npm run dev (to start development server^)
echo.
echo ⚠️  IMPORTANT: Never commit .env.local to version control!
echo    Make sure it's in .gitignore
echo.
pause

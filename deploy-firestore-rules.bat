@echo off
setlocal
cd /d "%~dp0"
set "PROJECT_ID=basair-academy-4a1d0"
set "FIREBASE_TOOLS_VERSION=15.28.1"

echo ============================================================
echo Basair Academy - Firestore rules deployment
echo Project: %PROJECT_ID%
echo ============================================================
echo.
echo [1/3] Current Firebase CLI account:
call npx firebase-tools@%FIREBASE_TOOLS_VERSION% login:list
if errorlevel 1 goto :login_help

echo.
echo [2/3] Checking project access...
call npx firebase-tools@%FIREBASE_TOOLS_VERSION% projects:list
if errorlevel 1 goto :permission_help
call npx firebase-tools@%FIREBASE_TOOLS_VERSION% use %PROJECT_ID%
if errorlevel 1 goto :permission_help

echo.
echo [3/3] Deploying Firestore rules...
call npx firebase-tools@%FIREBASE_TOOLS_VERSION% deploy --only firestore:rules --project %PROJECT_ID%
if errorlevel 1 goto :permission_help

echo.
echo SUCCESS: Firestore rules deployed to %PROJECT_ID%.
pause
exit /b 0

:login_help
echo.
echo Firebase CLI is not authenticated with a usable account.
echo Run:
echo   npx firebase-tools@%FIREBASE_TOOLS_VERSION% logout
echo   npx firebase-tools@%FIREBASE_TOOLS_VERSION% login
pause
exit /b 1

:permission_help
echo.
echo DEPLOYMENT DID NOT COMPLETE.
echo If the error is HTTP 403 / Caller does not have required permission,
echo the active Google account does not have sufficient IAM permission on %PROJECT_ID%.
echo Use the Google account that owns the project, or grant the deploying account
echo Service Usage Consumer plus permission to deploy Firebase Rules.
echo Local website code cannot grant Google Cloud IAM permissions to itself.
echo.
echo Check the active account with:
echo   npx firebase-tools@%FIREBASE_TOOLS_VERSION% login:list
pause
exit /b 1

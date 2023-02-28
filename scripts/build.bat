@echo off
pushd %~dp0
call npm i

if not exist ".\compiled\" (
    mkdir .\compiled
)

call npm run build
popd
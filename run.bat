@echo off
pushd %~dp0

if not exist ".\compiled\" (
    call ./scripts/build.bat
)

call node "./compiled/queue_server.js"
popd
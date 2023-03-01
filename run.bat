@echo off
pushd %~dp0

call ./scripts/build.bat

call node "./compiled/queue_server.js"

popd
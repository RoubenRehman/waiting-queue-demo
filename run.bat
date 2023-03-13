@echo off
pushd %~dp0

call ./scripts/build.bat

start cmd /k node "./compiled/application_server.js"
start cmd /k node "./compiled/queue_server.js"

popd
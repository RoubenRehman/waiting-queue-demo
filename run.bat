@echo off
pushd %~dp0

call ./scripts/build.bat

docker pull redis
docker run -d -p 6379:6379 --name waiting-queue-redis redis

start cmd /k node "./compiled/application_server.js"
start cmd /k node "./compiled/queue_server.js" queue_config.json
start cmd /k node "./compiled/queue_server.js" alt_queue_config.json

popd
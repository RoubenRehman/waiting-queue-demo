# Waiting queue POC

Full-stack waiting queue implementation POC in Node/TypeScript.

# Running this POC

You will need to have node and npm installed on your system:

[Download Node and NPM](https://nodejs.org/en/download/)

### Running on Windows
To run the POC on Windows, simply execute the `run.bat` file. It will automatically install all necessary packages, compile the TypeScript files, and start up both servers.

### Running on other OS
To run the POC on any other OS, you will need to install, compile and run manually:

1. Navigate into `/SA-TEAM60` and run `npm i`
2. Run `npm run build`
3. Start the queue server with `node ./compiled/queue_server.js`
4. Start the application server in a second terminal with `node ./compiled/application_server.js`
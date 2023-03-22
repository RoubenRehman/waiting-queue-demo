
# Waiting queue POC
Full-stack waiting queue implementation POC in Node/TypeScript.

# Running this POC
You will need to have node and npm installed on your system:
[Download Node and NPM](https://nodejs.org/en/download/)

Furthermore, this POC is configured to run with a local installation of Redis. Download and install [Redis](https://redis.io/docs/getting-started/) and make sure, a local instance is running on the default port 6379.

### Running on Windows
After starting Redis on port 6379, simply execute the `run.bat` file. It will automatically install all necessary packages, compile the TypeScript files, and start up both servers.

### Running on other OS
Navigate into the project folder and run `npm i` to install all dependencies.
Then, you can also run the POC by executing `npm run start:queue` and `npm run start:app`. This works on all OS, given node and npm are installed. You still need to make sure, Redis is running beforehand.

### Building manually
To install, compile and run manually, follow:

1. Navigate into `/SA-TEAM60` and run `npm i`

2. Run `npm run build`

3. Start the queue server with `node ./compiled/queue_server.js`

4. Start the application server in a second terminal with `node ./compiled/application_server.js`

# How this works
This POC simulates an application server (Ticketmaster's service), that is to be protected from large amounts of simulatneous connections by a seperate queue infrastructure.

After startup of both included servers, one can:

1. Connect to the application server, akin to connecting to Ticketmaster to buy a ticket. For this, one can naviagte to [http://localhost/](http://localhost/)

2. Afterwards, one is redirected to [http://localhost:1234/waitingroom.html](http://localhost:1234/waitingroom.html). This is akin to the external queue system a customer has to wait in before buying a ticket.

3. All incoming connections to [http://localhost/](http://localhost/) will be redirected to the waitingroom and queued there in incoming order. Use e.g. multiple tabs to simulate this.

4. The queue can be opened, akin to the start of the ticket onsale, by navigating to the queue's admin panel [http://localhost:1234/adminpanel.html](http://localhost:1234/adminpanel.html) and clicking `Start onsale`. Afterwards, the first client in the queue will be redirected to the initial protected endpoint again (akin to the ticket shop).

5. From now on, every time the user currently connected to the "ticket shop" disconnects (akin to checks out), the next user in the queue is redirected.

This implementation uses Redis as a distributed cache to keep track of the waiting queue. This allows for horizontal scaling of the queue server.

  

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

  

# Documentation

  

## HTTP endpoints

  

### queue_server.ts

  

* **GET /**
**request body**: *empty*
**response**: HTTP Redirect to `/waitingroom`

	The main endpoint of the queue server, where traffic to the server's base url is routed to.

* **GET /waitingroom**
	**request body**: query token `token: string` or *empty*
	**response**: waitingroom page or HTTP redirect to application server

	This endpoint is where users are actually waiting on.

* **GET /adminpanel**
	**request body**: *empty*
	**response**: Admin panel web page

	This endpoint serves the admin web page, using which the simulated ticket onsale can be started.

* **POST /start-onsale**
	**request body**: *empty*
	**response**: status 200 OK

	This endpoint is called by the `start onsale` button on the admin panel web page.

* **POST /validate-token**
	**request body**: `{ token: <string> }`
	**response**: `{ valid: true | false }` and status 200 OK

	This endpoint checks, if a provided token is marked as valid in Redis or not. It is used by the application server to validate incoming users' tokens.

* **POST /let-next-in**
	**request body**: `{ token: <string> }`
	**response**: status 200 OK

	This endpoint removes the provided token from Redis effectively invalidating its status and calls the `let_next_user_in` function with a value of 1, thereby letting the first user in the queue through to the application server.

### application_server.ts

* **GET /**
	**request body**: *empty* or a token as query string
	**response**: Redirect to queue server or `index.html`

	This endpoint is called by users navigating to the application server. It either redirects them to the queue or serves them the main web page (akin to the ticket shop) based on their provided token.

## Functions

### queue_server.ts

* **let_next_user_in**
	**input**: `num: number`
	**return**: `Promise<void>`

	This function takes in a number `num` and advances the queue by max. that many waiting users, depending on the length of the queue. The first `num` waiting users' tokens will be set to `valid` in Redis, resulting in a redirect to the application server on the next waiting room page refresh.

### application_server.ts

* **next_queue_server**
	**input**: *empty*
	**return**: `string`

	This function operates on the application servers list of queue server instances. It pops the first instance in the array, returns it and pushes it back to the end of the array. It is used to get the queue server instance to redirect the next incoming user to.

## Interfaces

* **QueueConfig**: Config interface for the queue server. The corresponding config file is `config/queue_config.json`
* **AppConfig**: Config interface for the application server. The corresponding config file is `config/app_config.json`
* **ClientObject**: Interface grouping a user connected to the application server with their corresponding Socket.IO socket.
* **PostBody**: Interface used in the API design.
* **ResponseBody**: Interface used in the API design.

## Config files

### queue_config:
* **max_simul_connections**: *number*
	How many simultaneous users are allowed on the application server.
* **port**: *number*
	On which port the queue server is deployed
* **debug**: *true | false*
	Defining if the queue server should start in debug mode or not. In debug mode, a special token is always valid.
* **debug_token**: *string*
	The string, that is treated as an always valid token if debug mode is turned on.
* **waiting_page**: *string*
	Path to the html page that's to be served as a waiting page from the `www` directory.

### app_config:
* **queue_servers**: *Array<string\>*
	An array holding the urls to the queue server instances that should be used by the application server.
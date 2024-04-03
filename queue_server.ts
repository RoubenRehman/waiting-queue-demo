// Authors: Rouben Rehman

import express, { Request, Response } from 'express';
import * as redis from 'redis';
import * as http from 'http';
import * as path from 'path';
import * as crypt from 'crypto';
import * as fs from 'fs';

import { QueueConfig, PostBody } from './interfaces/interfaces';

// Create redis client and connect to server
const redisClient = redis.createClient();
(async () => {
  await redisClient.connect();
})();

const app = express();
let port = 1234; // Default queue port

let DEBUG = false;
let DEBUG_TOKEN = 'always-valid';

app.use(express.static(path.join(__dirname, '../public')));
app.use(express.json());

const server = http.createServer(app);

const configFile = process.argv[2];
let confName = '';

if(configFile) {
  confName = configFile;
} else {
  confName = 'queue_config.json';
  console.warn("No config specified, using default config..");
}

const site_path = path.join(__dirname, '../www');
const config_path = path.join(__dirname, `../config/${confName}`);

let max_simul_connections = 1;
let waiting_page = 'waitingroom_1.html';

// Read config
try {
  const raw_config = fs.readFileSync(config_path);
  const config: QueueConfig = JSON.parse(raw_config.toString());

  max_simul_connections = config.max_simul_connections;
  port = config.port;
  DEBUG = config.debug;
  DEBUG_TOKEN = config.debug_token;
  waiting_page = config.waiting_page;
} catch(err) {

  console.error(`Error reading config file: ${err}`);
  console.error("Max_simul_config is set to 1 (default)\n");
}

// This function takes in an amount and advances the queue by that many clients
async function let_next_users_in(num: number): Promise<void> {
  for (let i = 0; i < num; i++) {
    const next = await redisClient.rPop('queue');
    
    if (!next) {
      return;
    }

    await redisClient.set(next, 'valid');
  }
}

/***************************
 *          API            *
 ***************************/

// GET endpoints
app.get('/', (req: Request, res: Response) => {
  res.redirect('/waitingroom');
});

// Main waiting room endpoint.
app.get('/waitingroom', async (req: Request, res: Response) => {
  const token = req.query.token;

  // If user doesn't have a token yet, create one and queue user up
  if(!token || typeof token != 'string') {
    try {
      const token = crypt.randomUUID();

      redisClient.lPush('queue', token);
      redisClient.set(token, 'waiting');
      res.redirect(`/waitingroom?token=${token}`);

    } catch(err) {
      console.error(err);
      res.status(500).send('Something went wrong');
    }

    return;
  }

  // If user has a token, check for validicy. If valid, sent to app, else to waiting room.
  const status = await redisClient.get(token);
  
  if(status === 'waiting') {
    res.sendFile(path.join(site_path, `/${waiting_page}`));
    return;

  } else if(status === 'valid') {
    res.redirect(`http://localhost:80/?token=${token}`);
    return;
  }

  // If user has a token but its neither waiting nor valid, discard the token
  res.redirect('/waitingroom');
});

// Endpoint serving the adminpanel.html site
app.get('/adminpanel', (req: Request, res: Response) => {
  res.sendFile(path.join(site_path, '/adminpanel.html'));
});


// POST endpoints

// Endpoint starting the onsale by letting in the first max_simul_connections waiting clients
app.post('/api/start-onsale', (req: Request, res: Response) => {
  let_next_users_in(max_simul_connections);
  res.sendStatus(200);
});

// Called by the protected web server to check if a given token is valid or if the client is to be sent
// back to the waiting room.
app.post('/api/validate-token', async (req: Request<{}, {}, PostBody>, res: Response) => {
  const body = req.body ? req.body : { };

  if(!body || !body.token) {
    res.status(400).send({ error: 'No token provided' });
    return;
  }

  const status = await redisClient.get(body.token);

  status === 'valid' ? res.status(200).send({ valid: true }) : res.status(200).send({ valid: false });;
});


// Called by the protected web server each time a client leaves the protected website.
// Each time, the next waiting client is to be let through.
app.post('/api/let-next-in', async (req: Request, res: Response) => {
  const body = req.body ? req.body : {};

  if(!body.token) {
    res.status(400).send({ error: 'No token provided' });
    return;
  }

  // Remove disconnected users token from redis
  if(!DEBUG || body.token != DEBUG_TOKEN) {
    await redisClient.del(body.token);
  }
  let_next_users_in(1);

  res.sendStatus(200);
});



server.listen(port, () => {
  const line = "==========================================================";
  const message = "This is the queue server. It manages the queue of clients waiting to connect to the application server.\n" +
    `\nThe server is listening on port ${port}.\n` +
    "\nWhen you try to access the protected endpoint, you will be redirected to the queue.\n" +
    "Clients are let through one by one, in the order in which they joined the queue." + 
    `\n\nMax. simultaneous connections: ${max_simul_connections}`;
  
  console.log(`${line}\n${message}\n${line}\n`);
  });
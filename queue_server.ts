// Authors: Rouben Rehman

import express, { Request, Response } from 'express';
import * as redis from 'redis';
import * as http from 'http';
import * as path from 'path';
import * as crypt from 'crypto';
import * as fs from 'fs';

const cookieparser = require('cookie-parser');

import { Config, PostBody } from './interfaces/interfaces';

const redisClient = redis.createClient();
(async () => {
  await redisClient.connect();
})();

const app = express();
const port = 1234;

app.use(express.static(path.join(__dirname, '../public')));
app.use(express.json());
app.use(cookieparser());

const server = http.createServer(app);

const site_path = path.join(__dirname, '../www');
const config_path = path.join(__dirname, '../config/queue_config.json');

let max_simul_connections = 1;

try {
  const raw_config = fs.readFileSync(config_path);
  const config: Config = JSON.parse(raw_config.toString());
  max_simul_connections = config.max_simul_connections;
  console.log(` Max number of simultaneous connections: ${max_simul_connections}`);
} catch(err) {
  console.error(`Error reading config file: ${err}`);
  console.error("Max_simul_config is set to 1 (default)");
}

// This function takes in an amount and advances the queue by that many clients
async function let_next_users_in() {
  const next = await redisClient.rPop('queue');
    
  if(!next){
    return;
  }

  await redisClient.set(next, 'valid')
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

    res.sendFile(path.join(site_path, '/waitingroom.html'));
    return;
  }

  const status = await redisClient.get(token);
  
  if(status === 'waiting') {
    res.sendFile(path.join(site_path, '/waitingroom.html'));
    return;
  }

  res.redirect(`http://localhost:80/?token=${token}`);
});

// Endpoint serving the adminpanel.html site
app.get('/adminpanel', (req: Request, res: Response) => {
  res.sendFile(path.join(site_path, '/adminpanel.html'));
});


// POST endpoints

// Endpoint starting the onsale by letting in the first max_simul_connections waiting clients
app.post('/api/start-onsale', (req: Request, res: Response) => {
  let_next_users_in();
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

  await redisClient.del(body.token);
  let_next_users_in();

  res.sendStatus(200);
});



server.listen(port, () => {
  console.log(`This is the queue server. It's lining up the clients wanting to connect to the application server in a queue and lets them trickle back to the protected website one by one.\nThe server is listening on port ${port}, you can connect directly, but you will be redirected to the queue when trying to access the protected endpoint`);
});
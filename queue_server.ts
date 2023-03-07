// Authors: Rouben Rehman

import express, { Request, Response } from 'express';

import * as http from 'http';
import * as path from 'path';
import * as crypt from 'crypto';
import { Server, Socket } from 'socket.io';

import { ClientObject, PostBody } from './interfaces/interfaces';

const app = express();
const port = 1234;

app.use(express.static(path.join(__dirname, '../public')));
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server);

const site_path = path.join(__dirname, '../www');

let waiting_clients: Array<ClientObject> = [];
let currently_valid_uuids: Array<string> = [];
let max_simul_connections: number = 1;

// This function takes in an amount and advances the queue by that many clients
function let_next_users_in(amount: number) {
  if(amount <= 0) {
    console.log("Error in advancing the queue: specified amout was zero or negative.");
  }

  const next_clients = waiting_clients.splice(0, amount);

  next_clients.forEach((next_client) => {
    currently_valid_uuids.push(next_client.uuid);
    next_client.socket.emit('redirect', { url: `/redirect?token=${next_client.uuid}` });
  });
}

/***************************
 *          API            *
 ***************************/

// Socket handlers
io.on('connection', (socket: Socket) => {

  const new_client: ClientObject = {
    uuid: crypt.randomUUID(),
    socket: socket
  }

  new_client.socket.on('disconnect', () => {
    const my_uuid = new_client.uuid;
    waiting_clients = waiting_clients.filter( x => { return x.uuid != my_uuid });
  })

  waiting_clients.push(new_client);
  new_client.socket.emit("new-token", { token: new_client.uuid });
  
  console.log(`New socket connected: ${new_client.uuid}\nCurrently waiting: ${waiting_clients.length}`);
});

// GET endpoints
app.get('/', (req: Request, res: Response) => {
  res.redirect('/waitingroom');
});

// Endpoint a waiting client gets rerouted to after finishing the queue. Here, a 301 redirect is issued
// taking the client back to the proteced website.
app.get('/redirect', (req: Request, res:Response) => {
  if(!req.query.token) {
    res.redirect('/waitingroom');
  }

  res.redirect(`http://localhost:80/?token=${req.query.token}`);
});

// Main waiting room endpoint.
app.get('/waitingroom', (req: Request, res: Response) => {
  res.sendFile(path.join(site_path, '/waitingroom.html'));
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

  if(!body) {
    res.status(400).send({ error: 'No token provided' });
    return;
  }

  if(body.token && currently_valid_uuids.includes(body.token)) {
    res.status(200).send({ valid: true });
    return;
  }
  
  res.status(200).send({ valid: false });
});

// Called by the protected web server each time a client leaves the protected website.
// Each time, the next waiting client is to be let through.
app.post('/api/let-next-in', (req: Request, res: Response) => {
  const body = req.body ? req.body : {};

  if(!body.token) {
    res.status(400).send({ error: 'No token provided' });
    return;
  }

  if(!currently_valid_uuids.includes(body.token)) {
    res.status(500).send({ error: 'Provided token is unknown' });
    return;
  }

  currently_valid_uuids = currently_valid_uuids.filter(x => { return x != body.token});

  let_next_users_in(1);

  res.sendStatus(200);
});



server.listen(port, () => {
  console.log(`This is the queue server. It's lining up the clients wanting to connect to the application server in a queue and lets them trickle back to the protected website one by one.\nThe server is listening on port ${port}, you can connect directly, but you will be redirected to the queue when trying to access the protected endpoint`);
});
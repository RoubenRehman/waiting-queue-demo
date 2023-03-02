// Authors: Rouben Rehman

import express, { Express, Request, Response } from 'express';

import * as http from 'http';
import * as path from 'path';
import * as crypt from 'crypto';
import { Server, Socket } from 'socket.io';

import { ClientObject, PostBody, ResponseBody } from './interfaces/interfaces';

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

function let_next_users_in(amount: number) {
  // This would be nicer if refactored to handle amount in parallel
  for(let i = 0; i < amount; i++) {
    const next_client = waiting_clients.shift();

    if(!next_client) {
      break;
    }

    currently_valid_uuids.push(next_client.uuid);
    next_client.socket.emit('redirect', { url: `/redirect?token=${next_client.uuid}` });
  }
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
  
  console.log(`New socket connected: ${waiting_clients}`);
});

// GET endpoints
app.get('/', (req: Request, res: Response) => {
  res.redirect('/waitingroom');
});

app.get('/redirect', (req: Request, res:Response) => {
  if(!req.query.token) {
    res.redirect('/waitingroom');
  }

  res.redirect(`http://localhost:80/?token=${req.query.token}`);
});

app.get('/waitingroom', (req: Request, res: Response) => {
  res.sendFile(path.join(site_path, '/waitingroom.html'));
});

// POST endpoints
app.post('/api/start-onsale', (req: Request, res: Response) => {
  let_next_users_in(max_simul_connections);
  res.sendStatus(200);
});

app.post('/api/validate-token', async (req: Request<{}, {}, PostBody>, res: Response) => {
  const body = req.body ? req.body : { };

  if(body.token && currently_valid_uuids.includes(body.token)) {
    res.status(200).send({ valid: true });
    return;
  }
  
  res.status(200).send({ valid: false });
});

app.post('/api/let-next-in', (req: Request, res: Response) => {
  const body = req.body ? req.body : {};

  if(!body.token) {
    res.sendStatus(400);
    return;
  }
  console.log(currently_valid_uuids);
  currently_valid_uuids = currently_valid_uuids.filter(x => { return x != body.token});
  console.log(currently_valid_uuids);

  let_next_users_in(1);

  res.sendStatus(200);
});



server.listen(port, () => {
  console.log(`The server is listening on port ${port}`);
});
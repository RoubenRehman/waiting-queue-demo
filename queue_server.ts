// Authors: Rouben Rehman

import express, { Express, Request, Response } from 'express';
import * as http from 'http';
import * as path from 'path';
import * as crypt from 'crypto';
import { Server } from 'socket.io';

import { WaitingClient } from './interfaces/interfaces';

const app = express();
const port = 80;

app.use(express.static(path.join(__dirname, './public')));

const server = http.createServer(app);
const io = new Server(server);

const site_path = path.join(__dirname, './www');

let waiting_clients: Array<WaitingClient> = [];
let currently_valid_uuids: Array<string> = [];
let max_simul_connections: Number = 1;


/***************************
 *          API            *
 ***************************/

// Socket handlers
io.on('connection', (socket) => {

  const new_client: WaitingClient = {
    uuid: crypt.randomUUID(),
    socket: socket
  }

  waiting_clients.push(new_client);

  console.log(`New socket connected: ${socket}`);
});

// GET endpoints
app.get('/', (req: Request, res: Response) => {
  res.redirect('/waitingroom');
});

app.get('/waitingroom', (req: Request, res: Response) => {
  res.sendFile(path.join(site_path, '/waitingroom.html'));
});

// POST endpoints
app.post('/api/validate-token', (req: Request, res: Response) => {

});

app.post('api/exit-connected-user', (req: Request, res: Response) => {

});



server.listen(port, () => {
  console.log(`The server is listening on port ${port}`);
});
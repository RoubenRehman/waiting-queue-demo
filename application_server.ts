// Authors: Rouben Rehman

import express, { Request, Response } from 'express';
import axios from 'axios';

import * as fs from 'fs';
import * as http from 'http';
import * as path from 'path';
import { Server, Socket } from 'socket.io';

import { AppConfig } from './interfaces/interfaces';

const app = express();
const port = 80;

app.use(express.static(path.join(__dirname, '../public')));
app.use(express.json());

const site_path = path.join(__dirname, '../www');
const server = http.createServer(app);
const io = new Server(server);

const config_path = path.join(__dirname, '../config/app_config.json');

let queue_servers = ['http://localhost:1234'];

try {

    const raw_config = fs.readFileSync(config_path);
    const config: AppConfig = JSON.parse(raw_config.toString());
    queue_servers = config.queue_servers;
  } catch(err) {
  
    console.error(`Error reading config file: ${err}`);
}

function next_queue_server(): string {
    const next = queue_servers.shift();

    if(!next){
        console.log('ERROR: No queue servers defined!')
        return '';
    }

    queue_servers.push(next);
    return next;
}

/***************************
 *          API            *
 ***************************/

// Socket handlers
io.on('connection', (socket: Socket) => {
    socket.on('register', (token: string) => {
        console.log(`new connection with token: ${token}`);

        socket.on('disconnect', async () => {
            const my_uuid = token;

            try {
                const queue_res = await axios({
                    method: 'post',
                    url: 'http://localhost:1234/api/let-next-in',
                    data: {
                        token: my_uuid
                    }
                });

            } catch(e) {
                console.log(`An error occured while validating the token: ${e}`);
            }

        });
    });
});

// GET endpoints
app.get('/', async (req: Request, res: Response) => {
    if(!req.query.token) {
        const next_redirect = next_queue_server();
        next_redirect ? res.redirect(next_redirect) : res.sendStatus(500);
        return;
    }

    let token_is_valid = false;

    try {
        const queue_res = await axios({
            method: 'post',
            url: 'http://localhost:1234/api/validate-token',
            data: {
                token: req.query.token
            }
        });

        token_is_valid = queue_res.data.valid;
    } catch(e) {
        console.log(`An error occured while validating the token: ${e}`);
        token_is_valid = false;
    }

    if(!token_is_valid) {
        const next_redirect = next_queue_server();
        next_redirect ? res.redirect(next_redirect) : res.sendStatus(500);
        return;
    }

    res.sendFile(path.join(site_path, 'index.html'));
});


server.listen(port, () => {
    const line = "==========================================================";
    const message = `This is the application server. It simulates the server that is to be protected by the external queue infrastructure.\n` +
        `The server is listening on port ${port}.\n` +
        `To connect, open http://localhost:${port}/ in a web browser.`;

    console.log(`${line}\n${message}\n${line}\n`);
});
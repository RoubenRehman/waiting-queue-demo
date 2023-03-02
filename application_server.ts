// Authors: Rouben Rehman

import express, { Request, Response } from 'express';
import axios from 'axios';

import * as http from 'http';
import * as path from 'path';
import { Server, Socket } from 'socket.io';

const app = express();
const port = 80;

app.use(express.static(path.join(__dirname, '../public')));
app.use(express.json());

const site_path = path.join(__dirname, '../www');
const server = http.createServer(app);
const io = new Server(server);

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
        res.redirect('http://localhost:1234');
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
        res.redirect('http://localhost:1234');
        return;
    }

    res.sendFile(path.join(site_path, 'index.html'));
});


server.listen(port, () => {
    console.log(`This is the application server. It simulates the server that is to be protected by the external queue infrastructure.\nIt's listening on port ${port}. To connect, open http://localhost:${port}/ in a browser.`);
});
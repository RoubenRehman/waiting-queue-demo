// Authors: Rouben Rehman

import express, { Express, Request, Response } from 'express';
import axios from 'axios';

import * as http from 'http';
import * as path from 'path';
import * as crypt from 'crypto';
import { Server } from 'socket.io';

import { WaitingClient, PostBody, ResponseBody } from './interfaces/interfaces';

const app = express();
const port = 80;

app.use(express.static(path.join(__dirname, '../public')));
app.use(express.json());

const site_path = path.join(__dirname, '../www');
const server = http.createServer(app);
const io = new Server(server);

app.get('/', async (req: Request, res: Response) => {
    if(!req.query.token) {
        res.redirect('http://localhost:1234');
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
    }

    res.sendFile(path.join(site_path, 'index.html'));
});

server.listen(port, () => {
    console.log(`The server is listening on port ${port}`);
});
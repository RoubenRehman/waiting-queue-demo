import { Socket } from "socket.io";

export interface Config {
    max_simul_connections: number;
    port: number;
};

export interface ClientObject {
    socket: Socket;
    uuid: string;
};

export interface PostBody {
    token?: string;
};

export interface ResponseBody {
    status: Number;
};
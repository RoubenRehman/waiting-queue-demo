import { Socket } from "socket.io";

export interface QueueConfig {
    max_simul_connections: number;
    port: number;
    debug: boolean;
    debug_token: string;
    waiting_page: string;
};

export interface AppConfig {
    queue_servers: Array<string>;
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
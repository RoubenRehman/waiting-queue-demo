import { Socket } from "socket.io";

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
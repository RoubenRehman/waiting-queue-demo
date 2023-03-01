export interface WaitingClient {
    socket: any;
    uuid: string;
};

export interface PostBody {
    token?: string;
};

export interface ResponseBody {
    status: Number;
};
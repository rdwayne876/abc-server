import { Application } from "express";
import {Server} from "socket.io";
import * as http from 'http';
import Locals from "./locals";
import { SocketController } from "../controllers/api/socket.controller";


export class SocketServer {

    private static io:Server;

	public static mountSocket(_express: Application){
        const port: number = Locals.config().port;

        let server = http.createServer(_express);
        this.io = new Server(server, {});
        
        SocketController.init(this.io);

        return server;
    }

    public static IO(){
        return SocketServer.io;
    }
}


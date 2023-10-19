import { Server, Socket } from 'socket.io';
import { Room } from '../../schema/room';
import { Request, Response } from 'express';
import { JsonResponse } from '../../helpers/JsonResponse.helper';
import { roomStatusMap } from '../../interfaces/room';



export class SocketController{
    static IO:Server;
    static Namespaces = {};
    static init(io:Server){
        
        io.on("connection", (socket)=>{
            
            console.log(socket.id);
            socket.emit("Connected");


            // socket.on("connect-room", (socket)=>)
        });

        // io.of("/gameroom/room_").use((socket, next)=>{
        //     console.log("No one will pass");
        //     next(new Error("I won't let anything pass"));
        // })
        io.of('/gameroom').on('connection', async(socket)=>{
            socket.on('join-room', async(userInfo: {token:string, room_id:string})=>{
                try{
                   
                    /**
                     * TODO:
                     * Find out the room status.
                     * Get the amount of people connected to room and compare it with the room limit.
                     * If limit is reached then prevent further connection to the room.
                     * Give the creator priority to be connected.
                     * Get all the users/sockets currently connected to the room via room id.
                     * Broadcast to all the users the total number of users until game begins.
                     * 
                    */
                    let room = await Room.findById(userInfo.room_id);
                    if(!room){
                        socket.emit("room-connect-error");
                    }
                    if(!(roomStatusMap.get(room?.status!) == "Online") ){
                        socket.emit("room-connect-error", "Room is currently unavailable");
                    }

                    //Create user Object.
                    //Token will contain userData like {email, id, username}
                    let userdata:{email:string, username:string, id: string} = JSON.parse(atob(userInfo.token));
                    //

                    // io.socketsJoin(userInfo.room_id);
                    socket.join(userInfo.room_id);
                    console.log(userInfo.room_id);

                    // socket.broadcast.to(userInfo.room_id).emit("player-connected", room);
                    let roomSize = await socket.nsp.in(userInfo.room_id).fetchSockets();
                    console.log(roomSize);
                    socket.nsp.to(userInfo.room_id).emit('player-connected',{room_size: roomSize.length })
                }catch(error:any){
                    socket.emit('room-connect-error', "Unable to connect with this id")
                }
            });

            socket.on('start-game', (room_id)=>{
                /**
                 * TODO:
                 * If the total number of client is not equal to the room limit or the player isn't the creator of the room. Prompt action is not permitted.
                 * Else proceed to start the game and change the status of the room from online to inprogress. This should prevent any unwanted or further access.
                 * From the list of users/sockets select random user and assign property of dictator.
                 * Once the game starts broadcast message of who dictator is to all connected clients.
                 */
            });

            socket.on('start-round',(roomdata)=>{
                /**
                 * TODO:
                 * Broadcast Selected letter to the clients attached.
                 * Get room data and have a countdown using the round duration
                 * After the countdown emit a stop-round event
                 */
            });
            socket.on('stop-round', (playerData)=>{
                /**
                 * TODO:
                 * This listener is for persons that wish to stop the round before timer.
                 * If the client that selects this option is the person assigned as Dictator.
                 * This will broadcast a stop-round event which overides previous round_duration. 
                 */
            });
            socket.on('start-voting', (response)=>{
                /**
                 * TODO:
                 * This listener will accept the user/responses and fields as key value pair.
                 * The listener will then send all the users responses to the other sockets.
                 */
            });
            socket.on('stop-voting', (userVotes)=>{
                /**
                 * TODO:
                 * This is where the secret sauce will be added. For now though:
                 * This listener will accept user votes which is a key value pair for room gamefields and vote either 1 / 0;
                 * The votes per field per user will then be averaged then rounded down.
                 * for example:
                 * socket1-votes = [{socket2:{food: 1, car-model: 1, animal: 0}}, {socket3:{food: 1, car-model: 1, animal: 1}}]
                 * socket2-votes = [{socket1:{food: 1, car-model: 1, animal: 0}}, {socket3:{food: 1, car-model: 0, animal: 1}}]
                 * socket3-votes = [{socket1:{food: 1, car-model: 1, animal: 1}}, {socket2:{food: 1, car-model: 1, animal: 1}}]
                 * 
                 * socket1-score-for-field = food = 2/2, car-model = 2/2 animal 1/2 = 2
                 * socket2-score-for-field = food = 2/2, car-model = 2/2 animal 1/2 = 2
                 * socket3-score-for-field = food = 2/2, car-model = 2/2 animal 1/2 = 2
                 * scores = [{socket1: 2},{socket2: 2},{socket3:2}];
                 * The room dictator will then be changed and emitted to all members of the room.
                 * Scores will then be broadcasted to all members of the room in an event 'scores tallied'
                 * 
                 */
            })

            

            

        });
        SocketController.IO = io;
    }

    // public static connectToGame(req:Request, res:Response, next:NextFunction){
    //     const socket = SocketController.
    // }

    static SocketAuthMiddleware(socket:Socket, next:Function){
                    console.log("No one will pass");

        next();
    }

    static playerConnect(){

    }



    static async connectToRoom(req:Request, res:Response){
        let id = req.params.id;
        let room = await Room.findById(id);
        if(!room){
            return JsonResponse.error(res, "Invalid room", ["Unable to connect to room, room doesn't exist"]);
        }
        console.log(id)
        const roomNamespace = SocketController.IO.of(`/ws/${room?.id}`); 

        roomNamespace.on('connection', (socket)=>{
            console.log('connected')
        })


    }

}
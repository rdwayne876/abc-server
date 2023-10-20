import { RemoteSocket, Server, Socket } from 'socket.io';
import { Room } from '../../schema/room';
import { roomStatusMap } from '../../interfaces/room';
import { ObjectId } from 'mongoose';
import { getKeyByValue } from '../../helpers/Utility.helper';
import { DefaultEventsMap } from 'socket.io/dist/typed-events';



export class SocketController{
    static IO:Server;
    static Namespaces = {};
    static TimeoutMap = new Map();
    static roomDataMap = new Map();
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
            socket.on('join-room', async(userInfo: UserInfo)=>{
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

                   /**
                     * FIXES:
                     * Find out the room status.
                     * Get the amount of people connected to room and compare it with the room limit.
                     * If limit is reached then prevent further connection to the room. 
                     * Give the creator priority to be connected.
                     * Get all the users/sockets currently connected to the room via room id.
                     * Broadcast to all the users the total number of users until game begins.
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
                    let connectedSockets = await socket.nsp.in(userInfo.room_id).fetchSockets();

                    if(room?.player_limit == connectedSockets.length){
                        // Room full but socket is the creater. I will kick out a random nobody..lol
                        if(room?.creator! == (userdata.id as unknown as ObjectId)){
                            let rand = Math.floor(Math.random()* connectedSockets.length);
                            connectedSockets[rand].leave(userInfo.room_id); //ah so unfortunate lol.
                        }else{
                            // emit to socket that they cannot connect
                            socket.emit("room-connect-error", "Room limit reached");
                        }
                    }
                    socket.join(userInfo.room_id);



                    // socket.broadcast.to(userInfo.room_id).emit("player-connected", room);
                    let sockets = await socket.nsp.in(userInfo.room_id).fetchSockets();
                    socket.data = userdata;
                    // emit to all connected players the data of those who are currently connected to the room.
                    socket.nsp.to(userInfo.room_id).emit('player-connected',{players : sockets.map((socket)=>socket.data), isFull: room?.player_limit == sockets.length});
                }catch(error:any){
                    socket.emit('room-connect-error', "Unable to connect with this id")
                }
            });

            socket.on('start-game', async(userInfo: UserInfo)=>{
                /**
                 * TODO:
                 * 
                 * If the total number of client is not equal to the room limit or the player isn't the creator of the room. Prompt action is not permitted.
                 * Else proceed to start the game and change the status of the room from online to inprogress. This should prevent any unwanted or further access.
                 * From the list of users/sockets select random user and assign property of dictator.
                 * Once the game start event to the dictator to choose a letter.
                 */

                /**
                 * FIXES:
                 * If the total number of client is not equal to the room limit and the player isn't the creator of the room. Prompt action is not permitted.
                 * Else proceed to start the game and change the status of the room from online to inprogress. This should prevent any unwanted or further access.
                 * From the list of users/sockets select random user and assign property of dictator.
                 * Once the game start event to the dictator to choose a letter.                 */

                let room = await Room.findById(userInfo.room_id);
                if(!room){
                    socket.emit("room-connect-error", "No matching rooms found");
                }
                if(!(roomStatusMap.get(room?.status!) == "Online") ){
                    socket.emit("room-connect-error", "Room is currently unavailable");
                }
                let userdata:{email:string, username:string, id: string, selected_letter: string, timeout:number} = JSON.parse(atob(userInfo.token));

                let connectedSockets = await socket.nsp.in(userInfo.room_id).fetchSockets();

                
                //If the total number of client doesn't match the room limit and client is not the creator.Then do nothing.
                if(room?.player_limit != connectedSockets.length && !(room?.creator! == (userdata.id as unknown as ObjectId))){
                        socket.emit("room-connect-error", "Client doesn't have permission to start game before all sockets are connected");
                }
                // Change room status to inProgress

                room?.updateOne({status: getKeyByValue(roomStatusMap,"InProgress")});
                // choose dictator and emit choose-letter event.

                
                SocketController.chooseDictatorAndEmitEvent(connectedSockets, "choose-letter");
                

            });

            socket.on('letter-selected', async (userInfo:UserInfo)=>{
                let room = await Room.findById(userInfo.room_id);
                if(!room){
                    socket.emit("room-connect-error", "No matching rooms found");
                }
                if(!(roomStatusMap.get(room?.status!) == "InProgress") ){
                    socket.emit("room-connect-error", "Action not permitted");
                }

                let userdata:TokenData = JSON.parse(atob(userInfo.token));

                let connectedSockets = await socket.nsp.in(userInfo.room_id).fetchSockets();
                let isDictator = connectedSockets.find((socket)=> (socket.data as SocketData).user.isDictator && (socket.data as SocketData).user.id === userdata.id);
                if(!isDictator){
                    socket.emit("room-connect-error", "Client does not have permission to start round please wait until letter is selected")
                };
                socket.nsp.in(userInfo.room_id).emit("countdown", {selected_letter: userdata.selected_letter});
            })

            socket.on('start-round', async (userInfo:UserInfo)=>{
                /**
                 * TODO:
                 * Broadcast Selected letter to the clients attached.
                 * Get room data and have a countdown using the round duration
                 * After the countdown emit a stop-round event
                 */

                let room = await Room.findById(userInfo.room_id);
                if(!room){
                    socket.emit("room-connect-error", "No matching rooms found");
                }
                if(!(roomStatusMap.get(room?.status!) == "InProgress") ){
                    socket.emit("room-connect-error", "Action not permitted");
                }

                let userdata:TokenData = JSON.parse(atob(userInfo.token));

                let connectedSockets = await socket.nsp.in(userInfo.room_id).fetchSockets();
                let isDictator = connectedSockets.find((socket)=> (socket.data as SocketData).user.isDictator && (socket.data as SocketData).user.id === userdata.id);
                if(!isDictator){
                    socket.emit("room-connect-error", "Client does not have permission to start round please wait until letter is selected")
                };
                userdata.timeout = room?.round_duration!;

                // emit to everyone in the room that they should stop after timeout
                
                let round_timeout = setTimeout(()=>{
                    socket.nsp.to(userInfo.room_id).emit("stop-round");
                }, userdata.timeout);

                // persist the timeout id to clear timeout if the user wishes to end round before the timeout completes.
                SocketController.TimeoutMap.set(userInfo.room_id, round_timeout);

            });
            socket.on('stop-round', async(userInfo:UserInfo)=>{
                /**
                 * TODO:
                 * This listener is for persons that wish to stop the round before timer.
                 * If the client that selects this option is the person assigned as Dictator.
                 * This will broadcast a stop-round event which overides previous round_duration. 
                 */

                let room = await Room.findById(userInfo.room_id);
                if(!room){
                    socket.emit("room-connect-error", "No matching rooms found");
                }
                if(!(roomStatusMap.get(room?.status!) == "InProgress") ){
                    socket.emit("room-connect-error", "Action not permitted");
                }

                let userdata:TokenData = JSON.parse(atob(userInfo.token));

                let connectedSockets = await socket.nsp.in(userInfo.room_id).fetchSockets();
                let isDictator = connectedSockets.find((socket)=> (socket.data as SocketData).user.isDictator && (socket.data as SocketData).user.id === userdata.id);
                if(!isDictator){
                    socket.emit("room-connect-error", "Client does not have permission to start round please wait until letter is selected")
                };
                // checks the timout map to see if there is a timeout for this room then clears the timeout
                if(SocketController.TimeoutMap.has(userInfo.room_id)){
                    clearTimeout(SocketController.TimeoutMap.get(userInfo.room_id));
                    SocketController.TimeoutMap.delete(userInfo.room_id);

                }
                socket.nsp.to(userInfo.room_id).emit("stop-round");
            });
            socket.on('start-voting', async (userInfo:UserInfo)=>{
                /**
                 * TODO:
                 * This listener will accept the user/responses and fields as key value pair.
                 * The listener will then send all the users responses to the other sockets.
                 */

                let room = await Room.findById(userInfo.room_id);
                if(!room){
                    socket.emit("room-connect-error", "No matching rooms found");
                }
                if(!(roomStatusMap.get(room?.status!) == "InProgress") ){
                    socket.emit("room-connect-error", "Action not permitted");
                }

                let userData:TokenData = JSON.parse(atob(userInfo.token));
                socket.to(userInfo.room_id).emit("round-response", {userData})
            });
            socket.on('stop-voting', async (userInfo: UserInfo)=>{
                /**
                 * TODO:
                 * This is where the secret sauce will be added. For now though:
                 * This listener will accept user votes which is a key value pair for room gamefields and vote either 1 / 0;
                 * The votes per field per user will then be averaged then rounded down.
                 * for example:
                 * The room dictator will then be changed and emitted to all members of the room.
                 * Scores will then be broadcasted to all members of the room in an event 'scores tallied'
                 * 
                 */

                let room = await Room.findById(userInfo.room_id);
                if(!room){
                    socket.emit("room-connect-error", "No matching rooms found");
                }
                if(!(roomStatusMap.get(room?.status!) == "InProgress") ){
                    socket.emit("room-connect-error", "Action not permitted");
                }
                // The total amount of rounds for the room has ended.
                ///emit the game over event if the current round reaches the limit set on the room.
                if(room?.round_limit! >= (socket.data as SocketData).user.current_round){
                    // Calculate the winner from the room then save the points to the user in the database. There can only be one user or none.
                    // If there is no highest score then noone will win no updates will be made to the respective users record.


                    socket.nsp.to(userInfo.room_id).emit("gameover");
                }

                let connectedSockets = await socket.nsp.in(userInfo.room_id).fetchSockets();

                SocketController.chooseDictatorAndEmitEvent(connectedSockets, "choose-letter");
            });
            

            

            

        });
        SocketController.IO = io;
    }

    static SocketAuthMiddleware(socket:Socket, next:Function){
                    console.log("No one will pass");

        next();
    }

    static playerConnect(){

    }

    static chooseDictatorAndEmitEvent(connectedSockets:RemoteSocket<DefaultEventsMap, any>[], event:string){
        let index = connectedSockets.findIndex((socket)=> socket.data.isDictator);
        // if no dictator is found or the last dictator is the last socket in the list then make the first socket be the dictator.
        if(index == -1 || index === connectedSockets.length-1){
            (connectedSockets[0].data as SocketData).user.isDictator = true;
        }else{
            (connectedSockets[index + 1].data as SocketData).user.isDictator = true;
        }

        let dictator = connectedSockets.find((socket)=> socket.data.isDictator)!;
        dictator?.emit(event)

        
    }

}


type SocketData ={
    user: {
        email: string,
        username: string,
        id: string,
        points: number,
        isDictator:boolean,
        current_round: number
    },
    room:{
        size:number
    }




}
type UserInfo = {
    token: string,
    room_id: string
}

type TokenData = {
    email:string, 
    username:string, 
    id: string, 
    selected_letter: string, 
    timeout:number,
    responses: {[x:string]: any}[]
}
import { RemoteSocket, Server, Socket } from 'socket.io';
import { Room, StatusEnum } from '../../schema/room';
import { roomStatusMap } from '../../interfaces/room';
import { ObjectId } from 'mongoose';
import { getKeyByValue } from '../../helpers/Utility.helper';
import { DefaultEventsMap } from 'socket.io/dist/typed-events';
import User, { UserSchema } from '../../schema/user';



export class SocketController{
    static IO:Server;
    static Namespaces = {};
    static TimeoutMap = new Map();
    static roomDataMap = new Map();
    static roomResponseMap = new Map();
    static roomVoteMap = new Map();
    static init(io:Server){
        
        io.on("connection", (socket)=>{
            
            console.log(socket.id);
            socket.emit("Connected");
        });

        


        // io.of("/gameroom/room_").use((socket, next)=>{
        //     console.log("No one will pass");
        //     next(new Error("I won't let anything pass"));
        // })
        io.of('/gameroom').on('connection', async(socket)=>{

            socket.on('join_room', async(userInfo: UserInfo)=>{
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
                    //Create user Object.
                    //Token will contain userData like {email, id, username}
                    let userdata:TokenData = JSON.parse(atob(userInfo.data));

                    let user = await User.findById(userdata.id);
                    if(!user) return socket.emit("room_connect_error", "No matching record found for this user")

                    let room = await Room.findById(userInfo.room_id);
                    if(!room){
                        socket.emit("room_connect_error", "No rooom matches this room id");
                    }
                    if((room?.status != StatusEnum.ONLINE) && room?.creator != user.id){
                        return socket.emit("room_connect_error", "Room is currently unavailable");
                    }
                    room?.updateOne({status: StatusEnum.ONLINE}).exec();
                    // Joins a room using the room id as a iterator.
                    socket.join(room?.id);

                    // io.socketsJoin(userInfo.room_id);
                    // let connectedSockets = await socket.nsp.in(userInfo.room_id).fetchSockets();
                    let connectedSockets = await io.in(userInfo.room_id).fetchSockets();

                    if(room?.player_limit == connectedSockets.length){
                        // Room full but socket is the creater. I will kick out a random nobody..lol
                        if(room?.creator! == (userdata.id as unknown as ObjectId)){
                            let rand = Math.floor(Math.random()* connectedSockets.length);
                            connectedSockets[rand].leave(userInfo.room_id); //ah so unfortunate lol.
                        }else{
                            // emit to socket that they cannot connect
                            socket.emit("room_connect_error", "Room limit reached");
                        }
                    }
                    socket.join(userInfo.room_id);



                    // socket.broadcast.to(userInfo.room_id).emit("player_connected", room);
                    let sockets = await socket.nsp.in(userInfo.room_id).fetchSockets();
                    // set initial user data
                    let initialUserData = {
                        email: userdata.email,
                        username: userdata.username,
                        id: userdata.id,
                        points: 0,
                        isDictator:false,
                        current_round: 0,
                    }
                    socket.data = {user: initialUserData};
                    // emit to all connected players the data of those who are currently connected to the room.
                    socket.nsp.to(userInfo.room_id).emit('player_connected',{players : sockets.map((socket)=>socket.data.user), isFull: room?.player_limit == sockets.length});
                }catch(error:any){
                    console.log(error.message)
                    socket.emit('room_connect_error', "Unable to connect with this id")
                }
            });

            socket.on('start_game', async(userInfo: UserInfo)=>{
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
                    socket.emit("room_connect_error", "No matching rooms found");
                }else if(room.status == StatusEnum.INPROGRESS){
                    socket.emit("Game is already in session");
                }
                // if(!(roomStatusMap.get(room?.status!) == "Online") ){
                //     socket.emit("room_connect_error", "Room is currently unavailable");
                // }
                let userdata:{email:string, username:string, id: string, selected_letter: string, timeout:number} = JSON.parse(atob(userInfo.data));

                let connectedSockets = await socket.nsp.in(userInfo.room_id).fetchSockets();

                
                //If the total number of client doesn't match the room limit and client is not the creator.Then do nothing.
                if(room?.player_limit != connectedSockets.length && !(room?.creator! == (userdata.id as unknown as ObjectId))){
                    return socket.emit("room_connect_error", "Client doesn't have permission to start game before all sockets are connected");
                }
                // Change room status to inProgress

                room?.updateOne({status: StatusEnum.INPROGRESS}).exec();
                // choose dictator and emit choose_letter event.

                SocketController.chooseDictator(connectedSockets);
                if(socket.data.user.isDictator){
                    socket.emit("choose_letter");
                    socket.broadcast.to(userInfo.room_id).emit("waiting", {main_message: "Waiting on the Dictator to choose a letter.", side_messages:[]})
                }

                

            });

            socket.on('letter_selected', async (userInfo:UserInfo)=>{
                try {
                    let room = await Room.findById(userInfo.room_id);
                    if(!room){
                        socket.emit("room_connect_error", "No matching rooms found");
                    }
                    if(!(room?.status == StatusEnum.INPROGRESS) ){
                        socket.emit("room_connect_error", "Action not permitted");
                    }
    
                    let userdata:TokenData = JSON.parse(atob(userInfo.data));
    
                    let connectedSockets = await socket.nsp.in(userInfo.room_id).fetchSockets();
                    let isDictator = connectedSockets.find((socket)=> (socket.data as SocketData).user.isDictator && (socket.data as SocketData).user.id === userdata.id);
                    if(!isDictator){
                        socket.emit("room_connect_error", "Client does not have permission to start round please wait until letter is selected")
                    };
    
                    socket.nsp.in(userInfo.room_id).emit("countdown", {selected_letter: userdata.selected_letter});
                } catch (error) {
                    console.log(error);
                    socket.emit("room_connect_error", "Something Occured with the server");
                }
            })

            socket.on('start_round', async (userInfo:UserInfo)=>{
                /**
                 * TODO:
                 * Broadcast Selected letter to the clients attached.
                 * Get room data and have a countdown using the round duration
                 * After the countdown emit a stop_round event
                 */

                let room = await Room.findById(userInfo.room_id);
                if(!room){
                    return socket.emit("room_connect_error", "No matching rooms found");
                }
                if(!(room?.status == StatusEnum.INPROGRESS) ){
                    socket.emit("room_connect_error", "Action not permitted");
                }

                let userdata:TokenData = JSON.parse(atob(userInfo.data));

                let connectedSockets = await socket.nsp.in(userInfo.room_id).fetchSockets();
                let isDictator = connectedSockets.find((socket)=> (socket.data as SocketData).user.isDictator && (socket.data as SocketData).user.id === userdata.id);
                if(!isDictator){
                    socket.emit("room_connect_error", "Client does not have permission to start round please wait until letter is selected")
                };
                userdata.timeout = room?.round_duration!;
                this.roomResponseMap.set(room._id,[] );
                this.roomVoteMap.set(room?.id,[] );

                // emit to everyone in the room that they should stop after timeout
                // let round_timeout = setTimeout(()=>{
                //     socket.emit("stop_round", {main_message: "Time is up", side_messages:[]});
                // }, userdata.timeout * 1000);
                // emit to everyone in the room that they should stop after timeout'

                console.log(room.round_duration);
                timeoutManager(socket, room.id, room.round_duration, 1000, {name: "stop_round", data:{main_message: "Time is up", side_messages:[]}});
            });
            socket.on('stop_round', async(userInfo:UserInfo)=>{
                /**
                 * TODO:
                 * This listener is for persons that wish to stop the round before timer.
                 * If the client that selects this option is the person assigned as Dictator.
                 * This will broadcast a stop_round event which overides previous round_duration. 
                 */
                console.log("In Stop Round")

                let room = await Room.findById(userInfo.room_id);
                if(!room){
                    socket.emit("room_connect_error", "No matching rooms found");
                }
                if(!(room?.status == StatusEnum.INPROGRESS) ){
                    socket.emit("room_connect_error", "Action not permitted");
                }

                let userdata:TokenData = JSON.parse(atob(userInfo.data));

                let connectedSockets = await socket.nsp.in(userInfo.room_id).fetchSockets();
                let isDictator = connectedSockets.find((socket)=> (socket.data as SocketData).user.isDictator && (socket.data as SocketData).user.id === userdata.id);
                if(!isDictator){
                    socket.emit("room_connect_error", "Client does not have permission to stop round please wait until letter is selected")
                }else{
                // checks the timout map to see if there is a timeout for this room then clears the timeout
                if(SocketController.TimeoutMap.has(userInfo.room_id)){
                    clearTimeout(SocketController.TimeoutMap.get(userInfo.room_id).id);
                    SocketController.TimeoutMap.delete(userInfo.room_id);
                    return socket.nsp.to(userInfo.room_id).emit("stop_round", {main_message: "Dictator has chosen to end the round.", side_messages:[]});

                }
                }

            });

            socket.on('round_response', async (userInfo:UserInfo)=>{
                /**
                 * TODO:
                 * This listener will accept the user/responses and fields as key value pair.
                 * The listener will then send all the users responses to the other sockets.
                 */

                try{

                    let room = await Room.findById(userInfo.room_id);
                if(!room){
                    socket.emit("room_connect_error", "No matching rooms found");
                }
                if(!(room?.status == StatusEnum.INPROGRESS) ){
                    socket.emit("room_connect_error", "Action not permitted");
                }
                let connectedSockets = await socket.nsp.in(userInfo.room_id).fetchSockets();

                // Emit waiting event while waiting on all responses from connected clients
                if(!this.roomResponseMap.has(room?.id)){
                    this.roomResponseMap.set(room?.id,[] );
                };
                let socketResponse = JSON.parse(atob(userInfo.data));
                let roundResponses = this.roomResponseMap.get(room?.id);
                let user = await User.findById(socketResponse["player"]);
                if(user){
                    socketResponse["player"] = user.username;
                }else{
                    console.log("Incorrect user")
                    return socket.emit("room_connect_error", "No matching user found"); 
                }
                roundResponses.push(socketResponse);
                console.log("Responses: ",roundResponses.length );
                timeoutManager(socket, room?.id, room?.voting_duration!, 1000, {name:"time_up", data:{next_event:"submit_vote", message: {main_message: "Voting time is up. ", side_messages:[]}}});
                if(roundResponses.length != connectedSockets.length){
                    socket.nsp.to(userInfo.room_id).emit("waiting", {main_message: "waiting for responses"});
                }else{
                    // If all responses are made then we can proceed even before the time has expired.
                    socket.nsp.to(userInfo.room_id).emit("round_responses", {responses: this.roomResponseMap.get(room?.id)})
                    this.roomResponseMap.set(room?.id,[] );
                    // clearInterval(SocketController.TimeoutMap.get(room?.id).id);
                    
                }
                }catch(error){
                    console.log(error);
                    socket.emit("room_connect_error", "Something Occured with the server");

                }
                
            });

            socket.on('submit_vote', async (userInfo:UserInfo)=>{
                /**
                 * TODO:
                 * This listener will accept the user/responses and fields as key value pair.
                 * The listener will then send all the users responses to the other sockets.
                 */
                let room_id = "";
                try{

                    let room = await Room.findById(userInfo.room_id);
                    if(!room){
                        socket.emit("room_connect_error", "No matching rooms found");
                    }
                    if(!(room?.status == StatusEnum.INPROGRESS) ){
                        socket.emit("room_connect_error", "Action not permitted");
                    }
                    let connectedSockets = await socket.nsp.in(userInfo.room_id).fetchSockets();

                    // Emit waiting event while waiting on all responses from connected clients
                    if(!this.roomVoteMap.has(room?.id)){
                        this.roomVoteMap.set(room?.id,[] );
                    };
                    let userData:UserVote = JSON.parse(atob(userInfo.data));
                    let roomVotes:UserVote[] = this.roomVoteMap.get(room?.id);
                    let user = await User.findById(userData.socket_user_id);
                    if(!user){
                        return socket.emit("room_connect_error", "User is not allowed to be in this room")
                    }
                    userData.socket_user = user.username;
                    roomVotes.push(userData);
                    /**
                     * Get all votes
                     */
                    let  scoreTable = [];
                    console.log("Room Votes Length", roomVotes.length)   
                    console.log("Room Votes", roomVotes)
                 
                    if(roomVotes.length != connectedSockets.length){
                        return socket.emit("waiting", {main_message: "waiting for responses"});
                    }else{
                        scoreTable = calculateVotes(roomVotes);
                        if(SocketController.TimeoutMap.has(userInfo.room_id)){
                            clearTimeout(SocketController.TimeoutMap.get(userInfo.room_id).id);
                            SocketController.TimeoutMap.delete(userInfo.room_id);        
                        }    
                        this.roomResponseMap.set(room?.id,[] );
                        socket.nsp.to(userInfo.room_id).emit("round_tally", {response: scoreTable});
                        // timeoutManager(socket, userInfo.room_id, 10, 1000, );
                         // The total amount of rounds for the room has ended.
                        if(room?.round_limit! <= (socket.data as SocketData).user.current_round){
                            // Calculate the winner from the room then save the points to the user in the database. There can only be one user or none.
                            // If there is no highest score then noone will win no updates will be made to the respective users record.
                            return timeoutManager(socket, userInfo.room_id, 15, 1000, {name :"Gameover", data:{}})
                        }

                        let connectedSockets = await socket.nsp.in(userInfo.room_id).fetchSockets();

                        SocketController.chooseDictator(connectedSockets);
                        timeoutManagerNewRound(socket, userInfo.room_id, 15, 1000, connectedSockets);
                        
                    }    
                }catch(error){
                    console.log(error);
                    this.roomResponseMap.set(room_id,[] );
                    socket.emit("room_connect_error","Something occured on the server")
                }
            });
            socket.on('start_voting', async (userInfo:UserInfo)=>{
                /**
                 * TODO:
                 * This listener will accept the user/responses and fields as key value pair.
                 * The listener will then send all the users responses to the other sockets.
                 */

                let room = await Room.findById(userInfo.room_id);
                if(!room){
                    socket.emit("room_connect_error", "No matching rooms found");
                }
                if(!(room?.status == StatusEnum.INPROGRESS) ){
                    socket.emit("room_connect_error", "Action not permitted");
                }

                let userData:TokenData = JSON.parse(atob(userInfo.data));
                socket.to(userInfo.room_id).emit("round_response", {userData})
            });
            socket.on('stop_voting', async (userInfo: UserInfo)=>{
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
                    socket.emit("room_connect_error", "No matching rooms found");
                }
                if(!(room?.status == StatusEnum.INPROGRESS) ){
                    socket.emit("room_connect_error", "Action not permitted");
                }
                // The total amount of rounds for the room has ended.
                ///emit the game over event if the current round reaches the limit set on the room.
                if(room?.round_limit! >= (socket.data as SocketData).user.current_round){
                    // Calculate the winner from the room then save the points to the user in the database. There can only be one user or none.
                    // If there is no highest score then noone will win no updates will be made to the respective users record.


                    socket.nsp.to(userInfo.room_id).emit("gameover");
                }

                let connectedSockets = await socket.nsp.in(userInfo.room_id).fetchSockets();

                SocketController.chooseDictator(connectedSockets);
                if(socket.data.user.isDictator){
                    socket.emit("choose_letter")
                }else{
                    socket.emit("waiting", {main_message: "Waiting on the Dictator to choose a letter.", side_messages: []})
                }
            }); 
            
            socket.on("leave-room", async(userInfo:UserInfo)=>{
                let userdata:TokenData = JSON.parse(atob(userInfo.data));

                let user = await User.findById(userdata.id);
                if(!user) return socket.emit("room_connect_error", "No matching record found for this user")

                let room = await Room.findById(userInfo.room_id);
                if(!room){
                    socket.emit("room_connect_error", "No rooom matches this room id");
                }
                if((room?.status != StatusEnum.ONLINE) && room?.creator != user.id){
                    return socket.emit("room_connect_error", "Room is currently unavailable");
                }
                
                socket.leave(room?.id);
                
            });

            

        });

        io.of("/gameroom").on("disconnect",()=>{
            console.log("disconnected");
        })
        SocketController.IO = io;
    }

    static SocketAuthMiddleware(socket:Socket, next:Function){
                    console.log("No one will pass");

        next();
    }

    static playerConnect(){

    }

    static chooseDictator(connectedSockets:RemoteSocket<DefaultEventsMap, any>[]){
        let index = connectedSockets.findIndex((socket)=> (socket.data as SocketData).user.isDictator == true);
        // if no dictator is found or the last dictator is the last socket in the list then make the first socket be the dictator.
        let randIndex = Math.floor(Math.random() * connectedSockets.length);
        if(index == -1 || index === connectedSockets.length-1){
            (connectedSockets[0].data as SocketData).user.isDictator = true;
        }else if( (index+1 > connectedSockets.length-1)){
            clearDictatorStatus(connectedSockets); // clears the status of the dictator if there was a dictator already selected.
            (connectedSockets[0].data as SocketData).user.isDictator = true;
        }else{
            clearDictatorStatus(connectedSockets); // clears the status of the dictator if there was a dictator already selected.
            console.log("Choosing a dictator");
            (connectedSockets[index+1].data as SocketData).user.isDictator = true;
        }
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
        size:number,
        id:string
    }




}
type UserInfo = {
    data: string,
    room_id: string
}

type UserVote = {
    socket_user_id: string,
    socket_user: string,

    vote:{
        player: string, 
        response: {
            [key:string]:{value:string, isCorrect:boolean}
        }
    }[]
}

type TokenData = {
    email:string, 
    username:string, 
    isDictator: number,
    id: string, 
    selected_letter: string, 
    timeout:number,
    responses: {[x:string]: any}[]
}

function calculateVotes(votes: UserVote[]):{player:string , response: {[key:string]:{ value: string; votes: number; }}}[]{
    let users_tally = [];
    for(let user of votes){
        let userObj:{player:string, response: {[key:string]: {value: string, votes: number}}};
        userObj = {player: user.socket_user, response:{}};

        // compare all votes to get total votes by pointer user for the user at this iteration.
        for(let pointeruser of votes){
            //find the votes for the socket user
                for(let user_response of pointeruser.vote){                    
                    if(userObj.player == user_response.player){
                        let objectSum = sumObjectProperties(userObj.response, user_response.response);
                        userObj.response = objectSum;
                        break;
                }
                
                // userObj.sum+=tally;
            } 
        }
        users_tally.push(userObj);
    }
    return users_tally;

}

function sumObjectProperties(originalObject: {[key:string]:{value:string, votes:number}}, objectWithUpdates: {[key:string]:{value:string, isCorrect:boolean}}): {[key:string]:{value:string, votes:number}}{
    if(Object.keys(originalObject).length == 0){
        Object.entries(objectWithUpdates).forEach(([prop, valueObj])=>{
            originalObject[prop] = {value: valueObj.value, votes: Number(objectWithUpdates[prop].isCorrect)}
        })  
    }else{
        for(let prop in originalObject){
            originalObject[prop].votes += Number(objectWithUpdates[prop].isCorrect); // converts true false to 1 or 0 respectively
        }
    }

    return originalObject;
}

function timeoutManager(socket:Socket, room_id: string, duration: number, interval:number, callback:{name:string, data: object}, toRoom = true){
    if(!SocketController.TimeoutMap.has(room_id)){
        let round_timeout = setInterval(()=>{
            if(SocketController.TimeoutMap.has(room_id) && (SocketController.TimeoutMap.get(room_id).timeLeft >= 0)){
                let countdownVal = SocketController.TimeoutMap.get(room_id).timeLeft;
                socket.nsp.to(room_id).emit("timer", {time_remaining:countdownVal});
                SocketController.TimeoutMap.set(room_id, {id: round_timeout, timeLeft: --countdownVal});
            }else{
                clearTimeout(round_timeout);
                SocketController.TimeoutMap.delete(room_id);
                if(!toRoom){
                    console.log(callback.name)
                    return socket.emit(callback.name, callback.data);
                }
                return socket.nsp.to(room_id).emit(callback.name, callback.data)
                // return cb;
            }

        }, interval);
         // persist the timeout id to clear timeout if the user wishes to end round before the timeout completes.
        SocketController.TimeoutMap.set(room_id, {id: round_timeout, timeLeft: duration});
    }else{
        // Since we are working with a set interval. I can just not do anything if a timeout is already created in the room.
        return;
    }
}

function timeoutManagerNewRound(socket:Socket, room_id: string, duration: number, interval:number, socketList:RemoteSocket<DefaultEventsMap, any>[]){
    if(!SocketController.TimeoutMap.has(room_id)){
        let round_timeout = setInterval(()=>{
            if(SocketController.TimeoutMap.has(room_id) && (SocketController.TimeoutMap.get(room_id).timeLeft >= 0)){
                let countdownVal = SocketController.TimeoutMap.get(room_id).timeLeft;
                socket.nsp.to(room_id).emit("timer", {time_remaining:countdownVal});
                SocketController.TimeoutMap.set(room_id, {id: round_timeout, timeLeft: --countdownVal});
            }else{
                clearTimeout(round_timeout);
                SocketController.TimeoutMap.delete(room_id);

                for(let i = 0; i < socketList.length; i++){
                    if(socketList[i] instanceof Socket){
                        socket = socketList[i] as unknown as Socket;
                    }
                    // let socket = connectedSockets[i] as Socket;
                    if(socket.data.user.isDictator){
                        socket.nsp.in(room_id).emit("waiting", {main_message: "Waiting on the Dictator to choose a letter.", side_messages:[]})
                        socket.emit("choose_letter", {});
                        return;
                    }
                }
                // return cb;
            }

        }, interval);
         // persist the timeout id to clear timeout if the user wishes to end round before the timeout completes.
        SocketController.TimeoutMap.set(room_id, {id: round_timeout, timeLeft: duration});
    }else{
        // Since we are working with a set interval. I can just not do anything if a timeout is already created in the room.
        return;
    }
}

function clearDictatorStatus(connectedSockets: RemoteSocket<DefaultEventsMap, any>[]) {
    connectedSockets.forEach((socket)=>{
        (socket.data as SocketData).user.isDictator = false;
    })
}

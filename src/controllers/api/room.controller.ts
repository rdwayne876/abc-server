import { Request, Response } from 'express';
import { JsonResponse } from '../../helpers/JsonResponse.helper';
import HttpStatusCode from '../../helpers/StatusCodes.helper';
import { IRoomModel, Room, StatusEnum } from '../../schema/room';
import { isObjectIdOrHexString } from 'mongoose';
import { body, validationResult } from 'express-validator';
import { IRoom, roomPrivacyMap, roomStatusMap } from '../../interfaces/room';

export class RoomController{
    public static createRoomValidators = [
        body("name", "Name should not be blank").notEmpty(),
        body("player_limit", "Should be a number representing seconds").isNumeric(),
        body("voting_duration", "Should be a number representing seconds").isNumeric(),
        body("round_duration", "Should be a number representing seconds").isNumeric(),
        body("gameFields", "Should be an array of strings representing fields").isArray(),
        body("status", "Status should be a valid status type").isNumeric(),
        body("privacy", "Privacy should be a valid privacy type").isNumeric(),
    ];

    public static async getAllRooms(req:Request, res:Response){
        try{
            let rooms = await Room.find();
            return JsonResponse.success(res, "Successfully retrieved all rooms", {rooms});
        }catch(e: any){
            return JsonResponse.error(res, "Unable to retrieve rooms",[], HttpStatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    public static async createRoom(req: Request, res:Response){
        try{
            let errors = validationResult(req);
            if(!errors.isEmpty()){
                return JsonResponse.error(res, "Invalid data fields", errors.array());
            }
            let reqBody = req.body;
            if(req.user){
                let tokenData:{[x:string]: any} = req.user;

                reqBody.creator = tokenData["id"];
            }
            let existingRoom = await Room.findOne({name: reqBody.name});
            if(existingRoom){
                return JsonResponse.error(res, "Unable to create room", ["Existing room found with this name"])
            }
            let room = new Room(reqBody);

            let newRoom = await room.save();
            if(!newRoom){
                return JsonResponse.error(res, "Unable to create room", ["Room data not being saved"])
            }
            return JsonResponse.success(res, "Successfully created room", {room:RoomController.sanitizeRoom(newRoom)})
        

        }catch(e:any){
            return JsonResponse.error(res, "Unable to create room", [e], HttpStatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    public static async getRoomById(req:Request, res:Response){
        let id = req.params.id;

        try{
            if(!isObjectIdOrHexString(id)){
                throw new Error("Invaid indentifier");
            }else{
                let room = await Room.findById(id);
                if(!room){
                    throw new Error("No matching records found")
                }
                return JsonResponse.success(res, "Successfully retrieved room",{room:RoomController.sanitizeRoom(room)});
            }
        }catch(e:any){
            return JsonResponse.error(res, "Unable to retrieve room", [e])
        }
    }

    public static async createRoomForm(req: Request, res: Response){
        let status:{[x:string]:any} = {};
        let privacy:{[x:string]:any} = {}
        roomStatusMap.forEach((val, key)=>{
            status[key] = val;
        });
        roomPrivacyMap.forEach((val, key)=>{
            privacy[key] = val;
        });
        return JsonResponse.success(res, "Request was successful", {status, privacy})
    }
    public static async updateRoom(req:Request, res:Response){
        let id = req.params.id;
        let errors = validationResult(req);
        if(!errors.isEmpty()){
            return JsonResponse.error(res, "Invalid data fields", errors.array());
        }
        let reqBody = req.body;
        if(req.user){
            let tokenData:{[x:string]: any} = req.user;
            reqBody.creator = tokenData["id"];
        }


        try{
            if(!isObjectIdOrHexString(id)){
                throw new Error("Invaid indentifier");
            }else{
                let room = await Room.findById(id);
 
                if(!room){
                    throw new Error("No matching records found")
                }else if(room.creator != reqBody.creator){
                    return JsonResponse.error(res, "Unauthorized action attempted", ["Only the creater is allowed to update room data"],HttpStatusCode.UNAUTHORIZED)
                }
                let updated = await Room.findByIdAndUpdate(id, reqBody);
                if(updated){

                    return JsonResponse.success(res, "Successfully updated room");
                }

            }
        }catch(e:any){
            console.log(e);
            return JsonResponse.error(res, "Unable to retrieve room", [e])
        }
    }

    public static async deleteRoom(req:Request, res:Response){
        let id = req.params.id;
        let errors = validationResult(req);
        if(!errors.isEmpty()){
            return JsonResponse.error(res, "Invalid data fields", errors.array());
        }
        let reqBody = req.body;
        if(req.user){
            let tokenData:{[x:string]: any} = req.user;
            reqBody.creator = tokenData["id"];
        }


        try{
            if(!isObjectIdOrHexString(id)){
                throw new Error("Invaid indentifier");
            }else{
                let room = await Room.findById(id);
 
                if(!room){
                    throw new Error("No matching records found")
                }else if(room.creator != reqBody.creator){
                    return JsonResponse.error(res, "Unauthorized action attempted", ["Only the creater is allowed to update room data"],HttpStatusCode.UNAUTHORIZED)
                }
                console.log(reqBody)
                let deleted = await Room.findByIdAndDelete(id);
                if(deleted){

                    return JsonResponse.success(res, "Successfully deleted room");
                }

            }
        }catch(e:any){
            console.log(e);
            return JsonResponse.error(res, "Unable to retrieve room", [e])
        }
    }

    public static sanitizeRoom(room:IRoomModel){
        let sanitizedRoom = {
            ...room.toObject(),
            status: roomStatusMap.get(room.status),
            privacy: roomPrivacyMap.get(room.privacy)
        }
        
        return sanitizedRoom;
    }
}
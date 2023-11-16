import User from '../../schema/user';
import { NextFunction, Request, Response } from 'express';
import IUser from '../../interfaces/user';
import { JsonResponse } from '../../helpers/JsonResponse.helper';
import HttpStatusCode from '../../helpers/StatusCodes.helper';
import { ValidationChain, body, validationResult } from 'express-validator';
import { Room } from '../../schema/room';
import { roomPrivacyMap, roomStatusMap } from '../../interfaces/room';
import { transformMapToObject } from '../../helpers/Utility.helper';

export class UserController{
    public static updateUserValidator = [
        body("firstName", "firstName should not be blank").notEmpty(),
        body("lastName", "lastName should not be blank").notEmpty(),
        body("username", "Username should not be blank").notEmpty(),
        body("email", "Email should not be blank").notEmpty(),
    ];

    public static async getAllUsers(req: Request, res:Response){
        const users = await User.find();
        return JsonResponse.success(res, "Successfully retrieved users", {users});
    }
    public static getUserById(req:Request, res:Response){
        let id = req.params.id;
        
        
    }
    public static async updateUserData(req:Request, res:Response){
        let id = req.params.id;
        let reqBody = req.body;
        try{
            let user = await User.findById(id);
            if(!user){
                return JsonResponse.error(res, "No matching record found", ['Unable to find user to update'], HttpStatusCode.NOT_FOUND);
            }
            user = await User.findByIdAndUpdate(id, reqBody, {new:true});
            return JsonResponse.success(res, "Successfully updatedd user", {user})
        }catch(e: any){
            return JsonResponse.error(res, "Error occurred when trying to update user", [e], HttpStatusCode.UNPROCESSABLE_ENTITY)
        }

    }
    public static DeleteUser(req:Request, res:Response){
        let id = req.params.id;
        
    }
    public static async getUserProfile(req:Request, res:Response){
        try{
            // There should be no possibility of req.user being null since this is a authorized route
            if(req.user){
                let tokenData:{[x:string]: any} = req.user!;
                let user = await User.findById(tokenData['id']);
                user!.password = "";
                if(!user){
                    return JsonResponse.error(res, "No matching record found", ["User profile does not exist"], HttpStatusCode.NOT_FOUND);
                }
                let user_rooms = await Room.find({creator: user.id});
                let roomStatusOptions = transformMapToObject(roomStatusMap);
                let roomPrivacyOptions = transformMapToObject(roomPrivacyMap);
                return JsonResponse.success(res, "Successfully Retrieved profile", {user, rooms: user_rooms, statusOptions:roomStatusOptions,privacyOptions: roomPrivacyOptions});
            }
            
        }catch(e: any){
            return JsonResponse.error(res, "Error occurred when retrieving user profile", [e], HttpStatusCode.UNPROCESSABLE_ENTITY)
        }
    }
}
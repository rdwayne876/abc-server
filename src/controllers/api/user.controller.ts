import User from '../../schema/user';
import { NextFunction, Request, Response } from 'express';
import IUser from '../../interfaces/user';
import { JsonResponse } from '../../helpers/JsonResponse.helper';
import HttpStatusCode from '../../helpers/StatusCodes.helper';
import { ValidationChain, body, validationResult } from 'express-validator';

export class UserController{
    

    public static async getAllUsers(req: Request, res:Response){
        const users = await User.find();
        return JsonResponse.success(res, "Successfully retrieved users", {users});
    }
    public static getUserById(req:Request, res:Response){
        let id = req.params.id;
        
        
    }
    public static updateUserData(req:Request, res:Response){


    }
    public static DeleteUser(req:Request, res:Response){
        let id = req.params.id;
        


    }
}
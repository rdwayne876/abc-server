import { NextFunction, Request, Response } from "express";
import { JsonResponse } from "../helpers/JsonResponse.helper";
import HttpStatusCode from "../helpers/StatusCodes.helper";
import jwt from 'jsonwebtoken';

export const isAuthorized = (req:Request, res:Response, next:NextFunction)=>{
        const token = req.headers.authorization?.split(' ')[1]; // this will come over as 'Bearer `token-sent-by-user` we just need the token'
      
        if (!token) {
          return JsonResponse.error(res, "Unauthorized access attempted", ['No token provided'], HttpStatusCode.UNAUTHORIZED);
        }
        try{
            const decodedToken = jwt.verify(token, res.locals.app.appSecret);
            if(!decodedToken){
                return JsonResponse.error(res, "Unauthroized access attempted", ["Failed to authenticate token"], HttpStatusCode.UNAUTHORIZED);
            }
            req.user= decodedToken; // Attach user information to the request

        }catch(error:any){
            return JsonResponse.error(res, "Unable to process request", [error], HttpStatusCode.INTERNAL_SERVER_ERROR);
        }
      
        next();
};
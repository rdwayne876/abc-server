/**
 * @author Aldaine Clarke <github.com/aldaineclarke>
 */

import { Response } from "express";
import HttpStatusCode from "./StatusCodes.helper";

export class JsonResponse{
    public static success(res:Response, data: object | object[], message = "Request was successful", status_code = HttpStatusCode.OK){
        return res.status(status_code).json({
            message,
            data,
            errors: []
        });
    }
    public static error(res:Response, message="Request was unsuccessful",  errors: object[] | string[],status_code = HttpStatusCode.BAD_REQUEST){
        return res.status(status_code).json({
            message,
            data : [],
            errors
        });

    }
}
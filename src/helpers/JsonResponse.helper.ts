/**
 * @author Aldaine Clarke <github.com/aldaineclarke>
 */

import { Response } from "express";
import HttpStatusCode from "./StatusCodes.helper";

export class JsonResponse{
    /**
     * 
     * @param {Response} res This is the response from the middleware passed
     * @param {string} message Readable message to caller
     * @param {object} data This is an optional object which holds data to present to caller
     * @param {HttpStatusCode} status_code  This is a enum for the status code of the response
     * @returns 
     */
    public static success(res:Response, message = "Request was successful", data: object = {}, status_code = HttpStatusCode.OK){
        return res.status(status_code).json({
            message,
            data,
            errors: []
        });
    }

    /**
     * 
     * @param {Response} res This is the response from the middleware passed
     * @param {string} message Readable message to caller
     * @param {string[] | object[]} errors This is an optional object or string array which holds errors to present to caller
     * @param {HttpStatusCode} status_code  This is a enum for the status code of the response
     * @returns 
     */
    public static error(res:Response, message="Request was unsuccessful",  errors: object[] | string[] = [],status_code = HttpStatusCode.BAD_REQUEST){
        return res.status(status_code).json({
            message,
            data : [],
            errors
        });

    }
}
/**
 * Define Login Login for the API
 *
 * @author Faiz A. Farooqui <faiz@geekyants.com>
 */

import * as jwt from 'jsonwebtoken';
import { ValidationChain, body, validationResult } from 'express-validator';

import User from '../../../schema/user';
import { NextFunction, Request, Response } from 'express';
import IUser from '../../../interfaces/user';

class AuthController {
    static loginValidations:ValidationChain[] = [
        body("email", "Email cannot be blank").notEmpty(),
        body('email', 'Email is not valid').isEmail(),
        body('password', 'Password cannot be blank').notEmpty(),
        body('password', 'Password length must be atleast 8 characters').isLength({ min: 8 })
    ];
    static registerValidations:ValidationChain[] = [
        body('email', 'E-mail cannot be blank').notEmpty(),
		body('email', 'E-mail is not valid').isEmail(),
		body('password', 'Password cannot be blank').notEmpty(),
		body('password', 'Password length must be atleast 8 characters').isLength({ min: 8 }),
		body('confirmPassword', 'Confirmation Password cannot be blank').notEmpty(),
    ];


	public static ValidateAndLogin = () =>{

        return async (req:Request, res:Response, next:NextFunction)=>{
            try{
                await Promise.all(this.loginValidations.map(validation => validation.run(req)))
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });

                }

                const _email = req.body.email.toLowerCase();
                const _password = req.body.password;

                let user = await User.findOne({email: _email});
                if (!user) {
                    return res.json({
                        error: ['User not found!']
                    });
                }
                else{
                    if (! user.password) {
                        return res.json({
                            error: ['Please login using your social creds']
                        });
                    }
        
                        user.comparePassword(_password, (err: Error, isMatch:boolean) => {
                            if (err) {
                                return res.json({
                                    error: err
                                });
                            }
        
                            if (! isMatch) {
                                return res.json({
                                    error: ['Password does not match!']
                                });
                            }
                            const token = jwt.sign(
                                { email: _email, password: _password },
                                res.locals.app.appSecret,
                                { expiresIn: res.locals.app.jwtExpiresIn * 60 }
                            );
        
                            // Hide protected columns
                            let newObj:Partial<IUser> = {};
                            newObj = user!; // we did check up top to see if user exists
                            delete newObj.password;
                            delete newObj.tokens;
        
        
        
                            return res.json({
                                user: newObj,
                                token,
                                token_expires_in: res.locals.app.jwtExpiresIn * 60
                            });
                        });
                    }   
            }catch(err:any){
                return res.status(500).json({
                    error: err
                });
            }
        }  
    }
    public static ValidateAndRegister = () =>{
        return async (req:Request, res:Response)=> {
            // need to find a better place to put this
            // this.registerValidations.push(body('confirmPassword', 'Password & Confirmation password does not match').equals(req.body.password));
            let registerValidations:ValidationChain[] = [
                body('email', 'E-mail cannot be blank').notEmpty(),
                body('email', 'E-mail is not valid').isEmail(),
                body('password', 'Password cannot be blank').notEmpty(),
                body('password', 'Password length must be atleast 8 characters').isLength({ min: 8 }),
                body('confirmPassword', 'Confirmation Password cannot be blank').notEmpty(),
                body('confirmPassword', 'Password & Confirmation password does not match').equals(req.body.password)
            ]
            await Promise.all(registerValidations.map(validation => validation.run(req)))


		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({
				error: errors
			});
		}

		const _email = req.body.email.toLowerCase();
		const _password = req.body.password;

		const newUser = new User({
			email: _email,
			password: _password
		});
        try{
            let existingUser = await User.findOne({ email: _email });
            if(existingUser){
                return res.json({
					error: ['Account with the e-mail address already exists.']
				});
            }else{
              let userData = await newUser.save(); 
              return res.json({
                data: userData
            });
            }

        }catch(err:any){
            return res.status(500).json({
                error: err
            });
        }
			
    }
    }   
}

export default AuthController;
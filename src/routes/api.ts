/**
 * Define all your API web-routes
 *
 * @author Faiz A. Farooqui <faiz@geekyants.com>
 */

import { Router } from 'express';
// import * as expressJwt from 'express-jwt';

import Locals from '../providers/locals';
import AuthController from '../controllers/api/auth.controller';
import { UserController } from '../controllers/api/user.controller';
import { RoomController } from '../controllers/api/room.controller';
import { isAuthorized } from '../middlewares/authenticate';

// import HomeController from '../controllers/Api/Home';
// import RegisterController from '../controllers/Api/Auth/Register';
// import RefreshTokenController from '../controllers/Api/Auth/RefreshToken';

const router = Router();

// router.get('/', HomeController.index);

router.post('/auth/login', AuthController.ValidateAndLogin());
router.post('/auth/register', AuthController.ValidateAndRegister());
// router.post('/auth/refresh-token', expressJwt({ secret: Locals.config().appSecret }), RefreshTokenController.perform);
router.get('/users', UserController.getAllUsers);
router.patch('/users/:id',isAuthorized,...UserController.updateUserValidator, UserController.updateUserData);

router.get('/userprofile',isAuthorized ,UserController.getUserProfile);
router.get('/rooms', RoomController.getAllRooms);
router.post('/rooms',isAuthorized, ...RoomController.createRoomValidators,RoomController.createRoom);
router.get('/rooms/:id',isAuthorized,RoomController.getRoomById);
router.patch('/rooms/:id',isAuthorized,RoomController.updateRoom);
router.delete('/rooms/:id',isAuthorized,RoomController.deleteRoom);


export default router;
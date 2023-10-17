/**
 * Define all your API web-routes
 *
 * @author Faiz A. Farooqui <faiz@geekyants.com>
 */

import { Router } from 'express';
// import * as expressJwt from 'express-jwt';

import Locals from '../providers/locals';
import AuthController from '../controllers/api/auth.controller';

// import HomeController from '../controllers/Api/Home';
// import RegisterController from '../controllers/Api/Auth/Register';
// import RefreshTokenController from '../controllers/Api/Auth/RefreshToken';

const router = Router();

// router.get('/', HomeController.index);

router.post('/auth/login', AuthController.ValidateAndLogin());
router.post('/auth/register', AuthController.ValidateAndRegister());
// router.post('/auth/refresh-token', expressJwt({ secret: Locals.config().appSecret }), RefreshTokenController.perform);

export default router;
/**
 * Defines all the requisites in HTTP
 *
 * @author Faiz A. Farooqui <faiz@geekyants.com>
 */

import * as cors from 'cors';
import { Application } from 'express';
// import * as connect from 'connect-mongo';
import * as bodyParser from 'body-parser';
import * as session from 'express-session';

import Log from './log';
import Locals from '../providers/locals';
import Passport from '../providers/passport';

class Http {
	public static mount(_express: Application): Application {
		Log.info('Booting the \'HTTP\' middleware...');

		// Enables the request body parser
		_express.use(bodyParser.json({
			limit: Locals.config().maxUploadLimit
		}));
		_express.use(bodyParser.urlencoded({
			limit: Locals.config().maxUploadLimit,
			parameterLimit: Locals.config().maxParameterLimit,
			extended: false
		}));
		// Added middleware to expose appconfig to all requests
		_express.use((req, res, next)=> {
			res.locals.app = _express.locals.app;
			res.locals.meet = "string";
			next()
		})

		// Disable the x-powered-by header in response
		_express.disable('x-powered-by');

		// Enables the request flash message
				/**
		 * Enables the session store
		 *
		 * Note: You can also add redis-store
		 * into the options object.
		 */
				const options = {
					resave: true,
					saveUninitialized: true,
					secret: Locals.config().appSecret,
					cookie: {
						maxAge: 1209600000 // two weeks (in ms)
					},
					// store: new MongoStore({
					// 	url: process.env.MONGOOSE_URL,
					// 	autoReconnect: true
					// })
				};
		
				_express.use(session.default(options));

		// Loads the passport configuration
		_express = Passport.mountPackage(_express);

		return _express;
	}
}

export default Http;
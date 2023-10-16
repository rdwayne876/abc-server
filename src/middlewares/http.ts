/**
 * Defines all the requisites in HTTP
 *
 * @author Faiz A. Farooqui <faiz@geekyants.com>
 */

import * as cors from 'cors';
import { Application } from 'express';
// import * as connect from 'connect-mongo';
import * as bodyParser from 'body-parser';
// import * as expressValidator from 'express-validator';

import Log from './log';
import Locals from '../providers/locals';
import Passport from '../providers/passport';

// const MongoStore = connect(session);

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

		// Disable the x-powered-by header in response
		_express.disable('x-powered-by');

		// Enables the request payload validator
		// _express.use(expressValidator());

		// Enables the request flash message
		/**
		 * Enables the session store
		 *
		 * Note: You can also add redis-store
		 * into the options object.
		 */

		// Loads the passport configuration
		_express = Passport.mountPackage(_express);

		return _express;
	}
}

export default Http;
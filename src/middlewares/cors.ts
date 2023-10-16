/**
 * Enables the CORS
 *
 * @author Faiz A. Farooqui <faiz@geekyants.com>
 */

import cors from 'cors';
import { Application } from 'express';

import Log from './log';
import Locals from '../providers/locals';

class CORS {

	
	allowedOrigins = ['http://localhost:3000'];

	corsOptions: cors.CorsOptions = {
		origin: this.allowedOrigins
	};
	public mount(_express: Application): Application {
		Log.info('Booting the \'CORS\' middleware...');

		const options = {
			origin: Locals.config().url,
			optionsSuccessStatus: 200		// Some legacy browsers choke on 204
		};

		_express.use(cors(this.corsOptions));

		return _express;
	}
}

export default new CORS;
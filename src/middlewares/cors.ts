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

	
	public mount(_express: Application): Application {
		Log.info('Booting the \'CORS\' middleware...');

		const options = {
			// if the cors is enabled then it will set the origin if not it will allow every request to pass through
			origin: Locals.config().isCORSEnabled ? Locals.config().url: "*",
			optionsSuccessStatus: 200		// Some legacy browsers choke on 204
		};

		_express.use(cors(options));

		return _express;
	}
}

export default new CORS;
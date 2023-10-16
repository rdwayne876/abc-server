/**
 * Define passport's local strategy
 *
 * @author Faiz A. Farooqui <faiz@geekyants.com>
 */

import { Strategy } from 'passport-local';
import User, { IUserModel } from '../../schema/user';
import Log from '../../middlewares/log';

class Local {
	public static init (_passport: any): any {
		_passport.use(new Strategy({ usernameField: 'email' }, (email:string, password:string, done) => {
			Log.info(`Email is ${email}`);
			Log.info(`Password is ${password}`);

			User.findOne({ email: email.toLowerCase() }, (err:Error, user:IUserModel) => {
				Log.info(`user is ${user.email}`);
				Log.info(`error is ${err}`);

				if (err) {
					return done(err);
				}

				if (! user) {
					return done(null, false, { message: `E-mail ${email} not found.`});
				}

				if (user && !user.password) {
					return done(null, false, { message: `E-mail ${email} was not registered with us using any password. Please use the appropriate providers to Log-In again!`});
				}

				Log.info('comparing password now!');

				user.comparePassword(password, (_err:Error, _isMatch: boolean) => {
					if (_err) {
						return done(_err);
					}
					if (_isMatch) {
						return done(null, user);
					}
					return done(null, false, { message: 'Invalid E-mail or password.'});
				});
			});
		}));
	}
}

export default Local;

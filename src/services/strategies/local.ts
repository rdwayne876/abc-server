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
		_passport.use(new Strategy({ usernameField: 'email' }, async (email:string, password:string, done) => {
			Log.info(`Email is ${email}`);
			Log.info(`Password is ${password}`);
			try{

				let user = await User.findOne({ email: email.toLowerCase() });

				if(!user){
					return done(null, false, { message: `E-mail ${email} not found.`});
				}else if (user && !user.password) {
					return done(null, false, { message: `E-mail ${email} was not registered with us using any password. Please use the appropriate providers to Log-In again!`});
				}else{
					Log.info(`user is ${user.email}`);
					Log.info('comparing password now!');

					user.comparePassword(password, (_err:Error, _isMatch: boolean) => {
						if (_err) {
							return done(_err);
						}
						if (_isMatch) {
							return done(null, user!); // will need to have checks so I don't have to assert that the user is present
						}
						return done(null, false, { message: 'Invalid E-mail or password.'});
					});
				}
				

			}catch(err:any){
				return done(err);
			}
		}
	));
	}
}

export default Local;

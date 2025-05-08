/**
 * Defines the passport config
 *
 * @author Faiz A. Farooqui <faiz@geekyants.com>
 */

import { Application } from 'express';
import passport from 'passport';

import LocalStrategy from '../services/strategies/local';

import User, { IUserModel } from '../schema/user';
import Log from '../middlewares/log';
import IUser from '../interfaces/user';

class Passport {
	public mountPackage (_express: Application): Application {
		_express = _express.use(passport.initialize());
		_express = _express.use(passport.session());

		passport.serializeUser<any, any>((user:IUserModel, done:any) => {
			done(null, user.id);
		});

		passport.deserializeUser<any, any>((id:string, done: (arg0: any, arg1: any) => void) => {
			User.findById(id, (err: any, user: IUser) => {
				done(err, user);
			});
		});

		this.mountLocalStrategies();

		return _express;
	}

	public mountLocalStrategies(): void {
		try {
			LocalStrategy.init(passport);
			// GoogleStrategy.init(passport);
			// TwitterStrategy.init(passport);
		} catch (_err:any) {
			Log.error(_err.stack);
		}
	}

	// public isAuthenticated (req, res, next): any {
	// 	if (req.isAuthenticated()) {
	// 		return next();
	// 	}

	// 	req.flash('errors', { msg: 'Please Log-In to access any further!'});
	// 	return res.redirect('/login');
	// }

	// public isAuthorized (req, res, next): any {
	// 	const provider = req.path.split('/').slice(-1)[0];
	// 	const token = req.user.tokens.find(token => token.kind === provider);
	// 	if (token) {
	// 		return next();
	// 	} else {
	// 		return res.redirect(`/auth/${provider}`);
	// 	}
	// }
}

export default new Passport;
/**
 * Define User model
 *
 * @author Faiz A. Farooqui <faiz@geekyants.com>
 */

import * as bcrypt from 'bcrypt';

import { IUser, userStatusMap } from '../interfaces/user';
import mongoose from '../providers/database';

// Create the model schema & register your custom methods here
export interface IUserModel extends IUser, mongoose.Document {
	billingAddress(): string;
	comparePassword(password: string, cb: any): string;
	validPassword(password: string, cb: any): string;
	gravatar(_size: number): string;
}
let statusKeys:number[] = [];
for(let key of userStatusMap.keys()){
	statusKeys.push(key);
};
// Define the User Schema
export const UserSchema = new mongoose.Schema<IUserModel>({
	email: { type: String, unique: true },
	firstName: { type: String, required:true},
	lastName: { type: String, required:true },
	password: { type: String },
	passwordResetToken: { type: String },
	passwordResetExpires: Date,	
    username: { type: String },
	status: { type: Number, enum: {values: statusKeys, message: `{VALUE} is not in ${statusKeys}`}, default: 0 },
	points: { type: Number, default:0 }
}, {
	timestamps: true
});

// Password hash middleware
UserSchema.pre<IUserModel>('save', function (_next) {
	const user = this;
	if (!user.isModified('password')) {
		return _next();
	}

	bcrypt.genSalt(10, (_err, _salt) => {
		if (_err) {
			return _next(_err);
		}

		bcrypt.hash(user.password, _salt).then((_hash) => {
			user.password = _hash;
			return _next();
		}).catch((_err)=>{
            if (_err) {
				return _next(_err);
			}

        });
	});
});

// Custom Methods
// Compares the user's password with the request password
UserSchema.methods.comparePassword = function (_requestPassword: string | Buffer, _cb: (arg0: Error | undefined, arg1: boolean) => any): any {
	bcrypt.compare(_requestPassword, this.password, (_err, _isMatch) => {
		return _cb(_err, _isMatch);
	});
};

const User = mongoose.model<IUserModel>('User', UserSchema);

export default User;
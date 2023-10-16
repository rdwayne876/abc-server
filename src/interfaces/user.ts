/**
 * Define interface for User Model
 *
 * @author Faiz A. Farooqui <faiz@geekyants.com>
 */

export interface Tokens {
	kind: string;
	accessToken: string;
	tokenSecret?: string;
}

export interface IUser {
	email: string;
	password: string;
	passwordResetToken: string;
	passwordResetExpires: Date;

	facebook: string;
	twitter: string;
	google: string;
	github: string;
	instagram: string;
	linkedin: string;
	tokens: Tokens[];
	steam: string;

	username: string;
	points: number;
	gender: string;
	geolocation: string;
	website: string;
	picture: string;
}

export default IUser;

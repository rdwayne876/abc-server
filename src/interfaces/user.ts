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
    [x: string]: any;
	email: string;
	password: string;
	firstName:string;
	lastName:string;
	passwordResetToken: string;
	passwordResetExpires: Date;

	facebook: string;
	twitter: string;
	google: string;
	github: string;
	instagram: string;
	linkedin: string;
	tokens?: Tokens[];
	steam: string;

	username: string;
	points: number;
	gender: string;
	geolocation: string;
	website: string;
	picture: string;
}

export const userStatusMap = new Map([
    [0, "Inactive"],
    [1, "Active"],
    [2, "Online"],
    [3, "Offline"]
]);

export default IUser;

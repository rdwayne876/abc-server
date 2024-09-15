import { ObjectId } from "mongoose"

export interface IRoom{
    room_id:string;
    name: string;
    creator: ObjectId;
    player_limit: number;
    voting_duration: number;
    round_duration:number;
    gameFields: string[];
    round_limit: number;
    status: number;
    privacy: number;
}

export const roomStatusMap = new Map([
    [0, "Online"],
    [1, "In Progress"],
    [2, "Offline"]
]);

export const roomPrivacyMap = new Map([
    [0, "Public"],
    [1, "Private"]
]);

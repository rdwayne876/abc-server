import { Document, Schema, Types, model } from "mongoose";
import { IRoom,roomPrivacyMap,roomStatusMap } from "../interfaces/room";

let statuskeys: number[] = [];
let privacyKeys: number[] = [];

for(let key of roomStatusMap.keys()){statuskeys.push(key)}
for(let key of roomPrivacyMap.keys()){privacyKeys.push(key)}
const roomSchema = new Schema<IRoom>({
    room_id: {type: String},
    name: {type: String},
    creator: {type: Types.ObjectId, ref:"User"},
    player_limit: {type: Number, default:5},
    voting_duration: {type: Number, default:30},
    round_duration:{type: Number, default: 30},
    round_limit: {type:Number, default:10},
    gameFields: {type: [String], default: ["Girl Name", "Boy Name", "Animal", "Place", "Thing"]},
    status: {type: Number, enum: {values: statuskeys, message: `{VALUE} is not in ${statuskeys}`}, default:0},
    privacy: {type:Number, enum: {values: privacyKeys, message: `{VALUE} is not in ${privacyKeys}`}, default: 0},
});


export interface IRoomModel extends IRoom, Document{};

export const Room = model("Room", roomSchema);
export enum StatusEnum {
    ONLINE = 0,
    INPROGRESS = 1,
    OFFLINE = 2,
}
import { Document, Schema, Types, model } from "mongoose";
import { IRoom,roomPrivacyMap,roomStatusMap } from "../interfaces/room";

const roomSchema = new Schema<IRoom>({
    room_id: {type: String},
    name: {type: String},
    creator: {type: Types.ObjectId, ref:"User"},
    player_limit: {type: Number, default:5},
    voting_duration: {type: Number, default:30},
    round_duration:{type: Number, default: 30},
    gameFields: {type: [String], default: ["Girl Name", "Boy Name", "Animal", "Place", "Thing"]},
    status: {type: Number, enum: Object.keys(roomStatusMap), default:0},
    privacy: {type:Number, enum: Object.keys(roomPrivacyMap), default: 0},
});


export interface IRoomModel extends IRoom, Document{};

export const Room = model("Room", roomSchema)
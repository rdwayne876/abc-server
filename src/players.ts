import { IPlayer, IResponseData } from "./interface";

const players = new Map<string, IPlayer>()

const playerResponses = new Map<string, IResponseData>()

const getPlayer = (id: string) => {
    return players.get(id)
}

export {
    players,
    playerResponses,
    getPlayer
}
import { IPlayer } from "./interface";

const players = new Map<string, IPlayer>()

const getPlayer = (id: string) => {
    return players.get(id)
}

export {
    players,
    getPlayer
}
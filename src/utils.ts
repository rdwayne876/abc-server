import { IPlayer, IResponseData } from "./interface";
import { players } from "./players";

const shuffle = (iterable: Iterable<unknown> | ArrayLike<unknown>) => {
    const array = <IPlayer[]>Array.from(iterable); // Convert iterable to an array
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

const setResponse = (socketId: string, data: IResponseData) => {
    const player = players.get(socketId)

    player ? player.response = data : null

    return player
}

export {
    shuffle,
    setResponse
}
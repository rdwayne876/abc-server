interface IPlayer {
    id: string
    userName: string
    score?: number
}

interface IStartRoundData {
    player: string
    letter: string
}
interface IResponseData {
    userName?: string
    animal: string,
    place: string,
    thing: string,
    food: string
}

export {
    IPlayer,
    IStartRoundData,
    IResponseData
}
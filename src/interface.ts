interface IPlayer {
    id: string
    userName: string
    score?: number
    response: IResponseData
}

interface IStartRoundData {
    player: string
    letter: string
}
interface IResponseData {
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
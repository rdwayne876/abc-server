import { IPlayer } from "./interface"

const playing: boolean = false

const roundStart: boolean = false

const roundColResponse: any[] = []

let playersArr: IPlayer[] = []

let turnIndex: number = 0

let responseCount: number = 0

let playerCount: number = 0

const incrementTurn = () => {
   return turnIndex++
}

const resetTurns = () => {
    return turnIndex = 0
}

const incrementResponse = () => {
    return responseCount++
}

const incrementPlayers = () => {
    return playerCount++
}
export {
    playing,
    roundColResponse,
    roundStart,
    playersArr,
    turnIndex,
    responseCount,
    playerCount,
    incrementResponse,
    incrementTurn, 
    resetTurns,
    incrementPlayers
}
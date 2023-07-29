import { IPlayer } from "./interface"

const playing: boolean = false

const roundStart: boolean = false

let playersArr: IPlayer[] = []

let turnIndex: number = 0

const incrementTurn = () => {
    turnIndex++
}

const resetTurns = () => {
    turnIndex = 0
}

export {
    playing,
    playersArr,
    roundStart,
    turnIndex,
    incrementTurn, 
    resetTurns
}
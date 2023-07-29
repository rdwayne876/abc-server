import { Server, Socket } from 'socket.io'
import { IPlayer, IResponseData, IStartRoundData } from './interface'
import { getPlayer, players } from './players'
import { incrementTurn, playersArr, playing, resetTurns, turnIndex } from './constants'
import { setResponse, shuffle } from './utils'

const onConnection = (io: Server, socket: Socket) => {

    let emitTimeout: NodeJS.Timeout | undefined
    let title: string = "name"

    const connect = (data: { name: string }) => {

        const playerData: IPlayer = {
            id: socket.id,
            userName: data.name,
            score: 0,
            response: {
                animal: '',
                place: '',
                thing: '',
                food: ''
            }
        }

        socket.data = playerData

        players.set(socket.id, playerData)

        players.size == 4 ? playersArr.splice(0, 0, ...shuffle(players.values())) : null

        players.size >= 5 ? playersArr.push(playerData) : null

        socket.broadcast.emit("new_player", { message: `${data.name} is now Online` })

        players.size == 4 && !playing ? io.emit("game_ready", { playersArr }) : null
    }

    const startRound = (data: IStartRoundData) => {

        playersArr.length - 1 > turnIndex ? resetTurns() : null

        if (playersArr[turnIndex].id == socket.id) {
            socket.broadcast.emit("round_start", { letter: data.letter })
            emitTimeout ? clearTimeout(emitTimeout) : null

            emitTimeout = setTimeout(() => {
                io.emit("round_stop",)
            }, 60000)
            incrementTurn()

        } else {
            socket.emit("error", { message: "Not this players turn" })
        }
    }

    const stopRound = () => {
        emitTimeout ? clearTimeout(emitTimeout) : null
        io.emit("round_stop")
    }

    const saveResponses = ( data: IResponseData) => {
        const player = getPlayer(socket.id)

        player ? setResponse(socket.id, data) : socket.emit("error", { message: "Unable to save response, player not found" })
    }

    socket.on("responses", saveResponses)
    socket.on("round_stop", stopRound)
    socket.on("round_start", startRound)
    socket.on("connection", connect)
}

export {
    onConnection
}


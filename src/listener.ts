import { Server, Socket } from 'socket.io'
import { IPlayer, IStartRoundData } from './interface'
import { players } from './players'
import { incrementTurn, playersArr, playing, resetTurns, turnIndex } from './constants'
import { shuffle } from './utils'

const onConnection = (io: Server, socket: Socket,) => {

    console.log(`${socket.id} just connected`)

    let emitTimeout: NodeJS.Timeout | undefined

    const connect = (data: { name: string }) => {

        try {

            const playerData: IPlayer = {
                id: socket.id,
                userName: data.name,
                score: 0,

            }

            socket.data = playerData

            console.log("socket data", socket.data)

            players.set(socket.id, playerData)

            console.log("sockets map", players)

            players.size == 4 ? playersArr.splice(0, 0, ...shuffle(players.values())) :

                console.log("players array", playersArr)

            players.size >= 5 ? playersArr.push(playerData) : null

            socket.broadcast.emit("new_player", { message: `${data.name} is now Online` })

            players.size == 4 && !playing ? io.emit("game_ready", { playersArr }) : null

        } catch (error) {
            console.error(error)
        }
    }

    const startRound = (data: IStartRoundData) => {
        try {
            console.log("updated players array", playersArr)

            playersArr.length - 1 > turnIndex ? resetTurns() : null

            if (playersArr[turnIndex].id == socket.id) {
                socket.broadcast.emit("round_start", { letter: data.letter, player: data.player })
                emitTimeout ? clearTimeout(emitTimeout) : null

                emitTimeout = setTimeout(() => {
                    io.emit("round_stop",)
                }, 60000)
                incrementTurn()

            } else {
                socket.emit("error", { message: "Not this players turn" })
            }
        } catch (error) {
            console.error(error)
        }
    }

    const stopRound = () => {
        try {

            emitTimeout ? clearTimeout(emitTimeout) : null
            io.emit("round_stop")

        } catch (error) {
            console.error(error)
        }
    }

    socket.on("round_stop", stopRound)
    socket.on("round_start", startRound)
    socket.on("player_connect", connect)
}

export {
    onConnection
}


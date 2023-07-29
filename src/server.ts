import { log } from 'console'
import { app } from './index'
import { createServer } from 'http'
import { Server } from 'socket.io'
import { onConnection } from './listener'

const httpServer = createServer(app)

const io = new Server( httpServer, {

})

io.on('connection', socket => onConnection(io, socket))

app.listen(3000, "0.0.0.0", () => {
    log("Server running on port 3000")
})
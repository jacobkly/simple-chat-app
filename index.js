import express from 'express'
import { Server } from "socket.io"
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const PORT = process.env.PORT || 3500
const ADMIN = "Admin"

const app = express() // server refered to as app

app.use(express.static(path.join(__dirname, "public")))

const expressServer = app.listen(PORT, () => {
    console.log(`listening on port ${PORT}`)
})

// state for users
const UsersState = {
    users: [],
    setUsers: function(newUsersArray) {
        this.users = newUsersArray
    }
}

const io = new Server(expressServer, {
    cors: {
        origin: process.env.NODE_ENV === "production" ? false : ["http://localhost:5500", "http://127.0.0.1:5500"]
    }
})

io.on('connection', socket => {
    console.log(`User ${socket.id} connected`)

    // socket.emit -> upon connection - message to user
    socket.emit('message', buildMsg(ADMIN, "Welcome to a Simple Chat App!"))

    socket.on('enterRoom', ({ name, room }) => {
        const prevRoom = getUser(socket.id)?.room // optional chaining
        // leave previous room if user was in another room
        if (prevRoom) {
            socket.leave(prevRoom)
            // only send message to users of the previous room
            io.to(prevRoom).emit('message', buildMsg(ADMIN, `$
                {name} has left the room`))
        }

        const user = activateUser(socket.id, name, room)

        // updates user state in the previous room
        // cannot update previous room user list until after the state updates in activate user
        if (prevRoom) {
            io.to(prevRoom).emit('userList', {
                users: getUsersInRoom(prevRoom)
            })
        }

        // join new room
        socket.join(user.room)

        // msg goes only to new user
        socket.emit('message', buildMsg(ADMIN, `You have joined the ${user.room} chat room`))

        // msg to everyone else
        socket.broadcast.to(user.room).emit('message', buildMsg(ADMIN, `${user.name} has joined the room`))

        // update user list for new room
        io.to(user.room).emit('userList', {
            users: getUsersInRoom(user.room)
        })

        // update room's list for everyone
        io.emit('roomList', {
            rooms: getAllActiveRooms
        })
    })

    // listening for user disconnection - message to all others
    socket.on('disconnect', () => {
        const user = getUser(socket.id)
        userLeavesApp(socket.id)

        if (user) {
            // sends message to everyone since user has left the room already
            io.to(user.room).emit('message', buildMsg(ADMIN, `${user.name} has left the room`))

            // update user list
            io.to(user.room).emit('userList', {
                users: getUsersInRoom(user.room)
            })

            // update room list since last user might have left
            io.emit('roomList', {
                rooms: getAllActiveRooms()
            })
        }

        console.log(`User ${socket.id} disconnected`)
    })

    // listening for a message event
    socket.on('message', ({ name, text }) => {
        const room = getUser(socket.id)?.room
        if (room) {
            io.to(room).emit('message', buildMsg(name, text))
        }
    })

    // listen for typing activity
    socket.on('activity', (name) => {
        const room = getUser(socket.id)?.room
        if (room) {
            // broadcast sends to everyone else
            socket.broadcast.to(room).emit('activity', name)
        }
    })
})

function buildMsg(name, text) { // does not impact user state
    return {
        name, 
        text,
        time: new Intl.DateTimeFormat('default', {
            hour: 'numeric',
            minute: 'numeric'
            // second: 'numeric' // if seconds are desired
        }).format(new Date())
    }
}

/* user functions */

// activates a user in the user state
function activateUser(id, name, room) {
    const user = { id, name, room }
    UsersState.setUsers([
        ...UsersState.users.filter(user => user.id !== id), // first filter out duplicates
        user // add new user
    ])
    return user
}

// removes a user
function userLeavesApp(id) {
    UsersState.setUsers(
        UsersState.users.filter(user => user.id !== id) // removes user
    )
}

// find a specific user by id
function getUser(id) {
    return UsersState.users.find(user => user.id === id)
}

// get all users in the room
function getUsersInRoom(room) {
    return UsersState.users.filter(user => user.room === room)
}

// get all active rooms by filtering through user state
function getAllActiveRooms() {
    // most inner chunck may contain duplicates, filter by creating set then turning to an
    return Array.from(new Set(UsersState.users.map(user => user.room)))
}
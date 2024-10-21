// more information on deploying the chat app on Dave Gray's last video for this chat app
const socket = io('ws://localhost:3500')

// selectors
const msgInput = document.querySelector('#message') // #<name of id>
const nameInput = document.querySelector('#name') // shift + alt + down arrow for copy entire line and move below
const chatRoom = document.querySelector('#room')
const activity = document.querySelector('.activity') // .<name of class>
const usersList = document.querySelector('.user-list')
const roomList = document.querySelector('.room-list')
const chatDisplay = document.querySelector('.chat-display')

function sendMessage(e) {
    e.preventDefault()
    if (nameInput.value && msgInput.value && chatRoom.value) {
        socket.emit('message', { // object
            name: nameInput.value,
            text: msgInput.value
        })
        msgInput.value = ""
    }
    msgInput.focus()
}

function enterRoom(e) {
    e.preventDefault()
    if (nameInput.value && chatRoom.value) {
        socket.emit('enterRoom', {
            name: nameInput.value,
            room: chatRoom.value
        })
    }
}

// event listeners
document.querySelector('.form-msg').addEventListener('submit', sendMessage)
document.querySelector('.form-join').addEventListener('submit', enterRoom)
msgInput.addEventListener('keypress', () => {
    socket.emit('activity', nameInput.value)
})

// listen for messages 
socket.on("message", (data) => {
    activity.textContent = ""
    const { name, text, time } = data // deconstructing data
    const li = document.createElement('li')
    li.className = 'post'

    if (name === nameInput.value) li.className = 'post post--left'
    if (name !== nameInput.value && name !== 'Admin') li.className = 'post post--right'
    if (name === 'Admin') {
        li.innerHTML = `<div class="post__text">${text}</div>`
    } else { // name is NOT 'Admin'
        li.innerHTML = `<div class="post__header ${name === nameInput.value 
            ? 'post__header--user' 
            : 'post__header--reply'
        }">
        <span class="post__header--name">${name}<\span>
        <span class="post__header--time">${time}<\span>
        </div>
        <div class="post__text">${text}</div>`
    }
    document.querySelector('.chat-display').appendChild(li)
    chatDisplay.scrollTop = chatDisplay.scrollHeight
})

// listen for typing acitivty
let activityTimer
socket.on("activity", (name) => {
    activity.textContent = `${name} is typing...`

    // clear after 1 seconds
    clearTimeout(activityTimer)
    activityTimer = setTimeout(() => {
        activity.textContent = ""
    }, 1000)
})

// listen for new users
socket.on('userList', ({ users }) => {
    showUsers(users)
})

// listen for new rooms\
socket.on('roomList', ({ rooms }) => {
    showRooms(rooms)
})

// shows all users
function showUsers(users) {
    usersList.textContent = ''
    if (users) {
        usersList.innerHTML = `<em>Users in ${chatRoom.value}:</em>`
        users.forEach((user, i) => {
            usersList.textContent += ` ${user.name}`
            if (user.length > 1 && i !== users.length - 1) {
                usersList.textContent += ","
            }
        })
    }
}

// shows all active rooms
function showRooms(rooms) {
    usersList.textContent = ''
    if (rooms) {
        roomList.innerHTML = `<em>Active Rooms:</em>`
        rooms.forEach((room, i) => {
            roomList.textContent += ` ${room}`
            if (rooms.length > 1 && i !== rooms.length - 1) {
                roomList.textContent += ","
            }
        })
    }
}

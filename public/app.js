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
    const li = document.createElement('li')
    li.textContent = data
    document.querySelector('ul').appendChild(li)
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
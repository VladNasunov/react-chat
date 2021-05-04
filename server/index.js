const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const cors = require('cors');

const { addUser, removeUser, getUser, getUsersInRoom } = require('./users');

const router = require('./router');
//creating server
const app = express();
const server = http.createServer(app);
const io = socketio(server, {
  cors: {
    origin: 'your origin',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

app.use(cors());
app.use(router);

io.on('connect', (socket) => {
  socket.on('join', ({ name, room }, callback) => {
    const { error, user } = addUser({ id: socket.id, name, room });

    if (error) return callback(error);

    socket.join(user.room);
    //whenn user join the room we send wessage with greetins
    socket.emit('message', { user: 'Admin', text: `${user.name}, welcome to room ${user.room}.` });
    //when other user join we aware users in room
    socket.broadcast
      .to(user.room)
      .emit('message', { user: 'admin', text: `${user.name} has joined!` });

    io.to(user.room).emit('roomData', { room: user.room, users: getUsersInRoom(user.room) });

    callback();
  });

  socket.on('sendMessage', (message, callback) => {
    const user = getUser(socket.id);
    //sending name with date
    io.to(user.room).emit('message', {
      user: user.name,
      text: message,
      createdAt: new Date().toLocaleString(),
    });

    callback();
  });

  socket.on('disconnect', () => {
    const user = removeUser(socket.id);
    //when user left we aware other user about it
    if (user) {
      io.to(user.room).emit('message', { user: 'Admin', text: `${user.name} has left.` });
      io.to(user.room).emit('roomData', { room: user.room, users: getUsersInRoom(user.room) });
    }
  });
});

server.listen(process.env.PORT || 5000, () => console.log(`Server has started.`));

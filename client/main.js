// import ioClient from 'socket.io-client'
// let io = ioClient('http://localhost:8080');
let socket = io();
socket.emit('chat message', 'vvvvvvvvvvvvvvvvv');

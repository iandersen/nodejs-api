const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const basicauth = require('basicauth-middleware');
const path = require('path');

const Storage = require('./storage/storage');
const UserConnection = require('./UserConnection');
let sockets = [];

app.get('/', function(req, res){
    res.sendFile(path.resolve('./views/index.html'));
});

app.get('/client', function(req, res){
    res.sendFile(path.resolve('./build/client.bundle.js'));
});

io.on('connection', function(socket){
    console.log('a user connected');
    const playerID = Storage.create('player', {name: 'Player'}, function(playerID){
        console.log('Player ID: ', playerID);
        sockets.push(new UserConnection(socket, playerID));
    });
    socket.on('disconnect', function(){
        console.log('Disconnected');
        const userConnection = sockets.filter((u) => {
            return u.socket.id === socket.id;
        });
        const pID = userConnection ? userConnection[0] : -1;
        console.log('ID From user connection: ', pID.player);
        Storage.destroy('player', pID.player);
        console.log('user disconnected');
    });
});

http.listen(8080, () => console.log('Listening on port 8080'));

const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const basicauth = require('basicauth-middleware');
const path = require('path');

const Storage = require('./storage/storage');
const UserConnection = require('./UserConnection');
const Room = require('./model/room');
const Player = require('./model/player');

let connections = [];

app.get('/', function(req, res){
    res.sendFile(path.resolve('./views/index.html'));
});

app.get('/client', function(req, res){
    res.sendFile(path.resolve('./build/client.bundle.js'));
});

io.on('connection', function(socket){
    logIn(socket);
    socket.on('mouse', function(pos){
        let x = pos.x;
        let y = pos.y;
        let width = pos.w;
        let height = pos.h;
        let conn = getConnection(socket);
        if(conn) {
            let player = conn.player;
            let microcosm = player.microcosm;
            if (microcosm) {
                microcosm.moveTowards(width / 2, height / 2, x, y);
            } else
                console.log('No microcosm');
        }
    });
    socket.on('disconnect', function(){
        logOut(socket);
    });
});

function logIn(socket){
    console.log('a user connected');
    const name = socket.handshake.query.name;
    const address = socket.handshake.address;
    Storage.create('stick', {angle: 0}, function(stickID) {
        Storage.create('microcosm', {
            x: Room.randomX(),
            y: Room.randomY(),
            direction: 0,
            root_stick_id: stickID
        }, function (microcosmID) {
            Storage.create('player', {name: name, ip_address: address, microcosm_id: microcosmID}, function (playerID) {
                connections.push(new UserConnection(socket, new Player(playerID)));
                console.log('Users connected: ', connections.length);
            });
        });
    });
}

function getConnection(socket){
    const userConnection = connections.filter((u, i) => {
        if(u.socket.id === socket.id)
            id = i;
        return id === i;
    });
    return userConnection ? userConnection[0] : -1;
}

function logOut(socket){
    let id = -1;
    const userConnection = connections.filter((u, i) => {
        if(u.socket.id === socket.id)
            id = i;
        return id === i;
    });
    const player = userConnection ? userConnection[0].player : -1;
    player.destroy();
    connections.splice(id, 1);
    console.log('user disconnected');
    console.log('Users connected: ', connections.length);
}

http.listen(8080, () => console.log('Listening on port 8080'));

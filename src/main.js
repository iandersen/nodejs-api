const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const basicauth = require('basicauth-middleware');
const path = require('path');

const Storage = require('./storage/storage');
const UserConnection = require('./UserConnection');
const Room = require('./model/room');
const Player = require('./model/player');
const Splinter = require('./model/splinter');
const Renderable = require('../rendering/Renderable');
const Microcosm = require('./model/microcosm');

let connections = [];
let splinters = [];
const SPLINTER_LIMIT = 500;

app.get('/', function(req, res){
    res.sendFile(path.resolve('./views/index.html'));
});

app.use('/img', express.static(path.join(__dirname, '../img')));

app.get('/client', function(req, res){
    res.sendFile(path.resolve('./build/client.bundle.js'));
});

init();
setInterval(main, 1000/30);

function init(){
    Storage.deleteAll('splinter');
}

function main(){
    let renderables = splinters.map((s) => {
        return new Renderable(s.x, s.y, 0, s.type)
    });
    connections.forEach((con) => {
        let player = con.player;
        let microcosm = player.microcosm;
        if (microcosm) {
            microcosm.renderSticks(renderables);
            microcosm.moveTowards(player.centerX, player.centerY, player.mouseX, player.mouseY);
            microcosm.checkSplinterCollisions(player, splinters);
            con.socket.emit('position', {x: microcosm.getX(), y: microcosm.getY()})
        }
    });
    createSplinter();
    io.emit('renderables', renderables);
}

function createSplinter(){
    if(splinters.length < SPLINTER_LIMIT){
        let x = Room.randomX();
        let y = Room.randomY();
        let type = Splinter.randomType();
        Storage.create('splinter', {x: x, y: y, type: type}, (id)=>{
            splinters.push(new Splinter(id, x, y, type));
            splinters = Storage.getAll('splinter', (s) => {
                splinters = [];
                s.forEach((row)=>{
                    const {id, x, y, type} = row;
                    splinters.push(new Splinter(id, x, y, type));
                });
            });
        });
    }
}

io.on('connection', function(socket){
    logIn(socket);
    socket.on('mouse', function(pos){
        let conn = getConnection(socket);
        if(conn) {
            let player = conn.player;
            player.mouseX = pos.x;
            player.mouseY = pos.y;
            player.centerX = pos.w / 2;
            player.centerY = pos.h / 2;
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
        // Storage.create('stick', {angle: .5}, function(sonID){
        //     Storage.update('stick', stickID, {son_id: sonID});
        //     Storage.create('stick', {angle: .5}, function(s){
        //         Storage.update('stick', sonID, {son_id: s})
        //     });
        // });
        // Storage.create('stick', {angle: -Math.PI / 4}, function(daughterID){
        //     Storage.update('stick', stickID, {daughter_id: daughterID})
        // });
        Storage.create('microcosm', {
            x: Room.randomX(),
            y: Room.randomY(),
            direction: 0,
            root_stick_id: stickID,
            type: Microcosm.randomType()
        }, function (microcosmID) {
            Storage.create('player', {name: name, ip_address: address, microcosm_id: microcosmID}, function (playerID) {
                connections.push(new UserConnection(socket, new Player(playerID)));
                console.log('Users connected: ', connections.length);
            });
        });
    });
}

function getConnection(socket){
    let id = -1;
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

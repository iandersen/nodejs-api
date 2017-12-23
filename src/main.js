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
const Game = require('./gameState');

const SPLINTER_LIMIT = 500;
const game = new Game();

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
    // Storage.deleteAll('splinter');
}

function main(){
    let renderables = game.splinters.map((s) => {
        return new Renderable(s.x, s.y, 0, s.type)
    });
    game.connections.sort((c1, c2) => {
        return c1.player.splinters < c2.player.splinters ? 1 : c1.player.splinters === c2.player.splinters ? 0 : -1;
    });
    game.connections.forEach((con) => {
        let player = con.player;
        let microcosm = player.microcosm;
        if (microcosm) {
            microcosm.renderSticks(renderables);
            microcosm.moveTowards(player.centerX, player.centerY, player.mouseX, player.mouseY);
            microcosm.checkSplinterCollisions(player);
            con.socket.emit('position', {x: microcosm.getX(), y: microcosm.getY()});
            con.socket.emit('properties', {splinters: player.splinters, sticks: player.sticks});
            con.socket.emit('scores', game.connections.slice(0, Math.min(10, game.connections.length)).map((p) => {console.log(p.player.splinters); return {name: p.player.name, score: p.player.splinters}}))
        }
    });
    createSplinter();
    io.emit('renderables', renderables);
}

function createSplinter(){
    if(game.splinters.length < SPLINTER_LIMIT){
        DONT_UPDATE_SPLINTERS = true;
        let x = Room.randomX();
        let y = Room.randomY();
        let type = Splinter.randomType();
        game.splinters.push(new Splinter(x, y, type));
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
    game.connections.push(new UserConnection(socket, new Player(name, address)));
}

function getConnection(socket){
    let id = -1;
    const userConnection = game.connections.filter((u, i) => {
        if(u.socket.id === socket.id)
            id = i;
        return id === i;
    });
    return userConnection ? userConnection[0] : -1;
}

function logOut(socket){
    let id = -1;
    const userConnection = game.connections.filter((u, i) => {
        if(u.socket.id === socket.id)
            id = i;
        return id === i;
    });
    game.connections.splice(id, 1);
    console.log('user disconnected');
    console.log('Users connected: ', game.connections.length);
}

http.listen(8080, () => console.log('Listening on port 8080'));

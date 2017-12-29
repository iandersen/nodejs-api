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
setInterval(collisions, 1000/30);
setInterval(secondary, 1000);
setInterval(staticRefresh, 5000);

function init(){
    // Storage.deleteAll('splinter');
}

function main(){
    let renderables = [];
    let textElements = [];
    game.players.forEach((player) => {
        let microcosm = player.microcosm;
        if (microcosm) {
            const bounds = microcosm.renderSticks(renderables);
            microcosm.moveTowards(player.centerX, player.centerY, player.mouseX, player.mouseY);
            player.socket.emit('position', {x: Math.round(microcosm.getX()), y: Math.round(microcosm.getY()), bounds: bounds});
            textElements.push({text: player.name, x: Math.round(microcosm.getX()), y: Math.round(microcosm.getY()), size: 35 + microcosm.numSticks * 3});
        }
    });
    createSplinter();
    io.emit('renderables', {addedStatics: game.addedSplinters, removedStatics: game.removedSplinters, dynamics: renderables});
    io.emit('textElements', textElements);
    game.addedSplinters = [];
    game.removedSplinters = [];
}

function collisions(){
    let allSticks = [];
    game.players.forEach((player) => {
        let microcosm = player.microcosm;
        if (microcosm) {
            microcosm.sticks().forEach((s)=>{
                allSticks.push(s);
            });
        }
    });
    game.players.forEach((player) => {
        let microcosm = player.microcosm;
        if (microcosm) {
            microcosm.checkSplinterCollisions(player);
            microcosm.checkStickCollisions(allSticks);
        }
    });
}

function secondary(){
    game.players.sort((c1, c2) => {
        return c1.splinters < c2.splinters ? 1 : c1.splinters === c2.splinters ? 0 : -1;
    });
    game.players.forEach((player) => {
        player.socket.emit('properties', {splinters: player.splinters, sticks: player.sticks});
        player.socket.emit('scores', game.players.slice(0, Math.min(10, game.players.length)).map((p) => {return {name: p.name, score: p.splinters}}))
    });
}

function staticRefresh(){
    io.emit('refreshStatics', game.splinters.map((s)=>{return new Renderable(s.x, s.y, 0, s.type)}))
}

function createSplinter(){
    let x = Room.randomX();
    let y = Room.randomY();
    let type = Splinter.randomType();
    for(let i = 0; i < SPLINTER_LIMIT; i++){
        if(!game.splinters[i]){
            game.splinters[i] = new Splinter(x,y,type);
            game.addedSplinters.push({index: i, renderable: new Renderable(x,y,0,type)});
            break;
        }
    }
}

io.on('connection', function(socket){
    logIn(socket);
    socket.on('mouse', function(pos){
        let player = getPlayer(socket);
        if(player) {
            player.mouseX = pos.x;
            player.mouseY = pos.y;
            player.centerX = pos.w / 2;
            player.centerY = pos.h / 2;
        }
    });
    socket.on('disconnect', function(){
        logOut(socket);
    });
    socket.emit('renderables', {addedStatics: game.splinters.map((s, i)=>{return {renderable: s, index: i}})})
});

function logIn(socket){
    console.log('a user connected');
    const name = socket.handshake.query.name.substr(0,12);
    const address = socket.handshake.address;
    game.players.push(new Player(name, address, socket));
}

function getPlayer(socket){
    let id = -1;
    const p = game.players.filter((u, i) => {
        if(u.socket.id === socket.id)
            id = i;
        return id === i;
    });
    return p ? p[0] : -1;
}

function logOut(socket){
    let id = -1;
    game.players.filter((u, i) => {
        if(u.socket.id === socket.id)
            id = i;
        return id === i;
    });
    game.players.splice(id, 1);
    console.log('user disconnected');
    console.log('Users connected: ', game.players.length);
}

http.listen(8080, () => console.log('Listening on port 8080'));

const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const basicauth = require('basicauth-middleware');
const path = require('path');
const present = require('present');

const Room = require('./model/Room');
const Player = require('./model/Player');
const Splinter = require('./model/Splinter');
const Renderable = require('../rendering/Renderable');
const TextRenderable = require('../rendering/TextRenderable');
const Game = require('./GameState');
const names = require('./names.json');


const SPLINTER_LIMIT = 500;
const game = new Game();
const MIN_PLAYERS = 50;
let lastPacket = present();

app.get('/', function(req, res){
    res.sendFile(path.resolve('./views/index.html'));
});

app.use('/img', express.static(path.join(__dirname, '../img')));

app.get('/client', function(req, res){
    res.sendFile(path.resolve('./build/client.bundle.js'));
});

setInterval(main, 1000/30);
setInterval(sync, 1000/10);
setInterval(collisions, 1000/30);
setInterval(secondary, 1000);
setInterval(reSyncSplinters, 10000);

function sync(){
    let microcosmPositions = [];
    let serializedMicrocosms = [];
    let actualMicrocosms = [];
    game.players.forEach((player)=>{
        let microcosm = player.microcosm;
        if (microcosm) {
            microcosmPositions.push(microcosm.serializePosition());
            serializedMicrocosms.push(microcosm.serialize());
            actualMicrocosms.push(microcosm);
            player.renderBounds = microcosm.renderSticks([]);
        }
    });
    game.players.forEach((player) => {
        if(player.socket) {
            let microcosm = player.microcosm;
            if (microcosm) {
                const info = {
                    r: {
                        aS: game.addedSplinters,
                        rS: game.removedSplinters,
                        mP: microcosmPositions.filter((r) => {
                            const m = 500;
                            return (r.x + m >= player.bounds.x && r.x - m <= player.bounds.x + player.bounds.w) &&
                                (r.y + m >= player.bounds.y && r.y - m <= player.bounds.y + player.bounds.h)
                        }),
                        m: serializedMicrocosms.filter((r, i)=>{
                            const x = microcosmPositions[i].x;
                            const y = microcosmPositions[i].y;
                            const actualMicrocosm = actualMicrocosms[i];
                            const m = 500;
                            if((x + m >= player.bounds.x && x - m <= player.bounds.x + player.bounds.w) &&
                                (y + m >= player.bounds.y && y - m <= player.bounds.y + player.bounds.h)){
                                if(!actualMicrocosm.isPlayerNotified(player.id)){
                                    actualMicrocosm.setPlayerNotified(player.id);
                                    return true;
                                }
                            }
                            return false;
                        })
                    },
                    p: {
                        x: Math.round(microcosm.getX()),
                        y: Math.round(microcosm.getY()),
                        b: player.renderBounds,
                        s: microcosm.speed,
                        d: microcosm.direction
                    },
                    t: Math.round(present() - lastPacket)
                };
                player.socket.emit('info', info);
            }
        }
    });
    lastPacket = present();
    game.addedSplinters = [];
    game.removedSplinters = [];
}

function main(){
    game.players.forEach((player)=>{
        let microcosm = player.microcosm;
        if (microcosm) {
            microcosm.moveTowards(player.centerX, player.centerY, player.mouseX, player.mouseY);
            if(!player.socket){//bots
                player.centerX = microcosm.getX();
                player.centerY = microcosm.getY();
                if(Math.random() * 100 < 1){
                    player.mouseX = Math.random() * Room.getWidth();
                    player.mouseY = Math.random() * Room.getHeight();
                }
            }
        }
    });
    createSplinter();
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
        if(player.socket) {
            player.socket.emit('properties', {splinters: player.splinters, sticks: player.sticks});
            player.socket.emit('scores', game.players.slice(0, Math.min(10, game.players.length)).map((p) => {
                return {name: p.name, score: p.splinters}
            }))
        }
    });
    if(game.players.length < MIN_PLAYERS){
        let player = new Player(randomName(),'fake',null);
        game.players.push(player);
        player.centerX = Room.getWidth() / 2;
        player.centerY = Room.getHeight() / 2;
        player.mouseX = Math.random() * Room.getWidth();
        player.mouseY = Math.random() * Room.getHeight();
    }
}

function randomName(){
    return names[Math.floor(Math.random() * names.length)].substr(0,16);
}

function createSplinter(){
    let x = Room.randomX();
    let y = Room.randomY();
    let type = Splinter.randomType();
    for(let i = 0; i < SPLINTER_LIMIT; i++){
        if(!game.splinters[i]){
            game.splinters[i] = new Splinter(x,y,type);
            game.addedSplinters.push({i: i, r: new Renderable(x,y,0,type,0,0)});
            break;
        }
    }
}

function reSyncSplinters(){
    io.emit('rS', game.splinters.map((s)=>{if(s) return new Renderable(s.x, s.y,s.radians,s.type,0,0)}));
}

io.on('connection', function(socket){
    logIn(socket);
    socket.on('m', function(pos){
        let player = getPlayer(socket);
        if(player) {
            player.mouseX = pos.x;
            player.mouseY = pos.y;
            player.centerX = pos.w / 2;
            player.centerY = pos.h / 2;
        }
    });
    socket.on('r', (b)=>{
        let player = getPlayer(socket);
        if(player) {
            player.bounds = b;
        }
    });
    socket.on('disconnect', function(){
        logOut(socket);
    });
    socket.emit('rS', game.splinters.map((s)=>{if(s) return new Renderable(s.x, s.y,s.radians,s.type,0,0)}));
    let microcosms = [];
    game.players.forEach((p)=>{
        if(p.microcosm)
            microcosms.push(p.microcosm.serialize());
    });
    socket.emit('m', microcosms);
});

function logIn(socket){
    const name = socket.handshake.query.name.substr(0,16);
    const address = socket.handshake.ipAddress;
    const player = new Player(name, address, socket);
    game.players.push(player);
    player.loggedIn();
}

function getPlayer(socket){
    let id = -1;
    if(!socket)
        return id;
    const p = game.players.filter((u, i) => {
        if(u.socket && u.socket.id === socket.id)
            id = i;
        return id === i;
    });
    return p ? p[0] : -1;
}

function logOut(socket){
    let id = -1;
    game.players.filter((u, i) => {
        if(u.socket && u.socket.id === socket.id)
            id = i;
        return id === i;
    });
    const player = game.players[id];
    player.loggedOut();
    game.players.splice(id, 1);
}
const server_port = process.env.OPENSHIFT_NODEJS_PORT || 8080;
const server_ip_address = process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1';
http.listen(server_port, () => console.log('Listening on port 8080'));

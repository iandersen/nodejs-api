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
const TextRenderable = require('../rendering/TextRenderable');
const Microcosm = require('./model/microcosm');
const Game = require('./gameState');

const SPLINTER_LIMIT = 500;
const game = new Game();
const MIN_PLAYERS = 0;

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
    game.players.forEach((player)=>{
        let microcosm = player.microcosm;
        if (microcosm) {
            player.renderBounds = microcosm.renderSticks(renderables);
            microcosm.moveTowards(player.centerX, player.centerY, player.mouseX, player.mouseY);
            if(!player.socket){
                player.centerX = microcosm.getX();
                player.centerY = microcosm.getY();
                if(Math.random() * 100 < 1){
                    player.mouseX = Math.random() * Room.getWidth();
                    player.mouseY = Math.random() * Room.getHeight();
                }
            }
            textElements.push(new TextRenderable(Math.round(microcosm.getX()), Math.round(microcosm.getY()), player.name,
                35 + microcosm.numSticks * 6, microcosm.speed, microcosm.direction));
        }
    });
    game.players.forEach((player) => {
        if(player.socket) {
            let microcosm = player.microcosm;
            if (microcosm) {
                player.socket.emit('info', {
                    renderables: {
                        addedStatics: game.addedSplinters,
                        removedStatics: game.removedSplinters,
                        dynamics: renderables.filter((r) => {
                            const m = 500;
                            return (r.x + m >= player.bounds.x && r.x - m <= player.bounds.x + player.bounds.width) &&
                                (r.y + m >= player.bounds.y && r.y - m <= player.bounds.y + player.bounds.height)
                        })
                    },
                    position: {
                        x: Math.round(microcosm.getX()),
                        y: Math.round(microcosm.getY()),
                        bounds: player.renderBounds,
                        s: microcosm.speed,
                        d: microcosm.direction
                    },
                    textElements: textElements.filter((r)=>{
                        const m = 500;
                        return (r.x + m >= player.bounds.x && r.x - m <= player.bounds.x + player.bounds.width) &&
                            (r.y + m >= player.bounds.y && r.y - m <= player.bounds.y + player.bounds.height)
                    })
                });
            }
        }
    });
    createSplinter();
    // io.emit('textElements', textElements);
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
    const names = ['name1', 'name2', 'name3', 'name4', 'name5', 'name6', 'name7', 'name8', 'name9', 'name10'];
    return names[Math.floor(Math.random() * names.length)];
}

function staticRefresh(){
    //io.emit('refreshStatics', game.splinters)
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
    socket.on('renderBounds', (b)=>{
        let player = getPlayer(socket);
        if(player)
            player.bounds = b;
    });
    socket.on('disconnect', function(){
        logOut(socket);
    });
    socket.emit('refreshStatics', game.splinters);
});

function logIn(socket){
    console.log('a user connected');
    const name = socket.handshake.query.name.substr(0,12);
    const address = socket.handshake.address;
    game.players.push(new Player(name, address, socket));
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
    game.players.splice(id, 1);
    console.log('user disconnected');
    console.log('Users connected: ', game.players.length);
}
const server_port = process.env.OPENSHIFT_NODEJS_PORT || 8080;
const server_ip_address = process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1';
http.listen(server_port, server_ip_address, () => console.log('Listening on port 8080'));

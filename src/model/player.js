/**
 * Created by Ian on 12/19/2017.
 */

const Microcosm = require('./microcosm');
const Room = require('./room');
const Game = require('../gameState');
const game = new Game();
const md5 = require('md5');
const request = require('request');

const MOVE_STATE = 0;
const BUILD_STATE = 1;
let id = 0;
const splinterCount = 10;
const increment = 10;

class Player {
    constructor(name, address, socket){
        this.name = name;
        this.address = address;
        let x = Room.randomX();
        let y = Room.randomY();
        let i = 0;
        while(game.distanceToNearestPlayer(x,y) < 1500 && i < 10){
            x = Room.randomX();
            y = Room.randomY();
            i++;
        }
        if(i >= 10){
            while(game.distanceToNearestPlayer(x,y) < 750 && i < 20){
                x = Room.randomX();
                y = Room.randomY();
                i++;
            }
        }
        this.microcosm = new Microcosm(x, y, 0);
        this.microcosm.player = this;
        this.centerX = -1;
        this.centerY = -1;
        this.mouseX = -1;
        this.mouseY = -1;
        this.splinters = 0;
        this.sticks = 1;
        this.state = MOVE_STATE;
        this.id = id++;
        if(id > 9999)
            id = 0;
        this.socket = socket;
        this.sticksLeft = splinterCount;
        this.automated = !this.socket;
        this.bounds = {x: 0, y: 0, width: Room.getWidth(), height: Room.getHeight()};
    }

    loggedIn(){
        this.maxScore = 0;
        this.lastSubmittedScore = 0;
        this.scoreUpdateTimer = setInterval(this.updateScore, 10000);
        this.timeStamp = 0;
        request.post('https://htmlhigh5.com/play/popsicio/score/create',{},
            function(err,httpResponse,body){});
    }

    updateScore(){
        const increment = Math.max(this.maxScore - this.lastSubmittedScore, 0);
        if(increment > 0)
            this.lastSubmittedScore = this.maxScore;
        this.timeStamp += Math.ceil(Math.random() * 5);
        request.post('https://htmlhigh5.com/play/popsicio/score/update',{json: {timestamp: this.timeStamp, score: increment, hash: Player.hashScore(increment, this.timeStamp)}},
            function(err,httpResponse,body){ });
    }

    static hashScore(value, salt){
        let val = md5(value + md5(salt + md5(value + md5(salt))));
        for(let i = 0; i < 37; i++)
            val = md5(salt + val);
        return val;
    }

    static BUILD_STATE(){
        return BUILD_STATE;
    }

    static MOVE_STATE(){
        return MOVE_STATE;
    }

    setState(state){
        this.state = state;
    }

    subtractSplinters(num){
        this.splinters -= 30;
        if(this.splinters < 0)
            this.splinters = 0;
    }

    addSplinter(){
        this.splinters++;
        if(this.splinters > this.maxScore)
            this.maxScore = this.splinters;
        this.sticksLeft--;
        if(this.microcosm){
            if(this.sticksLeft === 0){
                this.microcosm.addStickToFirstAvailable();
                this.sticksLeft = splinterCount + increment * this.microcosm.numSticks;
            }
        }
    }

    stickLost(){
        if(this.socket)
            this.socket.emit('sL', {});
    }

    loggedOut(){
        clearInterval(this.scoreUpdateTimer);
        const increment = Math.max(this.maxScore - this.lastSubmittedScore, 0);
        const timestamp = 9999999;
        request.post('https://htmlhigh5.com/play/popsicio/score/store',{json: {timestamp: timestamp, increment: increment, hash: Player.hashScore(increment, timestamp)}},
            function(err,httpResponse,body){});
    }

    destroy(){
        this.microcosm = null;
        game.players.forEach((c, i)=> {
            if (c.id === this.id) {
                if(c.socket)
                    setTimeout(()=>{c.socket.emit('dead', {})}, 200);
                else{
                    //If it's a bot
                    game.players.splice(i, 1);
                }
            }
        });
    }
}

module.exports = Player;
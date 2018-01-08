/**
 * Created by Ian on 12/19/2017.
 */

const Microcosm = require('./Microcosm');
const Room = require('./Room');
const Game = require('../GameState');
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
        this.ipAddress = address;
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
        this.splintersUntilStickAdded = splinterCount;
        this.bounds = {x: 0, y: 0, width: Room.getWidth(), height: Room.getHeight()};
        this.timeStamp = 0;
        this.maxScore = 0;
    }

    loggedIn(){
        this.maxScore = 0;
        this.scoreUpdateTimer = setInterval(this.updateScore.bind(this), 10000);
        this.timeStamp = 0;
        console.log('Sending IP: ', this.ipAddress);
        request.post('https://htmlhigh5.com/play/popsicio/score/create',{json: {ip: this.ipAddress}},
            function(err,httpResponse,body){});
    }

    updateScore(){
        const increment = 0;
        this.timeStamp += Math.ceil(Math.random() * 5);
        console.log('Sending IP: ', this.ipAddress);
        request.post('https://htmlhigh5.com/play/popsicio/score/update',{json: {timestamp: this.timeStamp, score: increment, ip: this.ipAddress, hash: Player.hashScore(increment, this.timeStamp)}},
            function(err,httpResponse,body){});
    }

    static hashScore(value, salt){
        let hashedValue = md5(value + md5(salt + md5(value + md5(salt))));
        for(let i = 0; i < 37; i++)
            hashedValue = md5(salt + hashedValue);
        return hashedValue;
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
        this.splintersUntilStickAdded--;
        if(this.microcosm){
            if(this.splintersUntilStickAdded === 0){
                this.microcosm.addStickToFirstAvailable();
                this.splintersUntilStickAdded = splinterCount + increment * this.microcosm.numSticks;
            }
        }
    }

    stickLost(){
        if(this.socket)
            this.socket.emit('sL', {});
    }

    loggedOut(){
        clearInterval(this.scoreUpdateTimer);
        const increment = this.maxScore;
        const timestamp = 9999999;
        console.log('Sending IP: ', this.ipAddress);
        request.post('https://htmlhigh5.com/play/popsicio/score/store',{json: {timestamp: timestamp, increment: increment, hash: Player.hashScore(increment, timestamp), ip: this.ipAddress}},
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
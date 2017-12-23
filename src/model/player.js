/**
 * Created by Ian on 12/19/2017.
 */
const Storage = require('../storage/storage');
const Microcosm = require('./microcosm');
const Room = require('./room');

class Player {
    constructor(name, address){
        this.name = name;
        this.address = address;
        this.microcosm = new Microcosm(Room.randomX(), Room.randomY(), 0);
        this.centerX = -1;
        this.centerY = -1;
        this.mouseX = -1;
        this.mouseY = -1;
        this.splinters = 0;
        this.sticks = 1;
    }


    addSplinter(){
        this.splinters++;
    }
}

module.exports = Player;
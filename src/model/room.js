/**
 * Created by Ian on 12/19/2017.
 */

class Room {
    constructor(name) {
        this.width = 10000;
        this.height = 10000;
    }

    static randomX(){
        return Math.random() * this.width;
    }

    static randomY(){
        return Math.random() * this.height;
    }
}

module.exports = Room;
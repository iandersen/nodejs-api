/**
 * Created by Ian on 12/19/2017.
 */
const width = 10000;
const height = 10000;
class Room {

    static randomX(){
        return Math.round(Math.random() * width);
    }

    static randomY(){
        return Math.round(Math.random() * height);
    }

    static getWidth(){
        return width;
    }
    static getHeight(){
        return height;
    }
}

module.exports = Room;
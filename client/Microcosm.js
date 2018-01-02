/**
 * Created by Ian on 1/2/2018.
 */
const Stick = require('./stick');

class Microcosm {
    constructor(id, stick, type, x, y, speed, direction){
        this.id = id;
        this.stick = stick;
        this.type = type;
        this.x = x;
        this.y = y;
        this.speed = speed;
        this.direction = direction;
    }

    removeStick(index){
        const sex = index % 2 === 1 ? 'male' : 'female';
        let parent = this.stick;
        if(index % 2 === 1){//If it is a son
            while(index > 1){
                parent = parent.son;
                index -= 2;
            }
        }else{//If it is a daughter
            while(index > 0){
                parent = parent.daughter;
                index -= 2;
            }
        }
        if(parent) {
            if (sex === 'male')
                parent.son = null;
            else
                parent.daughter = null;
        }else{
            console.log('Parent not found! i: ' + index);
        }
    }

    addStick(index, angle){
        let stick = this.stick;
        if(index % 2 === 1){//If it is a son
            while(index > 1){
                stick = stick.son;
                index -= 2;
            }
            if(stick) {
                stick.son = new Stick(angle, null, null, stick);
            }else
                console.log('STICK NOT FOUND! i: ' + index)
        }else{//If it is a daughter
            while(index > 0){
                stick = stick.daughter;
                index -= 2;
            }
            if(stick) {
                stick.daughter = new Stick(angle,null,null,stick);
            }
            else
                console.log('STICK NOT FOUND! i: ' + index)
        }
    }

    static deserialize(serialized){
        return new Microcosm(serialized.i,
            Stick.deserialize(serialized.s),
            serialized.t);
    }
}

module.exports = Microcosm;
/**
 * Created by Ian on 1/2/2018.
 */

class Stick {
    constructor(angle, son, daughter, parent){
        this.son = son;
        this.daughter = daughter;
        this.angle = angle;
        this.parent = parent;
    }

    static deserialize(serialized){
        let ret = new Stick(serialized.a);
        if(serialized.d) {
            ret.daughter = Stick.deserialize(serialized.d);
            ret.daughter.parent = true;
        }if(serialized.s) {
            ret.son = Stick.deserialize(serialized.s);
            ret.son.parent = true;
        }
        return ret;
    }
}

module.exports = Stick;
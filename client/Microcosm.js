/**
 * Created by Ian on 1/2/2018.
 */
const Stick = require('./Stick');

class Microcosm {
    constructor(id, stick, type, name, numSticks){
        this.id = id;
        this.stick = stick;
        this.type = type;
        this.name = name;
        this.numSticks = numSticks;
    }

    static deserialize(serialized){
        return new Microcosm(serialized.i,
            Stick.deserialize(serialized.s),
            serialized.t, serialized.n, serialized.st);
    }
}

module.exports = Microcosm;
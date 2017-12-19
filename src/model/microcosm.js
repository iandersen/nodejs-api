/**
 * Created by Ian on 12/19/2017.
 */
import Stick from './stick';

class Microcosm {
    constructor(name) {
        this.name = name;
        this.rootStick = new Stick(null, 'neuter');
        this.x = Room.randomX();
        this.y = Room.randomY();
    }

    sticks(){
        return this.rootStick.getChildren();
    }
}

export default Microcosm;
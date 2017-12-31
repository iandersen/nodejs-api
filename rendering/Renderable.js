/**
 * Created by Ian on 12/20/2017.
 */
class Renderable {
    constructor(x, y, radians, type, speed, direction){
        this.x = x;
        this.y = y;
        this.radians = radians;
        this.type = type;
        this.s = speed || 0;
        this.d = direction || 0;
    }
}

module.exports = Renderable;
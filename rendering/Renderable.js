/**
 * Created by Ian on 12/20/2017.
 */

class Renderable {
    constructor(x, y, radians, type, speed, direction, id){
        this.x = Math.round(x);
        this.y = Math.round(y);
        if(radians !== 0)
            this.r = Math.round(radians * 1000) / 1000;
        this.t = type;
        this.i = id || 0;
    }
}

module.exports = Renderable;
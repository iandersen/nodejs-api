/**
 * Created by Ian on 12/20/2017.
 */
class Renderable {
    constructor(x, y, radians, type, speed, direction){
        this.x = Math.round(x);
        this.y = Math.round(y);
        if(radians !== 0)
            this.r = Math.round(radians * 1000) / 1000;
        this.t = type;
        if(speed !== 0) {
            this.s = speed || 0;
            this.s = Math.round(this.s * 100) / 100;
            this.d = direction || 0;
        }
    }
}

module.exports = Renderable;
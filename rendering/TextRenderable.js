/**
 * Created by Ian on 12/20/2017.
 */
class TextRenderable {
    constructor(x, y, text, size, speed, direction){
        this.x = x;
        this.y = y;
        this.text = text;
        this.size = size || 30;
        this.s = speed || 0;
        this.d = direction || 0;
    }
}

module.exports = TextRenderable;
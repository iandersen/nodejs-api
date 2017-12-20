/**
 * Created by Ian on 12/19/2017.
 */

const Storage = require('../storage/storage');

class Splinter {
    constructor(id, x, y, type){
        this.id = id;
        this.x = x;
        this.y = y;
        this.type = type;
    }

    destroy(){
        Storage.destroy('splinter', this.id);
    }

    static randomType(){
        const types = ['splinter1','splinter2','splinter3','splinter4','splinter5','splinter6'];
        return types[Math.floor(Math.random() * types.length)];
    }
}

module.exports = Splinter;
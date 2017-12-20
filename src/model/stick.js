/**
 * Created by Ian on 12/19/2017.
 */

const Storage = require('../storage/storage');

class Stick {
    constructor(id, parent, gender){
        this.id = id;
        this.parent = parent;
        this.gender = gender;
        this.son = null;
        this.daughter = null;
        this.length = 300;
    }

    getChildren(){
        let children = [];
        children.push(this);
        if(this.son)
            children.push(this.son.getChilren());
        if(this.daughter)
            children.push(this.daughter.getChildren());
        return children;
    }

    destroy(){
        Storage.destroy('stick', this.id);
    }
}

module.exports = Stick;
/**
 * Created by Ian on 12/19/2017.
 */

class Stick {
    constructor(parent, gender){
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
}

module.exports = Stick;
/**
 * Created by Ian on 12/19/2017.
 */

const Storage = require('../storage/storage');

class Stick {
    constructor(id, parent, gender){
        this.id = id;
        this.parent = parent;
        this.gender = gender;
        this.length = Stick.getLength();
        Storage.find('stick', this.id, function(row){
            this.daughter = null;
            this.row = row[0];
            if(this.row.son_id)
                this.son = new Stick(this.row.son_id, this.id, 'male');
            if(this.row.daughter_id)
                this.daughter = new Stick(this.row.daughter_id, this.id, 'female');
        }.bind(this));
    }

    static getLength(){
        return 464;
    }

    static getTipSize(){
        return 20;
    }

    collidedSplinters(splinters){
        let ret = [];

        return ret;
    }

    updateChildren(){
        Storage.find('stick', this.id, function(row){
            this.daughter = null;
            this.row = row[0];
            if(this.row.son_id)
                this.son = new Stick(this.row.son_id, this.id, 'male');
            if(this.row.daughter_id)
                this.daughter = new Stick(this.row.daughter_id, this.id, 'female');
        }.bind(this));
    }

    getChildren(){
        let children = [];
        children.push(this);
        if(this.son && typeof this.son === 'object')
            children.push(this.son.getChilren());
        if(this.daughter && typeof this.daughter === 'object')
            children.push(this.daughter.getChildren());
        return children;
    }

    destroy(){
        Storage.destroy('stick', this.id);
    }
}

module.exports = Stick;
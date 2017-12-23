/**
 * Created by Ian on 12/19/2017.
 */
const Storage = require('../storage/storage');
const Microcosm = require('./microcosm');

class Player {
    constructor(id){
        this.id = id;
        this.microcosm = null;
        this.centerX = -1;
        this.centerY = -1;
        this.mouseX = -1;
        this.mouseY = -1;
        Storage.find('player', this.id, function(row){
            this.row = row[0];
            const mID = row[0].microcosm_id;
            this.splinters = row[0].splinters;
            this.mID = mID;
            this.microcosm = new Microcosm(mID);
        }.bind(this));
    }

    destroy(){
        Storage.destroy('player', this.id);
        if(this.microcosm)
            this.microcosm.destroy();
    }


    addSplinter(){
        Storage.find('player', this.id, function(row){
            this.row = row[0];
            this.splinters = this.row.splinters;
            Storage.update('player', this.id, {splinters: this.splinters++})
        }.bind(this));
    }
}

module.exports = Player;
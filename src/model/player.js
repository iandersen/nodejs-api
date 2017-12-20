/**
 * Created by Ian on 12/19/2017.
 */
const Storage = require('../storage/storage');
const Microcosm = require('./microcosm');

class Player {
    constructor(id){
        this.id = id;
        this.microcosm = null;
        Storage.find('player', this.id, function(row){
            this.row = row[0];
            const mID = row[0].microcosm_id;
            this.mID = mID;
            this.microcosm = new Microcosm(mID);
        }.bind(this));
    }

    destroy(){
        Storage.destroy('player', this.id);
        if(this.microcosm)
            this.microcosm.destroy();
    }
}

module.exports = Player;
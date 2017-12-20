/**
 * Created by Ian on 12/19/2017.
 */
const Storage = require('../storage/storage');
const Stick = require('./stick');
const Room = require('./room');

class Microcosm {
    constructor(id) {
        this.id = id;
        Storage.find('microcosm', this.id, function(row){
            console.log(this.id);
            this.row = row[0];
            this.stick = new Stick(row[0].root_stick_id, null, 'neuter');
        }.bind(this));
    }

    sticks(test){
        return this.stick.getChildren();
    }

    destroy(){
        Storage.destroy('microcosm', this.id);
        const allSticks = this.sticks();
        allSticks.map((s) => {
           s.destroy();
        });
    }
}

module.exports = Microcosm;
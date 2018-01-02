/**
 * Created by Ian on 12/23/2017.
 */

let instance = null;
class GameState {
    constructor(){
        if(!instance) {
            this.players = [];
            this.splinters = [];
            this.addedSplinters = [];
            this.removedSplinters = [];
            this.maxSplinters = 500;
            instance = this;
        }
        return instance;
    }
}

module.exports = GameState;
/**
 * Created by Ian on 12/23/2017.
 */

let instance = null;
class GameState {
    constructor(){
        if(!instance) {
            this.connections = [];
            this.splinters = [];
            instance = this;
        }
        return instance;
    }
}

module.exports = GameState;
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

    distanceToNearestPlayer(x,y){
        let minDist = 99999999;
        this.players.forEach((p)=>{
            const m = p.microcosm;
            if(m){
                const dist = Math.sqrt(Math.pow(m.x-x, 2) + Math.pow(m.y-y, 2));
                if(dist < minDist)
                    minDist = dist;
            }
        });
        return minDist;
    }
}

module.exports = GameState;
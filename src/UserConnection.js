/**
 * Created by Ian on 12/19/2017.
 */
class UserConnection{
    constructor(socket, player){
        this.socket = socket;
        this.player = player;
    }
}

module.exports = UserConnection;
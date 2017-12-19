/**
 * Created by Ian on 12/19/2017.
 */
class UserConnection{
    constructor(socket, playerID){
        this.socket = socket;
        this.player = playerID;
    }
}

module.exports = UserConnection;
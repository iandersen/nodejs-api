/**
 * Created by Ian on 12/19/2017.
 */
const Storage = require('../storage/storage');
const Stick = require('./stick');
const Room = require('./room');
const Renderable = require('../../rendering/Renderable');

const speed = 5;

class Microcosm {
    constructor(id) {
        this.id = id;
        Storage.find('microcosm', this.id, function(row){
            this.row = row[0];
            this.stick = new Stick(row[0].root_stick_id, null, 'neuter');
        }.bind(this));
    }

    getX(){
        if(this.row)
            return this.row.x;
        return -1;
    }

    getY(){
        if(this.row)
            return this.row.y;
        return -1;
    }

    sticks(){
        return this.stick.getChildren();
    }

    renderSticks(arr){
        if(this.stick) {
            let x = this.row.x;
            let y = this.row.y;
            let dir = this.row.direction;
            this.renderStickTree(this.stick, x, y, dir, arr);
        }
    }

    renderStickTree(rootStick, x, y, dir, arr){
        arr.push(new Renderable(x, y, dir, this.row.type));
        rootStick.updateChildren();
        if(rootStick.son && rootStick.son.row){
            let sonDir = rootStick.son.row.angle + dir;
            let anchorX = x + this.lengthDirX(Stick.getLength() / 2 - Stick.getTipSize(), dir);
            let anchorY = y + this.lengthDirY(Stick.getLength() / 2 - Stick.getTipSize(), dir);
            //arr.push(new Renderable(anchorX, anchorY, 0, 'blip'));
            let centerX = anchorX + this.lengthDirX(Stick.getLength() / 2, sonDir);
            let centerY = anchorY + this.lengthDirY(Stick.getLength() / 2, sonDir);
            this.renderStickTree(rootStick.son, centerX, centerY, sonDir, arr);
        }
        if(rootStick.daughter && rootStick.daughter.row){
            let daughterDir = rootStick.daughter.row.angle + dir;
            let anchorX = x + this.lengthDirX(Stick.getLength() / 2 - Stick.getTipSize(), dir - Math.PI);
            let anchorY = y + this.lengthDirY(Stick.getLength() / 2 - Stick.getTipSize(), dir - Math.PI);
            //arr.push(new Renderable(anchorX, anchorY, 0, 'blip'));
            let centerX = anchorX + this.lengthDirX(Stick.getLength() / 2, daughterDir);
            let centerY = anchorY + this.lengthDirY(Stick.getLength() / 2, daughterDir);
            this.renderStickTree(rootStick.daughter, centerX, centerY, daughterDir, arr);
        }
    }

    lengthDirX(len, dir){
        return Math.cos(dir) * len;
    }

    lengthDirY(len, dir){
        return Math.sin(dir) * len;
    }

    static randomType(){
        const types = ['pop1','pop2','pop3','pop4','pop5','pop6'];
        return types[Math.floor(Math.random() * types.length)];
    }

    destroy(){
        Storage.destroy('microcosm', this.id);
        const allSticks = this.sticks();
        allSticks.map((s) => {
           s.destroy();
        });
    }

    checkSplinterCollisions(player, splinters){
        const allSticks = this.sticks();
        const microcosm = this;
        allSticks.forEach((s) => {
            let collisions = s.collidedSplinters(splinters);
            collisions.forEach((c)=>{
                player.addSplinter();
                c.destroy();
            });
        });
    }

    moveTowards(cx, cy, x, y){
        if(!this.row)
            return;
        let myX = this.row.x;
        let myY = this.row.y;
        let myDirection = this.row.direction;
        let angle = this.angle(cx, cy, x, y);
        let diff = angle - myDirection;
        if(diff > Math.PI)
            diff = Math.PI - diff;
        if(diff < -Math.PI)
            diff = 2 * Math.PI + diff;
        if(Math.abs(diff) > Math.PI / 30) {
            diff = Math.sign(diff) * Math.PI / 30;
            myDirection += diff;
        }else
            myDirection = angle;
        myY += Math.sin(myDirection) * speed;
        myX += Math.cos(myDirection) * speed;
        myX = Math.max(0, Math.min(myX, Room.getWidth()));
        myY = Math.max(0, Math.min(myY, Room.getHeight()));
        this.row.x = myX;
        this.row.y = myY;
        this.row.direction = myDirection;
        Storage.update('microcosm', this.id, {direction: myDirection, x: myX, y: myY});
    }

    angle(cx, cy, ex, ey) {
        let dy = ey - cy;
        let dx = ex - cx;
        let theta = Math.atan2(dy, dx); // range (-PI, PI]
        //theta *= 180 / Math.PI; // rads to degs, range (-180, 180]
        return theta;
    }
}

module.exports = Microcosm;
/**
 * Created by Ian on 12/19/2017.
 */
const Storage = require('../storage/storage');
const Stick = require('./stick');
const Room = require('./room');
const Renderable = require('../../rendering/Renderable');

const speed = 5;

class Microcosm {
    constructor(x, y, direction) {
        this.x = x;
        this.y =y;
        this.direction = direction;
        this.stick = new Stick(null);
        this.type = Microcosm.randomType();
    }

    getX(){
        return this.x;
    }

    getY(){
        return this.y;
    }

    sticks(){
        return this.stick.getChildren();
    }

    renderSticks(arr){
        if(this.stick) {
            let x = this.x;
            let y = this.y;
            let dir = this.direction;
            this.renderStickTree(this.stick, x, y, dir, arr);
        }
    }

    renderStickTree(rootStick, x, y, dir, arr){
        //Tell the stick where it is
        rootStick.updatePosition(x,y,dir);
        arr.push(new Renderable(x, y, dir, this.type));
        //rootStick.updateChildren();
        if(rootStick.son){
            let sonDir = rootStick.son.angle + dir;
            let anchorX = x + this.lengthDirX(Stick.getLength() / 2 - Stick.getTipSize(), dir);
            let anchorY = y + this.lengthDirY(Stick.getLength() / 2 - Stick.getTipSize(), dir);
            //arr.push(new Renderable(anchorX, anchorY, 0, 'blip'));
            let centerX = anchorX + this.lengthDirX(Stick.getLength() / 2, sonDir);
            let centerY = anchorY + this.lengthDirY(Stick.getLength() / 2, sonDir);
            this.renderStickTree(rootStick.son, centerX, centerY, sonDir, arr);
        }
        if(rootStick.daughter){
            let daughterDir = rootStick.daughter.angle + dir;
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

    checkSplinterCollisions(player){
        const allSticks = this.sticks();
        allSticks.forEach((s) => {
            let collisions = s.collidedSplinters();
            collisions.forEach((c)=>{
                player.addSplinter();
            });
        });
    }

    moveTowards(cx, cy, x, y){
        let myX = this.x;
        let myY = this.y;
        let myDirection = this.direction;
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
        this.x = myX;
        this.y = myY;
        this.direction = myDirection;
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
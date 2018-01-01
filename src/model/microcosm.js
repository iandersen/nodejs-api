/**
 * Created by Ian on 12/19/2017.
 */
// const Storage = require('../storage/storage');
const Stick = require('./stick');
const Room = require('./room');
const Renderable = require('../../rendering/Renderable');
const Point = require('../util/point');

const speed = 9;
const rotationSpeed = Math.PI / 30;
let id = 0;

class Microcosm {
    constructor(x, y, direction) {
        this.x = x;
        this.y =y;
        this.direction = direction;
        this.stick = new Stick(null);
        this.type = Microcosm.randomType();
        this.id = id++;
        this.stick.microcosmID = this.id;
        this.stick.microcosm = this;
        this.speed = 9;
        this.numSticks = 1;
    }

    getX(){
        return this.x;
    }

    getY(){
        return this.y;
    }

    sticks(){
        let children = [];
        if(this.stick && this.stick.exists)
            children = this.stick.getChildren();
        this.numSticks = children.length;
        return children;
    }

    renderSticks(arr){
        if(this.stick && this.stick.exists) {
            let x = this.x;
            let y = this.y;
            let dir = this.direction;
            return this.renderStickTree(this.stick, x, y, dir, arr);
        }
    }

    addStickToFirstAvailable(){
        let sonCount = 0;
        let daughterCount = 0;
        let s = this.stick;
        let sonStick = null;
        let daughterStick = null;
        do{
            sonStick = s;
            sonCount++;
            s = s.son;
        }while(s);
        s = this.stick;
        do{
            daughterStick = s;
            daughterCount++;
            s = s.daughter;
        }while(s);
        let newStick;
        let parentStick;
        let reverseAngle = false;
        if(sonCount <= daughterCount){
            sonStick.son = new Stick(sonStick);
            newStick = sonStick.son;
            parentStick = sonStick;
        }else{
            daughterStick.daughter = new Stick(daughterStick);
            newStick = daughterStick.daughter;
            parentStick = daughterStick;
            reverseAngle = true;
        }
        const angles = [45,90,90,90,110,120,130,145,160,160,160,160,160,170,170,170,170,170,190,190,190,190,190,200,200,200,200,200,225,230,240,250,270,270,270,280,315];
        let angle = angles[Math.floor(Math.random() * angles.length)] / 180 * Math.PI;
        if(reverseAngle)
            angle = angle - Math.PI;
        newStick.angle = angle;
        newStick.rotation = angle;
        newStick.getColBox();
        parentStick.getColBox();
    }

    subtractSplinters(num){
        if(this.player)
            this.player.subtractSplinters(num);
    }

    //Returns bounds
    renderStickTree(rootStick, x, y, dir, arr){
        if(!rootStick.exists)
            return;
        //Tell the stick where it is
        let minX, minY, maxX, maxY;
        rootStick.updatePosition(x,y,dir);
        let sonTipX = x + this.lengthDirX(Stick.getLength() / 2 - Stick.getTipSize(), dir);
        let sonTipY = y + this.lengthDirY(Stick.getLength() / 2 - Stick.getTipSize(), dir);
        let daughterTipX = x + this.lengthDirX(Stick.getLength() / 2 - Stick.getTipSize(), dir - Math.PI);
        let daughterTipY = y + this.lengthDirY(Stick.getLength() / 2 - Stick.getTipSize(), dir - Math.PI);
        minX = Math.min(x, sonTipX, daughterTipX);
        minY = Math.min(y, sonTipY, daughterTipY);
        maxX = Math.max(x, sonTipX, daughterTipX);
        maxY = Math.max(y, sonTipY, daughterTipY);
        arr.push(new Renderable(x, y, Math.round(1000 * dir)/1000, rootStick.parent ? 'pop' : this.type, this.speed, Math.round(1000 * this.direction)/1000));
        //arr.push(new Renderable(sonTipX, sonTipY, 0, 'blip'));
        //arr.push(new Renderable(daughterTipX, daughterTipY, 0, 'blip'));
        //rootStick.updateChildren();
        if(rootStick.son && !rootStick.son.exists)
            rootStick.son = null;
        if(rootStick.daughter && !rootStick.daughter.exists)
            rootStick.daughter = null;
        let childBounds = {min: new Point(9999999, 9999999), max: new Point(-9999999, -999999)};
        if(rootStick.son){
            let sonDir = rootStick.son.angle + dir;
            let anchorX = x + this.lengthDirX(Stick.getLength() / 2 - Stick.getTipSize(), dir);
            let anchorY = y + this.lengthDirY(Stick.getLength() / 2 - Stick.getTipSize(), dir);
            //arr.push(new Renderable(anchorX, anchorY, dir, 'blip'));
            let centerX = anchorX + this.lengthDirX(Stick.getLength() / 2, sonDir);
            let centerY = anchorY + this.lengthDirY(Stick.getLength() / 2, sonDir);
            childBounds = this.renderStickTree(rootStick.son, centerX, centerY, sonDir, arr);
        }
        if(rootStick.daughter){
            let daughterDir = rootStick.daughter.angle + dir;
            let anchorX = x + this.lengthDirX(Stick.getLength() / 2 - Stick.getTipSize(), rootStick.parent ? dir : dir - Math.PI);
            let anchorY = y + this.lengthDirY(Stick.getLength() / 2 - Stick.getTipSize(), rootStick.parent ? dir : dir - Math.PI);
            //arr.push(new Renderable(anchorX, anchorY, dir, 'blip'));
            let centerX = anchorX + this.lengthDirX(Stick.getLength() / 2, daughterDir);
            let centerY = anchorY + this.lengthDirY(Stick.getLength() / 2, daughterDir);
            childBounds = this.renderStickTree(rootStick.daughter, centerX, centerY, daughterDir, arr);
        }
        minX = Math.min(minX, childBounds.min.x);
        minY = Math.min(minY, childBounds.min.y);
        maxX= Math.max(maxX, childBounds.max.x);
        maxY = Math.max(maxY, childBounds.max.y);
        return {min: new Point(Math.round(minX), Math.round(minY)), max: new Point(Math.round(maxX), Math.round(maxY))};
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

    checkStickCollisions(sticks){
        const mySticks = this.sticks();
        const enemySticks = sticks.filter((s)=>{
            return s.microcosmID !== this.id;
        });
        mySticks.forEach((s) => {
            enemySticks.forEach((es) => {
                if(s.tip1Box.isCollided(es.hitBox) || s.tip2Box.isCollided(es.hitBox)){
                    es.destroy(this.player);
                }
            });
        });

    }

    moveTowards(cx, cy, x, y){
        let myX = this.x;
        let myY = this.y;
        let myDirection = this.direction;
        let angle = this.angle(cx, cy, x, y);
        this.speed = Math.max(speed - this.numSticks * .2, 1);
        this.rotationSpeed = Math.max(rotationSpeed * Math.pow(.85, this.numSticks-1), rotationSpeed / 5);
        if(myDirection < -Math.PI)
            myDirection = 2 * Math.PI + myDirection;
        let diff = angle - myDirection;
        if(diff > Math.PI)
            diff = Math.PI - diff;
        if(diff < -Math.PI)
            diff = 2 * Math.PI + diff;
        diff = Math.round(diff * 100) / 100;
        if(Math.abs(diff) > this.rotationSpeed)
            myDirection += Math.sign(diff) * this.rotationSpeed;
        else
            myDirection = angle;
        myY += Math.sin(myDirection) * this.speed;
        myX += Math.cos(myDirection) * this.speed;
        myX = Math.max(0, Math.min(myX, Room.getWidth()));
        myY = Math.max(0, Math.min(myY, Room.getHeight()));
        this.x = myX;
        this.y = myY;
        this.direction = myDirection;
    }

    angle(cx, cy, ex, ey) {
        let dy = ey - cy;
        let dx = ex - cx;
        return Math.atan2(dy, dx); // range (-PI, PI]
    }

    destroy(){
        console.log('Microcosm DESTROYED');
        if(this.player){
            this.player.destroy();
        }
    }
}

module.exports = Microcosm;
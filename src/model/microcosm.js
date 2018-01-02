/**
 * Created by Ian on 12/19/2017.
 */
// const Storage = require('../storage/storage');
const Stick = require('./stick');
const Room = require('./room');
const Renderable = require('../../rendering/Renderable');
const AddedStick = require('../../rendering/AddedStick');
const RemovedMicrocosm = require('../../rendering/RemovedMicrocosm');
const Point = require('../util/point');
const Game = require('../gameState');
const game = new Game();

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
            return Microcosm.renderStickTree(this.stick, x, y, dir, arr, this.speed, this.type, dir);
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
        let count = 0;
        if(sonCount <= daughterCount){
            count = sonCount * 2  - 1;
            sonStick.son = new Stick(sonStick, count);
            newStick = sonStick.son;
            parentStick = sonStick;
        }else{
            count = daughterCount * 2;
            daughterStick.daughter = new Stick(daughterStick, count);
            newStick = daughterStick.daughter;
            parentStick = daughterStick;
        }
        newStick.getColBox();
        parentStick.getColBox();
        game.addedSticks.push(new AddedStick(this.id,newStick.angle,count))
    }

    subtractSplinters(num){
        if(this.player)
            this.player.subtractSplinters(num);
    }

    //Returns bounds
    static renderStickTree(rootStick, x, y, dir, arr, speed, type, microcosmDirection){
        if(!rootStick.exists)
            return;
        //Tell the stick where it is
        let minX, minY, maxX, maxY;
        let son = rootStick.son || rootStick.s;
        let sonAngle = son ? son.angle || son.a : 0;
        let daughter = rootStick.daughter || rootStick.d;
        let daughterAngle = daughter ? daughter.angle || daughter.a : 0;
        let parent = rootStick.parent || rootStick.p;
        rootStick.updatePosition(x,y,dir);
        let sonTipX = x + Microcosm.lengthDirX(Stick.getLength() / 2 - Stick.getTipSize(), dir);
        let sonTipY = y + Microcosm.lengthDirY(Stick.getLength() / 2 - Stick.getTipSize(), dir);
        let daughterTipX = x + Microcosm.lengthDirX(Stick.getLength() / 2 - Stick.getTipSize(), dir - Math.PI);
        let daughterTipY = y + Microcosm.lengthDirY(Stick.getLength() / 2 - Stick.getTipSize(), dir - Math.PI);
        minX = Math.min(x, sonTipX, daughterTipX);
        minY = Math.min(y, sonTipY, daughterTipY);
        maxX = Math.max(x, sonTipX, daughterTipX);
        maxY = Math.max(y, sonTipY, daughterTipY);
        arr.push(new Renderable(x, y, Math.round(1000 * dir)/1000, parent ? 'pop' : type, speed, Math.round(1000 * microcosmDirection)/1000,rootStick.id || rootStick.p));
        let childBounds = {min: new Point(9999999, 9999999), max: new Point(-9999999, -999999)};
        if(son){
            let sonDir = sonAngle + dir;
            let anchorX = x + Microcosm.lengthDirX(Stick.getLength() / 2 - Stick.getTipSize(), dir);
            let anchorY = y + Microcosm.lengthDirY(Stick.getLength() / 2 - Stick.getTipSize(), dir);
            let centerX = anchorX + Microcosm.lengthDirX(Stick.getLength() / 2, sonDir);
            let centerY = anchorY + Microcosm.lengthDirY(Stick.getLength() / 2, sonDir);
            childBounds = Microcosm.renderStickTree(son, centerX, centerY, sonDir, arr);
        }
        if(daughter){
            let daughterDir = daughterAngle + dir;
            let anchorX = x + Microcosm.lengthDirX(Stick.getLength() / 2 - Stick.getTipSize(), parent ? dir : dir - Math.PI);
            let anchorY = y + Microcosm.lengthDirY(Stick.getLength() / 2 - Stick.getTipSize(), parent ? dir : dir - Math.PI);
            let centerX = anchorX + Microcosm.lengthDirX(Stick.getLength() / 2, daughterDir);
            let centerY = anchorY + Microcosm.lengthDirY(Stick.getLength() / 2, daughterDir);
            childBounds = Microcosm.renderStickTree(daughter, centerX, centerY, daughterDir, arr);
        }
        minX = Math.min(minX, childBounds.min.x);
        minY = Math.min(minY, childBounds.min.y);
        maxX= Math.max(maxX, childBounds.max.x);
        maxY = Math.max(maxY, childBounds.max.y);
        return {min: new Point(Math.round(minX), Math.round(minY)), max: new Point(Math.round(maxX), Math.round(maxY))};
    }

    static lengthDirX(len, dir){
        return Math.cos(dir) * len;
    }

    static lengthDirY(len, dir){
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
                    es.propagateDestruction();
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
        game.removedMicrocosms.push(new RemovedMicrocosm(this.id));
        if(this.player){
            this.player.destroy();
        }
    }

    serialize(){
        return{
            s: this.stick ? this.stick.serialize(0) : null
        }
    }
}

module.exports = Microcosm;
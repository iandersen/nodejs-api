/**
 * Created by Ian on 12/19/2017.
 */

const Line = require('../util/Line');
const Point = require('../util/Point');
const ColBox = require('../util/CollisionBox');
const Game = require('../GameState');
const game = new Game();
let id = 0;

class Stick {
    constructor(parent, index){
        this.parent = parent;
        if(parent)
            this.microcosmID = parent.microcosmID;
        this.length = Stick.getLength();
        this.x = 0;
        this.y = 0;
        this.rotation = 0;
        this.angle = 0;
        this.daughter = null;
        this.son = null;
        this.tip1Box = null;
        this.tip2Box = null;
        this.hitBox = null;
        this.exists = true;
        this.microcosm = null;
        this.id = id++;
        const angles = [45,90,90,90,110,120,130,145,160,160,160,160,160,170,170,170,170,170,190,190,190,190,190,200,200,200,200,200,225,230,240,250,270,270,270,280,315];
        let angle = angles[Math.floor(Math.random() * angles.length)] / 180 * Math.PI;
        this.angle = angle;
        this.rotation = angle;
        this.index = index;
    }

    static getLength(){
        return 464;
    }

    static getWidth(){
        return 38;
    }

    static getTipSize(){
        return 20;
    }

    collidedSplinters(){
        const colBox = this.getColBox();
        let ret = [];
        if(!colBox)
            return ret;
        game.splinters.forEach((s, i)=>{
            if(s)
                if(Math.abs(s.x - this.x) < Stick.getLength() && Math.abs(s.y - this.y) < Stick.getLength()) {
                    if (colBox.isCollided(s.colBox)) {
                        game.splinters[i] = null;
                        game.removedSplinters.push(i);
                        ret.push(s);
                    }
                }
        });
        return ret;
    }

    updatePosition(x,y,dir){
        this.x = x;
        this.y = y;
        this.rotation = dir;
        this.frontX = x + this.lengthDirX(Stick.getLength() / 2, dir);
        this.frontY = y + this.lengthDirY(Stick.getLength() / 2, dir);
        this.backX = x + this.lengthDirX(Stick.getLength() / 2, dir - Math.PI);
        this.backY = y + this.lengthDirY(Stick.getLength() / 2, dir - Math.PI);
        this.mfrontX = x + this.lengthDirX(Stick.getLength() / 2 - Stick.getTipSize(), dir);
        this.mfrontY = y + this.lengthDirY(Stick.getLength() / 2 - Stick.getTipSize(), dir);
        this.mbackX = x + this.lengthDirX(Stick.getLength() / 2 - Stick.getTipSize(), dir - Math.PI);
        this.mbackY = y + this.lengthDirY(Stick.getLength() / 2 - Stick.getTipSize(), dir - Math.PI);
        this.getColBox();
    }

    getColBox(){
        let tLX, tLY, tRX, tRY, bLX, bLY, bRX, bRY;
        const w = Stick.getWidth();
        tLX=this.frontX+this.lengthDirX(w/2,this.rotation+Math.PI/2);
        tLY=this.frontY+this.lengthDirY(w/2,this.rotation+Math.PI/2);
        tRX=this.frontX+this.lengthDirX(w/2,this.rotation-Math.PI/2);
        tRY=this.frontY+this.lengthDirY(w/2,this.rotation-Math.PI/2);
        bLX=this.backX+this.lengthDirX(w/2,this.rotation+Math.PI/2);
        bLY=this.backY+this.lengthDirY(w/2,this.rotation+Math.PI/2);
        bRX=this.backX+this.lengthDirX(w/2,this.rotation-Math.PI/2);
        bRY=this.backY+this.lengthDirY(w/2,this.rotation-Math.PI/2);
        let l1, l2, l3, l4;
        l1 = new Line(new Point(tLX, tLY), new Point(tRX, tRY));
        l2 = new Line(new Point(tRX, tRY), new Point(bLX, bLY));
        l3 = new Line(new Point(bLX, bLY), new Point(bRX, bRY));
        l4 = new Line(new Point(bRX, bRY), new Point(tLX, tLY));
        this.colBox = new ColBox(l1, l2, l3, l4);
        let mtLX, mtLY, mtRX, mtRY, mbLX, mbLY, mbRX, mbRY;
        mtLX=this.mfrontX+this.lengthDirX(w/2,this.rotation+Math.PI/2);
        mtLY=this.mfrontY+this.lengthDirY(w/2,this.rotation+Math.PI/2);
        mtRX=this.mfrontX+this.lengthDirX(w/2,this.rotation-Math.PI/2);
        mtRY=this.mfrontY+this.lengthDirY(w/2,this.rotation-Math.PI/2);
        mbLX=this.mbackX+this.lengthDirX(w/2,this.rotation+Math.PI/2);
        mbLY=this.mbackY+this.lengthDirY(w/2,this.rotation+Math.PI/2);
        mbRX=this.mbackX+this.lengthDirX(w/2,this.rotation-Math.PI/2);
        mbRY=this.mbackY+this.lengthDirY(w/2,this.rotation-Math.PI/2);
        l1 = new Line(new Point(mtLX, mtLY), new Point(mtRX, mtRY));
        l2 = new Line(new Point(mtRX, mtRY), new Point(mbLX, mbLY));
        l3 = new Line(new Point(mbLX, mbLY), new Point(mbRX, mbRY));
        l4 = new Line(new Point(mbRX, mbRY), new Point(mtLX, mtLY));
        this.hitBox = new ColBox(l1, l2, l3, l4);
        l1 = new Line(new Point(tLX, tLY), new Point(tRX, tRY));
        l2 = new Line(new Point(tRX, tRY), new Point(mtRX, mtRY));
        l3 = new Line(new Point(mtRX, mtRY), new Point(mtLX, mtLY));
        l4 = new Line(new Point(mtLX, mtLY), new Point(tLX, tLY));
        this.tip1Box = new ColBox(l1, l2, l3, l4);
        l1 = new Line(new Point(bLX, bLY), new Point(bRX, bRY));
        l2 = new Line(new Point(bRX, bRY), new Point(mbRX, mbRY));
        l3 = new Line(new Point(mbRX, mbRY), new Point(mbLX, mbLY));
        l4 = new Line(new Point(mbLX, mbLY), new Point(bLX, bLY));
        this.tip2Box = new ColBox(l1, l2, l3, l4);
        return this.colBox;
    }

    lengthDirX(len, dir){
        return Math.cos(dir) * len;
    }

    lengthDirY(len, dir){
        return Math.sin(dir) * len;
    }

    getChildren(){
        let children = [];
        children.push(this);
        if(this.son && !this.son.exists)
            this.son = null;
        if(this.daughter && !this.daughter.exists)
            this.daughter = null;
        if(this.son && typeof this.son === 'object')
            this.son.getChildren().forEach((c)=>{
                children.push(c);
            });
        if(this.daughter && typeof this.daughter === 'object')
            this.daughter.getChildren().forEach((c)=>{
                children.push(c);
            });
        return children;
    }

    subtractSplinters(num){
        if(this.microcosm)
            this.microcosm.subtractSplinters(num);
        else if(this.parent)
            this.parent.subtractSplinters(num);
    }

    tellPlayerToShrink(){
        if(this.microcosm)
            this.microcosm.player.stickLost();
        else if(this.parent)
            this.parent.tellPlayerToShrink();
    }

    destroy(player){
        this.tellPlayerToShrink();
        const dir = this.rotation;
        this.backX = this.x + this.lengthDirX(Stick.getLength() / 2, dir - Math.PI);
        this.backY = this.y + this.lengthDirY(Stick.getLength() / 2, dir - Math.PI);
        const drops = 15;
        for(let i = 0; i < drops; i++){
            if(player)
                player.addSplinter();
        }
        this.subtractSplinters(30);
        this.exists = false;
        if(this.son)
            this.son.destroy(player);
        if(this.daughter)
            this.daughter.destroy(player);
        if(this.microcosm)//If it is the root stick
            this.microcosm.destroy();
    }

    propagateDestruction(){
        if(this.microcosm)
            this.microcosm.updated();
        else if(this.parent)
            this.parent.propagateDestruction();
    }

    serialize(i){
        let ret = {
            a: Math.round(1000 * this.angle) / 1000,
            p: i
        };
        if(this.son)
            ret.s = this.son.serialize(i+2);
        if(this.daughter)
            ret.d = this.daughter.serialize(i+2);
        return ret;
    }
}

module.exports = Stick;
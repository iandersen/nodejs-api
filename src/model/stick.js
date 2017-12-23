/**
 * Created by Ian on 12/19/2017.
 */

const Storage = require('../storage/storage');
const Line = require('../util/line');
const Point = require('../util/point');
const ColBox = require('../util/colBox');
const Game = require('../gameState');
const game = new Game();

class Stick {
    constructor(parent){
        this.parent = parent;
        this.length = Stick.getLength();
        this.x = 0;
        this.y = 0;
        this.rotation = 0;
        this.daughter = null;
        this.son = null;
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
            if(Math.abs(s.x - this.x) < Stick.getLength() && Math.abs(s.y - this.y) < Stick.getLength()) {
                if (colBox.isCollided(s.colBox)) {
                    game.splinters.splice(i,1);
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
        if(this.son && typeof this.son === 'object')
            children.push(this.son.getChilren());
        if(this.daughter && typeof this.daughter === 'object')
            children.push(this.daughter.getChildren());
        return children;
    }
}

module.exports = Stick;
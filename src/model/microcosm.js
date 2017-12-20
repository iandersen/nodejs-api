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
            console.log(this.id);
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
            arr.push(new Renderable(this.row.x, this.row.y, this.row.direction, this.row.type));
        }
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
        if(Math.abs(diff) > Math.PI / 30)
            diff = Math.sign(diff) * Math.PI / 30;
        if(Math.abs(diff) >= Math.PI / 60)
        myDirection += diff;
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
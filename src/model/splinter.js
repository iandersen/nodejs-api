/**
 * Created by Ian on 12/19/2017.
 */

// const Storage = require('../storage/storage');
const Line = require('../util/line');
const Point = require('../util/point');
const ColBox = require('../util/colBox');

class Splinter {
    constructor(x, y, type){
        this.x = x;
        this.y = y;
        this.type = type;
        const width = 50;
        const height = 50;
        this.colBox = new ColBox(
            new Line(new Point(x - width / 2, y - height / 2), new Point(x + width / 2, y - height / 2)),
            new Line(new Point(x + width / 2, y - height / 2), new Point(x + width / 2, y + height / 2)),
            new Line(new Point(x - width / 2, y + height / 2), new Point(x + width / 2, y + height / 2)),
            new Line(new Point(x - width / 2, y - height / 2), new Point(x - width / 2, y + height / 2))
        )
    }

    static randomType(){
        const types = ['splinter1','splinter2','splinter3','splinter4','splinter5','splinter6'];
        return types[Math.floor(Math.random() * types.length)];
    }
}

module.exports = Splinter;
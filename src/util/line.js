/**
 * Created by Ian on 12/23/2017.
 */
class Line {
    constructor(point1, point2){
        this.point1 = point1;
        this.point2 = point2;
    }

    //  https://stackoverflow.com/a/16725715/3455858
    static turn(p1, p2, p3) {
        let a, b, c, d, e, f, A, B;
        a = p1.x; b = p1.y;
        c = p2.x; d = p2.y;
        e = p3.x; f = p3.y;
        A = (f - b) * (c - a);
        B = (d - b) * (e - a);
        return (A > B + Number.EPSILON) ? 1 : (A + Number.EPSILON < B) ? -1 : 0;
    }

    isCollided(line) {
        let p1, p2, p3, p4;
        p1 = this.point1;
        p2 = this.point2;
        p3 = line.point1;
        p4 = line.point2;
        return (Line.turn(p1, p3, p4) !== Line.turn(p2, p3, p4)) && (Line.turn(p1, p2, p3) !== Line.turn(p1, p2, p4));
    }
}

module.exports = Line;
/**
 * Created by Ian on 12/23/2017.
 */
class ColBox {
    constructor(line1, line2, line3, line4){
        this.lines = [line1, line2, line3, line4];
    }

    isCollided(colBox){
        let col = false;
        this.lines.forEach((l)=>{
            colBox.lines.forEach((l2)=>{
                if(l.isCollided(l2))
                    col = true;
            });
        });
        return col;
    }
}

module.exports = ColBox;
/*
*
* This class's methods would interact with a database in a full version.
*
*/

const mysql = require('mysql');

const tables = {
    'microcosm': 'microcosms',
    'room': 'rooms',
    'stick': 'sticks',
    'player': 'players'
};
let con = null;

class Storage{

    static connect(){
        if(!con) {
            con = mysql.createConnection({
                host: "localhost",
                user: "root",
                password: "",
                database: "popsicio"
            });

            con.connect(function (err) {
                if (err) throw err;
                console.log("Connected to Database!");
            });
        }
    }

    static find(modelName, id, callback){
        Storage.connect();
        con.query(`SELECT * FROM ${tables[modelName]} where id = ?`, [id], function(err, results) {
            if(err){
                console.error(err);
                console.log(query);
                console.log(modelName);
            }
            callback(results);
        });
    }

    static create(modelName, props, callback){
        Storage.connect();
        const cols = Object.keys(props);
        const vals = Object.values(props);
        let colString = '';
        let valString = '';
        for(let i = 0; i < cols.length; i++){
            colString += `\`${cols[i]}\``;
            valString += '?';
            if(i < cols.length - 1) {
                colString += ',';
                valString += ',';
            }
        }
        const query = `INSERT INTO ${tables[modelName]}(${colString}) values (${valString})`;
        let newID = -1;
        con.query(query, vals, function(err, results) {
            if(err){
                console.error(err);
                console.log(query);
                console.log(modelName);
            }
            newID = results.insertId;
            callback(newID);
        });
        return 0;
    }

    static destroy(modelName, id){
        Storage.connect();
        con.query(`DELETE FROM ${tables[modelName]} where id = ?`, [id], function(err, results) {
            if(err){
                console.error(err);
                console.log(query);
                console.log(modelName);
            }
        });
    }
}

module.exports = Storage;


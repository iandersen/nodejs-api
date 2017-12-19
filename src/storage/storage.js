/*
*
* This class's methods would interact with a database in a full version.
*
*/

const mysql = require('mysql');
const {models, tables} = require('../model/models');

let con = null;
function connect(){
    if(!con) {
        con = mysql.createConnection({
            host: "localhost",
            user: "root",
            password: "",
            database: "popsicio"
        });

        con.connect(function (err) {
            if (err) throw err;
            console.log("Connected!");
        });
    }
}
class Storage{

    static create(modelName, props, callback){
	    connect();
        const model = models[modelName];
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
            newID = results.insertId;
            callback(newID);
        });
        return 0;
    }

    static destroy(modelName, id){
        connect();
        con.query(`DELETE FROM ${tables[modelName]} where id = ?`, [id], function(err, results) {});
    }
}

module.exports = Storage;


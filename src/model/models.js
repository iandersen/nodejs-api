/**
 * Created by Ian on 12/19/2017.
 */
const Microcosm = require('./microcosm');
const Room = require('./room');
const Stick = require('./stick');
const Player = require('./player');


const models = {
    'microcosm': Microcosm,
    'room': Room,
    'stick': Stick,
    'player': Player
};

const tables = {
    'microcosm': 'microcosms',
    'room': 'rooms',
    'stick': 'sticks',
    'player': 'players'
};

module.exports = {models: models, tables: tables};
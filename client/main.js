// import ioClient from 'socket.io-client'
// let io = ioClient('http://localhost:8080');
import $ from 'jquery';
require('../sass/main.scss');
const types = require('../rendering/types');
let images = {};

let socket, mouseX, mouseY, lastMouseX, lastMouseY, x, y, renderables, splinters, sticks, scoreBoard;
let statics = [];
let dynamics = [];
const canvas = document.getElementById('gameCanvas');
const context = canvas.getContext('2d');
const WIDTH = 10000;
const HEIGHT = 10000;
const GRID_SIZE = 100;
const imageCache = {};
let attempts = 0;
let hits = 0;
let time = 0;

function hashKey(image, x, y, rotation){
    return Math.round(stringToInt(image) + x * WIDTH + y + rotation * 57313);
}

function stringToInt(s){
    const limit = 37189;
    s = s + ' ';
    let chars = s.split('');
    let ret = 0;
    for(let i = 0; i < chars.length; i++)
        ret += chars[i].charCodeAt(0) * Math.pow(3, i);
    return ret % limit;
}

$('#startButton').click(function(){
    let name = $('#nameField').val();
    socket = io.connect('', {query: 'name='+name});
    socket.on('position', (pos) => {
        x = Math.round(pos.x);
        y = Math.round(pos.y);
    });
    socket.on('properties', (props) => {
        splinters = props.splinters;
        sticks = props.sticks;
    });
    socket.on('scores', (scores) => {
        scoreBoard = scores;
    });

    socket.on('renderables', (r)=>{
        if(r.addedStatics)
            r.addedStatics.forEach((s)=>{
                statics[s.index] = s.renderable;
            });
        if(r.removedStatics)
            r.removedStatics.forEach((s)=>{
                statics[s] = null;
            });
        dynamics = r.dynamics;
    });
    socket.on('dead', (s)=>{
        window.location.reload();
    });
    $('#gameTitle').remove();
    $('#startBox').remove();
    let timer = window.setInterval(main, 1000/30);
    let timer2 = window.setInterval(checkPercentage, 10000);
});


function main(){
    let t0 = performance.now();
    draw();
    let t1 = performance.now();
    attempts ++;
    time += t1 - t0;
    drawGUI();
    if(true || mouseX !== lastMouseX || mouseY !== lastMouseY) {
        lastMouseX = mouseX;
        lastMouseY = mouseY;
        let w = $(window).width();
        let h = $(window).height();
        socket.emit('mouse', {x: mouseX, y: mouseY, w: w, h: h});
    }
}

function checkPercentage(){
    console.log('Time: ', time/attempts);
    console.log('attempts: ', attempts);
    attempts = 0;
    time = 0;
}

$( "html" ).mousemove(function( event ) {
    mouseX = event.pageX;
    mouseY = event.pageY;
});
const offscreenCanvas = document.createElement('canvas');
const offscreenCtx = offscreenCanvas.getContext('2d');
function rotateAndCache(image, angle, w, h, key) {
    //const alreadyCached = imageCache[hashKey(key,w,h,angle)];
   // if(alreadyCached)
     //   return alreadyCached;
    let size = Math.max(w, h);
    offscreenCanvas.width = size;
    offscreenCanvas.height = size;
    offscreenCtx.translate(size/2, size/2);
    offscreenCtx.rotate(angle);
    offscreenCtx.drawImage(image, -w/2, -h/2, w, h);
    //imageCache[hashKey(key,w,h,angle)] = offscreenCanvas;
    return offscreenCanvas;
}

function drawRotated(x, y, image, radians, w, h, key){
    //radians = Math.round(radians * 10) / 10;
    const rotatedImage = rotateAndCache(image, radians, w, h, key);
    context.drawImage(rotatedImage, x, y);
}
let gridBKG;
function draw(){
    canvas.width = window.innerWidth * 2;
    canvas.height = window.innerHeight * 2;
    drawBKG(context);
    if(dynamics)
        dynamics.forEach((r) => {
            if(r)
                render(r);
        });
    if(statics)
        statics.forEach((r) => {
            if(r)
                render(r);
        });
}

function render(r){
    let t = r.type;
    let img = images[t];
    if(!img) {
        img = document.getElementById(t);
        images[t] = img;
    }
    let xx = Math.round(r.x - x + canvas.width / 2);
    let yy = Math.round(r.y - y + canvas.height / 2);
    if(xx >= -200 && xx <= canvas.width + 200 && yy >= -200 && yy <= canvas.height + 200) {
        const s = Math.max(img.width, img.height);
        drawRotated(xx - s / 2,yy - s / 2,img,r.radians, img.width, img.height, t);
    }
}

function gridImage(){
    const c = document.createElement('canvas');
    const ctx = c.getContext('2d');
    c.width = WIDTH;
    c.height = HEIGHT;
    ctx.fillStyle='#fff';
    gridBKG = gridBKG || document.getElementById('gridsquare');
    for(let i = 0; i < WIDTH; i+=GRID_SIZE){
        for(let n = 0; n < HEIGHT; n+=GRID_SIZE){
            ctx.fillRect(i,n,GRID_SIZE,GRID_SIZE);
            ctx.drawImage(gridBKG, i, n, GRID_SIZE, GRID_SIZE);
        }
    }
    return c;
}
let grid;
function drawBKG(context){
    //grid = grid || gridImage();
    context.clearRect(0,0,canvas.width, canvas.height);
    // const sx = Math.max(0, x - canvas.width / 2);
    // const sy = Math.max(y - canvas.height / 2, 0);
    // const sw = Math.min(WIDTH - sx, canvas.width);
    // const sh = Math.min(HEIGHT - sy, canvas.height);
    // const dx = Math.max(canvas.width /2 - x, 0);
    // const dy = Math.max(canvas.height /2 - y, 0);
    gridBKG = gridBKG || document.getElementById('gridsquare');
    gridBKG.width = 100;
    gridBKG.height = 100;
    context.fillStyle = context.createPattern(gridBKG, 'repeat');
    context.save();
    context.translate(-x,-y);
    context.fillRect(canvas.width / 2, canvas.height / 2, 10000, 10000);
    context.restore();
    //context.drawImage(grid, sx, sy, sw, sh, dx, dy, sw, sh);
}

function drawGUI(){
    const h = canvas.height;
    const w = canvas.width;
    context.fillStyle = 'rgba(0,0,0,.5)';
    const boxHeight = 700;
    const boxWidth = 550;
    context.fillRect(w - boxWidth, 0, boxWidth, boxHeight);
    const lineHeight = boxHeight / 10;
    const margin = 10;
    if(scoreBoard)
        scoreBoard.forEach((s, i) => {
            const name = s.name;
            const score = s.score;
            context.fillStyle = 'gold';
            context.font = "bold 50px Arial";
            const textWidth = context.measureText(name + ': ').width;
            context.fillText(name + ': ', w - boxWidth + margin, lineHeight * (i+1));
            context.fillStyle = 'white';
            context.fillText(score, w - boxWidth + margin + textWidth, lineHeight * (i+1));
        });
}
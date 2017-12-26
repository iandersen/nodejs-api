// import ioClient from 'socket.io-client'
// let io = ioClient('http://localhost:8080');
import $ from 'jquery';
require('../sass/main.scss');
const types = require('../rendering/types');
let images = {};

let socket, mouseX, mouseY, lastMouseX, lastMouseY, x, y, renderables, splinters, sticks, scoreBoard;
let canvas = document.getElementById('gameCanvas');
const WIDTH = 10000;
const HEIGHT = 10000;
const GRID_SIZE = 100;

$('#startButton').click(function(){
    let name = $('#nameField').val();
    socket = io.connect('', {query: 'name='+name});
    socket.on('position', (pos) => {
        x = pos.x;
        y = pos.y;
    });
    socket.on('properties', (props) => {
        splinters = props.splinters;
        sticks = props.sticks;
    });
    socket.on('scores', (scores) => {
        scoreBoard = scores;
    });

    socket.on('renderables', (r)=>{
        renderables = r
    });
    socket.on('dead', (s)=>{
        window.location.reload();
    });
    $('#gameTitle').remove();
    $('#startBox').remove();
    let timer = window.setInterval(main, 1000/30);
});

function main(){
    draw();
    drawGUI();
    if(true || mouseX !== lastMouseX || mouseY !== lastMouseY) {
        lastMouseX = mouseX;
        lastMouseY = mouseY;
        let w = $(window).width();
        let h = $(window).height();
        socket.emit('mouse', {x: mouseX, y: mouseY, w: w, h: h});
    }
}

$( "html" ).mousemove(function( event ) {
    mouseX = event.pageX;
    mouseY = event.pageY;
});


const offscreenCanvas = document.createElement('canvas');
const offscreenCtx = offscreenCanvas.getContext('2d');
function rotateAndCache(image, angle, w, h) {
    let size = Math.max(w, h);
    offscreenCanvas.width = size;
    offscreenCanvas.height = size;
    offscreenCtx.translate(size/2, size/2);
    offscreenCtx.rotate(angle);
    offscreenCtx.drawImage(image, -w/2, -h/2, w, h);

    return offscreenCanvas;
}

function drawRotated(x, y, image, radians, w, h){
    const context = canvas.getContext('2d');
    const rotatedImage = rotateAndCache(image, radians, w, h);
    context.drawImage(rotatedImage, x, y);
}
let gridBKG;
function draw(){
    const context = canvas.getContext('2d');
    canvas.width = window.innerWidth * 2;
    canvas.height = window.innerHeight * 2;
    drawBKG(context);
    if(renderables)
        renderables.forEach((r) => {
            let t = r.type;
            let img = images[t];
            if(!img) {
                img = document.getElementById(t);
                images[t] = img;
            }
            let xx = r.x - x + canvas.width / 2;
            let yy = r.y - y + canvas.height / 2;
            if(xx >= -200 && xx <= canvas.width + 200 && yy >= -200 && yy <= canvas.height + 200) {
                const s = Math.max(img.width, img.height);
                drawRotated(xx - s / 2,yy - s / 2,img,r.radians, img.width, img.height);
            }
        });
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
    grid = grid || gridImage();
    context.clearRect(0,0,canvas.width, canvas.height);
    context.fillStyle='#aaa';
    context.fillRect(0,0,canvas.width, canvas.height);
    const sx = Math.max(0, x - canvas.width / 2);
    const sy = Math.max(y - canvas.height / 2, 0);
    const sw = Math.min(WIDTH - sx, canvas.width);
    const sh = Math.min(HEIGHT - sy, canvas.height);
    const dx = Math.max(canvas.width /2 - x, 0);
    const dy = Math.max(canvas.height /2 - y, 0);
    context.drawImage(grid, sx, sy, sw, sh, dx, dy, sw, sh);

}

function drawGUI(){
    const context = canvas.getContext('2d');
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
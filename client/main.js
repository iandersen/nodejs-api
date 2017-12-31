// import ioClient from 'socket.io-client'
// let io = ioClient('http://localhost:8080');
import $ from 'jquery';
require('../sass/main.scss');
const types = require('../rendering/types');
let images = {};

let socket, mouseX, mouseY, lastMouseX, lastMouseY, x, y, renderables, splinters, sticks, scoreBoard, bounds;
let statics = [];
let dynamics = [];
let pd = 0;
let ps = 0;
let textElements = [];
const canvas = document.getElementById('gameCanvas');
const guiCanvas = document.getElementById('guiCanvas');
const context = canvas.getContext('2d');
const guiContext = guiCanvas.getContext('2d');
const WIDTH = 10000;
const HEIGHT = 10000;
const GRID_SIZE = 100;
const imageCache = {};
let attempts = 0;
let hits = 0;
let time = 0;
let renderSize = 0;
let forceResize = false;
let timer, timer2;

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
    socket = io.connect('', {query: 'name='+name, forceNew: true});
    statics = [];
    // socket.on('position', (pos) => {
    //     x = pos.x;
    //     y = pos.y;
    //     bounds = pos.bounds;
    // });
    socket.on('properties', (props) => {
        splinters = props.splinters;
        sticks = props.sticks;
    });
    socket.on('scores', (scores) => {
        scoreBoard = scores;
    });
    socket.on('stickLost', ()=>{
        setTimeout(()=>{forceResize = true; console.log('SHRUNK')}, 500);
    });
    socket.on('refreshStatics', (s)=>{
        statics = s;
    });

    // socket.on('textElements', (elements)=>{
    //     textElements = elements;
    // });
    socket.on('info', (info)=>{
        console.log('SIZE: ', roughSizeOfObject(info));
        textElements = info.textElements;
        const r = info.renderables;
        if(r.addedStatics)
            r.addedStatics.forEach((s)=>{
                statics[s.index] = s.renderable;
            });
        if(r.removedStatics)
            r.removedStatics.forEach((s)=>{
                statics[s] = null;
            });
        dynamics = r.dynamics;
        const pos = info.position;
        x = pos.x;
        y = pos.y;
        ps = pos.s;
        pd = pos.d;
        bounds = pos.bounds;
        main();
    });

    function roughSizeOfObject( object ) {

        let objectList = [];

        let recurse = function( value )
        {
            let bytes = 0;

            if ( typeof value === 'boolean' ) {
                bytes = 4;
            }
            else if ( typeof value === 'string' ) {
                bytes = value.length * 2;
            }
            else if ( typeof value === 'number' ) {
                bytes = 8;
            }
            else if
            (
                typeof value === 'object'
                && objectList.indexOf( value ) === -1
            )
            {
                objectList[ objectList.length ] = value;

                for(let i in value ) {
                    bytes+= 8; // an assumed existence overhead
                    bytes+= recurse( value[i] )
                }
            }

            return bytes;
        };

        return recurse( object );
    }

    // socket.on('renderables', (r)=>{
    //     if(r.addedStatics)
    //         r.addedStatics.forEach((s)=>{
    //             statics[s.index] = s.renderable;
    //         });
    //     if(r.removedStatics)
    //         r.removedStatics.forEach((s)=>{
    //             statics[s] = null;
    //         });
    //     dynamics = r.dynamics;
    //     if(r.dynamics)
    //         console.log(r.dynamics.length);
    // });
    socket.on('dead', (s)=>{
        console.log('Socket says we are dead...');
        clearInterval(timer);
        clearInterval(timer2);
        textElements = [];
        splinters = [];
        sticks = [];
        statics = [];
        $('#gameTitle').show();
        $('#startBox').show();
        socket.disconnect();
    });
    $('#gameTitle').hide();
    $('#startBox').hide();
    timer = window.setInterval(interpolatePositions, 1000/30);
    timer2 = window.setInterval(checkPercentage, 10000);
});

function interpolatePositions(){
    dynamics.forEach((d)=>{
        d.x += Math.cos(d.d) * d.s;
        d.y += Math.sin(d.d) * d.s;
    });
    textElements.forEach((t)=>{
        t.x += Math.cos(t.d) * t.s;
        t.y += Math.sin(t.d) * t.s;
    });
    x += Math.cos(pd) * ps;
    y += Math.sin(pd) * ps;
    draw();
}


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
        socket.emit('renderBounds', {x: x - canvas.width / 2, y: y - canvas.height / 2, width: canvas.width, height: canvas.height});
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
window.onresize = (e)=>{forceResize = true;};
let gridBKG;
function draw(){
    if(bounds) {
        let maxDiff = Math.round(Math.sqrt(2) * Math.sqrt(Math.pow(bounds.max.x - bounds.min.x, 2) + Math.pow(bounds.max.y - bounds.min.y, 2)));
        if (maxDiff > renderSize + 10 || forceResize) {
            const ratio = window.innerHeight / window.innerWidth;
            maxDiff += 10;
            renderSize = maxDiff;
            forceResize = false;
            if (ratio <= 1) {
                canvas.width = Math.max(maxDiff / ratio + 100, window.innerWidth);
                canvas.height = Math.max(canvas.width * ratio, window.innerHeight);
            } else {
                canvas.height = Math.max(maxDiff + 100, window.innerHeight);
                canvas.width = Math.max(canvas.height * ratio, window.innerWidth);
            }
        }
    }
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
    if(textElements){
        textElements.forEach((t)=>{
            renderText(t);
        });
    }
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
    context.fillRect(canvas.width / 2, canvas.height / 2, WIDTH, HEIGHT);
    context.restore();
    //context.drawImage(grid, sx, sy, sw, sh, dx, dy, sw, sh);
}

function drawGUI(){
    guiCanvas.width = window.innerWidth;
    guiCanvas.height = window.innerHeight;
    const w = guiCanvas.width;
    guiContext.fillStyle = 'rgba(0,0,0,.5)';
    const boxHeight = 375;
    const boxWidth = 275;
    guiContext.clearRect(w - boxWidth, 0, boxWidth, boxHeight);
    guiContext.fillRect(w - boxWidth, 0, boxWidth, boxHeight);
    const lineHeight = boxHeight / 10;
    const margin = 10;
    if(scoreBoard)
        scoreBoard.forEach((s, i) => {
            const name = s.name;
            const score = s.score;
            guiContext.fillStyle = 'gold';
            guiContext.font = "bold 30px Arial";
            const textWidth = guiContext.measureText(name + ': ').width;
            guiContext.fillText(name + ': ', w - boxWidth + margin, lineHeight * (i+1));
            guiContext.fillStyle = 'white';
            guiContext.fillText(score, w - boxWidth + margin + textWidth, lineHeight * (i+1));
        });
}

function renderText(textElement){
    let xx = Math.round(textElement.x - x + canvas.width / 2);
    let yy = Math.round(textElement.y - y + canvas.height / 2);
    if(xx >= -200 && xx <= canvas.width + 200 && yy >= -200 && yy <= canvas.height + 200) {
        context.fillStyle = 'white';
        context.textAlign = 'center';
        context.textBaseline="middle";
        context.font = `bold ${textElement.size}px Work Sans`;
        context.fillText(textElement.text, xx, yy);
        context.fillStyle = 'black';
        context.strokeWidth = 2;
        context.strokeText(textElement.text, xx, yy)
    }
}
// import ioClient from 'socket.io-client'
// let io = ioClient('http://localhost:8080');
import $ from 'jquery';
require('../sass/main.scss');
const Microcosm = require('../src/model/microcosm');
const ClientMicrocosm = require('./Microcosm');
let images = {};

let socket, mouseX, mouseY, lastMouseX, lastMouseY, lastCanvasWidth, lastCanvasHeight, x, y, splinters, sticks, scoreBoard, bounds;
let statics = [];
let dynamics = [];
let microcosms = [];
let renderMicrocosms = [];
let textElements = [];
const canvas = document.getElementById('gameCanvas');
const guiCanvas = document.getElementById('guiCanvas');
const context = canvas.getContext('2d');
const guiContext = guiCanvas.getContext('2d');
const WIDTH = 10000;
const HEIGHT = 10000;
let attempts = 0;
let time = 0;
let renderSize = 0;
let forceResize = false;
let timer, timer2;
let buffer = [];
const BUFFER_SIZE = 6;
let renderTimer;
let renderSpeed = 1000/30;
let renderDiff = 1000/30;
let socketSpeed = 1000/10;
let lastSocketTime = performance.now();
let lastRenderTime = -1;
const DELAY_TIME = 0;
let bufferFrameID = 0;
let timeSinceLastFrame = 0;
let startTime = 0;

$('#startButton').click(function(){
    let name = $('#nameField').val();
    if(timer)
        clearInterval(timer);
    if(timer2)
        clearInterval(timer2);
    if(renderTimer)
        clearInterval(renderTimer);
    buffer = [];
    textElements = [];
    splinters = [];
    sticks = [];
    statics = [];
    socket = io.connect('', {query: 'name='+name, forceNew: true});
    statics = [];
    socket.on('properties', (props) => {
        splinters = props.splinters;
        sticks = props.sticks;
    });
    socket.on('scores', (scores) => {
        scoreBoard = scores;
    });
    socket.on('sL', ()=>{
        setTimeout(()=>{forceResize = true; console.log('SHRUNK')}, 500);
    });
    socket.on('rS', (s)=>{
        statics = s;
    });
    socket.on('info', (info)=>{
        drawGUI();
        if(startTime === 0)
            startTime = performance.now();
        let bufferMicrocosms = [];
        let bufferMicrocosmPositions = [];
        const r = info.r;
        //Added Splinters
        if(r.aS)
            r.aS.forEach((s)=>{
                statics[s.i] = s.r;
            });
        //Removed Splinters
        if(r.rS)
            r.rS.forEach((s)=>{
                statics[s] = null;
            });
        //Microcosms
        if(r.m){
            r.m.forEach((m)=>{
                const id = m.i;
                bufferMicrocosms[id] = ClientMicrocosm.deserialize(m);
            });
        }
        //Microcosm positions
        if(r.mP){
            r.mP.forEach((m)=>{
                const id = m.i;
                bufferMicrocosmPositions[id] = m;
            });
        }
        buffer.push({time: info.t, microcosms: bufferMicrocosms, pos: info.p, microcosmPositions: bufferMicrocosmPositions, id: bufferFrameID++});
        if(buffer.length > BUFFER_SIZE)
            buffer = buffer.slice(-BUFFER_SIZE);
        socketSpeed = performance.now() - lastSocketTime;
        lastSocketTime = performance.now();
        bounds = info.p.b;
        main();
    });
    socket.on('dead', (s)=>{
        $('#gameTitle').show();
        $('#startBox').show();
        socket.disconnect();
        lastRenderTime = -1;
        startTime = 0;
        timeSinceLastFrame = 0;
    });
    $('#gameTitle').hide();
    $('#startBox').hide();
    timer2 = window.setInterval(checkPercentage, 10000);
    renderTimer = window.setInterval(renderScreen, renderSpeed);
});

function renderScreen(){
    if(startTime === 0 || performance.now() - startTime < DELAY_TIME)
        return;
    renderMicrocosms = [];
    textElements = [];
    if(buffer.length > 3){
        let nextFrame = buffer[1];
        if(timeSinceLastFrame > nextFrame.time) {
            if(buffer.length === 4)//Make sure the frames don't pile up
                timeSinceLastFrame %= nextFrame.time;
            //console.log('New time: ', timeSinceLastFrame);
            buffer = buffer.slice(1, buffer.length);
            console.log('Length after slice: ', buffer.length);
        }
    }
    if(buffer.length > 1){//Interpolate
        renderDiff = performance.now() - lastSocketTime;
        if(lastRenderTime !== -1)
            renderSpeed = performance.now() - lastRenderTime;
        timeSinceLastFrame += renderSpeed;
        lastRenderTime = performance.now();
        let frame = buffer[0];
        let nextFrame = buffer[1];
        if(frame.microcosms.length > 0){
            frame.microcosms.forEach((m, i)=>{
                if(m) {
                    microcosms[i] = m;
                }
            });
        }
        const percentage = timeSinceLastFrame / nextFrame.time;
        const d = frame.microcosmPositions;
        const nd = nextFrame.microcosmPositions;
        for(let n = 0; n < d.length; n++){
            let r = d[n];
            let nr = nd[n];
            if(r && nr){
                let myDirection = r.d;
                let nextDirection = nr.d;
                let diff = nextDirection - myDirection;
                if(diff > Math.PI)
                    diff = 2 * Math.PI - diff;
                if(diff < -Math.PI)
                    diff = 2 * Math.PI + diff;
                const newDirection = diff * percentage + myDirection;
                const dX = nr.x - r.x;
                const newX = r.x + percentage * dX;
                const dY = nr.y - r.y;
                const newY = r.y + percentage * dY;
                const storedMicrocosm = microcosms[n];
                if(storedMicrocosm)
                    renderMicrocosms[n] = {x: newX, y: newY, type: storedMicrocosm.type, direction: newDirection, microcosm: storedMicrocosm};
            }
        }
        const pos = frame.pos;
        const nPos = nextFrame.pos;
        const dX = nPos.x - pos.x;
        const dY = nPos.y - pos.y;
        x = pos.x;
        y = pos.y;
        x += percentage * dX;
        y += percentage * dY;
    }else if(buffer.size > 0){//Extrapolating
        console.log('Buffer not full!');
    }else{
        console.log('buffer empty!');
    }
    draw();
}

function main(){
    if(mouseX !== lastMouseX || mouseY !== lastMouseY){
        lastMouseX = mouseX;
        lastMouseY = mouseY;
        const w = $(window).width();
        const h = $(window).height();
        socket.emit('m', {x: mouseX, y: mouseY, w: w, h: h});
    }
    socket.emit('r', {x: Math.round(x - canvas.width / 2), y: Math.round(y - canvas.height / 2), w: canvas.width, h: canvas.height});
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
    let size = Math.max(w, h);
    offscreenCanvas.width = size;
    offscreenCanvas.height = size;
    offscreenCtx.translate(size/2, size/2);
    offscreenCtx.rotate(angle);
    offscreenCtx.drawImage(image, -w/2, -h/2, w, h);
    return offscreenCanvas;
}

function drawRotated(x, y, image, radians, w, h, key){
    const rotatedImage = rotateAndCache(image, radians, w, h, key);
    context.drawImage(rotatedImage, x, y);
}
window.onresize = (e)=>{forceResize = true;};
let gridBKG;
function draw(){
    let t0 = performance.now();
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
    dynamics = [];
    if(renderMicrocosms)
        renderMicrocosms.forEach((m) => {
            if(m)
                renderMicrocosm(m.x, m.y, m.direction, m.type, m.microcosm);
        });
    if(dynamics)
        dynamics.forEach((r) => {
            if(r)
                renderObject(r);
        });
    if(renderMicrocosms)
        renderMicrocosms.forEach((m) => {
            if(m)
                drawMicrocosmText(m.x, m.y, m.microcosm);
        });
    if(statics)
        statics.forEach((r) => {
            if(r)
                renderObject(r);
        });
    if(textElements){
        textElements.forEach((t)=>{
            renderText(t);
        });
    }
    let t1 = performance.now();
    attempts ++;
    time += t1 - t0;
}

function renderObject(r){
    let t = r.t;
    let img = images[t];
    if(!img) {
        img = document.getElementById(t);
        images[t] = img;
    }
    let xx = Math.round(r.x - x + canvas.width / 2);
    let yy = Math.round(r.y - y + canvas.height / 2);
    if(xx >= -200 && xx <= canvas.width + 200 && yy >= -200 && yy <= canvas.height + 200) {
        const s = Math.max(img.width, img.height);
        drawRotated(xx - s / 2,yy - s / 2,img,r.r, img.width, img.height, t);
    }
}

function renderMicrocosm(x, y, direction, type, microcosm){
    Microcosm.renderStickTree(microcosm.stick,x,y,direction,dynamics,type);
}

function drawMicrocosmText(x,y,microcosm){
    renderText({x: x, y: y, z: microcosm.numSticks * 5 + 30, t: microcosm.name});
}

function drawBKG(context){
    context.clearRect(0,0,canvas.width, canvas.height);
    gridBKG = gridBKG || document.getElementById('gridsquare');
    gridBKG.width = 100;
    gridBKG.height = 100;
    context.fillStyle = context.createPattern(gridBKG, 'repeat');
    context.save();
    context.translate(-x,-y);
    context.fillRect(canvas.width / 2, canvas.height / 2, WIDTH, HEIGHT);
    context.restore();
}

function drawGUI(){
    guiCanvas.width = window.innerWidth;
    guiCanvas.height = window.innerHeight;
    const w = guiCanvas.width;
    guiContext.fillStyle = 'rgba(0,0,0,.5)';
    const boxHeight = 400;
    const boxWidth = 300;
    guiContext.clearRect(w - boxWidth, 0, boxWidth, boxHeight);
    guiContext.fillRect(w - boxWidth, 0, boxWidth, boxHeight);
    const lineHeight = boxHeight / 10.5;
    const margin = 10;
    if(scoreBoard)
        scoreBoard.forEach((s, i) => {
            const name = s.name;
            const score = s.score;
            guiContext.fillStyle = 'gold';
            guiContext.font = "bold 25px Arial";
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
        context.font = `bold ${textElement.z}px Work Sans`;
        context.fillText(textElement.t, xx, yy);
        context.fillStyle = 'black';
        context.lineWidth = Math.floor(Math.sqrt(textElement.z) - 4);
        context.strokeText(textElement.t, xx, yy)
    }
}
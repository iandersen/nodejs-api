// import ioClient from 'socket.io-client'
// let io = ioClient('http://localhost:8080');
import $ from 'jquery';
require('../sass/main.scss');
const Microcosm = require('../src/model/Microcosm');
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
let timer, timer2, interpolationTimer;
let buffer = [];
let BUFFER_SIZE = 6;
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
let extrapolations = 0;
let interpolations = 0;
let bufferFilled = false;

$('#startButton').click(start);
$( "body" ).keypress(function( event ) {
    if (event.which === 13) {
        start()
    }
});

function balanceBuffer(){
    const percentage = extrapolations/(interpolations+extrapolations);
    if(percentage < .10) {
        if (BUFFER_SIZE > 3)
            BUFFER_SIZE--;
    }else {
        BUFFER_SIZE++;
        bufferFilled = false;
    }
    interpolations = 0;
    extrapolations = 0;
    console.log('Client Buffer Size: ', BUFFER_SIZE);
}

function start(){
    const url = (window.location !== window.parent.location)
        ? document.referrer
        : document.location.href;
    console.log('Being accessed from ', url);
    $.post('https://htmlhigh5.com/remotePlay', {url: url, game: 'popsic.io'});
    let name = $('#nameField').val();
    $('#backgroundBox').hide();
    if(timer)
        clearInterval(timer);
    if(timer2)
        clearInterval(timer2);
    if(renderTimer)
        clearInterval(renderTimer);
    if(interpolationTimer)
        clearInterval(interpolationTimer);
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
        setTimeout(()=>{forceResize = true}, 500);
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
        onInfoPacketReceived();
    });
    socket.on('dead', (s)=>{
        $('#gameTitle').show();
        $('#startBox').show();
        socket.disconnect();
        lastRenderTime = -1;
        startTime = 0;
        timeSinceLastFrame = 0;
        if(interpolationTimer)
            clearInterval(interpolationTimer);
    });
    $('#gameTitle').hide();
    $('#startBox').hide();
    timer2 = window.setInterval(displayDrawTiming, 10000);
    renderTimer = window.setInterval(renderScreen, renderSpeed);
    interpolationTimer = window.setInterval(balanceBuffer, 3000);
}

function renderScreen(){
    if(startTime === 0 || performance.now() - startTime < DELAY_TIME)
        return;
    if(!bufferFilled && buffer.length < BUFFER_SIZE)
        return;
    if(buffer.length >= BUFFER_SIZE)
        bufferFilled = true;
    renderMicrocosms = [];
    textElements = [];
    if(buffer.length > BUFFER_SIZE){
        let nextFrame = buffer[1];
        if(timeSinceLastFrame > nextFrame.time) {
            timeSinceLastFrame %= nextFrame.time;
            buffer = buffer.slice(1, buffer.length);
        }
    }
    if(buffer.length > 1)
        updateMicrocosmPositions();
    draw();
}

function updateMicrocosmPositions(){
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
    let percentage = timeSinceLastFrame / nextFrame.time;
    if(percentage > 1 && buffer.length > 2){
        timeSinceLastFrame %= buffer[1].time;
        buffer = buffer.slice(1,buffer.length);
        frame = buffer[0];
        nextFrame = buffer[1];
        percentage = timeSinceLastFrame / nextFrame.time
    }
    if(percentage > 1)
        extrapolations++;
    else
        interpolations++;
    const currentPositions = frame.microcosmPositions;
    const futurePositions = nextFrame.microcosmPositions;
    for(let n = 0; n < currentPositions.length; n++){
        let currentPosition = currentPositions[n];
        let futurePosition = futurePositions[n];
        if(currentPosition && futurePosition){
            let myDirection = currentPosition.d;
            let nextDirection = futurePosition.d;
            let deltaDirection = nextDirection - myDirection;
            if(deltaDirection > Math.PI)
                deltaDirection = 2 * Math.PI - deltaDirection;
            if(deltaDirection < -Math.PI)
                deltaDirection = 2 * Math.PI + deltaDirection;
            const newDirection = deltaDirection * percentage + myDirection;
            const deltaX = futurePosition.x - currentPosition.x;
            const newX = currentPosition.x + percentage * deltaX;
            const deltaY = futurePosition.y - currentPosition.y;
            const newY = currentPosition.y + percentage * deltaY;
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
}

function onInfoPacketReceived(){
    if(mouseX !== lastMouseX || mouseY !== lastMouseY){
        lastMouseX = mouseX;
        lastMouseY = mouseY;
        const width = $(window).width();
        const height = $(window).height();
        socket.emit('m', {x: mouseX, y: mouseY, w: width, h: height});
    }
    socket.emit('r', {x: Math.round(x - canvas.width / 2), y: Math.round(y - canvas.height / 2), w: canvas.width, h: canvas.height});
}

function displayDrawTiming(){
    console.log('Time: ', time/attempts);
    console.log('attempts: ', attempts);
    attempts = 0;
    time = 0;
}

$( "html" ).mousemove(function( event ) {
    mouseX = event.pageX;
    mouseY = event.pageY;
});

const offScreenCanvas = document.createElement('canvas');
const offScreenContext = offScreenCanvas.getContext('2d');
function rotateAndCache(image, angle, w, h, key) {
    let size = Math.max(w, h);
    offScreenCanvas.width = size;
    offScreenCanvas.height = size;
    offScreenContext.translate(size/2, size/2);
    offScreenContext.rotate(angle);
    offScreenContext.drawImage(image, -w/2, -h/2, w, h);
    return offScreenCanvas;
}

function drawRotated(x, y, image, radians, width, height, key){
    const rotatedImage = rotateAndCache(image, radians, width, height, key);
    context.drawImage(rotatedImage, x, y);
}

window.onresize = (e)=>{forceResize = true};

let gridBKG;

function draw(){
    let t0 = performance.now();
    resizeCanvas();
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
            drawPlayerText(t);
        });
    }
    let t1 = performance.now();
    attempts++;
    time += t1 - t0;
}

function resizeCanvas(){
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
    drawPlayerText({x: x, y: y, size: microcosm.numSticks * 5 + 30, text: microcosm.name});
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
    drawScoreboard();
}

function drawScoreboard(){
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

function drawPlayerText(textElement){
    let textX = Math.round(textElement.x - x + canvas.width / 2);
    let textY = Math.round(textElement.y - y + canvas.height / 2);
    if(textX >= -200 && textX <= canvas.width + 200 && textY >= -200 && textY <= canvas.height + 200) {
        context.fillStyle = 'white';
        context.textAlign = 'center';
        context.textBaseline="middle";
        context.font = `bold ${textElement.size}px Work Sans`;
        context.fillText(textElement.text, textX, textY);
        context.fillStyle = 'black';
        context.lineWidth = Math.floor(Math.sqrt(textElement.size) - 4);
        context.strokeText(textElement.text, textX, textY)
    }
}
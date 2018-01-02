// import ioClient from 'socket.io-client'
// let io = ioClient('http://localhost:8080');
import $ from 'jquery';
require('../sass/main.scss');
const types = require('../rendering/types');
const Microcosm = require('../src/model/microcosm');
const Stick = require('../src/model/stick');
let images = {};

let socket, mouseX, mouseY, lastMouseX, lastMouseY, x, y, splinters, sticks, scoreBoard, bounds;
let statics = [];
let dynamics = [];
let microcosms = [];
let renderMicrocosms = [];
let pd = 0;
let ps = 0;
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
let socketSpeed = 1000/10;
let lastSocketTime = performance.now();
let lastRenderTime = performance.now();
const DELAY_TIME = 300;

$('#startButton').click(function(){
    let name = $('#nameField').val();
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
        //Added Microcosms
        if(r.aM)
            r.aM.forEach((m)=>{
                microcosms.push(m);
            });
        //Removed Microcosms
        if(r.rM)
            r.rM.forEach((m)=>{
                microcosms.forEach((n, i)=>{
                    if(n.i === m.i)
                        microcosms.splice(i, 1);
                });
            });
        //Added Sticks
        if(r.aT)
            r.aT.sort((a, b)=>{return a.i - b.i}).forEach((s)=>{
                const microcosmID = s.m;
                let microcosm = null;
                microcosms.forEach((m)=>{
                    if(m.i === microcosmID)
                        microcosm = m;
                });
                if(!microcosm)
                    console.log('ERROR! Microcosm with id: ', s.m + ' was not found!!! Trying to add a stick at position: ', s.i);
                else{
                    let i = s.i;
                    let stick = microcosm.s;
                    if(i % 2 === 1){//If it is a son
                        while(i > 1){
                            stick = stick.s;
                            i -= 2;
                        }
                        if(stick) {
                            stick.s = s;
                            s.parent = stick;
                        }else
                            console.log('STICK NOT FOUND! i: ' + s.i)
                    }else{//If it is a daughter
                        while(i > 0){
                            stick = stick.d;
                            i -= 2;
                        }
                        if(stick) {
                            stick.d = s;
                            s.parent = stick;
                        }
                        else
                            console.log('STICK NOT FOUND! i: ' + s.i)
                    }
                }
            });
        //Removed Sticks
        if(r.rT)
            r.rT.sort((a, b)=>{return b.i - a.i}).forEach((s)=>{
                const microcosmID = s.m;
                let microcosm = null;
                microcosms.forEach((m)=>{
                    if(m.i === microcosmID)
                        microcosm = m;
                });
                if(!microcosm)
                    console.log('ERROR! Microcosm with id: ', s.m + ' was not found!!! Trying to add a stick at position: ', s.i);
                else{
                    const sex = i % 2 === 1 ? 'male' : 'female';
                    let i = s.i - 2;
                    let parent = microcosm.s;
                    if(i % 2 === 1){//If it is a son
                        while(i > 1){
                            parent = parent.s;
                            i -= 2;
                        }
                    }else{//If it is a daughter
                        while(i > 0){
                            parent = parent.d;
                            i -= 2;
                        }
                    }
                    if(parent) {
                        if (sex === 'male')
                            parent.s = null;
                        else
                            parent.d = null;
                    }else{
                        console.log('Parent not found! i: ' + s.i);
                    }
                }
            });
        //Microcosm positions
        if(r.m)
            microcosms = r.m;
        //dynamics = r.d;
        buffer.push({time: performance.now(), microcosms: microcosms, pos: info.p});
        socketSpeed = performance.now() - lastSocketTime;
        lastSocketTime = performance.now();
        // const pos = info.p;
        // x = pos.x;
        // y = pos.y;
        // ps = pos.s;
        // pd = pos.d;
        bounds = info.p.b;
        main();
        if(timer)
            clearInterval(timer);
        timer = window.setInterval(extrapolatePositions, renderSpeed);
    });
    socket.on('dead', (s)=>{
        if(timer)
            clearInterval(timer);
        if(timer2)
            clearInterval(timer2);
        if(renderTimer)
            clearInterval(renderTimer);
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
    timer = window.setInterval(extrapolatePositions, renderSpeed);
    timer2 = window.setInterval(checkPercentage, 10000);
    renderTimer = window.setInterval(renderScreen, renderSpeed);
});

function renderScreen(){
    renderMicrocosms = [];
    textElements = [];
    renderSpeed = performance.now() - lastSocketTime;
    lastRenderTime = performance.now();
    if(buffer.length > BUFFER_SIZE)
        buffer = buffer.slice(-BUFFER_SIZE);
    if(buffer.length === BUFFER_SIZE) {
        const now = performance.now();
        for (let i = 0; i < buffer.length; i++) {
            const b = buffer[i];
            const t = b.time;
            if (now - t <= DELAY_TIME) {
                //console.log(i, now-t);
                const percentage = renderSpeed / 100;
                if(!buffer[i + 1] || !buffer[i+1].microcosms) {
                    b.microcosms.forEach((d) => {
                        d.x += Math.cos(d.d) * d.s * percentage;
                        d.y += Math.sin(d.d) * d.s * percentage;
                    });
                    renderMicrocosms = b.microcosms.map((d)=> {
                        return {x: d.x, y: d.y, r: d.r, s: d.s, t: d.t, d: d.d};
                    });
                    textElements = b.microcosms.map((t)=>{
                        return {x: t.x, y: t.y, t: t.n, z: t.st * 5 + 30, s: t.s, d: t.d};
                    });
                    const pos = b.pos;
                    pd = pos.d;
                    ps = pos.s;
                    x = pos.x;
                    y = pos.y;
                    x += Math.cos(pd) * ps;
                    y += Math.sin(pd) * ps;
                    x = Math.min(WIDTH, Math.max(x, 0));
                    y = Math.min(HEIGHT, Math.max(y, 0));
                }else{
                    const d = b.microcosms.sort((a,b)=>{return a.i - b.i});
                    const nd = buffer[i+1].microcosms.sort((a,b)=>{return a.i - b.i});
                    for(let n = 0; n < d.length; n++){
                        let r = d[n];
                        let nr = nd[n];
                        if(!nr || r.i !== nr.i)
                            renderMicrocosms[n] = r;
                        else {
                            let dR = nr.r - r.r;
                            if(dR > Math.PI){
                                dR = 2 * Math.PI - dR;
                            }
                            if(dR < -Math.PI){
                                dR = 2 * Math.PI + dR;
                            }
                            const newR = r.r + percentage * dR;
                            const dS = nr.s - r.s;
                            const newS = nr.s + percentage * dS;
                            const dX = nr.x - r.x;
                            const newX = nr.x + percentage * dX;
                            const dY = nr.y - r.y;
                            const newY = nr.y + percentage * dY;
                            renderMicrocosms[n] = {x: newX, y: newY, s: newS, r: newR, t: r.t, d: r.d};
                        }
                    }
                    // const t = b.textElements;
                    // const nt = buffer[i+1].textElements;
                    // for(let n = 0; n < t.length; n++){
                    //     let r = t[n];
                    //     let nr = nt[n];
                    //     if(!nr || r.i !== nr.i)
                    //         textElements[n] = r;
                    //     else {
                    //         const dR = nr.r - r.r;
                    //         const newR = r.r + percentage * dR;
                    //         const dS = nr.s - r.s;
                    //         const newS = nr.s + percentage * dS;
                    //         const dX = nr.x - r.x;
                    //         const newX = nr.x + percentage * dX;
                    //         const dY = nr.y - r.y;
                    //         const newY = nr.y + percentage * dY;
                    //         textElements[n] = {x: newX, y: newY, s: newS, r: newR, t: r.t, d: r.d, z: r.z};
                    //     }
                    // }
                    const pos = b.pos;
                    const nPos = buffer[i+1].pos;
                    const dX = nPos.x - pos.x;
                    const dY = nPos.y - pos.y;
                    x = pos.x;
                    y = pos.y;
                    x += percentage * dX;
                    y += percentage * dY;
                }
                break;
            }
        }
    }
    draw();
}

function extrapolatePositions(){
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
    x = Math.min(WIDTH, Math.max(x, 0));
    y = Math.min(HEIGHT, Math.max(y, 0));
    //draw();
}


function main(){
    lastMouseX = mouseX;
    lastMouseY = mouseY;
    const w = $(window).width();
    const h = $(window).height();
    socket.emit('m', {x: mouseX, y: mouseY, w: w, h: h});
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
                renderMicrocosm(m);
        });
    if(dynamics)
        dynamics.forEach((r) => {
            if(r)
                renderObject(r);
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

function renderMicrocosm(m){
    Microcosm.renderStickTree(m.s,m.x,m.y,m.d,dynamics,m.s,m.t,m.d);
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
        context.font = `bold ${textElement.z}px Work Sans`;
        context.fillText(textElement.t, xx, yy);
        context.fillStyle = 'black';
        context.strokeWidth = Math.floor(textElement.z / 10);
        context.strokeText(textElement.t, xx, yy)
    }
}
// import ioClient from 'socket.io-client'
// let io = ioClient('http://localhost:8080');
import $ from 'jquery';
require('../sass/main.scss');
const types = require('../rendering/types');
let images = {};

let socket, mouseX, mouseY, lastMouseX, lastMouseY, x, y, renderables;
let canvas = document.getElementById('gameCanvas');

$('#startButton').click(function(){
    let name = $('#nameField').val();
    socket = io.connect('', {query: 'name='+name});
    socket.on('position', (pos) => {
        x = pos.x;
        y = pos.y;
    });

    socket.on('renderables', (r)=>{
        renderables = r
    });
    $('#gameTitle').remove();
    $('#startBox').remove();
    let timer = window.setInterval(main, 1000/30);
});

function main(){
    draw();
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

function draw(){
    const context = canvas.getContext('2d');
    canvas.width = window.innerWidth * 2;
    canvas.height = window.innerHeight * 2;
    context.clearRect(0,0,canvas.width, canvas.height);
    context.fillStyle='#aaa';
    context.fillRect(0,0,canvas.width, canvas.height);
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
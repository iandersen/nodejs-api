// import ioClient from 'socket.io-client'
// let io = ioClient('http://localhost:8080');
import $ from 'jquery';
require('../sass/main.scss');


let socket, mouseX, mouseY, lastMouseX, lastMouseY;
let canvas = document.getElementById('gameCanvas');

$('#startButton').click(function(){
    let name = $('#nameField').val();
    socket = io.connect('', {query: 'name='+name});
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

function draw(){
    const context = canvas.getContext('2d');
    context.clearRect(0,0,canvas.width, canvas.height);
    context.fillStyle='#aaa';
    context.fillRect(0,0,canvas.width, canvas.height);
}
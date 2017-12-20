// import ioClient from 'socket.io-client'
// let io = ioClient('http://localhost:8080');
import $ from 'jquery';

$('#startButton').click(function(){
    console.log('Clicked');
    let name = $('#nameField').val();
    let socket = io.connect('', {query: 'name='+name});
    socket.emit('chat message', 'joined');
});

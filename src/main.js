const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const basicauth = require('basicauth-middleware');
const path = require('path');

app.get('/', function(req, res){
    res.sendFile(path.resolve('./views/index.html'));
});

app.get('/client', function(req, res){
    res.sendFile(path.resolve('./build/client.bundle.js'));
});

io.on('connection', function(socket){
    console.log('a user connected');

    socket.on('disconnect', function(){
        console.log('user disconnected');
    });
});

http.listen(8080, () => console.log('Listening on port 8080'));

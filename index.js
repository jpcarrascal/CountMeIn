const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const { AllRooms } = require("./scripts/server-functions.js");

var rooms = new AllRooms();
var seq = false;

app.get('/', (req, res) => {
    // req.query.seq
    page = '/index.html';
    res.sendFile(__dirname + page);
});

app.get('/sequencer', (req, res) => {
    page = '/seq.html';
    res.sendFile(__dirname + page);
});

app.get('/track', (req, res) => {
    page = '/seq.html';
    res.sendFile(__dirname + page);
});

app.use('/scripts', express.static(__dirname + '/scripts/'));
app.use('/css', express.static(__dirname + '/css/'));
app.use('/images', express.static(__dirname + '/images/'));
app.use('/sounds', express.static(__dirname + '/sounds/'));

io.on('connection', (socket) => {
    var seq = false;
    if(socket.handshake.headers.referer.includes("sequencer"))
        seq = true;
    var room = socket.handshake.query.room;
    var initials = socket.handshake.query.initials;
    socket.join(room);
    rooms.addRoom(room);
    if(!seq) {
        if(rooms.isReady(room)) {
            console.log(initials + " joined room " + room);
            var track = rooms.allocateAvailableTrack(room, socket.id);
            console.log(rooms.rooms[0])
            socket.broadcast.to(room).emit('track initials', { initials: initials, track:track });
            socket.on('disconnect', () => {
                var track2delete = rooms.getTrackNumber(room, socket.id);
                rooms.releaseTrack(room, socket.id);
                //io.to(socket.id).emit('exit session');
                io.to(room).emit('clear track', {track: track2delete});
                console.log(initials + ' disconnected, clearing track ' + track2delete);
            });
            io.to(socket.id).emit('create track', {track: track});
        } else {
            io.to(socket.id).emit('exit session', {reason: "Sequencer not online yet..."});
        }
    } else {
        console.log("Sequencer joined room " + room);
        rooms.setSeqID(room,socket.id);
        console.log(rooms.rooms[0])
        socket.on('disconnect', () => {
            console.log(initials + ' disconnected (sequencer). Clearing room...');
            socket.broadcast.to(room).emit('exit session',{reason: "Sequencer exited!"});
            rooms.clearRoom(room);
            console.log(rooms.rooms[0])
        });
    }
    socket.on('step value', (msg) => { // Send step values
        io.to(room).emit('step value', msg);
        console.log(msg);
    });

    socket.on('step tick', (msg) => { // Visual sync
        socket.broadcast.to(room).emit('step tick', msg);
    });

    socket.on('play', (msg) => {
        socket.broadcast.to(room).emit('play', msg);
        console.log("Playing...");
    });

    socket.on('stop', (msg) => {
        socket.broadcast.to(room).emit('stop', msg);
        console.log("Stopped.");
    });

});

var port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log('listening on *:' + port);
});
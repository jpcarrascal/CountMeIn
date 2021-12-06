const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

var tracks = ["","","","","","","",""];
var seq = false;
var seqID = "";
function allocateAvailableTrack(name) {
    for(var i=0; i<tracks.length; i++) {
        if(tracks[i] == "") {
            tracks[i] = name;
            return(i);
        }
    }
    return -1;
}

function releaseTrack(name) {
    for(var i=0; i<tracks.length; i++) {
        if(tracks[i] == name)
            tracks[i] = "";
    }
}

function getTrackNumber(name) {
    for(var i=0; i<tracks.length; i++) {
        if(tracks[i] == name) {
            return(i);
        }
    }
    return -1;
}

app.get('/', (req, res) => {
    if(req.query.seq == "sequencer") {
        page = '/index-seq.html';
        seq = true;
    }
    else {
        page = '/index.html'
        seq = false;
    }
    page = '/index.html';
    res.sendFile(__dirname + page);
});

app.use('/scripts', express.static(__dirname + '/scripts/'));
app.use('/css', express.static(__dirname + '/css/'));

io.on('connection', (socket) => {
    if(!seq) {
        console.log("Joined: " + socket.id);
        var track = allocateAvailableTrack(socket.id);
        socket.on('disconnect', () => {
            var track2del = getTrackNumber(socket.id);
            releaseTrack(socket.id);
            io.to(socket.id).emit('destroy track');
            io.emit('clear track', {track: track2del});
            console.log('user ' + socket.id + ' disconnected, clearing track ' + track2del);
            console.log("Seq id:" + seqID)
        });
        io.to(socket.id).emit('create track', {track: track});
    } else {
        console.log("Joined: " + socket.id + " (server)");
        seqID = socket.id;
        console.log("Sequencer, no track allocated: " + seqID)
    }

    socket.on('step value', (msg) => { // Update step values
        io.emit('step value', msg);
        console.log(msg);
    });

    socket.on('step tick', (msg) => {
        //if(msg.counter%4 == 0)
          //  console.log(">");
        //else
            //console.log(".");
        socket.broadcast.emit('step tick', msg);
    });

    socket.on('play', (msg) => {
        console.log(msg);
        //io.emit('play', msg);
        socket.broadcast.emit('play', msg);
        console.log("Playing...");
    });

    socket.on('stop', (msg) => {
        console.log("getting this..." + msg);
        //io.emit('stop', msg);
        socket.broadcast.emit('stop', msg);
        console.log("Stopped.");
    });

});

var port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log('listening on *:' + port);
});
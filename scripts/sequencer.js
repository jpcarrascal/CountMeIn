// Am I a sequencer?
var isSeq = location.pathname.includes("sequencer");
var initials = "";
var room = findGetParameter("room") || DEFAULT_ROOM;
var method;
if(isSeq) {
  var stepSequencer = new StepSequencer(NUM_TRACKS, NUM_STEPS, drumNotes);
  method = findGetParameter("method") || "random";
  initials = "SQ";
  var hideInfo = findGetParameter("hideinfo");
  if(!hideInfo) {
    document.getElementById("room-name").innerText = room;
    var info = document.getElementById("room-info");
    info.style.display = "flex";
    var closeInfo = document.getElementById("close-info");
    closeInfo.addEventListener("click", function() { info.style.display = "none"});
    var trackURL = document.location.origin + "/track?room="+room;
    var qrcode = 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data='+trackURL;
    document.getElementById("track-url").innerText = trackURL;
    document.getElementById("url-copy").innerText = trackURL;
    document.getElementById("qrcode").setAttribute("src",qrcode);
    document.getElementById("track-url").setAttribute("href",trackURL);
    document.getElementById("copy").addEventListener("click", function(e) {
      copyURL("url-copy");
      this.innerText = "COPIED!";
      p=setTimeout( function() { document.getElementById("copy").innerText = "COPY TO CLIPBOARD" }, 2000);
      console.log(p)
    });
  }
} else {
  console.log("not a sequencer...");
  initials = findGetParameter("initials") || "?";
}
var counting = false;

// Node stuff:
var socket = io("", {query:{initials:initials, room:room, sequencer:isSeq, method:method}});
var mySocketID;
socket.on("connect", () => {
  console.log("Connected, my socketid:" + socket.id);
  mySocketID = socket.id;
});

socket.on('play', function(msg) {
  //console.log("Remote play!" + msg.socketID);
});

socket.on('stop', function(msg) {
  //console.log("Remote stop!" + msg.socketID);
  updateCursor(-1, -1);
});

socket.on('step tick', function(msg) {
  updateCursor(msg.counter, msg.prev);
});

socket.on('step update', function(msg) {
  var stepID = "track"+msg.track+"-step"+msg.step;
  var step = document.getElementById(stepID);
  if(step) {
    var fader = document.getElementById(stepID+"fader");
    var kb = document.getElementById(stepID+"kb");
    var value = msg.value;
    var note = msg.note;
    step.setAttribute("value", value);
    step.setAttribute("note", note);
    step.style.backgroundColor = valueToBGColor(value);
    var swColor = step.firstChild.getAttribute("color");
    step.firstChild.style.backgroundColor = valueToSWColor(value, swColor);
    fader.value = value;
    if(value) kb.setNote(note);
    else kb.unsetNote();
    if(stepSequencer) {
      stepSequencer.tracks[msg.track].notes[msg.step].vel = value;
      stepSequencer.tracks[msg.track].notes[msg.step].note = note;
    }
  }
});

// UI stuff:
var matrix = document.getElementById("matrix");
createHeader(matrix);

if(isSeq) {

  socket.on('clear track', function(msg) {
    var trackName = document.getElementById("track"+msg.track+"-name");
    var track = document.getElementById("track"+msg.track);
    track.style.backgroundColor = EMPTY_COLOR;
    trackName.innerText = "---";
    if(msg.track > 7) {
      document.getElementById("track" + msg.track + "-name").style.color = "black";
      document.getElementById("track" + msg.track + "-icon").style.filter = "";
    }
  });

  socket.on('track joined', function(msg) {
    //console.log(msg.initials + " joined on track " + msg.track);
    socket.emit('track notes', { track: msg.track, socketid: msg.socketid, notes:stepSequencer.tracks[msg.track].notes } );
    var trackName = document.getElementById("track" + msg.track+"-name");
    var track = document.getElementById("track" + msg.track);
    trackName.innerText = msg.initials;
    track.style.backgroundColor = colors[msg.track];
    if(msg.track > 7) {
      document.getElementById("track" + msg.track + "-name").style.color = "white";
      document.getElementById("track" + msg.track + "-icon").style.filter = "invert(1)";
    }
    stepSequencer.setTrackInitials(msg.track, msg.initials);
    //clearTrack(msg.track);
  });

  document.addEventListener("keydown", event => {
    if (event.code == "Space") {
      event.preventDefault();
      e = new Event("click");
      if(playing)
        document.querySelector("#stop").dispatchEvent(e);
      else
        document.querySelector("#play").dispatchEvent(e);
    } else if (event.code == "Escape") {
      document.getElementById("room-info").style.display = "none";
    }
  });

  // tracks:
  for(var i=NUM_TRACKS-1; i>=0; i--) {
    var tr = createTrack(i);
    matrix.appendChild(tr);
  }

  // Seq stuff:
  var tempo = document.getElementById("tempo").value;
  var playing = false;
  var interval = 60000/(4*tempo);
  var timer;
  var counter = 0;
  var prev = 15;

  document.getElementById("tempo").addEventListener("change",function(e){
    this.setAttribute('value', this.value);
    tempo = this.value;
    interval = 60000/(4*tempo);
  });
}

function clearTrack(track) {
  stepSequencer.clearTrack(track);
  var trackClass = ".track"+track;
  var steps = document.querySelectorAll(trackClass);
  steps.forEach(step =>{
    step.setAttribute("value",0);
    step.style.backgroundColor = offColor;
    step.firstChild.style.backgroundColor = "transparent";
  });
}


function updateCursor(counter, prev) {
  if(counter >=0) {
    var stepPos = document.querySelectorAll(".step"+counter);
    var prevPos = document.querySelectorAll(".step"+prev);
    prevPos.forEach(step => {
      step.parentElement.classList.remove("cursor");
      step.style.backgroundColor = valueToBGColor(step.getAttribute("value"));
      step.style.borderRadius = "10%";
    });
    stepPos.forEach(step => {
      var c = parseInt(step.getAttribute("track"));
      if(c>7) c = 0;
      var hlColor = colors[c]
      step.parentElement.classList.add("cursor");
      if(step.getAttribute("value") > 0){
        step.style.backgroundColor = hlColor;
        step.style.borderRadius = "50%";
      }
    });
  } else {
    var all = document.querySelectorAll(".step");
    all.forEach(step => {
      step.parentElement.classList.remove("cursor");
      step.style.backgroundColor = valueToBGColor(step.getAttribute("value"));
      step.style.borderRadius = "10%";
    })
  }
}




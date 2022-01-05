const NUM_TRACKS = config.NUM_TRACKS;
const NUM_STEPS = config.NUM_STEPS;
const MAX_NUM_ROUNDS = config.MAX_NUM_ROUNDS;

const NOTE_ON = 0x90;
const NOTE_OFF = 0x80;
const NOTE_DURATION = 300;
const DEFAULT_ROOM = 999;
const EMPTY_COLOR = "#AAA"
const colors = ["cyan","chartreuse","dodgerblue","darkorchid","magenta","red","orange","gold","black","black","black"];
/*
36. Kick Drum
38. Snare Drum
39. Hand Clap
41. Floor Tom 2
42. Hi-Hat Closed
43. Floor Tom 1
45. Low Tom
46. Hi-Hat Open
49. Crash Cymbal
*/
const drumNotes = [36, 38, 39, 41, 43, 45, 42, 46];
const onColor = "rgb(128,128,128)";
const offColor = "white";
var mouseStepDownVal = 0;

function createHeader(table) {
  // Header
  var tr = document.createElement("tr");
  tr.classList.add("track-header-tr");
  var th = document.createElement("th");
  th.classList.add("name-header");
  tr.appendChild(th);
  th = document.createElement("th");
  th.classList.add("name-header");
  var text = document.createTextNode("☺");
  th.append(text);
  tr.appendChild(th);
  for(var j=0; j<NUM_STEPS; j++) {
    var th = document.createElement("th");
    th.classList.add("step-header");
    var text = document.createTextNode(j+1);
    th.append(text);
    tr.appendChild(th);
  }
  table.appendChild(tr);
}

function createTrack(i) {
  var tr = document.createElement("tr");
  var trackID = "track"+i;
  tr.setAttribute("id",trackID);
  tr.setAttribute("note",drumNotes[i]);
  tr.classList.add("track");
  if(i>7) tr.classList.add("synth-track");

  var td = document.createElement("td");
  var img = document.createElement("img");
  if(i>7) img.setAttribute("src","images/8.png");
  else img.setAttribute("src","images/"+i+".png");
  img.setAttribute("track",trackID);
  img.setAttribute("id",trackID+"-icon");
  img.classList.add("track-icon");
  img.addEventListener("click", showStepControls);
  td.appendChild(img);
  td.classList.add("track-icon-td");
  td.classList.add("track-meta");
  tr.appendChild(td);

  td = document.createElement("td");
  var text = document.createTextNode("---");
  td.classList.add("track-name-td");
  td.classList.add("track-meta");
  td.setAttribute("id",trackID+"-name");
  td.setAttribute("track",trackID);
  td.addEventListener("dblclick", clearSteps);
  td.append(text);
  tr.appendChild(td);
  for(var j=0; j<NUM_STEPS; j++) {
    var stepID = trackID+"-step"+j;
    var td = document.createElement("td");
    td.classList.add("step-td");
    var step = document.createElement("div");
    step.classList.add("step");
    step.classList.add("step"+j);
    step.classList.add(trackID);
    step.setAttribute("id",stepID);
    step.setAttribute("track",i);
    step.setAttribute("step",j);
    step.setAttribute("value","0");
    if(i<=7) step.setAttribute("note",drumNotes[i]);
    else step.setAttribute("note",0);
    step.addEventListener('mousedown', stepClick);
    step.addEventListener('mouseover', stepHover);
    var sw = document.createElement("div");
    sw.setAttribute("color",colors[i]);
    sw.classList.add("sw");
    step.appendChild(sw);
    td.appendChild(step);

    var keyboard = createKeyboard(i,j);
    td.appendChild(keyboard);
    var fader = createFader(i, j);
    td.appendChild(fader);      

    tr.appendChild(td);
  }
  return(tr);
}

function createKeyboard (i, j) {
  var trackID = "track"+i;
  var stepID = trackID+"-step"+j;
  //td.appendChild(document.createTextNode("Oct"));
  var keyboard = document.createElement("div");
  keyboard.setAttribute("track",trackID);
  keyboard.setAttribute("stepID",stepID);
  keyboard.classList.add("keyboard");
  keyboard.classList.add(trackID);
  keyboard.setAttribute("id",stepID+"kb");
  var oct = document.createElement("div");
  oct.classList.add("oct-controls");
  var plus = document.createElement("div");
  var minus = document.createElement("div");
  plus.classList.add("oct-button");
  minus.classList.add("oct-button");
  plus.appendChild(document.createTextNode("+"));
  minus.appendChild(document.createTextNode("-"));
  oct.appendChild(minus);
  oct.appendChild(plus);
  keyboard.appendChild(oct);
  var noteNumber;
  var octave = 3;
  for(var k=0; k<12; k++) {
    noteNumber = 12-k;
    var key = document.createElement("div");
    key.classList.add("key");
    key.classList.add(stepID);
    key.setAttribute("note",noteNumber);
    key.setAttribute("octave",octave);
    key.setAttribute("stepID",stepID);
    key.addEventListener("mousedown", keyClick);
    if([1,3,5,8,10].includes(k)) {
      key.classList.add("black-key");
    }
    keyboard.appendChild(key);
  }
  keyboard.setNote = function(note) {
    var children = this.children;
    for(var k=0; k<children.length; k++) {
      var childNote = parseInt(children[k].getAttribute("note"));
      var childOct = parseInt(children[k].getAttribute("octave"));
      if(childNote+12*childOct == note)
        children[k].classList.add("key-on");
      else
        children[k].classList.remove("key-on");
    }
  }
  return keyboard;
}

function keyClick(e) {
  var step = this.getAttribute("stepID");
  var stepElem = document.getElementById(step);
  var note = parseInt(this.getAttribute("note")) + (12 * this.getAttribute("octave"));
  updateStep(stepElem, note, 63);
}

function createFader(i, j) {
  var trackID = "track"+i;
  var stepID = trackID+"-step"+j;
  var fader = document.createElement("input");
  fader.classList.add("fader");
  fader.classList.add(trackID);
  fader.setAttribute("type","range");
  fader.setAttribute("min","0");
  fader.setAttribute("max","127");
  fader.setAttribute("value","0");
  fader.setAttribute("track",trackID);
  fader.setAttribute("stepID",stepID);
  fader.setAttribute("id",stepID+"fader");
  fader.addEventListener("mouseup",faderDrag);
  fader.addEventListener("touchend",faderDrag);
  fader.addEventListener("input",faderWhileDragging);
  fader.addEventListener("mousemove",faderHover);
  return fader;
}

function stepClick(e) {
  var value = this.getAttribute("value");
  if(value == 0) {
      value = 63;
  } else {
      value = 0;
  }
  updateStep(this, false, value);
  mouseStepDownVal = value;
}

function stepHover(e) {
  if(e.buttons == 1 || e.buttons == 3) {
    value = mouseStepDownVal;
    updateStep(this, false, value);
  }
}

function faderDrag(e) {
  //if(!counting) counting = true;
  var stepID = this.getAttribute("stepID");
  var value = parseInt(this.value);
  var stepElem = document.getElementById(stepID);
  updateStep(stepElem, false, value);
}

// From: https://stackoverflow.com/questions/62892560/change-the-value-of-input-range-when-hover-or-mousemove
var valueHover = 0;
function calcSliderPos(e) {
    return (e.offsetX / e.target.clientWidth) *  parseInt(e.target.getAttribute('max'),10);
}

function faderHover(e) {
  if(e.buttons == 1 || e.buttons == 3) {
    valueHover = Math.floor(calcSliderPos(e).toFixed(2));
    if(valueHover != this.value) {
      var step = document.getElementById(this.getAttribute("stepid"));
      updateStep(step, false, valueHover);
    }
  }
}

function faderWhileDragging(e) {
  var stepID = this.getAttribute("stepID");
  var value = parseInt(this.value);
  var stepElem = document.getElementById(stepID);
  var swColor = stepElem.firstChild.getAttribute("color");
  stepElem.firstChild.style.backgroundColor = valueToSWColor(value, swColor);
  stepElem.style.backgroundColor = valueToBGColor(value);
}

function updateStep(stepElem, note, value) {
  var oldValue = stepElem.getAttribute("value");
  var oldNote = stepElem.getAttribute("note");
  if(value != oldValue || ( note && note != oldNote) ) {
    if(!counting) counting = true;
    var track = stepElem.getAttribute("track");
    var fader = document.getElementById(stepElem.getAttribute("id") + "fader");
    var kb = document.getElementById(stepElem.getAttribute("id") + "kb");
    var step = stepElem.getAttribute("step");
    stepElem.setAttribute("value", value);
    if(note) {
      stepElem.setAttribute("note", note);
      kb.setNote(note);
    } else note = stepElem.getAttribute("note");
    fader.value = value;
    stepElem.style.backgroundColor = valueToBGColor(value);
    var swColor = stepElem.firstChild.getAttribute("color");
    stepElem.firstChild.style.backgroundColor = valueToSWColor(value, swColor);
    socket.emit('step update', { track: track, step: step, note: note, value: value, socketID: mySocketID } );
  }
}

function clearSteps(e) {
  var track = this.getAttribute("track");
  document.querySelectorAll(".step."+track).forEach(elem => {
    updateStep(elem, false, 0);
  });
}

function showStepControls(e) {
  var track = this.getAttribute("track");
  var isSynth = this.parentNode.parentNode.classList.contains("synth-track");
  var selector = ".fader."+track;
  if(isSynth) selector = ".keyboard."+track;
  document.querySelectorAll(selector).forEach(elem => {
    if(elem.style.display == "block")
      elem.style.display = "none";
    else
      elem.style.display = "block";
  });
}

function valueToBGColor(value) {
  var tmp = 255 - value*2;
  return "rgb("+[tmp,tmp,tmp].join(",")+")";
}

function valueToSWColor(value, c) {
  if(value == 0)
    return "transparent";
  else
    return c;
}

function pad(num) {
  num = num.toString();
  while (num.length < 2) num = "0" + num;
  return num;
}


function playNote (note, out) {
  out.send([NOTE_ON, note, 0x7f]);
  setTimeout(out.send([NOTE_OFF, note, 0x00]), NOTE_DURATION);
}


// Cookies, from: https://stackoverflow.com/questions/14573223/set-cookie-and-get-cookie-with-javascript
function setCookie(name, val, days) {
    var expires = "";
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days*24*60*60*1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (val || "")  + expires + "; path=/";
}
function getCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for(var i=0;i < ca.length;i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1,c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
    }
    return null;
}
function eraseCookie(name) {   
    document.cookie = name +'=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
}

// GET parameter access, from: https://stackoverflow.com/questions/5448545/how-to-retrieve-get-parameters-from-javascript

function findGetParameter(parameterName) {
  var result = null,
      tmp = [];
  location.search
      .substr(1)
      .split("&")
      .forEach(function (item) {
        tmp = item.split("=");
        if (tmp[0] === parameterName) result = decodeURIComponent(tmp[1]);
      });
  return result;
}

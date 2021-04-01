"use strict"

const PORT = process.env.PORT || 3000;
const fs = require('fs');
const express = require('express');
const gameModule = require('./lib/game.js');

const app = express(PORT);
const server = app.listen();

app.get('/data', function(req, res) {
  if(game == null)
    res.send('0/4');
  else
    res.send(game.getFullnessData());
});
app.use(express.static('public'));

console.clear();
console.log("running");

const socket = require('socket.io');
const io = socket(server);

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (token == '0000') {
    next();
  } else {
    const err = new Error("not authorized");
    next(err);
  }
});

io.sockets.on('connection', newConnection);

function newConnection(socket) {
  var freePlayerId = game.findFreePlayerId();

  if (freePlayerId == null) {
    socket.disconnect();
    return;
  }

  console.log('new player: ', freePlayerId);

  socket.emit('initGame', game.getInitData());

  socket.join('game');

  io.to('game').emit('createPlayer', freePlayerId, gameModule.player_template[freePlayerId]);

  game.addPlayer(freePlayerId, socket.id);

  socket.emit('assignPlayer', freePlayerId);

  socket.on('playerInput', data => {
    game.updateInput(data, socket.id);
  });

  socket.on('playerClicked', () => {
    game.playerClicked(socket.id);
  });

  socket.on('disconnect', () => {
    io.to('game').emit('removePlayer', freePlayerId);
    game.removePlayer(freePlayerId, socket.id);
    console.log('lost player: ', freePlayerId);
  });
}


const tickLengthMs = 1000 / 60;
var previousTick = Date.now();
var previousEmitTick = Date.now();
const emitTickLengthMs = 1000 / 60;

function gameLoop() {
  var now = Date.now()

  if (previousTick + tickLengthMs <= now) {
    var delta = (now - previousTick) / 1000;
    previousTick = now;

    game.update(delta);
    //console.log('update', delta);
  }

  if(previousEmitTick + emitTickLengthMs <= now){
    var delta = (now - previousEmitTick) / 1000;
    previousEmitTick = now;
    //console.log('emit', delta);
    const emitDataBase = game.getEmitData();
    emitDataBase.delta = delta;
    const emitData = formatGameStateEmitData(emitDataBase);
    io.to('game').emit('updateEntities', emitData);
    //console.log('delta', delta*1000, '(target: ' + tickLengthMs +' ms)');
  }



  setTimeout(gameLoop);
  /*if (Date.now() - previousTick < tickLengthMs - 16) {
    setTimeout(gameLoop);
  } else {
    setImmediate(gameLoop);
  }*/
}

function formatGameStateEmitData(data){
  const formattedData = {
    d: 20-data.delta*1000,
    p: []
  };
  //players positions
  for(let i = 0; i < data.players.length; i++){
    let arr = [
      data.players[i].id,
      Math.round(data.players[i].x),
      Math.round(data.players[i].y),
      Math.round(data.players[i].rotation*100)
    ];
    if(data.players[i].health != null){
      arr.push(data.players[i].health);
    }
    formattedData.p.push(arr);
  }
  //bullets to create
  if(data.bullets != null){
    formattedData.b = [];
    for(let i = 0; i < data.bullets.length; i++){
      formattedData.b.push([
        Math.round(data.bullets[i].px),
        Math.round(data.bullets[i].py),
        Math.round(data.bullets[i].vx),
        Math.round(data.bullets[i].vy)
      ]);
    }
  }
  //
  if(data.KD != null){
    formattedData.s = [];
    for(let i = 0; i < data.KD.length; i++){
      formattedData.s.push([
        data.KD[i].idK,
        data.KD[i].idD,
      ]);
    }
  }
  return formattedData;
}

function getUTF8Size( str ) {
  var sizeInBytes = str.split('')
    .map(function( ch ) {
      return ch.charCodeAt(0);
    }).map(function( uchar ) {
      // The reason for this is explained later in
      // the section “An Aside on Text Encodings”
      return uchar < 128 ? 1 : 2;
    }).reduce(function( curr, next ) {
      return curr + next;
    });

  return sizeInBytes;
};

let rawdata = fs.readFileSync('maps/map_0.json');
let obj = JSON.parse(rawdata);

const game = new gameModule.Game(obj);

gameLoop();
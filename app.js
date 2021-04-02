"use strict"
const PORT = process.env.PORT || 3000;
const fs = require('fs');
const express = require('express');
const app = express();
const server = app.listen(PORT);
const socket = require('socket.io');
const io = socket(server);

const gameModule = require('./lib/game.js');

class Room{
  constructor(id, name, game, maxPlayers, token){
    this.id = id;
    this.name = name;
    this.game = game;
    this.maxPlayers = maxPlayers;
    this.token = token;
    this.sockets = [];
  }

  update(delta){
    this.game.update(delta);
    const emitDataBase = this.game.getEmitData();
    emitDataBase.delta = delta;
    let ms = '' + Date.now();
    emitDataBase.time = ms.substring(ms.length-3, ms.length);

    const emitData = this.formatGameStateEmitData(emitDataBase);
    io.to(this.name).emit('updateEntities', emitData);
  }

  getData(){
    return {id: this.id, fullness: this.game.getFullnessData()};
  }

  formatGameStateEmitData(data) {
    const formattedData = {
      d: 20 - data.delta * 1000,
      t: data.time,
      p: []
    };
    //players positions
    for (let i = 0; i < data.players.length; i++) {
      let arr = [
        data.players[i].id,
        Math.round(data.players[i].x),
        Math.round(data.players[i].y),
        Math.round(data.players[i].rotation * 100)
      ];
      if (data.players[i].health != null) {
        arr.push(data.players[i].health);
      }
      formattedData.p.push(arr);
    }
    //bullets to create
    if (data.bullets != null) {
      formattedData.b = [];
      for (let i = 0; i < data.bullets.length; i++) {
        formattedData.b.push([
          Math.round(data.bullets[i].px),
          Math.round(data.bullets[i].py),
          Math.round(data.bullets[i].vx),
          Math.round(data.bullets[i].vy)
        ]);
      }
    }
    //
    if (data.KD != null) {
      formattedData.s = [];
      for (let i = 0; i < data.KD.length; i++) {
        formattedData.s.push([
          data.KD[i].idK,
          data.KD[i].idD,
        ]);
      }
    }
    return formattedData;
  }

  joinRequest(socket){
    var freePlayerId = this.game.findFreePlayerId();
    var playerData = {
      nick: (socket.handshake.auth.nick == '' ? socket.id.substring(0, 5) : socket.handshake.auth.nick),
      color: socket.handshake.auth.color
    }

    if (freePlayerId == null) {
      socket.disconnect();
      return;
    }

    //this.sockets.push(socket);

    //socket.join(this.name);
    socket.join(this.name);

    console.log('new player: ', freePlayerId);

    socket.emit('initGame', this.game.getInitData());

    this.game.addPlayer(freePlayerId, socket.id, playerData);

    io.to(this.name).emit('createPlayer', freePlayerId,{
       x : this.game.players[freePlayerId].pos.x, 
       y : this.game.players[freePlayerId].pos.y, 
       color: playerData.color, 
       nick: playerData.nick
    });

    socket.emit('assignPlayer', freePlayerId);

    socket.on('playerInput', data => {
      this.game.updateInput(data, socket.id);
    });

  socket.on('playerClicked', () => {
    this.game.playerClicked(socket.id);
  });

  socket.on('disconnect', () => {
    io.to(this.name).emit('removePlayer', freePlayerId);
    this.game.removePlayer(freePlayerId, socket.id);
    console.log('lost player: ', freePlayerId);
  });

  }
}

class RoomsManager{
  constructor(){
    let rawdata = fs.readFileSync('maps/map_0.json');
    let mapObj = JSON.parse(rawdata);

    this.rooms = new Array();
    this.rooms.push(new Room(1, 'game1', new gameModule.Game(mapObj), 4, '0000'));
    //this.rooms.push(new Room(2, 'game2', new gameModule.Game(mapObj), 4, '0000'));
  }

  update(delta){
    for(let i = 0; i < this.rooms.length; i++){
      this.rooms[i].update(delta);
    }
  }

  getRoomsData(){
    const data = { rooms: [] };
    for(let i = 0; i < this.rooms.length; i++){
      data.rooms.push(this.rooms[i].getData());
    }
    return data;
  }

  joinRequest(socket){
    const data = socket.handshake.auth;//token, room, nick
    for(let i = 0; i < this.rooms.length; i++){
      if(data.room == this.rooms[i].id){
        this.rooms[i].joinRequest(socket);
        return;
      }
    }
    socket.disconnect();//did not found room
  }
}

const roomsManger = new RoomsManager();

console.clear();
console.log("running on port", PORT);

app.get('/data', function (req, res) {
  console.log('room data request');
  if (roomsManger != null) {
    res.send(roomsManger.getRoomsData());
  }
});

app.use(express.static('public'));

io.use((socket, next) => {
  next();
  //next(new Error("not authorized"));
});

io.sockets.on('connection', (socket) => {
  roomsManger.joinRequest(socket);
});


const tickLengthMs = 1000 / 60;
var previousTick = Date.now();

function gameLoop() {
  var now = Date.now()

  if (previousTick + tickLengthMs <= now) {

    var delta = (now - previousTick) / 1000;
    previousTick = now;

    roomsManger.update(delta);
  }

  setTimeout(gameLoop);
  /*if (Date.now() - previousTick < tickLengthMs - 16) {
    setTimeout(gameLoop);
  } else {
    setImmediate(gameLoop);
  }*/
}

gameLoop();

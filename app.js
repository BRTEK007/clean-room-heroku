"use strict"
const PORT = process.env.PORT || 3000;
const express = require('express');
const fs = require('fs');
const app = express();
const server = app.listen(PORT);
const socket = require('socket.io');
const io = socket(server);
//const os = require('os-utils');

/*os.cpuUsage(function(v){
	console.log( 'CPU Usage (%): ' + v );
});*/

const Game = require('./lib/Game.js');
const formatModule = require('./lib/format.js');

const tickLengthMs = 1000 / 60;
var previousTick = Date.now();

console.clear();
console.log("running on port", PORT);

class Room{
  constructor(_id, _name, _maxPlayerCount, _token, _mapObj){
    this.id = _id;
    this.name = _name;
    this.game = new Game(_mapObj);
    this.maxPlayerCount = _maxPlayerCount;
    this.playerCount = 0;
    this.token = _token;
    this.sockets = [];
  }

  update(delta){
    //dont update if no players
    this.game.update(delta);
    const emitDataBase = this.game.getEmitData();
    emitDataBase.delta = delta;
    let ms = '' + Date.now();
    emitDataBase.time = ms.substring(ms.length-3, ms.length);

    const emitData = formatModule.encode(emitDataBase);
    io.to(this.name).emit('updateEntities', emitData);
  }

  getData(){
    return {id: this.id, fullness: '' + this.playerCount + '/' + this.maxPlayerCount};
  }

  joinRequest(socket){
    //console.log(socket.handshake.address);
    if(this.playerCount >= this.maxPlayerCount){
      socket.disconnect();
      return;
    }
    this.playerCount++;
    
    var playerData = {
      nick: (socket.handshake.auth.nick == '' ? socket.id.substring(0, 5) : socket.handshake.auth.nick),
      color: socket.handshake.auth.color
    }

    let newPlayer = this.game.createNewPlayer(playerData);

    socket.send({a : 10});

    socket.join(this.name);

    console.log('new player: ', newPlayer.id);

    socket.emit('initGame', this.game.getInitData());

    io.to(this.name).emit('createPlayer', {
       id : newPlayer.id,
       x : newPlayer.transform.pos.x, 
       y : newPlayer.transform.pos.y, 
       color: playerData.color, 
       nick: playerData.nick
    });

    socket.emit('assignPlayer', newPlayer.id);

    socket.on('playerInput', data => {
      newPlayer.OnSocketInput(data);
    });

  socket.on('disconnect', () => {
    this.playerCount--;
    io.to(this.name).emit('removePlayer', newPlayer.id);
    this.game.removePlayer(newPlayer.id);
    console.log('lost player: ', newPlayer.id);
  });

  }
}

class RoomsManager{
  constructor(){
    let rawdata = fs.readFileSync('maps/map_0.json');
    let mapObj = JSON.parse(rawdata);

    this.rooms = new Array();
    this.rooms.push(new Room(1, 'game1', 5, '0000', mapObj));
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


function gameLoop() {
  var now = Date.now()

  if (previousTick + tickLengthMs <= now) {

    var delta = (now - previousTick) / 1000;
    previousTick = now;

    roomsManger.update(delta);
  }

  setTimeout(gameLoop);
  //setImmediate(gameLoop);
  /*if (Date.now() - previousTick < tickLengthMs - 16) {
    setTimeout(gameLoop);
  } else {
    setImmediate(gameLoop);
  }*/
}

gameLoop();

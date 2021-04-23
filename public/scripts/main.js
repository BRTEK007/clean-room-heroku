"use strict"
PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;
const TEXTURES = {
  health_bar: [PIXI.Texture.from('health_bar_3.png'), PIXI.Texture.from('health_bar_2.png'), PIXI.Texture.from('health_bar_1.png')]
};

var socket;
var t0, t1;
var resizeTimer;
var game;

const DOM = {
  fpsDiv : document.getElementById('fpsDiv'),
  pingDiv : document.getElementById('pingDiv'),
  fpsDiv2 : document.getElementById('fpsDiv2'),
  leaderboard : document.getElementById('leaderboard'),
  l_entry : [null, null, null, null]
}

function decToRGBColor(dec){
  let b = (dec % 256);
  dec = (dec-b)/256;
  //while(b.length < 2) b = '0' + b;
  let g = (dec%256);
  dec = (dec-g)/256;
  //while(g.length < 2) g = '0' + g;
  let r = dec;
  //while(r.length < 2) r = '0' + r;

  //return '#'+r+g+b;
  return `rgb(${r}, ${g}, ${b})`;
}

function CropDimensionsToRatio(ow, oh, rw, rh){
  var sw = Math.floor(ow/rw);
  var sh = Math.floor(oh/rh);
  if(sw < sh){
    return  {x : rw*sw, y : rh*sw};
  }
  return  {x : rw*sh, y : rh*sh};
}

function updateLeaderboard(data){
  console.log(data);
}

function addToLeaderBoard(id, nick, color){
  if(DOM.l_entry[id] != null) return;
  let leaderboard_entry = document.createElement('div');
  leaderboard_entry.classList.add('entry');
  leaderboard_entry.id = 'le' + id;
  leaderboard_entry.style.color = decToRGBColor(color);
  leaderboard_entry.innerHTML = `
  <div>${nick}</div>
  <div>${0}</div>
  `;
  DOM.leaderboard.appendChild(leaderboard_entry);
  DOM.l_entry[id] = leaderboard_entry;
}

function removeFromLeaderBoard(id){
  DOM.l_entry[id].remove();
  DOM.l_entry[id] = null;
}

function decodeGameStateData(data){
  const decodedData = {};
  decodedData.delta = (20-data.d)/1000;
  decodedData.time = data.t;
  decodedData.players = [];
  for(let i = 0; i < data.p.length; i++){
    let obj = {
      id : data.p[i][0],
      x : data.p[i][1],
      y : data.p[i][2],
      rotation : data.p[i][3]/100,
      shot : (data.p[i][4] == 1 ? true : false)
    };
    if(data.p[i][5] != null){
      obj.health = data.p[i][5];
    }
    decodedData.players.push(obj);
  }
  if(data.s != null){
    decodedData.KD = [];
    for(let i = 0; i < data.s.length; i++){
      decodedData.KD.push({
        idK : data.s[i][0],
        idD : data.s[i][1],
      });
    }
  }
  return decodedData;
}

function attemptConnection(data) {
  socket = io({
    reconnection : false,
    timeout: 2000,
    auth: data
  });

  socket.on('disconnect', () =>{
    console.log('disconnected');
    transitionToLobby();
  });

  socket.on("connect_error", (err) => {
    console.log(err.message);
    socket.disconnect();
    socket = null;
  });

  socket.on("connect", () => {
    console.log('connected');
    transitionToGame();
    connectedToServer();
  });
}

function transitionToGame(){
  document.getElementById('lobbyDiv').setAttribute('visible', "false");
  document.getElementById('gameDiv').setAttribute('visible', "true");
  window.addEventListener('resize', windowResize);
  t0 = performance.now();
  t1 = performance.now();
  window.requestAnimationFrame(frame);
}

function transitionToLobby(){
    //alert('Bro, you were disconnected from the server!');
    //location.reload();
    //return;
    game.terminate();
    game = null;
    socket = null;
    document.getElementById('lobbyDiv').setAttribute('visible', "true");
    document.getElementById('gameDiv').setAttribute('visible', "false");
    window.removeEventListener('resize', windowResize);
}

function windowResize(){
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(()=>{
    console.log('resize');
    game.resizeRequest();
  }, 500);
}

function connectedToServer() {

  socket.on('initGame', (data) => {
   for(let i = 0; i < data.players.length; i++){
     addToLeaderBoard(data.players[i].id, data.players[i].nick, data.players[i].color);
   }
   game = new Game(data);
  });

  socket.on('message', (msg) => {
    console.log(msg);
  });

  socket.on('assignPlayer', (id) => {
    //console.log('assigned', id);
    game.assignPlayerById(id);
  });

  socket.on('createPlayer', (id, data) => {
    addToLeaderBoard(id, data.nick, data.color);
    game.createPlayer(id, data);
  });

  socket.on('removePlayer', (id) => {
    removeFromLeaderBoard(id);
    game.removePlayer(id);
  });

  socket.on('updateEntities', (data) => {
    const decodedData = decodeGameStateData(data);

    if(decodedData.KD != null)  updateLeaderboard(decodedData.KD);

    game.updateServer(decodedData);

    let ms = '' + Date.now();
    let myTime = ms.substring(ms.length-3, ms.length);

    DOM.pingDiv.innerHTML = 'ping: ' + ( parseInt(myTime) - parseInt(decodedData.time))+ 'ms';

    DOM.fpsDiv2.innerHTML = 'FPS(s): ' + Math.round(1/decodedData.delta);
  });
}

function frame() {
  window.requestAnimationFrame(frame);
  t0 = performance.now();
  var delta = (t0 - t1) / 1000;

  if (game) {
    let inputData = game.getInputData();

    if (inputData != null) {
      socket.emit('playerInput', inputData);
    }

    game.update(delta);
  }

  DOM.fpsDiv.innerHTML = 'FPS(c): ' + Math.round(1/delta);

  t1 = performance.now();
}

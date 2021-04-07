"use strict"
PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;
const TEXTURES = {
  health_bar: [PIXI.Texture.from('health_bar_3.png'), PIXI.Texture.from('health_bar_2.png'), PIXI.Texture.from('health_bar_1.png')]
};

var socket;
var t0, t1;

const DOM = {
  fpsDiv : document.getElementById('fpsDiv'),
  pingDiv : document.getElementById('pingDiv'),
  fpsDiv2 : document.getElementById('fpsDiv2'),
  leaderboard : document.getElementById('leaderboard')
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

function addToLeaderBoard(id, data){
  let leaderboard_entry = document.createElement('div');
  leaderboard_entry.classList.add('entry');
  //leaderboard_entry.setAttribute('playerId', id);
  leaderboard_entry.style.color = decToRGBColor(data.color);
  leaderboard_entry.innerHTML = `
  <div>${data.nick}</div>
  <div>0</div>
  `;
  DOM.leaderboard.appendChild(leaderboard_entry);
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
    auth: data
  });

  socket.on("connect_error", (err) => {
    console.log(err.message);
  });

  socket.on("connect", () => {
    console.log('connected');
    try{
      document.getElementById('lobbyDiv').style.display = 'none';
      document.getElementById('gameDiv').style.display = 'block';
    }catch{

    }
    connectedToServer();
  });
}

function connectedToServer() {

  window.addEventListener('keydown', e => {
    InputManager.keyPressed(e.code);
  });

  window.addEventListener('keyup', e => {
    InputManager.keyReleased(e.code);
  });

  socket.on('initGame', (data) => {/*console.log('initialized: ', data);*/ Game.init(data);});

  socket.on('assignPlayer', (id) => {
    //console.log('assigned', id);
    InputManager.assignPlayerId(id);
  });

  socket.on('createPlayer', (id, data) => {
    addToLeaderBoard(id, data);
    Game.createPlayer(id, data);
  });

  socket.on('removePlayer', (id) => {
    Game.removePlayer(id);
  });

  socket.on('updateEntities', (data) => {
    const decodedData = decodeGameStateData(data);

    if(decodedData.KD != null)  updateLeaderboard(decodedData.KD);

    Game.updateServer(decodedData);

    let ms = '' + Date.now();
    let myTime = ms.substring(ms.length-3, ms.length);

    DOM.pingDiv.innerHTML = 'ping: ' + ( parseInt(myTime) - parseInt(decodedData.time))+ 'ms';

    DOM.fpsDiv2.innerHTML = 'FPS(s): ' + Math.round(1/decodedData.delta);
  });

  t0 = performance.now();
  t1 = performance.now();
  window.requestAnimationFrame(frame);
}

function frame() {
  window.requestAnimationFrame(frame);
  t0 = performance.now();
  var delta = (t0 - t1) / 1000;

  if (Game.initialized) {
    let inputData = InputManager.getInputData();
    if (inputData != null) {
      socket.emit('playerInput', inputData);
    }

    Game.update(delta);
  }

  DOM.fpsDiv.innerHTML = 'FPS(c): ' + Math.round(1/delta);

  t1 = performance.now();
}

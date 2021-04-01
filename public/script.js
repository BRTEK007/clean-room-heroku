"use strict"
PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;
const TEXTURES = {
  health_bar: [PIXI.Texture.from('health_bar_3.png'), PIXI.Texture.from('health_bar_2.png'), PIXI.Texture.from('health_bar_1.png')]
};

var socket;
var t0, t1;

const InputManager = {
  lastSentInput: {
    x: 0,
    y: 0,
    rotation: 0,
    mx: 0,
    my: 0,
    mouseDown: false
  },
  currentInput: {
    x: 0,
    y: 0,
    mx: 0,
    my: 0,
    rotation: 0,
    mouseDown: false
  },
  playerId: null,

  getInputData: function() {
    if (this.playerId == null || Game.players[this.playerId].dead) return null;

    let mousePos = Game.app.renderer.plugins.interaction.mouse.global;
    this.currentInput.mx = Math.round(mousePos.x);
    this.currentInput.my = Math.round(mousePos.y);

    let inputToSend = {};
    let inputEmpty = true;

    if (this.lastSentInput.x != this.currentInput.x) {
      inputToSend.x = this.currentInput.x;
      this.lastSentInput.x = this.currentInput.x;
      inputEmpty = false;
    }

    if (this.lastSentInput.y != this.currentInput.y) {
      inputToSend.y = this.currentInput.y;
      this.lastSentInput.y = this.currentInput.y;
      inputEmpty = false;
    }

    if (Math.sqrt(Math.pow(this.lastSentInput.mx - this.currentInput.mx, 2) + Math.pow(this.lastSentInput.my - this.currentInput.my, 2)) > 30 &&
      this.currentInput.mx >= 0 && this.currentInput.mx <  Game.map.width && this.currentInput.my >= 0 && this.currentInput.my < Game.map.height) {
      inputToSend.mousePos = this.currentInput.my * Game.map.width + this.currentInput.mx;
      this.lastSentInput.mx = this.currentInput.mx;
      this.lastSentInput.my = this.currentInput.my;
      inputEmpty = false;
    }

    if (this.lastSentInput.mouseDown != this.currentInput.mouseDown) {
      inputToSend.mouseDown = this.currentInput.mouseDown;
      this.lastSentInput.mouseDown = this.currentInput.mouseDown;
      inputEmpty = false;
    }

    return inputEmpty ? null : inputToSend;

  },

  assignPlayerId: function(id) {
    this.playerId = id;
  },

  keyPressed: function(key) {
    switch (key) {
      case 'ArrowRight':
      case 'KeyD':
        this.currentInput.x = 1;
        break;
      case 'ArrowLeft':
      case 'KeyA':
        this.currentInput.x = -1;
        break;
      case 'ArrowUp':
      case 'KeyW':
        this.currentInput.y = -1;
        break;
      case 'ArrowDown':
      case 'KeyS':
        this.currentInput.y = 1;
        break;

    }
  },

  keyReleased: function(key) {
    switch (key) {
      case 'ArrowRight': case 'KeyD':
        this.currentInput.x = 0;
        break;
      case 'ArrowLeft': case 'KeyA':
        this.currentInput.x = 0;
        break;
      case 'ArrowUp': case 'KeyW':
        this.currentInput.y = 0;
        break;
      case 'ArrowDown': case 'KeyS':
        this.currentInput.y = 0;
        break;
    }
  },

  mouseDownTrigger: function(m) {
    this.currentInput.mouseDown = m;
  }

}

const Game = {

  initialized: false,

  init: function(data) {
    this.map = data.map;

    this.players = [null, null, null, null];

    this.playersKD = [
      {kills : 0, deaths: 0},
      {kills : 0, deaths: 0},
      {kills : 0, deaths: 0},
      {kills : 0, deaths: 0}
    ];

    this.bullets = [];

    this.app = new PIXI.Application({
      width: this.map.width,
      height: this.map.height,
      backgroundColor: 0x101010,
      resolution: window.devicePixelRatio || 1,
    });

    document.getElementById('gameDiv').appendChild(this.app.view);

    this.app.view.addEventListener('mousedown', () => {
      InputManager.mouseDownTrigger(true);
    });

    this.app.view.addEventListener('mouseup', () => {
      InputManager.mouseDownTrigger(false);
    });

    this.initialized = true;

    //add players
    for(let i = 0; i < data.players.length; i++){
      this.createPlayer(data.players[i].id, data.players[i].template);
    }

    //add rects
    this.rects = [];
    for(let i = 0; i < data.map.rects.length; i++){
      const lr = data.map.rects[i];
      this.addRect(lr.x, lr.y, lr.w, lr.h, lr.r);
      this.rects.push(lr);
    }

  },

  addRect: function(x,y,w,h,r){
    const graphic = new PIXI.Graphics();
    graphic.x = x;
    graphic.y = y;
    //left bottom circle
    graphic.beginFill(0xEEEEEE);
    graphic.drawCircle(r, h-r, r);
    //graphic.endFill();
    //right bottom circle
    //graphic.beginFill(0xFF00FF);
    graphic.drawCircle(w-r, h-r, r);
    //graphic.endFill();
    //left top circle
    //graphic.beginFill(0xFF00FF);
    graphic.drawCircle(r, r, r);
    //graphic.endFill();
    //right top circle
    //graphic.beginFill(0xFF00FF);
    graphic.drawCircle(w-r, r, r);
    //graphic.endFill();
    //line top
    //graphic.lineStyle(1, 0xffffff).moveTo(r, 0).lineTo(w-r, 0);
    //line bottom
    //graphic.lineStyle(1, 0xffffff).moveTo(r,  h).lineTo(w-r, h);
    //line left
    //graphic.lineStyle(1, 0xffffff).moveTo(0, r).lineTo(0, h-r);
    //line right
    //graphic.lineStyle(1, 0xffffff).moveTo(w, r).lineTo( w, h-r);
    //graphic.beginFill(0xFF00FF);
    graphic.drawRect(r,0,w-r*2,h);
    graphic.drawRect(0,r,w,h-r*2);
    graphic.endFill();

    this.app.stage.addChild(graphic);
  },

  update: function(delta) {

    //update players
    for (let i = 0; i < this.players.length; i++) {
      if(this.players[i] != null && !this.players[i].isDead)
      this.players[i].updateTransform(delta);
    }

    //update bullets
    for (let i = 0; i < this.bullets.length; i++) {
      //remove dead bullets
      if (this.bullets[i].isDead) {
        this.bullets[i].destroy(this.app);
        this.bullets.splice(i, 1);
        continue;
      }

      this.bullets[i].update(delta);

      if (this.isBulletOut(this.bullets[i])) {this.bullets[i].isDead = true; continue;}

      //bullets player collision
      for (let j = 0; j < this.players.length; j++) {
        if (this.players[j] == null || this.bullets[i].id == j || this.players[j].dead) continue;
        if (this.doesBulletPlayerOverlap(this.bullets[i], this.players[j])) { this.bullets[i].isDead = true; continue;}
      }

      //bullets level collisions
      for(let j = 0; j < this.rects.length; j++){
        this.resolveBulletRectCollision(this.bullets[i], this.rects[j]);
        if(this.bullets[i].isDead) continue;
      }

    }


  },

  createPlayer: function(id, data) {
    this.players[id] = new Player(data, this.app);
  },

  removePlayer: function(id) {
    this.players[id].destroy();
    this.players[id] = null;
  },

  updateServer: function(data) {
    //kill and deaths
    if(data.KD.length > 0){
      for(let i = 0; i < data.KD.length; i++){
        this.playersKD[data.KD[i].idK].kills++;
        this.playersKD[data.KD[i].idD].deaths++;
      }
      updateLeaderboard();
    }
    //create bullets
    for (let i = 0; i < data.bullets.length; i++) {
        let id = data.bullets[i].id;
        let x = data.bullets[i].px;
        let y = data.bullets[i].py;
        let vx = data.bullets[i].vx;
        let vy = data.bullets[i].vy;
        let newBullet = new Bullet(id, x, y, vx, vy, this.app);
        this.bullets.push(newBullet);
      }

    //update players server data
    for (let i = 0; i < data.players.length; i++) {
      this.players[i].updateDesiredPos(data.players[i], data.delta);
      if (data.players[i].health != null) {
        this.players[i].updateHealth(data.players[i].health);
      }
    }



  },

  resolveBulletRectCollision(bullet, rect) {
    if (bullet.pos.x + bullet.radius >= rect.x &&
      bullet.pos.x - bullet.radius <= rect.x + rect.w &&
      bullet.pos.y + bullet.radius >= rect.y &&
      bullet.pos.y - bullet.radius <= rect.y + rect.h) {
      bullet.isDead = true;
    }
  },

  isBulletOut: function(bullet) {
    return bullet.pos.x - bullet.radius < 0 ||
      bullet.pos.x + bullet.radius >= this.map.width ||
      bullet.pos.y - bullet.radius < 0 ||
      bullet.pos.y + bullet.radius >= this.map.height;
  },

  doesBulletPlayerOverlap: function(bullet, player) {
    let x1 = bullet.pos.x;
    let y1 = bullet.pos.y;

    let x2 = player.pos.x;
    let y2 = player.pos.y;

    let r1 = player.radius;
    let r2 = bullet.radius;

    return Math.abs((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2)) <= (r1 + r2) * (r1 + r2);
  }
}

function updateLeaderboard(){
  console.log(Game.playersKD);
}

function encodeGameStateData(data){
  const encodedData = {};
  encodedData.delta = (20-data.d)/1000;
  encodedData.players = [];
  for(let i = 0; i < data.p.length; i++){
    let obj = {
      id : data.p[i][0],
      x : data.p[i][1],
      y : data.p[i][2],
      rotation : data.p[i][3]/100
    };
    if(data.p[i][4] != null){
      obj.health = data.p[i][4];
    }
    encodedData.players.push(obj);
  }
  encodedData.bullets = [];
  if(data.b != null){
    for(let i = 0; i < data.b.length; i++){
      encodedData.bullets.push({
        px : data.b[i][0],
        py : data.b[i][1],
        vx : data.b[i][2],
        vy : data.b[i][3],
      });
    }
  }
  encodedData.KD = [];
  if(data.s != null){
    for(let i = 0; i < data.s.length; i++){
      encodedData.KD.push({
        idK : data.s[i][0],
        idD : data.s[i][1],
      });
    }
  }
  return encodedData;
}

//attemptConnection('0000');

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
    document.body.removeChild(document.getElementById('codeDiv'));
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

  socket.on('initGame', (data) => {Game.init(data);});

  socket.on('assignPlayer', (id) => {
    InputManager.assignPlayerId(id);
  });

  socket.on('createPlayer', (id, data) => {
    Game.createPlayer(id, data);
  });

  socket.on('removePlayer', (id) => {
    Game.removePlayer(id);
  });

  socket.on('updateEntities', (data) => {
    //console.log(data);
    const encodedData = encodeGameStateData(data);
    //console.log(encodedData);
    Game.updateServer(encodedData);
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

  t1 = performance.now();
}

class Player {
  constructor(data, app) {
    this.pos = {
      x: data.x,
      y: data.y
    };
    this.rotation = 0;
    this.radius = 25;
    this.health = 3;
    this.dead = false;
    this.serverTransform = {
      x: data.x,
      y: data.y,
      rotation: 0,
      delta: Infinity
    };

    //visuals
    this.app = app;
    this.graphic = new PIXI.Graphics();
    //gun
    this.graphic.beginFill(0xDDDDDD);
    this.graphic.drawRect(-10, -40, 20, 25);
    this.graphic.endFill();
    //body
    this.graphic.beginFill(data.color);//data.color
    this.graphic.drawCircle(0, 0, 25);
    this.graphic.endFill();
    this.graphic.x = data.x;
    this.graphic.y = data.y;
    app.stage.addChild(this.graphic);
    //health_bar
    this.health_bar = new PIXI.Sprite(TEXTURES.health_bar[0]);
    this.health_bar.scale.set(3);
    this.health_bar.anchor.x = 0.5;
    this.health_bar.anchor.y = -1.5;
    this.health_bar.x = data.x;
    this.health_bar.y = data.y;
    this.app.stage.addChild(this.health_bar);
    this.lastServerDelta;
  }

  updateHealth(h) {
    if (h <= 0) {
      this.dead = true;
      this.destroy();
      return;
    } else if (h >= 3) {
      this.dead = false;
      this.respawn();
    }
    this.health = h;
    this.health_bar.texture = TEXTURES.health_bar[3 - this.health];
  }

  respawn() {
    this.app.stage.addChild(this.graphic);
    this.app.stage.addChild(this.health_bar);
  }

  destroy() {
    this.app.stage.removeChild(this.graphic);
    this.app.stage.removeChild(this.health_bar);
  }

  updateTransform(delta) {
    this.pos.x = this.lerp(this.pos.x, this.serverTransform.x, delta/this.serverTransform.delta);
    this.pos.y = this.lerp(this.pos.y, this.serverTransform.y, delta/this.serverTransform.delta);
    this.rotation = this.circularLerp(this.rotation, this.serverTransform.rotation, delta/this.serverTransform.delta);

    this.graphic.x = this.pos.x;
    this.graphic.y = this.pos.y;
    this.graphic.rotation = this.rotation;

    this.health_bar.x = this.pos.x;
    this.health_bar.y = this.pos.y;
    this.health_bar.rotation = this.rotation;
  }

  lerp(start, end, time){return start * (1-time) + end * time;}

  circularLerp(start, end, time){
    if(Math.abs(start - end) > Math.abs(start - (end - Math.PI*2) )) end = end - Math.PI*2;
    else if(Math.abs(start - end) > Math.abs(start - (end + Math.PI*2) )) end = end + Math.PI*2;
    return start * (1-time) + end * time;
  }

  updateDesiredPos(data, delta){
    this.serverTransform.x = data.x;
    this.serverTransform.y = data.y;
    this.serverTransform.rotation = data.rotation;
    this.serverTransform.delta = delta;
  }


}

class Bullet {
  constructor(id, px, py, vx, vy, app) {
    this.id = id;
    this.pos = {
      x: px,
      y: py
    };
    this.vel = {
      x: vx,
      y: vy
    };
    this.radius = 10;
    this.idDead = false;

    this.graphic = new PIXI.Graphics();
    this.graphic.beginFill(0xFFFF00);
    this.graphic.drawCircle(0, 0, 10);
    this.graphic.endFill();
    this.graphic.x = px;
    this.graphic.y = py;
    app.stage.addChild(this.graphic);
  }

  update(delta) {
    this.pos.x += this.vel.x * delta;
    this.pos.y += this.vel.y * delta;
    this.graphic.x = this.pos.x;
    this.graphic.y = this.pos.y;
  }

  destroy(app) {
    app.stage.removeChild(this.graphic);
  }
}

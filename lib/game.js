'use strict';
const playerModule = require('./player.js');
const rectModule = require('./rect.js');
const utils = require('./utils.js');

class Game {
  constructor(map) {
    this.players = [null, null, null, null];
    this.playerInput = [{
        id: 0,
        x: 0,
        y: 0,
        mx: 0,
        my: 0,
        mdown: false
      },
      {
        id: 1,
        x: 0,
        y: 0,
        mx: 0,
        my: 0,
        mdown: false
      },
      {
        id: 2,
        x: 0,
        y: 0,
        mx: 0,
        my: 0,
        mdown: false
      },
      {
        id: 3,
        x: 0,
        y: 0,
        mx: 0,
        my: 0,
        mdown: false
      },
    ];
    this.playersKD = [
      {kills : 0, deaths: 0},
      {kills : 0, deaths: 0},
      {kills : 0, deaths: 0},
      {kills : 0, deaths: 0}
    ];
    this.playerIdDictionary = new Map();
    this.bullets = new Array();
    //this.emitDataBullets = [];
    this.emitDataKD = [];

    this.map = map;
    this.rects = [];
    for(let i = 0; i < this.map.rects.length; i++){
      let t = this.map.rects[i];
      this.rects.push(new rectModule.Rect(t.x, t.y, t.w, t.h, t.r));
    }
    this.balls = [];
    for(let i = 0; i < this.map.balls.length; i++){
      let t = this.map.balls[i];
      this.balls.push(new rectModule.Ball(t.x, t.y, t.r));
    }
  }

  update(delta) {

    for (let i = 0; i < this.players.length; i++) {
      if (this.players[i] == null) continue;

      //update
      this.players[i].update(this.playerInput[i], delta);

      //respawn
      if (this.players[i].isDead) {
        if (this.players[i].canRespawn()) {
          this.respawnPlayer(this.players[i]);
        } else continue;
      }

      //player player collision
      for (let j = 0; j < this.players.length; j++) {
        if (this.players[j] == null || j == i || this.players[j].isDead) continue;
        this.resolvePlayersCollision(this.players[i], this.players[j]);
      }

      //level collision
      this.playerBoundriesCollision(this.players[i]);
      for (let j = 0; j < this.rects.length; j++) {
        this.resolvePlayerRectCollision(this.players[i], this.rects[j]);
      }
      for (let j = 0; j < this.balls.length; j++) {
        this.resolvePlayerBallCollision(this.players[i], this.balls[j]);
      }

      //shooting
      if (this.playerInput[i].mdown) {
        if (this.players[i].canShoot())
          this.makePlayerShoot(i);
      }
    }

    //bullets
    for (let i = 0; i < this.bullets.length; i++) {

      //remove dead bullets
      if (this.bullets[i].isDead) {
        this.bullets.splice(i, 1);
        continue;
      }

      //update
      this.bullets[i].update(delta);
      //level collision
      if (this.isBulletOut(this.bullets[i])) {
        this.bullets[i].isDead = true;
        continue;
      }
      for (let j = 0; j < this.rects.length; j++) {
        this.resolveBulletRectCollision(this.bullets[i], this.rects[j]);
        if (this.bullets[i].isDead) continue;
      }

      //player bullet collisions
      for (let j = 0; j < this.playerInput.length; j++) {
        if (this.players[j] == null || this.players[j].isDead) continue;
        this.resolvePlayerBulletCollision(this.players[j], this.bullets[i]);
        if (this.bullets[i].isDead) continue;
      }

    }

  }

  updateInput(data, socket) {
    let id = this.playerIdDictionary.get(socket);

    if (data.x != null)
      this.playerInput[id].x = data.x;

    if (data.y != null)
      this.playerInput[id].y = data.y;

    if (data.mousePos != null) {
      let mx = data.mousePos % this.map.width;
      let my = (data.mousePos - mx) / this.map.width;
      this.playerInput[id].mx = mx;
      this.playerInput[id].my = my;
    }

    if (data.mouseDown != null) {
      this.playerInput[id].mdown = data.mouseDown;
    }

  }

  //players
  removePlayer(id, socket) {
    this.players[id] = null;
    this.playerIdDictionary.delete(socket);
  }

  addPlayer(id, socket, data) {
    this.players[id] = new playerModule.Player(id, this.map.spawn_points[id].x, this.map.spawn_points[id].y, data.nick, data.color);
    this.playerIdDictionary.set(socket, id);
  }

  respawnPlayer(player) {
    player.pos.x = this.map.spawn_points[player.id].x;
    player.pos.y = this.map.spawn_points[player.id].y;
    player.respawn();
  }

  findFreePlayerId() {
    for (let i = 0; i < this.players.length; i++) {
      if (this.players[i] == null) return i;
    }
    return null;
  }

  makePlayerShoot(id) {
    let x = this.players[id].firePointPos.x;
    let y = this.players[id].firePointPos.y;

    let vx = 600 * Math.cos(this.players[id].rotation - Math.PI/2);
    let vy = 600 * Math.sin(this.players[id].rotation - Math.PI/2);

    let bullet = new playerModule.Bullet(id, x, y, vx, vy);
    this.bullets.push(bullet);

    this.players[id].justShot = true;
    this.players[id].knockback(-vx * 0.5, -vy * 0.5);
  }

  //collisions
  doBallsOverlap(x1, y1, r1, x2, y2, r2) {
    return Math.abs((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2)) <= (r1 + r2) * (r1 + r2);
  }

  isBulletOut(bullet) {
    return bullet.pos.x - bullet.radius < 0 ||
      bullet.pos.x + bullet.radius >= this.map.width ||
      bullet.pos.y - bullet.radius < 0 ||
      bullet.pos.y + bullet.radius >= this.map.height;
  }

  playerBoundriesCollision(player) {
    if (player.pos.x /*+ player.vel.x*/ - player.radius < 0) {
      player.pos.x = player.radius;
      player.vel.x = 0;
    } else if (player.pos.x + player.radius /*+ player.vel.x*/ > this.map.width) {
      player.pos.x = this.map.width - player.radius;
      player.vel.x = 0;
    }
    if (player.pos.y - player.radius /*+ player.vel.y*/ < 0) {
      player.pos.y = player.radius;
      player.vel.y = 0;
    } else if (player.pos.y + player.radius /*+ player.vel.y*/ > this.map.height) {
      player.pos.y = this.map.height - player.radius;
      player.vel.y = 0;
    }
  }

  resolvePlayersCollision(player1, player2) {
    if (!this.doBallsOverlap(player1.pos.x, player1.pos.y, player1.radius, player2.pos.x, player2.pos.y, player2.radius)) return;

    // Distance between ball centers
    var fDistance = Math.sqrt(Math.pow(player1.pos.x - player2.pos.x, 2) + Math.pow(player1.pos.y - player2.pos.y, 2));

    // Calculate displacement required
    var fOverlap = (fDistance - player1.radius - player2.radius);

    // Displace Current Ball away from collision
    player1.pos.x -= fOverlap * (player1.pos.x - player2.pos.x) / fDistance;
    player1.pos.y -= fOverlap * (player1.pos.y - player2.pos.y) / fDistance;

    // Displace Target Ball away from collision
    player2.pos.x += fOverlap * (player1.pos.x - player2.pos.x) / fDistance;
    player2.pos.y += fOverlap * (player1.pos.y - player2.pos.y) / fDistance;

    // Set velocities

    // Normal
    var nx = (player2.pos.x - player1.pos.x) / fDistance;
    var ny = (player2.pos.y - player1.pos.y) / fDistance;

    // Tangent
    var tx = -ny;
    var ty = nx;

    // Dot Product Tangent
    var dpTan1 = player1.vel.x * tx + player1.vel.y * ty;
    var dpTan2 = player2.vel.x * tx + player2.vel.y * ty;

    // Dot Product Normal
    var dpNorm1 = player1.vel.x * nx + player1.vel.y * ny;
    var dpNorm2 = player1.vel.x * nx + player1.vel.y * ny;
    // Update ball velocities
    player1.vel.x = (tx * dpTan1 + nx);
    player1.vel.y = (ty * dpTan1 + ny);
    player2.vel.x = (tx * dpTan2 + nx);
    player2.vel.y = (ty * dpTan2 + ny);

  }

  resolvePlayerBallCollision(player, ball){
    if (this.doBallsOverlap(player.pos.x, player.pos.y, player.radius, ball.x, ball.y, ball.radius)) {
      var fDistance = Math.sqrt(Math.pow(player.pos.x - ball.x, 2) + Math.pow(player.pos.y - ball.y, 2));
      var fOverlap = (fDistance - player.radius - ball.radius);
      player.pos.x -= 2 * fOverlap * (player.pos.x - ball.x) / fDistance;
      player.pos.y -= 2 * fOverlap * (player.pos.y - ball.y) / fDistance;
      var nx = (ball.x - player.pos.x) / fDistance;
      var ny = (ball.y - player.pos.y) / fDistance;
      var tx = -ny;
      var ty = nx;
      var dpTan1 = player.vel.x * tx + player.vel.y * ty;
      var dpTan2 = 0;
      player.vel.x = tx * (dpTan1 + dpTan2) + 2*nx;
      player.vel.y = ty * (dpTan1 + dpTan2) + 2*ny;
      return true;
    }
    return false;
  }

  resolvePlayerRectCollision(player, rect) {
    for (let i = 0; i < rect.balls.length; i++) {
      const ball = rect.balls[i];
      if (this.resolvePlayerBallCollision(player, ball)) break;
    }

    for (let i = 0; i < rect.walls.length; i++) {
      const wall = rect.walls[i];

      switch (wall.face) {
        case utils.TOP:
          if (player.pos.y + player.radius > wall.y1 && player.lastPos.y + player.radius <= wall.y1 && player.pos.x <= wall.x2 && player.pos.x >= wall.x1) {
            player.pos.y = wall.y1 - player.radius;
            //player.vel.y += -WALL_KNOCKBACK;
            player.vel.y = 0;
            //return;
          }
          break;
        case utils.BOTTOM:
          if (player.pos.y - player.radius < wall.y1 && player.lastPos.y - player.radius >= wall.y1 && player.pos.x <= wall.x2 && player.pos.x >= wall.x1) {
            player.pos.y = wall.y1 + player.radius;
            //player.vel.y += WALL_KNOCKBACK;
            player.vel.y = 0;
            //return;
          }
          break;
        case utils.RIGHT:
          if (player.pos.x - player.radius < wall.x1 && player.lastPos.x - player.radius >= wall.x1 && player.pos.y <= wall.y2 && player.pos.y >= wall.y1) {
            player.pos.x = wall.x1 + player.radius;
            //player.vel.x += WALL_KNOCKBACK;
            player.vel.x = 0;
            //return;
          }
          break;
        case utils.LEFT:
          if (player.pos.x + player.radius > wall.x1 && player.lastPos.x + player.radius <= wall.x1 && player.pos.y <= wall.y2 && player.pos.y >= wall.y1) {
            player.pos.x = wall.x1 - player.radius;
            //player.vel.x += -WALL_KNOCKBACK;
            player.vel.x = 0;
            //return;
          }
          break;
      }

    }
  }

  resolveBulletRectCollision(bullet, rect) {
    if (bullet.pos.x + bullet.radius >= rect.template.x &&
      bullet.pos.x - bullet.radius <= rect.template.x + rect.template.w &&
      bullet.pos.y + bullet.radius >= rect.template.y &&
      bullet.pos.y - bullet.radius <= rect.template.y + rect.template.h) {
      bullet.isDead = true;
    }
    //moze odbicie ?
  }

  resolvePlayerBulletCollision(player, bullet) {
    if (bullet.id == player.id) return;

    if (this.doBallsOverlap(bullet.pos.x, bullet.pos.y, bullet.radius, player.pos.x, player.pos.y, player.radius)) {
      player.receiveHit();
      if (player.isDead){
        this.playersKD[bullet.id].kills++;
        this.playersKD[player.id].deaths++;
        this.emitDataKD.push({idK: bullet.id, idD: player.id});
      }
      bullet.isDead = true;

      let vx = bullet.vel.x;
      let vy = bullet.vel.y;
      player.knockback(vx * 0.5, vy * 0.5);
    }
  }

  //get data
  getFullnessData() {
    return '' + this.playerIdDictionary.size + '/' + this.players.length;
  }

  getEmitData() {
    var emitData = {
      players: [],
    };
    for (let i = 0; i < this.players.length; i++) {
      if (this.players[i] == null) continue;
      let player_data = this.players[i].getEmitData();
      emitData.players.push(player_data);
    }

    /*if (this.emitDataBullets.length > 0) {
      emitData.bullets = this.emitDataBullets;
      this.emitDataBullets = [];
    }*/

    if (this.emitDataKD.length > 0) {
      emitData.KD = this.emitDataKD;
      this.emitDataKD = [];
    }

    return emitData;
  }

  getInitData() {
    const data = {
      map : this.map,
      players: []
    };

    for (let i = 0; i < this.players.length; i++) {
      if (this.players[i] != null) {
        let player_data = {
          id: i,
          x: this.players[i].pos.x,
          y: this.players[i].pos.y,
          nick: this.players[i].nick,
          color: this.players[i].color
        }
        data.players.push(player_data);
      }
    }

    return data;
  }
}

module.exports.Game = Game;

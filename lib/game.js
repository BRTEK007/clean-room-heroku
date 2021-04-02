'use strict';

const TOP = 'T',
  RIGHT = 'R',
  BOTTOM = 'B',
  LEFT = 'L';

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
    this.emitDataBullets = [];
    this.emitDataKD = [];

    this.map = map;
    this.rects = [];
    for(let i = 0; i < this.map.rects.length; i++){
      let t = this.map.rects[i];
      this.rects.push(new Rect(t.x, t.y, t.w, t.h, t.r));
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
    this.players[id] = new Player(id, this.map.spawn_points[id].x, this.map.spawn_points[id].y, data.nick, data.color);
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

    //direction
    let dx = this.playerInput[id].mx - x;
    let dy = this.playerInput[id].my - y;
    //magnitude
    let m = Math.sqrt(dx * dx + dy * dy);

    let vx = 600 * dx / m;
    let vy = 600 * dy / m;

    this.players[id].knockback(-vx * 0.5, -vy * 0.5);

    let bullet = new Bullet(id, x, y, vx, vy);
    this.bullets.push(bullet);
    this.emitDataBullets.push({
      px : x,
      py : y,
      vx: vx,
      vy: vy
    });
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
    if (player.pos.x < player.radius) {
      player.pos.x = player.radius;
      player.vel.x *= -1;
    } else if (player.pos.x + player.radius > this.map.width) {
      player.pos.x = this.map.width - player.radius;
      player.vel.x *= -1;
    }
    if (player.pos.y < player.radius) {
      player.pos.y = player.radius;
      player.vel.y *= -1;
    } else if (player.pos.y + player.radius > this.map.height) {
      player.pos.y = this.map.height - player.radius;
      player.vel.y *= -1;
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

  resolvePlayerRectCollision(player, rect) {
    for (let i = 0; i < rect.balls.length; i++) {
      const ball = rect.balls[i];
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
        //player.vel.x = (tx * dpTan1 + nx);
        //player.vel.y = (ty * dpTan1 + ny);
        player.vel.x = tx * (dpTan1 + dpTan2) + 2*nx;
        player.vel.y = ty * (dpTan1 + dpTan2) + 2*ny;

        //knockback
        /*let dx = player.pos.x - ball.x;
        let dy = player.pos.y - ball.y;
        let m = Math.sqrt(dx * dx + dy * dy);
        let vx = WALL_KNOCKBACK * dx / m;
        let vy = WALL_KNOCKBACK * dy / m;
        player.knockback(vx, vy);*/

        break;
      }
    }

    for (let i = 0; i < rect.walls.length; i++) {
      const wall = rect.walls[i];

      switch (wall.face) {
        case TOP:
          if (player.pos.y + player.radius > wall.y1 && player.lastPos.y + player.radius <= wall.y1 && player.pos.x <= wall.x2 && player.pos.x >= wall.x1) {
            player.pos.y = wall.y1 - player.radius;
            //player.vel.y += -WALL_KNOCKBACK;
            player.vel.y = 0;
            //return;
          }
          break;
        case BOTTOM:
          if (player.pos.y - player.radius < wall.y1 && player.lastPos.y - player.radius >= wall.y1 && player.pos.x <= wall.x2 && player.pos.x >= wall.x1) {
            player.pos.y = wall.y1 + player.radius;
            //player.vel.y += WALL_KNOCKBACK;
            player.vel.y = 0;
            //return;
          }
          break;
        case RIGHT:
          if (player.pos.x - player.radius < wall.x1 && player.lastPos.x - player.radius >= wall.x1 && player.pos.y <= wall.y2 && player.pos.y >= wall.y1) {
            player.pos.x = wall.x1 + player.radius;
            //player.vel.x += WALL_KNOCKBACK;
            player.vel.x = 0;
            //return;
          }
          break;
        case LEFT:
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

    if (this.emitDataBullets.length > 0) {
      emitData.bullets = this.emitDataBullets;
      this.emitDataBullets = [];
    }

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

class Rect {
  constructor(x, y, w, h, r) {
    this.template = {
      x: x,
      y: y,
      w: w,
      h: h,
      r: r
    };
    this.balls = new Array();
    this.walls = new Array();
    //left bottom circle
    this.balls.push(new Ball(x + r, y + h - r, r));
    //right bottom circle
    this.balls.push(new Ball(x + w - r, y + h - r, r));
    //left top circle
    this.balls.push(new Ball(x + r, y + r, r));
    //right top circle
    this.balls.push(new Ball(x + w - r, y + r, r));
    //line top
    this.walls.push(new Wall(x + r, y, x + w - r, y, TOP));
    //line bottom
    this.walls.push(new Wall(x + r, y  + h, x + w - r, y  + h, BOTTOM));
    //line left
    this.walls.push(new Wall(x + 0, y + r, x, y + h - r, LEFT));
    //line right
    this.walls.push(new Wall(x  + w, y + r, x  + w, y + h-r, RIGHT));
  }
}

class Ball {
  constructor(x, y, r) {
    this.x = x;
    this.y = y;
    this.radius = r;
  }
}

class Wall {
  constructor(x1, y1, x2, y2, f) {
    this.x1 = x1;
    this.y1 = y1;
    this.x2 = x2;
    this.y2 = y2;
    this.face = f;
  }
}

class Player {
  constructor(_id, _xp, _yp, _nick, _color) {
    this.id = _id;
    this.pos = {
      x: _xp,
      y: _yp
    };
    this.lastPos = {
      x: _xp,
      y: _yp
    }
    this.vel = {
      x: 0,
      y: 0
    };

    this.firePointAngle = -Math.PI/2;
    this.firePointMag = 50;
    this.firePointPos = {x: 0, y: 0};

    this.radius = 25;
    this.rotation = 0;
    this.isDead = false;
    this.health = 3;
    this.healthChangeRegistered = true;
    this.shootDelay = 0.5;
    this.shootDelayCounter = 0;
    this.respawnDelay = 1;
    this.respawnDelayCounter = 0;

    this.nick = _nick;
    this.color = _color;
  }

  update(input, delta) {

    if (this.isDead) {
      this.respawnDelayCounter += delta;
      return;
    }
    //movement
    var diagonalMultiplayer = 1;
    if (input.x != 0 && input.y != 0) diagonalMultiplayer = 0.707;
    //this.vel.x = input.x * 600 * diagonalMultiplayer;
    //this.vel.y = input.y * 600 * diagonalMultiplayer;
    this.vel.x += input.x * 30 * diagonalMultiplayer;
    this.vel.y += input.y * 30 * diagonalMultiplayer;
    this.vel.x *= 0.95;
    this.vel.y *= 0.95;
    if (Math.abs(this.vel.x) < 0.1) this.vel.x = 0;
    if (Math.abs(this.vel.y) < 0.1) this.vel.y = 0;
    this.lastPos.x = this.pos.x;
    this.lastPos.y = this.pos.y;
    this.pos.x += this.vel.x * delta;
    this.pos.y += this.vel.y * delta;
    this.rotation = lookAtRotation(this.pos.x, this.pos.y, input.mx, input.my);
    this.firePointPos.x = this.pos.x + Math.cos(this.rotation + this.firePointAngle) * this.firePointMag;
    this.firePointPos.y = this.pos.y + Math.sin(this.rotation + this.firePointAngle) * this.firePointMag;

    if (this.shootDelayCounter < this.shootDelay) this.shootDelayCounter += delta;
  }

  getEmitData() {
    const data = {
      id : this.id,
      x : this.pos.x,
      y : this.pos.y,
      rotation : this.rotation
    }
    if(!this.healthChangeRegistered){
      data.health = this.health;
      this.healthChangeRegistered = true;
    }
    return data;
  }

  canShoot() {
    if (this.shootDelayCounter >= this.shootDelay) {
      this.shootDelayCounter = 0;
      return true;
    } else return false;
  }

  canRespawn() {
    if (this.respawnDelayCounter >= this.respawnDelay) {
      this.respawnDelayCounter = 0;
      return true;
    } else return false;
  }

  receiveHit(){
    this.health--;
    if(this.health <= 0){
       this.health = 0;
       this.isDead = true;
     }
    this.healthChangeRegistered = false;
  }

  respawn(){
    this.vel.x = 0;
    this.vel.y = 0;
    this.rotation = 0;
    this.health = 3;
    this.isDead = false;
    this.healthChangeRegistered = false;
  }

  knockback(x, y) {
    this.vel.x += x;
    this.vel.y += y;
  }
}

class Bullet {
  constructor(id, px, py, vx, vy) {
    this.pos = {
      x: px,
      y: py
    };
    this.vel = {
      x: vx,
      y: vy
    };
    this.radius = 10;
    this.id = id;
    this.isDead = false;
  }

  update(delta) {
    this.pos.x += this.vel.x * delta;
    this.pos.y += this.vel.y * delta;
  }
}

function lookAtRotation(fx, fy, tx, ty) {
  var dist_Y = fy - ty;
  var dist_X = fx - tx;
  var angle = Math.atan2(dist_Y, dist_X) - Math.PI / 2;
  return angle;
}

module.exports.Game = Game;

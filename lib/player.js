const utils = require('./utils.js');
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
      this.justShot = false;
  
      this.radius = 25;
      this.rotation = 0;
      this.isDead = false;
      this.health = 3;
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
      this.pos.x += Math.round(this.vel.x * delta);
      this.pos.y += Math.round(this.vel.y * delta);
      this.rotation = Math.round(utils.lookAtRotation(this.pos.x, this.pos.y, input.mx, input.my)*100)/100;
      this.firePointPos.x = this.pos.x + Math.cos(this.rotation + this.firePointAngle) * this.firePointMag;
      this.firePointPos.y = this.pos.y + Math.sin(this.rotation + this.firePointAngle) * this.firePointMag;
  
      if (this.shootDelayCounter < this.shootDelay) this.shootDelayCounter += delta;
    }
  
    getEmitData() {
      const data = {
        id : this.id,
        x : this.pos.x,
        y : this.pos.y,
        rotation : this.rotation,
        shot : this.justShot,
        health : this.health
      }
      if(this.justShot) this.justShot = false;
  
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
    }
  
    respawn(){
      this.vel.x = 0;
      this.vel.y = 0;
      this.rotation = 0;
      this.health = 3;
      this.isDead = false;
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

module.exports.Player = Player;
module.exports.Bullet = Bullet;
const utils = require('./utils.js');
class Player {
    constructor(game, _id, _xp, _yp, _nick, _color) {
      this.game = game;
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

      this.client_input = {
        x: 0,
        y: 0,
        mx: 0,
        my: 0,
        mdown: false
      };
    }
  
    update(delta) {
  
      if (this.isDead) {
        this.respawnDelayCounter += delta;
        return;
      }
      //movement
      var diagonalMultiplayer = 1;
      if (this.client_input.x != 0 && this.client_input.y != 0) diagonalMultiplayer = 0.707;
      //this.vel.x = input.x * 600 * diagonalMultiplayer;
      //this.vel.y = input.y * 600 * diagonalMultiplayer;
      this.vel.x += this.client_input.x * 30 * diagonalMultiplayer;
      this.vel.y += this.client_input.y * 30 * diagonalMultiplayer;
      this.vel.x *= 0.95;
      this.vel.y *= 0.95;
      if (Math.abs(this.vel.x) < 0.1) this.vel.x = 0;
      if (Math.abs(this.vel.y) < 0.1) this.vel.y = 0;
      this.lastPos.x = this.pos.x;
      this.lastPos.y = this.pos.y;
      this.pos.x += Math.round(this.vel.x * delta);
      this.pos.y += Math.round(this.vel.y * delta);
      this.rotation = Math.round(utils.lookAtRotation(this.pos.x, this.pos.y, this.client_input.mx, this.client_input.my)*100)/100;
      this.firePointPos.x = this.pos.x + Math.cos(this.rotation + this.firePointAngle) * this.firePointMag;
      this.firePointPos.y = this.pos.y + Math.sin(this.rotation + this.firePointAngle) * this.firePointMag;
  
      if (this.shootDelayCounter < this.shootDelay)
       this.shootDelayCounter += delta;
      else if(this.shootDelayCounter >= this.shootDelay && this.client_input.mdown){
        this.shootDelayCounter = 0;
        this.Shoot();
      }
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

    Shoot(){
      let vx = 600 * Math.cos(this.rotation - Math.PI/2);
      let vy = 600 * Math.sin(this.rotation - Math.PI/2);

      let bullet = new Bullet(this.id, this.firePointPos.x, this.firePointPos.y, vx, vy);
      this.game.bullets.push(bullet);

      this.justShot = true;
      this.knockback(-vx * 0.5, -vy * 0.5); 
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

    OnSocketInput(data){
      if (data.x != null)
        this.client_input.x = data.x;
  
      if (data.y != null)
        this.client_input.y = data.y;

      if(data.mx != null)
        this.client_input.mx = data.mx;
  
      if(data.my != null)
        this.client_input.my = data.my;
  
      if (data.mouseDown != null) {
        this.client_input.mdown = data.mouseDown;
      }
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
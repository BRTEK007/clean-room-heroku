const utils = require('./utils.js');
class Entity{
  constructor(){
    this.rigidbody = null;
    this.transform = null;
    this.collider = null;
    this.isDestroyed = false;
    this.isDisabled = false;
  }

  update(delta){
    if(this.rigidbody != null)
      this.rigidbody.update(delta);
  }

  destroy(){
    this.isDestroyed = true;
  }
}

class Player extends Entity{
    constructor(game, _id, _xp, _yp, _nick, _color) {
      super();
      this.game = game;
      this.id = _id;
      this.transform = new Transform(this, _xp, _yp);
      this.rigidbody = new RigidBody(this.transform, {drag: 0.95});
      this.collider = new CircleCollider(this.transform, 25, {rigidbody : this.rigidbody});
  
      this.firePointAngle = -Math.PI/2;
      this.firePointMag = 50;
      this.firePointPos = {x: 0, y: 0};
      this.justShot = false;
  
      this.isDead = false;
      this.health = 3;
      this.shootDelay = 0.4;
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
      super.update(delta);
  
      if (this.isDead) {
        this.respawnDelayCounter += delta;
        if(this.respawnDelayCounter >= this.respawnDelay){
          this.respawnDelayCounter = 0;
          this.respawn();
        }
        return;
      }
      //movement
      var diagonalMultiplayer = 1;
      if (this.client_input.x != 0 && this.client_input.y != 0) diagonalMultiplayer = 0.707;
      this.rigidbody.addForce(this.client_input.x * 30 * diagonalMultiplayer, this.client_input.y * 30 * diagonalMultiplayer);

      this.transform.lookAt(this.client_input.mx, this.client_input.my);
      this.firePointPos.x = this.transform.pos.x + Math.cos(this.transform.rotation + this.firePointAngle) * this.firePointMag;
      this.firePointPos.y = this.transform.pos.y + Math.sin(this.transform.rotation + this.firePointAngle) * this.firePointMag;
  
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
        x : this.transform.pos.x,
        y : this.transform.pos.y,
        rotation : this.transform.rotation,
        shot : this.justShot,
        health : this.health
      }
      if(this.justShot) this.justShot = false;
  
      return data;
    }

    getInitData() {
      return {
        id: this.id,
        x: this.transform.pos.x,
        y: this.transform.pos.y,
        nick: this.nick,
        color: this.color
      }
    }

    Shoot(){
      let vx = 600 * Math.cos(this.transform.rotation - Math.PI/2);
      let vy = 600 * Math.sin(this.transform.rotation - Math.PI/2);

      let bullet = new Bullet(this.id, this.firePointPos.x, this.firePointPos.y, vx, vy);
      this.game.bullets.push(bullet);

      this.justShot = true;
      this.rigidbody.addForce(-vx * 0.5, -vy * 0.5); 
    }
  
    receiveHit(){
      this.health--;
      if(this.health <= 0){
         this.health = 0;
         this.isDead = true;
       }
    }
  
    respawn(){
      let r_pos = this.game.getRespawnPos();
      this.transform.setPos(r_pos.x, r_pos.y);
      this.transform.updatePrevPos();
      this.rigidbody.setVel(0,0);
      this.transform.rotation = 0;
      this.health = 3;
      this.isDead = false;
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
  
class Bullet extends Entity{
    constructor(id, px, py, vx, vy) {
      super();
      this.transform = new Transform(this, px, py);
      this.rigidbody = new RigidBody(this.transform);
      this.rigidbody.setVel(vx, vy);
      this.collider = new CircleCollider(this.transform, 10, {rigidbody : this.rigidbody, isTrigger : true});
      this.collider.onEntityCollision = (other) => { this.onEntityCollision(other) };
      this.collider.onSolidCollision = () => { this.onSolidCollision() };
      this.id = id;
    }
    onEntityCollision(other){
      var entity = other.transform.entity;

      if(entity instanceof Player && entity.id != this.id && !entity.isDead){
        entity.receiveHit();
        entity.rigidbody.addForce(this.rigidbody.vel.x * 0.5, this.rigidbody.vel.y * 0.5);
        this.destroy();
      }

    }

    onSolidCollision(){
      this.destroy();
    }
}

class Transform{
  constructor(_e, _x, _y){
    this.entity = _e;
    this.pos = {x : _x, y: _y};
    this.prev_pos = {x : _x, y : _y};
    this.rotation = 0;
  }
  setPos(_x, _y){
    this.pos.x = _x;
    this.pos.y = _y;
  }
  updatePrevPos(){
    this.prev_pos.x = this.pos.x;
    this.prev_pos.y = this.pos.y;
  }
  lookAt(tx,ty){
    var dist_Y = this.pos.y - ty;
    var dist_X = this.pos.x - tx;
    var angle = Math.atan2(dist_Y, dist_X) - Math.PI / 2;
    this.rotation = Math.round(angle*100)/100;
  }
}

class RigidBody{
  constructor(t, options = {}){
    this.transform = t;
    this.vel = {x : 0, y : 0};
    this.clipping = options.clipping || 0.1;
    this.drag = options.drag || 1;
  }

  update(delta){
      this.vel.x *= this.drag;
      this.vel.y *= this.drag;

      if (Math.abs(this.vel.x) < this.clipping) this.vel.x = 0;
      if (Math.abs(this.vel.y) < this.clipping) this.vel.y = 0;

      this.transform.updatePrevPos();

      this.transform.pos.x += Math.round(this.vel.x * delta);
      this.transform.pos.y += Math.round(this.vel.y * delta);
  }

  addForce(_x, _y){
    this.vel.x += _x;
    this.vel.y += _y;
  }

  setVel(_x, _y){
    this.vel.x = _x;
    this.vel.y = _y;
  }

}

class Collider{
  constructor(transform, options = {}){
    this.transform = transform;
    this.rigidbody = options.rigidbody || null;
    this.isTrigger = options.isTrigger || false;
    this.isDynamic = this.rigidbody ? true : false;
    this.onEntityCollision = (other) => {};
    this.onSolidCollision = () => {};
  }
}

class CircleCollider extends Collider{
  constructor(_t, _r, _o = {}){
    super(_t, _o);
    this.radius = _r;
  }
}

module.exports.Player = Player;
module.exports.Bullet = Bullet;
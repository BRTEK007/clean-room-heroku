const Entity = require('./Entity.js');
const Transform = require('./Transform.js');
const RigidBody = require('./Rigidbody.js');
const {CircleCollider} = require('../physics/collidersModule.js');
const Bullet = require('./Bullet.js');
const Vector2D = require('../physics/Vector2D.js');

module.exports = class Player extends Entity{
    constructor(_game, _id, _xp, _yp, _nick, _color) {
      super();
      this.game = _game;
      this.id = _id;
      this.transform = new Transform(this, _xp, _yp);
      this.rigidbody = new RigidBody(this.transform, {drag: 0.975});
      this.collider = new CircleCollider(this.transform, 25, {rigidbody : this.rigidbody});
      this.speed = 20;
      this.rotationSpeed = 0.05;
      this.collider.onEntityCollision = (other) => { this.onEntityCollision(other) };
  
      this.firePointAngle = -Math.PI/2;
      this.firePointMag = 50;
      this.firePointPos = {x: 0, y: 0};
      this.justShot = false;
  
      this.isDead = false;
      this.health = 3;
      this.shootDelay = 1;
      this.shootDelayCounter = 0;
      this.respawnDelay = 1;
      this.respawnDelayCounter = 0;
  
      this.nick = _nick;
      this.color = _color;

      this.client_input = {
        x: 0,
        y: 0,
        action: false
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
      let dir = this.transform.getForwardVec();
      this.rigidbody.addForce(-dir.x * this.client_input.y*this.speed, -dir.y* this.client_input.y*this.speed);
      this.transform.rotation += this.client_input.x * this.rotationSpeed;
      this.firePointPos.x = this.transform.pos.x + Math.cos(this.transform.rotation + this.firePointAngle) * this.firePointMag;
      this.firePointPos.y = this.transform.pos.y + Math.sin(this.transform.rotation + this.firePointAngle) * this.firePointMag;
  
      if (this.shootDelayCounter < this.shootDelay)
       this.shootDelayCounter += delta;
      else if(this.shootDelayCounter >= this.shootDelay && this.client_input.action){
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
      let dir = this.transform.getForwardVec();
      let vx = 800 * dir.x;
      let vy = 800 * dir.y;

      let bullet = new Bullet(this.id, this.firePointPos.x, this.firePointPos.y, vx, vy);
      this.game.instanciateEntity(bullet);

      this.justShot = true;
      this.rigidbody.addForce(-(vx/800) * 600, -(vy/800) * 600); 
    }
  
    receiveHit(){
      this.health--;
      if(this.health <= 0) this.die();
    }

    die(){
      this.health = 0;
      this.isDead = true;
      this.collider.isDisabled = true;
    }
  
    respawn(){
      let r_pos = this.game.getRespawnPos();
      this.transform.setPos(r_pos.x, r_pos.y);
      this.transform.updatePrevPos();
      this.rigidbody.setVel(0,0);
      this.transform.rotation = 0;
      this.health = 3;
      this.isDead = false;
      this.collider.isDisabled = false;
    }

    OnSocketInput(data){
      if (data.x != null)
        this.client_input.x = data.x;
  
      if (data.y != null)
        this.client_input.y = data.y;

      if (data.action != null) {
        this.client_input.action = data.action;
      }
    }

    onEntityCollision(other){
      return;
      var entity = other.transform.entity;

      if(entity instanceof Player){
        //entity.receiveHit();
        entity.rigidbody.addForce(this.rigidbody.vel.x * 0.5, this.rigidbody.vel.y * 0.5);
      }

    }
}
  
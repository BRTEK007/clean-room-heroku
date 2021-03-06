const Entity = require('./Entity.js');
const Transform = require('./Transform.js');
const RigidBody = require('./Rigidbody.js');
const {CircleCollider} = require('../physics/collidersModule.js');
const Bullet = require('./Bullet.js');
const Vector2D = require('../physics/Vector2D.js');

module.exports = class Player extends Entity{
    constructor(_game, _id, _xp, _yp, _nick, _color) {
      super();
      this.tag = 'p';
      this.game = _game;
      this.id = _id;
      this.transform = new Transform(this, _xp, _yp);
      this.rigidbody = new RigidBody(this.transform, {drag: 0.975});
      this.collider = new CircleCollider(this.transform, 25, {rigidbody : this.rigidbody});
      this.speed = 15;
      this.rotationSpeed = 0.005;
      this.angularVelocity = 0;
      this.angularDrag = 0.95;
      this.maxAngularVelocity = 0.05; 
      this.collider.onEntityCollision = (other) => { this.onEntityCollision(other) };
  
      this.firePointMag = 50;
      this.firePointPos = new Vector2D(0,0);
      this.justShot = false;
  
      this.isDead = false;
      this.health = 1;
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
      this.angularVelocity +=this.client_input.x * this.rotationSpeed;
      this.angularVelocity *= this.angularDrag;
      if(Math.abs(this.angularVelocity) > this.maxAngularVelocity){
        this.angularVelocity = this.angularVelocity < 0 ? -this.maxAngularVelocity : this.maxAngularVelocity;
      } 
      this.transform.rotation += this.angularVelocity;
      this.firePointPos.x = this.transform.pos.x + dir.x * this.firePointMag;
      this.firePointPos.y = this.transform.pos.y + dir.y * this.firePointMag;
  
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

      let bullet = new Bullet(this, this.firePointPos.x, this.firePointPos.y, vx, vy);
      this.game.instanciateEntity(bullet);

      this.justShot = true;
      this.rigidbody.addForce(-dir.x * 500, -dir.y * 500); 
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
      //let r_pos = this.transform.pos;
      this.transform.setPos(r_pos.x, r_pos.y);
      this.transform.updatePrevPos();
      this.rigidbody.setVel(0,0);
      this.transform.rotation = 0;
      this.health = 1;
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
  
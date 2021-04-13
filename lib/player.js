const Entity = require('./entity/Entity.js');
const Transform = require('./entity/Transform.js');
const RigidBody = require('./entity/Rigidbody.js');
const Collider = require('./entity/Collider.js');
const {CircleShape} = require('./physics/shapes.js');


class Player extends Entity{
    constructor(_game, _id, _xp, _yp, _nick, _color) {
      super();
      this.game = _game;
      this.id = _id;
      this.transform = new Transform(this, _xp, _yp);
      this.rigidbody = new RigidBody(this.transform, {drag: 0.92});
      this.collider = new Collider(this.transform, new CircleShape(25), {rigidbody : this.rigidbody});
      this.speed = 60;
      this.collider.onEntityCollision = (other) => { this.onEntityCollision(other) };
  
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
      this.rigidbody.addForce(this.client_input.x * this.speed * diagonalMultiplayer, this.client_input.y * this.speed * diagonalMultiplayer);

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
      let vx = 800 * Math.cos(this.transform.rotation - Math.PI/2);
      let vy = 800 * Math.sin(this.transform.rotation - Math.PI/2);

      let bullet = new Bullet(this.id, this.firePointPos.x, this.firePointPos.y, vx, vy);
      this.game.instanciateEntity(bullet);

      this.justShot = true;
      this.rigidbody.addForce(-(vx/800) * 500, -(vy/800) * 500); 
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

      if(data.mx != null)
        this.client_input.mx = data.mx;
  
      if(data.my != null)
        this.client_input.my = data.my;
  
      if (data.mouseDown != null) {
        this.client_input.mdown = data.mouseDown;
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
  
class Bullet extends Entity{
    constructor(id, px, py, vx, vy) {
      super();
      this.transform = new Transform(this, px, py);
      this.rigidbody = new RigidBody(this.transform);
      this.rigidbody.setVel(vx, vy);
      this.collider = new Collider(this.transform, new CircleShape(10), {rigidbody : this.rigidbody, isTrigger : true});
      this.collider.onEntityCollision = (other) => { this.onEntityCollision(other) };
      this.collider.onSolidCollision = () => { this.onSolidCollision(); };
      this.id = id;
    }
    onEntityCollision(other){
      var entity = other.transform.entity;

      if(entity instanceof Player && entity.id != this.id){
        entity.receiveHit();
        entity.rigidbody.addForce(this.rigidbody.vel.x * 0.5, this.rigidbody.vel.y * 0.5);
      }

      this.destroy();
    }

    onSolidCollision(){
      this.destroy();
    }
}

module.exports.Player = Player;
module.exports.Bullet = Bullet;
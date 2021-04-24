const Entity = require('./Entity.js');
const Transform = require('./Transform.js');
const RigidBody = require('./Rigidbody.js');
const {CircleCollider} = require('../physics/collidersModule.js');
const Player = require('./Player.js');

module.exports = class Bullet extends Entity{
    constructor(_player, px, py, vx, vy) {
      super();
      this.transform = new Transform(this, px, py);
      this.rigidbody = new RigidBody(this.transform);
      this.rigidbody.setVel(vx, vy);
      this.collider = new CircleCollider(this.transform, 12, {rigidbody : this.rigidbody, isTrigger : true});
      this.collider.onEntityCollision = (other) => { this.onEntityCollision(other) };
      this.collider.onSolidCollision = () => { this.onSolidCollision(); };
      this.player = _player;
    }
    update(_delta){
      super.update(_delta);
      if(this.player == null) this.destroy();
    }

    onEntityCollision(other){
      console.log(other);
      return;
      var entity = other.transform.entity;
      console.log(entity);

      if(entity instanceof Player && entity != this.player){
        entity.receiveHit();
        entity.rigidbody.addForce(this.rigidbody.vel.x * 0.5, this.rigidbody.vel.y * 0.5);
      }

      this.destroy();
    }

    onSolidCollision(){
      this.destroy();
    }
}
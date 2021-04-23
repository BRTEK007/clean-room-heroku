const Entity = require('./Entity.js');
const Transform = require('./Transform.js');
const RigidBody = require('./Rigidbody.js');
const {CircleCollider} = require('../physics/collidersModule.js');
const Player = require('./Player.js');

module.exports = class Bullet extends Entity{
    constructor(id, px, py, vx, vy) {
      super();
      this.transform = new Transform(this, px, py);
      this.rigidbody = new RigidBody(this.transform);
      this.rigidbody.setVel(vx, vy);
      this.collider = new CircleCollider(this.transform, 12, {rigidbody : this.rigidbody, isTrigger : true});
      this.collider.onEntityCollision = (other) => { this.onEntityCollision(other) };
      this.collider.onSolidCollision = () => { this.onSolidCollision(); };
      this.id = id;
    }
    onEntityCollision(other){
      return;
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
const Vector2D = require('../physics/Vector2D');

module.exports = class RigidBody{
    constructor(t, options = {}){
      this.transform = t;
      this.vel = new Vector2D(0,0);
      this.clipping = options.clipping || 0.1;
      this.drag = options.drag || 1;
      this.mass = options.mass || 1;
      this.elasticity = options.elasticity || 1;
    }
  
    update(delta){
        this.vel = this.vel.mult(this.drag);
  
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
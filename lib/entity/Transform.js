const Vector2D = require('../physics/Vector2D');

module.exports = class Transform{
    constructor(_e, _x, _y){
      this.entity = _e;
      this.pos = new Vector2D(_x, _y);
      this.prev_pos = new Vector2D(_x, _y);
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
const Vector2D = require("../physics/Vector2D");

module.exports = class SolidCollider{
    constructor(_x, _y, _shape){
      this.transform = {
          pos: new Vector2D(_x, _y)
      };
      this.shape = _shape;
      this.layer = 0;
    }
}
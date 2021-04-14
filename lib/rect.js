const Transform = require('./entity/Transform.js');
const utils = require('./utils.js');
const Vector2D = require('./physics/Vector2D');

class SolidCircleCollider {
    constructor(x, y, r) {
      this.x = x;
      this.y = y;
      this.radius = r;
    }
}

class SolidCircle {
  constructor(_x, _y){
    this.transform = new Transform();
  }
}

class SolidWallCollider{
  constructor(x1, y1, x2, y2){
      this.start = new Vector2D(x1, y1);
      this.end = new Vector2D(x2, y2);
  }
  wallUnit(){
      return this.end.subtr(this.start).unit();
  }
}

module.exports.SolidCircleCollider = SolidCircleCollider;
module.exports.SolidWallCollider = SolidWallCollider;
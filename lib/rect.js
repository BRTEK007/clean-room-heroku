const Transform = require('./entity/Transform.js');
const utils = require('./utils.js');

class SolidRectCollider{
    constructor(x, y, w, h, r) {
      this.template = {
        x: x,
        y: y,
        w: w,
        h: h,
        r: r
      };
      this.balls = new Array();
      this.walls = new Array();
      //left bottom circle
      this.balls.push(new SolidCircleCollider(x + r, y + h - r, r));
      //right bottom circle
      this.balls.push(new SolidCircleCollider(x + w - r, y + h - r, r));
      //left top circle
      this.balls.push(new SolidCircleCollider(x + r, y + r, r));
      //right top circle
      this.balls.push(new SolidCircleCollider(x + w - r, y + r, r));
      //line top
      this.walls.push(new SolidWallCollider(x + r, y, x + w - r, y, utils.TOP));
      //line bottom
      this.walls.push(new SolidWallCollider(x + r, y  + h, x + w - r, y  + h, utils.BOTTOM));
      //line left
      this.walls.push(new SolidWallCollider(x + 0, y + r, x, y + h - r, utils.LEFT));
      //line right
      this.walls.push(new SolidWallCollider(x  + w, y + r, x  + w, y + h-r, utils.RIGHT));
    }
  }
  
class SolidCircleCollider {
    constructor(x, y, r) {
      this.x = x;
      this.y = y;
      this.radius = r;
    }
}
  
class SolidWallCollider {
    constructor(x1, y1, x2, y2, f) {
      this.x1 = x1;
      this.y1 = y1;
      this.x2 = x2;
      this.y2 = y2;
      this.face = f;
    }
}

class SolidCircle {
  constructor(_x, _y){
    this.transform = new Transform();
  }
}

module.exports.SolidRectCollider = SolidRectCollider;
module.exports.SolidCircleCollider = SolidCircleCollider;
module.exports.SolidWallCollider = SolidWallCollider;
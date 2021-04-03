const utils = require('./utils.js');

class Rect {
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
      this.balls.push(new Ball(x + r, y + h - r, r));
      //right bottom circle
      this.balls.push(new Ball(x + w - r, y + h - r, r));
      //left top circle
      this.balls.push(new Ball(x + r, y + r, r));
      //right top circle
      this.balls.push(new Ball(x + w - r, y + r, r));
      //line top
      this.walls.push(new Wall(x + r, y, x + w - r, y, utils.TOP));
      //line bottom
      this.walls.push(new Wall(x + r, y  + h, x + w - r, y  + h, utils.BOTTOM));
      //line left
      this.walls.push(new Wall(x + 0, y + r, x, y + h - r, utils.LEFT));
      //line right
      this.walls.push(new Wall(x  + w, y + r, x  + w, y + h-r, utils.RIGHT));
    }
  }
  
class Ball {
    constructor(x, y, r) {
      this.x = x;
      this.y = y;
      this.radius = r;
    }
}
  
class Wall {
    constructor(x1, y1, x2, y2, f) {
      this.x1 = x1;
      this.y1 = y1;
      this.x2 = x2;
      this.y2 = y2;
      this.face = f;
    }
}

module.exports.Rect = Rect;
const utils = require('./utils.js');

function CirclesOverlap(x1, y1, r1, x2, y2, r2) {
  return Math.abs((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2)) <= (r1 + r2) * (r1 + r2);
}

function dynamicCircleStaticCircle(player, ball){
    if (CirclesOverlap(player.transform.pos.x, player.transform.pos.y, player.radius, ball.x, ball.y, ball.radius)) {
      var fDistance = Math.sqrt(Math.pow(player.transform.pos.x - ball.x, 2) + Math.pow(player.transform.pos.y - ball.y, 2));
      var fOverlap = (fDistance - player.radius - ball.radius);
      player.transform.pos.x -=  2*  fOverlap * (player.transform.pos.x - ball.x) / fDistance;
      player.transform.pos.y -=  2*  fOverlap * (player.transform.pos.y - ball.y) / fDistance;
      var nx = (ball.x - player.transform.pos.x) / fDistance;
      var ny = (ball.y - player.transform.pos.y) / fDistance;
      var tx = -ny;
      var ty = nx;
      var dpTan1 = player.rigidbody.vel.x * tx + player.rigidbody.vel.y * ty;
      var dpTan2 = 0;
      player.rigidbody.vel.x = tx * (dpTan1 + dpTan2) + 2*nx;
      player.rigidbody.vel.y = ty * (dpTan1 + dpTan2) + 2*ny;
      return true;
    }
    return false;
}

function resolveBulletBallCollision(bullet, ball) {
  if (CirclesOverlap(bullet.transform.pos.x, bullet.transform.pos.y, bullet.radius, ball.x, ball.y, ball.radius)) {
    bullet.isDestroyed = true;
    return true;
  }
  return false;
}

function triggerCircle2Circle(player, bullet) {
  if (CirclesOverlap(bullet.transform.pos.x, bullet.transform.pos.y, bullet.radius, player.transform.pos.x, player.transform.pos.y, player.radius)) {
    bullet.onEntityCollision(player);
    player.onEntityCollision(bullet);
    return true;
  }
  return false;
}

function dynamicCircleX2(c1, c2) {
  if (!CirclesOverlap(c1.transform.pos.x, c1.transform.pos.y, c1.radius, c2.transform.pos.x, c2.transform.pos.y, c2.radius)) return;
  var fDistance = Math.sqrt(Math.pow(c1.transform.pos.x - c2.transform.pos.x, 2) + Math.pow(c1.transform.pos.y - c2.transform.pos.y, 2));
  var fOverlap = (fDistance - c1.radius - c2.radius);
  c1.transform.pos.x -= fOverlap * (c1.transform.pos.x - c2.transform.pos.x) / fDistance;
  c1.transform.pos.y -= fOverlap * (c1.transform.pos.y - c2.transform.pos.y) / fDistance;
  c2.transform.pos.x += fOverlap * (c1.transform.pos.x - c2.transform.pos.x) / fDistance;
  c2.transform.pos.y += fOverlap * (c1.transform.pos.y - c2.transform.pos.y) / fDistance;
  var nx = (c2.transform.pos.x - c1.transform.pos.x) / fDistance;
  var ny = (c2.transform.pos.y - c1.transform.pos.y) / fDistance;
  var tx = -ny;
  var ty = nx;
  var dpTan1 = c1.rigidbody.vel.x * tx + c1.rigidbody.vel.y * ty;
  var dpTan2 = c2.rigidbody.vel.x * tx + c2.rigidbody.vel.y * ty;
  c1.rigidbody.setVel(tx * dpTan1 + nx, ty * dpTan1 + ny);
  c2.rigidbody.setVel(tx * dpTan2 + nx, ty * dpTan2 + ny);
}

function dynamicCircleStaticWall(player, wall){
  switch (wall.face) {
    case utils.TOP:
      if (player.transform.pos.y + player.radius > wall.y1 && player.transform.prev_pos.y + player.radius <= wall.y1 && player.transform.pos.x <= wall.x2 && player.transform.pos.x >= wall.x1) {
        player.transform.pos.y = wall.y1 - player.radius;
        player.rigidbody.vel.y = 0;
        return true;
      }
      break;
    case utils.BOTTOM:
      if (player.transform.pos.y - player.radius < wall.y1 && player.transform.prev_pos.y - player.radius >= wall.y1 && player.transform.pos.x <= wall.x2 && player.transform.pos.x >= wall.x1) {
        player.transform.pos.y = wall.y1 + player.radius;
        player.rigidbody.vel.y = 0;
        return true;
      }
      break;
    case utils.RIGHT:
      if (player.transform.pos.x - player.radius < wall.x1 && player.transform.prev_pos.x - player.radius >= wall.x1 && player.transform.pos.y <= wall.y2 && player.transform.pos.y >= wall.y1) {
        player.transform.pos.x = wall.x1 + player.radius;
        player.rigidbody.vel.x = 0;
        return true;
      }
      break;
    case utils.LEFT:
      if (player.transform.pos.x + player.radius > wall.x1 && player.transform.prev_pos.x + player.radius <= wall.x1 && player.transform.pos.y <= wall.y2 && player.transform.pos.y >= wall.y1) {
        player.transform.pos.x = wall.x1 - player.radius;
        player.rigidbody.vel.x = 0;
        return true;
      }
      break;
  }
  return false;
}

function dynamicCircleStaticRect(player, rect) {

  for (let i = 0; i < rect.balls.length; i++) {
    var ball = rect.balls[i];
    if (this.dynamicCircleStaticCircle(player, ball)) break;
  }

  for (let i = 0; i < rect.walls.length; i++) {
    var wall = rect.walls[i];
    if(this.dynamicCircleStaticWall(player,wall)) break;
  }

}

function triggerCircle2Rect(circle, rect) {
  if (circle.transform.pos.x + circle.radius >= rect.template.x &&
    circle.transform.pos.x - circle.radius <= rect.template.x + rect.template.w &&
    circle.transform.pos.y + circle.radius >= rect.template.y &&
    circle.transform.pos.y - circle.radius <= rect.template.y + rect.template.h)
  {
    circle.onSolidCollision();
  }
}

module.exports.CirclesOverlap = CirclesOverlap;
module.exports.dynamicCircleStaticCircle = dynamicCircleStaticCircle;
module.exports.resolveBulletBallCollision = resolveBulletBallCollision;
module.exports.triggerCircle2Circle = triggerCircle2Circle;
module.exports.dynamicCircleX2 = dynamicCircleX2;
module.exports.dynamicCircleStaticWall = dynamicCircleStaticWall;
module.exports.dynamicCircleStaticRect = dynamicCircleStaticRect;
module.exports.triggerCircle2Rect = triggerCircle2Rect;
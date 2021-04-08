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
    bullet.isDead = true;
    return true;
  }
  return false;
}

function triggerCircle2Circle(player, bullet) {
  if (bullet.id == player.id) return false;

  if (CirclesOverlap(bullet.transform.pos.x, bullet.transform.pos.y, bullet.radius, player.transform.pos.x, player.transform.pos.y, player.radius)) {
    player.receiveHit();
    /*if (player.isDead){
      this.playersKD[bullet.id].kills++;
      this.playersKD[player.id].deaths++;
      this.emitDataKD.push({idK: bullet.id, idD: player.id});
    }*/
    bullet.isDead = true;

    let vx = bullet.vel.x;
    let vy = bullet.vel.y;
    player.rigidbody.addForce(vx * 0.5, vy * 0.5);
    return true;
  }
  return false;
}

function dynamicCircleX2(player1, player2) {
  if (!CirclesOverlap(player1.pos.x, player1.pos.y, player1.radius, player2.pos.x, player2.pos.y, player2.radius)) return;
  var fDistance = Math.sqrt(Math.pow(player1.pos.x - player2.pos.x, 2) + Math.pow(player1.pos.y - player2.pos.y, 2));
  var fOverlap = (fDistance - player1.radius - player2.radius);
  player1.pos.x -= fOverlap * (player1.pos.x - player2.pos.x) / fDistance;
  player1.pos.y -= fOverlap * (player1.pos.y - player2.pos.y) / fDistance;
  player2.pos.x += fOverlap * (player1.pos.x - player2.pos.x) / fDistance;
  player2.pos.y += fOverlap * (player1.pos.y - player2.pos.y) / fDistance;
  var nx = (player2.pos.x - player1.pos.x) / fDistance;
  var ny = (player2.pos.y - player1.pos.y) / fDistance;
  var tx = -ny;
  var ty = nx;
  var dpTan1 = player1.vel.x * tx + player1.vel.y * ty;
  var dpTan2 = player2.vel.x * tx + player2.vel.y * ty;
  player1.vel.x = (tx * dpTan1 + nx);
  player1.vel.y = (ty * dpTan1 + ny);
  player2.vel.x = (tx * dpTan2 + nx);
  player2.vel.y = (ty * dpTan2 + ny);
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

function triggerCircle2Rect(bullet, rect) {
  if (bullet.transform.pos.x + bullet.radius >= rect.template.x &&
    bullet.transform.pos.x - bullet.radius <= rect.template.x + rect.template.w &&
    bullet.transform.pos.y + bullet.radius >= rect.template.y &&
    bullet.transform.pos.y - bullet.radius <= rect.template.y + rect.template.h) {
    bullet.isDead = true;
    return true;
  }
  return false;
}

module.exports.CirclesOverlap = CirclesOverlap;
module.exports.dynamicCircleStaticCircle = dynamicCircleStaticCircle;
module.exports.resolveBulletBallCollision = resolveBulletBallCollision;
module.exports.triggerCircle2Circle = triggerCircle2Circle;
module.exports.dynamicCircleX2 = dynamicCircleX2;
module.exports.dynamicCircleStaticWall = dynamicCircleStaticWall;
module.exports.dynamicCircleStaticRect = dynamicCircleStaticRect;
module.exports.triggerCircle2Rect = triggerCircle2Rect;
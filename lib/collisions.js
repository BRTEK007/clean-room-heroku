const utils = require('./utils.js');

function CirclesOverlap(x1, y1, r1, x2, y2, r2) {
  return Math.abs((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2)) <= (r1 + r2) * (r1 + r2);
}

function resolvePlayerBallCollision(player, ball){
    if (CirclesOverlap(player.pos.x, player.pos.y, player.radius, ball.x, ball.y, ball.radius)) {
      var fDistance = Math.sqrt(Math.pow(player.pos.x - ball.x, 2) + Math.pow(player.pos.y - ball.y, 2));
      var fOverlap = (fDistance - player.radius - ball.radius);
      player.pos.x -=  2*  fOverlap * (player.pos.x - ball.x) / fDistance;
      player.pos.y -=  2*  fOverlap * (player.pos.y - ball.y) / fDistance;
      var nx = (ball.x - player.pos.x) / fDistance;
      var ny = (ball.y - player.pos.y) / fDistance;
      var tx = -ny;
      var ty = nx;
      var dpTan1 = player.vel.x * tx + player.vel.y * ty;
      var dpTan2 = 0;
      player.vel.x = tx * (dpTan1 + dpTan2) + 2*nx;
      player.vel.y = ty * (dpTan1 + dpTan2) + 2*ny;
      return true;
    }
    return false;
}

function resolveBulletBallCollision(bullet, ball) {
  if (CirclesOverlap(bullet.pos.x, bullet.pos.y, bullet.radius, ball.x, ball.y, ball.radius)) {
    bullet.isDead = true;
    return true;
  }
  return false;
}

function resolvePlayerBulletCollision(player, bullet) {
  if (bullet.id == player.id) return false;

  if (CirclesOverlap(bullet.pos.x, bullet.pos.y, bullet.radius, player.pos.x, player.pos.y, player.radius)) {
    player.receiveHit();
    /*if (player.isDead){
      this.playersKD[bullet.id].kills++;
      this.playersKD[player.id].deaths++;
      this.emitDataKD.push({idK: bullet.id, idD: player.id});
    }*/
    bullet.isDead = true;

    let vx = bullet.vel.x;
    let vy = bullet.vel.y;
    player.knockback(vx * 0.5, vy * 0.5);
    return true;
  }
  return false;
}

function resolvePlayersCollision(player1, player2) {
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
  var dpNorm1 = player1.vel.x * nx + player1.vel.y * ny;
  var dpNorm2 = player1.vel.x * nx + player1.vel.y * ny;
  player1.vel.x = (tx * dpTan1 + nx);
  player1.vel.y = (ty * dpTan1 + ny);
  player2.vel.x = (tx * dpTan2 + nx);
  player2.vel.y = (ty * dpTan2 + ny);
}

function resolvePlayerWallCollision(player, wall){
  switch (wall.face) {
    case utils.TOP:
      if (player.pos.y + player.radius > wall.y1 && player.lastPos.y + player.radius <= wall.y1 && player.pos.x <= wall.x2 && player.pos.x >= wall.x1) {
        player.pos.y = wall.y1 - player.radius;
        player.vel.y = 0;
        return true;
      }
      break;
    case utils.BOTTOM:
      if (player.pos.y - player.radius < wall.y1 && player.lastPos.y - player.radius >= wall.y1 && player.pos.x <= wall.x2 && player.pos.x >= wall.x1) {
        player.pos.y = wall.y1 + player.radius;
        player.vel.y = 0;
        return true;
      }
      break;
    case utils.RIGHT:
      if (player.pos.x - player.radius < wall.x1 && player.lastPos.x - player.radius >= wall.x1 && player.pos.y <= wall.y2 && player.pos.y >= wall.y1) {
        player.pos.x = wall.x1 + player.radius;
        player.vel.x = 0;
        return true;
      }
      break;
    case utils.LEFT:
      if (player.pos.x + player.radius > wall.x1 && player.lastPos.x + player.radius <= wall.x1 && player.pos.y <= wall.y2 && player.pos.y >= wall.y1) {
        player.pos.x = wall.x1 - player.radius;
        player.vel.x = 0;
        return true;
      }
      break;
  }
  return false;
}

function resolvePlayerRectCollision(player, rect) {

  for (let i = 0; i < rect.balls.length; i++) {
    var ball = rect.balls[i];
    if (this.resolvePlayerBallCollision(player, ball)) break;
  }

  for (let i = 0; i < rect.walls.length; i++) {
    var wall = rect.walls[i];
    if(this.resolvePlayerWallCollision(player,wall)) break;
  }
}

function resolveBulletRectCollision(bullet, rect) {
  if (bullet.pos.x + bullet.radius >= rect.template.x &&
    bullet.pos.x - bullet.radius <= rect.template.x + rect.template.w &&
    bullet.pos.y + bullet.radius >= rect.template.y &&
    bullet.pos.y - bullet.radius <= rect.template.y + rect.template.h) {
    bullet.isDead = true;
    return true;
  }
  return false;
}

module.exports.CirclesOverlap = CirclesOverlap;
module.exports.resolvePlayerBallCollision = resolvePlayerBallCollision;
module.exports.resolveBulletBallCollision = resolveBulletBallCollision;
module.exports.resolvePlayerBulletCollision = resolvePlayerBulletCollision;
module.exports.resolvePlayersCollision = resolvePlayersCollision;
module.exports.resolvePlayerWallCollision = resolvePlayerWallCollision;
module.exports.resolvePlayerRectCollision = resolvePlayerRectCollision;
module.exports.resolveBulletRectCollision = resolveBulletRectCollision;
const utils = require('./utils.js');
const rectModule = require('./rect.js');
const Vector2D = require('./physics/Vector2D');
const { CircleShape } = require('./physics/shapes.js');
const SolidCollider = require('./entity/SolidCollider.js');

const collisionLayers = [
  [true, true, true],
  [true, true, true],
  [true, true, true],
]

function coll_det_circle2circle(x1, y1, r1, x2, y2, r2) {
  return Math.abs((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2)) <= (r1 + r2) * (r1 + r2);
}

function dynamicCircleStaticCircle(player, ball){
    if (coll_det_circle2circle(player.transform.pos.x, player.transform.pos.y, player.radius, ball.x, ball.y, ball.radius)) {
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

function triggerCircle2SolidCircle(tc, sc){
  if (coll_det_circle2circle(tc.transform.pos.x, tc.transform.pos.y, tc.radius, sc.x, sc.y, sc.radius)) {
    tc.onSolidCollision(sc);
  }
}

function triggerCircle2DynamicCircle(tc, dc) {
  if (coll_det_circle2circle(tc.transform.pos.x, tc.transform.pos.y, tc.radius, dc.transform.pos.x, dc.transform.pos.y, dc.radius)) {
    tc.onEntityCollision(dc);
    dc.onEntityCollision(tc);
  }
}

function dynamicCircleX2(c1, c2) {
  if (!coll_det_circle2circle(c1.transform.pos.x, c1.transform.pos.y, c1.radius, c2.transform.pos.x, c2.transform.pos.y, c2.radius)) return;
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

function triggerCircle2Wall(c, w){
  //horizontal
  if(w.face == utils.TOP || w.face == utils.BOTTOM){
    if(c.transform.pos.x + c.radius <= w.x2 && c.transform.pos.x - c.radius >= w.x1 && Math.abs(c.transform.pos.y - w.y1) <= c.radius){
      c.onSolidCollision();
      return;
    }
  }
  //vertical
  else{
    if(c.transform.pos.y + c.radius <= w.y2 && c.transform.pos.y - c.radius >= w.y1 && Math.abs(c.transform.pos.x - w.x1) <= c.radius){
      c.onSolidCollision();
      return;
    }
  }

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
    if (dynamicCircleStaticCircle(player, ball)) break;
  }

  for (let i = 0; i < rect.walls.length; i++) {
    var wall = rect.walls[i];
    if(dynamicCircleStaticWall(player,wall)) break;
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

function entitySolidCollision(e, s){
    if(s instanceof rectModule.SolidRectCollider){
      if(e.isTrigger) 
        triggerCircle2Rect(e, s);
      else
        dynamicCircleStaticRect(e, s);
    }
    else if(s instanceof rectModule.SolidCircleCollider){
      if(e.isTrigger) 
        triggerCircle2SolidCircle(e, s);
      else
        dynamicCircleStaticCircle(e, s);
    }
    else if(s instanceof rectModule.SolidWallCollider){
      if(e.isTrigger) 
        triggerCircle2Wall(e, s);
      else
        dynamicCircleStaticWall(e, s);
    }
}

function checkForCollision(e1, e2){
  if(e1.shape instanceof CircleShape && e2.shape instanceof CircleShape){
    if (coll_det_circle2circle(e1.transform.pos.x, e1.transform.pos.y, e1.shape.radius, e2.transform.pos.x, e2.transform.pos.y, e2.shape.radius)){
      return new Collision(e1, e2);
    }
  }

  /*if(!e1.isTrigger && !e2.isTrigger){
    //if e1 and e2 are circles
    //dynamicCircleX2(e1, e2);
    if (coll_det_circle2circle(e1.transform.pos.x, e1.transform.pos.y, e1.radius, e2.transform.pos.x, e2.transform.pos.y, e2.radius)){
      pen_res_bb(e1, e2);
      //coll_res_bb(e1, e2);
    }
  }/*else if(e1.isTrigger && e2.isTrigger){

  }
  else{
    if(e2.isTrigger){
      triggerCircle2DynamicCircle(e2, e1);
    }else{
      triggerCircle2DynamicCircle(e1, e2);
    }
  }*/

}

function resolveCollision(_col){
  _col.e1.onEntityCollision(_col.e2);
  _col.e2.onEntityCollision(_col.e1);

  if(_col.e1.isTrigger || _col.e2.isTrigger) return;

  //if circles
  //dynamicCircleX2(_col.e1, _col.e2);
  pen_res_circle2circle(_col.e1, _col.e2);
  //coll_res_circle2circle(_col.e1, _col.e2);

}

function pen_res_circle2circle(c1, c2){
  let inv_m1 = c1 instanceof SolidCollider ? 0 : 1/c1.rigidbody.mass;
  let inv_m2 = c2 instanceof SolidCollider ? 0 : 1/c2.rigidbody.mass;
  console.log(inv_m1, inv_m2)
  
  let dist = c1.transform.pos.subtr(c2.transform.pos);
  let pen_depth = c1.shape.radius + c2.shape.radius - dist.mag();
  //dividing the penetration depth in the ratio of the inverse masses
  let pen_res = dist.unit().mult(pen_depth / (inv_m1 + inv_m2));
  c1.transform.pos = c1.transform.pos.add(pen_res.mult(inv_m1));
  c2.transform.pos = c2.transform.pos.add(pen_res.mult(-inv_m2));
}

function coll_res_circle2circle(c1, c2){
  let normal = c1.transform.pos.subtr(c2.transform.pos).unit();
  let relVel = c1.rigidbody.vel.subtr(c2.rigidbody.vel);
  let sepVel = Vector2D.dot(relVel, normal);
  let new_sepVel = -sepVel * Math.min(c1.rigidbody.elasticity, c2.rigidbody.elasticity);
  
  //the difference between the new and the original sep.velocity value
  let vsep_diff = new_sepVel - sepVel;

  //dividing the impulse value in the ration of the inverse masses
  //and adding the impulse vector to the original vel. vectors
  //according to their inverse mass
  let impulse = vsep_diff / (1/c1.rigidbody.mass + 1/c2.rigidbody.mass);
  let impulseVec = normal.mult(impulse);

  c1.rigidbody.vel = c1.rigidbody.vel.add(impulseVec.mult(1/c1.rigidbody.mass));
  c2.rigidbody.vel = c2.rigidbody.vel.add(impulseVec.mult(-1/c2.rigidbody.mass));
}

class Collision{
  constructor(_e1, _e2, _t){
    this.e1 = _e1;
    this.e2 = _e2;
  }
}

module.exports.entitySolidCollision = entitySolidCollision;
module.exports.checkForCollision = checkForCollision;
module.exports.resolveCollision = resolveCollision;
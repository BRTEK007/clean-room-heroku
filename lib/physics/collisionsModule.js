const Bullet = require('../entity/Bullet.js');
const Player = require('../entity/Player.js');
const {SolidCircleCollider, SolidPolygonCollider, SolidWallCollider, CircleCollider, SolidCollider, Collider} = require('./collidersModule.js');
const Vector2D = require('./Vector2D');

class Collision{
  constructor(_e1, _e2, _t){
    this.e1 = _e1;
    this.e2 = _e2;
  }
}

class CollisionDetection{
  constructor(){};

  static circle2circle(x1, y1, r1, x2, y2, r2) {
    return Math.abs((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2)) <= (r1 + r2) * (r1 + r2);
  }

  static cirlce2solidWall(b1, w1){
    let ballToClosest = CollisionDetection.closestPointCircle2Wall(b1, w1).subtr(b1.transform.pos);
    return ballToClosest.mag() <= b1.radius ? true : false;
  }
  
  static closestPointCircle2Wall(b1, w1){
    let ballToWallStart = w1.start.subtr(b1.transform.pos);
    if(Vector2D.dot(w1.wallUnit(), ballToWallStart) > 0){
        return w1.start;
    }
  
    let wallEndToBall = b1.transform.pos.subtr(w1.end);
    if(Vector2D.dot(w1.wallUnit(), wallEndToBall) > 0){
        return w1.end;
    }
  
    let closestDist = Vector2D.dot(w1.wallUnit(), ballToWallStart);
    let closestVect = w1.wallUnit().mult(closestDist);
    return w1.start.subtr(closestVect);
  }
}

class CollisionReposition{
  constructor(){};
  static circle2circle(c1, c2){
      let inv_m1 = 1/c1.rigidbody.mass;
      let inv_m2 = 1/c2.rigidbody.mass;
      let dist = c1.transform.pos.subtr(c2.transform.pos);
      let pen_depth = c1.radius + c2.radius - dist.mag();
      let pen_res = dist.unit().mult(pen_depth / (inv_m1 + inv_m2));
      c1.transform.pos = c1.transform.pos.add(pen_res.mult(inv_m1));
      c2.transform.pos = c2.transform.pos.add(pen_res.mult(-inv_m2));
  }
  static circle2solidCircle(c1, c2){
      let inv_m1 = 1/c1.rigidbody.mass;
      let inv_m2 = 0;
      let dist = c1.transform.pos.subtr(c2.pos);
      let pen_depth = c1.radius + c2.radius - dist.mag();
      let pen_res = dist.unit().mult(pen_depth / (inv_m1 + inv_m2));
      c1.transform.pos = c1.transform.pos.add(pen_res.mult(inv_m1));
  }
  static cirlce2solidWall(b1, w1){
    let penVect = b1.transform.pos.subtr(CollisionDetection.closestPointCircle2Wall(b1, w1));
    b1.transform.pos = b1.transform.pos.add(penVect.unit().mult(b1.radius-penVect.mag()));
  }
}

class CollisionResponse{
  constructor(){};
  static circle2circle(c1, c2){
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
  static circle2solidCircle(c1, c2){
    let normal = c1.transform.pos.subtr(c2.pos).unit();
    let relVel = c1.rigidbody.vel;
    let sepVel = Vector2D.dot(relVel, normal);
    let new_sepVel = -sepVel * c1.rigidbody.elasticity;
    let vsep_diff = new_sepVel - sepVel;
    let impulse = vsep_diff / (1/c1.rigidbody.mass);
    let impulseVec = normal.mult(impulse);
  
    c1.rigidbody.vel = c1.rigidbody.vel.add(impulseVec.mult(1/c1.rigidbody.mass));
  }
  static cirlce2solidWall(b1, w1){
    let normal = b1.transform.pos.subtr(CollisionDetection.closestPointCircle2Wall(b1, w1)).unit();
    let sepVel = Vector2D.dot(b1.rigidbody.vel, normal);
    let new_sepVel = -sepVel * b1.rigidbody.elasticity;
    let vsep_diff = sepVel - new_sepVel;
    b1.rigidbody.vel = b1.rigidbody.vel.add(normal.mult(-vsep_diff));
  }
}

function checkForCollision(e1, e2){
  var collisions = [];
  //e1 always Collider e2 might be solid
  if(e2 instanceof Collider){
    if(e1 instanceof CircleCollider){
      if(e2 instanceof CircleCollider){
        if (CollisionDetection.circle2circle(e1.transform.pos.x, e1.transform.pos.y, e1.radius, e2.transform.pos.x, e2.transform.pos.y, e2.radius)){
          collisions.push(new Collision(e1, e2));
        }
      }
    }
  }else{
    if(e1 instanceof CircleCollider){
      if(e2 instanceof SolidCircleCollider){
        if (CollisionDetection.circle2circle(e1.transform.pos.x, e1.transform.pos.y, e1.radius, e2.pos.x, e2.pos.y, e2.radius)){
          collisions.push(new Collision(e1, e2));
        }
      }else if(e2 instanceof SolidWallCollider){
        if(CollisionDetection.cirlce2solidWall(e1, e2))
          collisions.push(new Collision(e1, e2));
      }else if(e2 instanceof SolidPolygonCollider){
        for(let i = 0; i < e2.walls.length; i++){
          if(CollisionDetection.cirlce2solidWall(e1, e2.walls[i]))
            collisions.push(new Collision(e1, e2.walls[i]));
        }
      }
    }
  }

  return collisions;

}

function resolveCollision(_col){
  //e1 is always entity e2 might be solid
  if(_col.e2 instanceof Collider){
    _col.e1.onEntityCollision(_col.e2);
    _col.e2.onEntityCollision(_col.e1);
    if(_col.e1.isTrigger || _col.e2.isTrigger) return;

    if(_col.e1 instanceof CircleCollider && _col.e2 instanceof CircleCollider){
      CollisionReposition.circle2circle(_col.e1, _col.e2);
      CollisionResponse.circle2circle(_col.e1, _col.e2);
    }
    
  }else{//e2 is solid
    _col.e1.onSolidCollision(_col.e2);
    if(_col.e1.isTrigger) return;

    if(_col.e1 instanceof CircleCollider){
      if(_col.e2 instanceof SolidCircleCollider){
        CollisionReposition.circle2solidCircle(_col.e1, _col.e2);
        CollisionResponse.circle2solidCircle(_col.e1, _col.e2);
      }else if(_col.e2 instanceof SolidWallCollider){
        CollisionReposition.cirlce2solidWall(_col.e1, _col.e2);
        CollisionResponse.cirlce2solidWall(_col.e1, _col.e2);
      }
    }

  }

}

module.exports = {checkForCollision, resolveCollision};
const { cpuCount } = require('os-utils');
const Vector2D = require('./Vector2D');

class Collider{
    constructor(_transform, _options = {}){
      this.transform = _transform;
      this.rigidbody = _options.rigidbody || null;
      this.isTrigger = _options.isTrigger || false;
      //this.isDynamic = this.rigidbody ? true : false;
      this.isDisabled = false;
      this.layer = 0;
      this.onEntityCollision = (other) => {};
      //this.onSolidCollision = () => {};
    }
}

class CircleCollider extends Collider{
  constructor(_transform, _radius, _options = {}){
    super(_transform, _options);
    this.radius = _radius;
  }
}

class SolidCollider{
  constructor(){};
}

class SolidCircleCollider extends SolidCollider{
  constructor(_x, _y, _r) {
    super();
    this.pos = new Vector2D(_x, _y);
    this.radius = _r;
  }
}

class SolidWallCollider extends SolidCollider{
constructor(x1, y1, x2, y2){
    super();
    this.start = new Vector2D(x1, y1);
    this.end = new Vector2D(x2, y2);
}
wallUnit(){
    return this.end.subtr(this.start).unit();
}
}

class SolidPolygonCollider extends SolidCollider{
constructor(){
  super();
  this.walls = [];
}
addWall(x1, y1, x2, y2){
  this.walls.push(new SolidWallCollider(x1, y1, x2, y2));
}
}

function createVertexShapeCollider(_data){
  var polygon = new SolidPolygonCollider();
  for(let j = 0; j < _data.length-1; j++){
    polygon.addWall(_data[j][0], _data[j][1], _data[j+1][0], _data[j+1][1]);
  }
  return polygon;
}

function createRegularPolygonCollider(_data){
  var polygon = new SolidPolygonCollider();
  var angle = 2*Math.PI/_data.verticies;
  var rotation = 2*Math.PI*_data.rotation/360;
  for(let i = 0; i < _data.verticies-1; i++){
    let x = _data.x + Math.round(Math.cos(rotation + angle*i)*_data.radius);
    let y = _data.y + Math.round(Math.sin(rotation + angle*i)*_data.radius);
    let nx = _data.x + Math.round(Math.cos(rotation + angle*(i+1))*_data.radius);
    let ny = _data.y + Math.round(Math.sin(rotation + angle*(i+1))*_data.radius);
    polygon.addWall(x, y, nx, ny);
    if(i == _data.verticies-2)
      polygon.addWall(nx, ny, _data.x + Math.round(Math.cos(rotation)*_data.radius), _data.y + Math.round(Math.sin(rotation)*_data.radius));
  }
  return polygon;
}

module.exports = {SolidCollider, Collider, CircleCollider, SolidCircleCollider, SolidWallCollider, SolidPolygonCollider, createVertexShapeCollider, createRegularPolygonCollider};
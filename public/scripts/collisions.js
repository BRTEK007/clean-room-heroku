class CollisionDetection{
    constructor(){};
  
    static circle2circle(x1, y1, r1, x2, y2, r2) {
      return Math.abs((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2)) <= (r1 + r2) * (r1 + r2);
    }

    static cirlce2solidWall(b1, w1){
        let ballToClosest = CollisionDetection.closestPointCircle2Wall(b1, w1).subtr(b1.pos);
        return ballToClosest.mag() <= b1.radius ? true : false;
    }
      
    static closestPointCircle2Wall(b1, w1){
        let ballToWallStart = w1.start.subtr(b1.pos);
        let wallUnit = w1.wallUnit();

        if(Vector2D.dot(wallUnit, ballToWallStart) > 0){
            return w1.start;
        }
      
        let wallEndToBall = b1.pos.subtr(w1.end);
        if(Vector2D.dot(wallUnit, wallEndToBall) > 0){
            return w1.end;
        }
      
        let closestDist = Vector2D.dot(wallUnit, ballToWallStart);
        let closestVect = wallUnit.mult(closestDist);
        return w1.start.subtr(closestVect);
    }

}

class SolidCollider{
    constructor(){};
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
    constructor(_app){
      super();
      this.walls = [];
      this.graphic = new PIXI.Graphics();
      this.graphic.lineStyle(2, 0xFFFFFF);
      Object.assign(this.graphic, {worldPos : {x : 0, y : 0}} );
      _app.stage.addChild(this.graphic);
    }
    addWall(x1, y1, x2, y2){
      this.graphic.moveTo(x1, y1);
      this.graphic.lineTo(x2, y2);
      this.walls.push(new SolidWallCollider(x1, y1, x2, y2));
    }
}

class SolidCircleCollider extends SolidCollider{
    constructor(_d, _app) {
      super();
      this.pos = new Vector2D(_d.x, _d.y);
      this.radius = _d.r;

      this.graphic = new PIXI.Graphics();
      this.graphic.x = _d.x;
      this.graphic.y = _d.y;
      this.graphic.lineStyle(2, 0xFFFFFF);
      this.graphic.drawCircle(0,0, _d.r);
      Object.assign(this.graphic, {worldPos : {x : _d.x, y : _d.y}} );
      _app.stage.addChild(this.graphic);
    }
}

function createVertexShapeCollider(s, app){
    var polygon = new SolidPolygonCollider(app);

    for(let j = 1; j < s.length; j++)
      polygon.addWall(s[j-1][0], s[j-1][1], s[j][0], s[j][1]);
    
    return polygon;
}

function createRegularPolygon(_data, _app){
    var polygon = new SolidPolygonCollider(_app);
  
    var angle = 2*Math.PI/_data.verticies;
    var rotation = 2*Math.PI*_data.rotation/360;
  
    for(let i = 0; i < _data.verticies; i++){
        let x1 = _data.x + Math.round(Math.cos(rotation + angle*i)*_data.radius);
        let y1 = _data.y + Math.round(Math.sin(rotation + angle*i)*_data.radius);
        let x2 = _data.x + Math.round(Math.cos(rotation + angle*(i+1))*_data.radius);
        let y2 = _data.y + Math.round(Math.sin(rotation + angle*(i+1))*_data.radius);
        polygon.addWall(x1, y1, x2, y2);
    }
    return polygon;
}

function bulletSolidCollision(_b, _s){
    if(_s instanceof SolidPolygonCollider){
        for(let i = 0; i < _s.walls.length; i++){
          if(CollisionDetection.cirlce2solidWall(_b, _s.walls[i])){
            _b.isDead = true;
            return;
          }
        }
    }else if(_s instanceof SolidCircleCollider){
        if(CollisionDetection.circle2circle(_b.pos.x, _b.pos.y, _b.radius, _s.pos.x, _s.pos.y, _s.radius)){
            _b.isDead = true;
            return;
        }
    }
}

function bulletPlayerCollision(_b, _p){
    if(CollisionDetection.circle2circle(_b.pos.x, _b.pos.y, _b.radius, _p.pos.x, _p.pos.y, _p.radius)){
        _b.isDead = true;
        return;
    }
}
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
        let wallUnit = w1.wallUnit();

        if(Vector2D.dot(wallUnit, ballToWallStart) > 0){
            return w1.start;
        }
      
        let wallEndToBall = b1.transform.pos.subtr(w1.end);
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
      this.app = _app;
      this.walls = [];
      this.graphic = new PIXI.Graphics();
      this.graphic.lineStyle(2, 0xFFFFFF);
      Object.assign(this.graphic, {worldPos : {x : 0, y : 0}} );
    }
    addWall(x1, y1, x2, y2){
      this.walls.push(new SolidWallCollider(x1, y1, x2, y2));
    }
}

function createVertexShapeCollider(s, app){
    var polygon = new SolidPolygonCollider(app);

    polygon.graphic.moveTo(s[0][0], s[0][1]);

    for(let j = 1; j < s.length; j++){
      polygon.addWall(s[j-1][0], s[j-1][1], s[j][0], s[j][1]);
      polygon.graphic.lineTo(s[j][0], s[j][1]);
    }

    app.stage.addChild(polygon.graphic);
    return polygon;
}
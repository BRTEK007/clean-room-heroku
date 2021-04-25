

function getOutlineColor(dec){
  let b = (dec % 256);
  dec = (dec-b)/256;
  let g = (dec%256);
  dec = (dec-g)/256;
  let r = dec;
  return Math.max(r-50, 0) * 256*256 + Math.max(g-50, 0)*256 + Math.max(b-50, 0);
}


class Player {
    constructor(data, _game) {
      this.pos = new Vector2D(data.x, data.y);
      this.rotation = 0;
      this.radius = 25;
      this.health = 1;
      this.isDead = false;
      this.serverTransform = {
        pos : new Vector2D(data.x, data.y),
        rotation: 0,
        delta: Infinity
      };
      this.game = _game;
      //visuals
      this.app = this.game.app;
      this.color = data.color;
      let outlineColor = getOutlineColor(data.color);
      //gun
      this.gunGraphic = new PIXI.Graphics();
      this.gunGraphic.beginFill(data.color);
      this.gunGraphic.lineStyle(4, outlineColor); 
      this.gunGraphic.drawRect(0, -12, 40, 24);
      this.gunGraphic.endFill();
      this.app.stage.addChild(this.gunGraphic);
      this.gunGraphic.x = data.x;
      this.gunGraphic.y = data.y;
      //body
      this.graphic = new PIXI.Graphics();
      this.graphic.beginFill(data.color);
      this.graphic.lineStyle(4, outlineColor);  //(thickness, color)
      this.graphic.drawCircle(0, 0, 25);
      this.graphic.endFill();
      //eyes
      this.graphic.lineStyle(2, outlineColor);
      this.graphic.beginFill(0xffffff);
      this.graphic.drawCircle(-4, -10, 8);
      this.graphic.drawCircle(-4, 10, 8);
      this.graphic.beginFill(0x000000);
      this.graphic.lineStyle(0, 0);
      this.graphic.drawCircle(-4, -10, 4);
      this.graphic.drawCircle(-4, 10, 4);
      this.app.stage.addChild(this.graphic);
      this.graphic.x = data.x;
      this.graphic.y = data.y;
      //tail
      this.particles = [];
      this.lastPlacedShade = new Vector2D(this.pos.x, this.pos.y);
      //identification
      this.id = data.id;
      this.nick = new PIXI.Text(data.nick, {fontFamily : 'Arial', fontSize: 20, fill : data.color, align : 'center'});
      this.nick.anchor.x = 0.5;
      this.app.stage.addChild(this.nick);
      //
      Object.assign(this.graphic, {worldPos : {x : this.graphic.x, y : this.graphic.y}} );
      Object.assign(this.nick, {worldPos : {x : this.nick.x, y : this.nick.y}} );
      Object.assign(this.gunGraphic, {worldPos : {x : this.gunGraphic.x, y : this.gunGraphic.y}} );
      //gun pos
      this.firePointMag = 65;
      this.firePointPos = {x: 0, y: 0};
    }
  
    updateHealth(h) {
      if (!this.isDead && h <= 0) {
        this.isDead = true;
        this.changeVisibility(false);
        return;
      } else if (this.isDead && h >= 1) {
        this.isDead = false;
        this.changeVisibility(true);
      }
      this.health = h;
    }
  
    showGraphic() {
      this.app.stage.addChild(this.gunGraphic);
      this.app.stage.addChild(this.graphic);
      this.app.stage.addChild(this.nick);
    }
  
    changeVisibility(_v) {
      this.graphic.visible = _v;
      this.gunGraphic.visible = _v;
      this.nick.visible = _v;
    }

    destroy() {
      this.app.stage.removeChild(this.graphic);
      this.app.stage.removeChild(this.nick);
      this.app.stage.removeChild(this.gunGraphic);
    }
  
    updateTransform(delta) {
      this.pos = Vector2D.lerp(this.pos, this.serverTransform.pos, delta/this.serverTransform.delta);
      this.rotation = this.circularLerp(this.rotation, this.serverTransform.rotation, delta/this.serverTransform.delta);
  
      //visuals
      this.graphic.worldPos.x = this.pos.x;
      this.graphic.worldPos.y = this.pos.y;
      this.graphic.rotation = this.rotation;
  
      this.nick.worldPos.x = this.pos.x;
      this.nick.worldPos.y = this.pos.y - 60;

      this.gunGraphic.worldPos.x = this.pos.x;
      this.gunGraphic.worldPos.y = this.pos.y;
      this.gunGraphic.rotation = this.rotation;
      if(this.gunGraphic.scale.x < 1){
        this.gunGraphic.scale.x += 0.01;
      }
      
      /*if(Vector2D.distSquare(this.pos, this.lastPlacedShade) > Math.pow(12.5, 2)){
        this.lastPlacedShade.x = this.pos.x;
        this.lastPlacedShade.y = this.pos.y;
        this.particles.push(
          new Particle(this.pos.x, this.pos.y, 
          new Vector2D(this.serverTransform.x - this.pos.x, this.serverTransform.y - this.pos.y).normal(), 
          this.particles[this.particles.length-1], 
          this.color,
          this.app));
      }*/

      /*for(let i = 0; i < this.particles.length; i++){
        if(this.particles[i].radius <= 0){
          if(i != 0)
            this.app.stage.removeChild(this.particles[i].graphic);
          this.particles.splice(i, 1);
          continue;
        }
        this.particles[i].update(delta);
      }*/

    }
  
    circularLerp(start, end, time){
      if(Math.abs(start - end) > Math.abs(start - (end - Math.PI*2) )) end = end - Math.PI*2;
      else if(Math.abs(start - end) > Math.abs(start - (end + Math.PI*2) )) end = end + Math.PI*2;
      return start * (1-time) + end * time;
    }
  
    updateServerPos(data, delta){
      this.serverTransform.pos.x = data.x;
      this.serverTransform.pos.y = data.y;
      this.serverTransform.rotation = data.rotation;
      this.serverTransform.delta = delta;
      //fire poiont
      this.firePointPos.x = data.x + Math.cos(data.rotation) * this.firePointMag;
      this.firePointPos.y = data.y + Math.sin(data.rotation) * this.firePointMag;
    }

    shootAnim(){
      this.gunGraphic.scale.x = 0.8;
    }
}

class Particle{
  constructor(_x, _y, _n, _prev, _color,_app){
    this.n = _n;
    this.pos = new Vector2D(_x, _y);
    this.color = _color;
    this.prev = _prev;
    if(_prev == null){
      this.radius = 25;
      this.rightPoint = new Vector2D(0,0);
      this.leftPoint = new Vector2D(0,0);
    }else{
      this.radius = 25;
      this.rightPoint = new Vector2D(_n.x*this.radius, _n.y*this.radius);
      this.leftPoint = new Vector2D(-_n.x*this.radius, -_n.y*this.radius);
      if(
        Vector2D.dot(this.rightPoint, _prev.rightPoint) < Vector2D.dot(this.rightPoint, _prev.leftPoint)
      ){
        let t = this.rightPoint;
        this.rightPoint = this.leftPoint;
        this.leftPoint = t;
      }

      this.graphic = new PIXI.Graphics();
      this.graphic.beginFill(_color);
      this.graphic.moveTo(this.pos.x + this.rightPoint.x, this.pos.y + this.rightPoint.y);
      this.graphic.lineTo(_prev.pos.x + _prev.rightPoint.x, _prev.pos.y + _prev.rightPoint.y);
      this.graphic.lineTo(_prev.pos.x + _prev.leftPoint.x, _prev.pos.y + _prev.leftPoint.y);
      this.graphic.lineTo(this.pos.x + this.leftPoint.x, this.pos.y + this.leftPoint.y);
      this.graphic.closePath();
      this.graphic.endFill();
      _app.stage.addChild(this.graphic);
      Object.assign(this.graphic, {worldPos : {x : 0, y : 0}} );

      /*_app.stage.addChild(this.graphic);
      this.graphic.x = this.pos.x;
      this.graphic.y = this.pos.y;
      //Object.assign(this.graphic, {worldPos : {x : this.pos.x, y : this.pos.y}} );
      Object.assign(this.graphic, {worldPos : {x : 0, y : 0}} );*/
    }
  }

  update(){
    if(this.graphic){
      this.graphic.clear();
      this.graphic.beginFill(this.color);
      this.graphic.moveTo(this.pos.x + this.rightPoint.x, this.pos.y + this.rightPoint.y);
      this.graphic.lineTo(this.prev.pos.x + this.prev.rightPoint.x, this.prev.pos.y + this.prev.rightPoint.y);
      this.graphic.lineTo(this.prev.pos.x + this.prev.leftPoint.x, this.prev.pos.y + this.prev.leftPoint.y);
      this.graphic.lineTo(this.pos.x + this.leftPoint.x, this.pos.y + this.leftPoint.y);
      this.graphic.closePath();
      this.graphic.endFill();
      //this.tintColor -= 65793*4;
      //this.graphic.scale.x -= 0.05;
      //this.graphic.scale.y -= 0.05;
      this.rightPoint = new Vector2D(this.n.x*this.radius, this.n.y*this.radius);
      this.leftPoint = new Vector2D(-this.n.x*this.radius, -this.n.y*this.radius);
      if(
        Vector2D.dot(this.rightPoint, this.prev.rightPoint) < Vector2D.dot(this.rightPoint, this.prev.leftPoint)
      ){
        let t = this.rightPoint;
        this.rightPoint = this.leftPoint;
        this.leftPoint = t;
      }
      this.radius -= 1;
    }
  }
}
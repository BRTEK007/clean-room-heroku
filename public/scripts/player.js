

function getOutlineColor(dec){
  let b = (dec % 256);
  dec = (dec-b)/256;
  let g = (dec%256);
  dec = (dec-g)/256;
  let r = dec;
  return Math.max(r-50, 0) * 256*256 + Math.max(g-50, 0)*256 + Math.max(b-50, 0);
}


class Player {
    constructor(data, app) {
      this.pos = {
        x: data.x,//data.x, y
        y: data.y
      };
      this.rotation = 0;
      this.radius = 25;
      this.health = 3;
      this.dead = false;
      this.serverTransform = {
        x: data.x,
        y: data.y,
        rotation: 0,
        delta: Infinity
      };
  
      //visuals
      this.app = app;
      this.graphic = new PIXI.Graphics();
      this.color = data.color;
      let outlineColor = getOutlineColor(data.color);
      //gun
      this.graphic.beginFill(0x545454);
      this.graphic.drawRect(10, -8, 40, 16);
      this.graphic.endFill();
      //body
      this.graphic.beginFill(data.color);
      this.graphic.lineStyle(4, outlineColor);  //(thickness, color)
      this.graphic.drawCircle(0, 0, 25);
      this.graphic.endFill();
      this.graphic.x = data.x;
      this.graphic.y = data.y;
      app.stage.addChild(this.graphic);
      //tail
      this.tail = [];
      this.lastPlacedShade = new Vector2D(this.pos.x, this.pos.y);
      //identification
      this.id = data.id;
      this.nick = new PIXI.Text(data.nick, {fontFamily : 'Arial', fontSize: 20, fill : data.color, align : 'center'});
      this.nick.anchor.x = 0.5;
      this.app.stage.addChild(this.nick);
      //
      Object.assign(this.graphic, {worldPos : {x : this.graphic.x, y : this.graphic.y}} );
      Object.assign(this.nick, {worldPos : {x : this.nick.x, y : this.nick.y}} );
      //gun pos
      this.firePointMag = 65;
      this.firePointPos = {x: 0, y: 0};
    }
  
    updateHealth(h) {
      if (h <= 0) {
        this.dead = true;
        this.destroy();
        return;
      } else if (h >= 3) {
        this.dead = false;
        this.respawn();
      }
      this.health = h;
    }
  
    respawn() {
      this.app.stage.addChild(this.graphic);
      this.app.stage.addChild(this.nick);
    }
  
    destroy() {
      this.app.stage.removeChild(this.graphic);
      this.app.stage.removeChild(this.nick);
    }
  
    updateTransform(delta) {
      this.pos.x = this.lerp(this.pos.x, this.serverTransform.x, delta/this.serverTransform.delta);
      this.pos.y = this.lerp(this.pos.y, this.serverTransform.y, delta/this.serverTransform.delta);
      this.rotation = this.circularLerp(this.rotation, this.serverTransform.rotation, delta/this.serverTransform.delta);
  
      //visuals
      this.graphic.worldPos.x = this.pos.x;
      this.graphic.worldPos.y = this.pos.y;
      this.graphic.rotation = this.rotation;
  
      this.nick.worldPos.x = this.pos.x;
      this.nick.worldPos.y = this.pos.y - 60;
    }
  
    lerp(start, end, time){return start * (1-time) + end * time;}
  
    circularLerp(start, end, time){
      if(Math.abs(start - end) > Math.abs(start - (end - Math.PI*2) )) end = end - Math.PI*2;
      else if(Math.abs(start - end) > Math.abs(start - (end + Math.PI*2) )) end = end + Math.PI*2;
      return start * (1-time) + end * time;
    }
  
    updateServerPos(data, delta){
      this.serverTransform.x = data.x;
      this.serverTransform.y = data.y;
      this.serverTransform.rotation = data.rotation;
      this.serverTransform.delta = delta;
      //fire poiont
      this.firePointPos.x = data.x + Math.cos(data.rotation) * this.firePointMag;
      this.firePointPos.y = data.y + Math.sin(data.rotation) * this.firePointMag;
    }
}

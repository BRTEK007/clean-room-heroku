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
      let outlineColor = getOutlineColor(data.color);
      //gun
      this.graphic.beginFill(0x545454);
      this.graphic.drawRect(-8, -60, 16, 40);
      this.graphic.endFill();
      //body
      this.graphic.beginFill(data.color);
      this.graphic.drawCircle(0, 0, 25);
      this.graphic.lineStyle(4, outlineColor);  //(thickness, color)
      this.graphic.drawCircle(0, 0, 24);   //(x,y,radius)
      this.graphic.endFill();
       //eyes
      this.graphic.lineStyle(0, outlineColor);
      this.graphic.beginFill(0xffffff);
      this.graphic.drawCircle(-10, 4, 8);
      this.graphic.drawCircle(10, 4, 8);
      this.graphic.beginFill(0x000000);
      this.graphic.drawCircle(-10, 4, 4);
      this.graphic.drawCircle(10, 4, 4);
      //hand 1
      this.graphic.beginFill(data.color);
      this.graphic.drawCircle(2, -20, 8);
      this.graphic.lineStyle(2, outlineColor);  //(thickness, color)
      this.graphic.drawCircle(2, -20, 7);   //(x,y,radius)
      this.graphic.endFill();
      //hand 2
      this.graphic.beginFill(data.color);
      this.graphic.drawCircle(8, -45, 8);
      this.graphic.lineStyle(2, outlineColor);  //(thickness, color)
      this.graphic.drawCircle(8, -45, 7);   //(x,y,radius)
      this.graphic.endFill();  
      //health bar holder
      this.graphic.beginFill(0xFF0000);
      this.graphic.drawRect(-20, 35, 40, 10);
      this.graphic.endFill();
      //this.graphic.scale.set(2);
      this.graphic.x = data.x;
      this.graphic.y = data.y;
      app.stage.addChild(this.graphic);
      //health_bar
      this.health_bar = new PIXI.Graphics();
      this.health_bar.beginFill(0x00FF00);
      this.health_bar.drawRect(-20, 35, 40, 10);
      this.health_bar.endFill();
      app.stage.addChild(this.health_bar);
      //this.health_bar.width = 20;
      //identification
      this.id = data.id;
      this.nick = new PIXI.Text(data.nick, {fontFamily : 'Arial', fontSize: 20, fill : data.color, align : 'center'});
      this.nick.anchor.x = 0.5;
      this.app.stage.addChild(this.nick);
      //gun pos
      this.firePointAngle = -Math.PI/2;
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
      this.health_bar.scale.x = this.health/3;
      //this.health_bar.texture = TEXTURES.health_bar[3 - this.health];
    }
  
    respawn() {
      this.app.stage.addChild(this.graphic);
      this.app.stage.addChild(this.health_bar);
      this.app.stage.addChild(this.nick);
    }
  
    destroy() {
      this.app.stage.removeChild(this.graphic);
      this.app.stage.removeChild(this.health_bar);
      this.app.stage.removeChild(this.nick);
    }
  
    updateTransform(delta) {
      this.pos.x = this.lerp(this.pos.x, this.serverTransform.x, delta/this.serverTransform.delta);
      this.pos.y = this.lerp(this.pos.y, this.serverTransform.y, delta/this.serverTransform.delta);
      this.rotation = this.circularLerp(this.rotation, this.serverTransform.rotation, delta/this.serverTransform.delta);
  
      //visuals
      this.graphic.x = this.pos.x;
      this.graphic.y = this.pos.y;
      this.graphic.rotation = this.rotation;
  
      this.health_bar.x = this.pos.x;
      this.health_bar.y = this.pos.y;
      this.health_bar.rotation = this.rotation;
  
      this.nick.x = this.pos.x;
      this.nick.y = this.pos.y - 60;
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
      this.firePointPos.x = data.x + Math.cos(data.rotation + this.firePointAngle) * this.firePointMag;
      this.firePointPos.y = data.y + Math.sin(data.rotation + this.firePointAngle) * this.firePointMag;
    }
  
  
}

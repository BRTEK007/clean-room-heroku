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
      //gun
      this.graphic.beginFill(0xDDDDDD);
      this.graphic.drawRect(-10, -40, 20, 25);
      this.graphic.endFill();
      //body
      this.graphic.beginFill(data.color);//data.color
      this.graphic.drawCircle(0, 0, 25);
      this.graphic.endFill();
      this.graphic.x = data.x;
      this.graphic.y = data.y;
      app.stage.addChild(this.graphic);
      //health_bar
      this.health_bar = new PIXI.Sprite(TEXTURES.health_bar[0]);
      this.health_bar.scale.set(3);
      this.health_bar.anchor.x = 0.5;
      this.health_bar.anchor.y = -1.5;
      this.health_bar.x = data.x;
      this.health_bar.y = data.y;
      this.app.stage.addChild(this.health_bar);
      this.lastServerDelta;
      //identification
      this.id = data.id;
      this.nick = new PIXI.Text(data.nick, {fontFamily : 'Arial', fontSize: 20, fill : 0xffffff, align : 'center'});
      this.app.stage.addChild(this.nick);
      //gun pos
      this.firePointAngle = -Math.PI/2;
      this.firePointMag = 50;
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
      this.health_bar.texture = TEXTURES.health_bar[3 - this.health];
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
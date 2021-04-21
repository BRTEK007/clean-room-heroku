class Bullet {
    constructor(id, px, py, vx, vy, app) {
      this.id = id;
      this.pos = {
        x: px,
        y: py
      };
      this.vel = {
        x: vx,
        y: vy
      };
      this.radius = 10;
      this.idDead = false;
  
      this.graphic = new PIXI.Graphics();
      this.graphic.beginFill(0xFFFF00);
      this.graphic.drawCircle(0, 0, 10);
      this.graphic.endFill();
      Object.assign(this.graphic, {worldPos : {x : px, y : py}} );
      this.app = app;
      this.app.stage.addChild(this.graphic);
    }
  
    update(delta) {
      this.pos.x += this.vel.x * delta;
      this.pos.y += this.vel.y * delta;
      this.graphic.worldPos.x = this.pos.x;
      this.graphic.worldPos.y = this.pos.y;
    }
  
    destroy() {
      this.app.stage.removeChild(this.graphic);
    }
  }
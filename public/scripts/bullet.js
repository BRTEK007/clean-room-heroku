class Bullet {
    constructor(px, py, vx, vy, _color ,app) {
      this.pos = new Vector2D(px, py);
      this.vel = new Vector2D(vx, vy);
      this.radius = 12;
      this.idDead = false;
  
      this.graphic = new PIXI.Graphics();
      this.graphic.beginFill(_color);
      this.graphic.lineStyle(4, getOutlineColor(_color));
      this.graphic.drawCircle(0, 0, this.radius);
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
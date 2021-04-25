class Bullet {
    constructor(_player, px, py, vx, vy ,app) {
      this.player =_player;
      this.pos = new Vector2D(px, py);
      this.vel = new Vector2D(vx, vy);
      this.radius = 12;
      this.idDead = false;
  
      this.graphic = new PIXI.Graphics();
      this.graphic.beginFill(_player.color);
      this.graphic.lineStyle(4, getOutlineColor(_player.color));
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
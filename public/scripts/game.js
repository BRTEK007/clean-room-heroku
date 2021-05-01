class Game{
    constructor(data) {
      let doc_w = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
      let doc_h = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
      this.app = new PIXI.Application({
        width: doc_w,
        height: doc_h,
        backgroundColor: 0x000000,
        resolution: window.devicePixelRatio || 1,
      });
      document.getElementById('gameDiv').appendChild(this.app.view);
      this.inputManager = new InputManager();
  
      this.map = data.map;
      this.players = new Array();
      this.clientPlayer = null;
      this.bullets = [];
      this.particleSystems = [];
      //add players
      for(let i = 0; i < data.players.length; i++){
        this.createPlayer(data.players[i]);
      }
      this.camera = new Camera(doc_w, doc_h);

      this.solidColliders = [];
      //add circles
      for(let i = 0; i < data.map.balls.length; i++)
        this.solidColliders.push(new SolidCircleCollider(data.map.balls[i], this.app));
      //add vertex shapes
      for(let i = 0; i < data.map.vertexShapes.length; i++)
        this.solidColliders.push(createVertexShapeCollider(data.map.vertexShapes[i], this.app)); 
      //add regular polygons
      for(let i = 0; i < data.map.regularPolygons.length; i++)
        this.solidColliders.push(createRegularPolygon(data.map.regularPolygons[i], this.app));
    }

    resizeRequest(){
      return;
      if(!this.initialized) return;
      let doc_w = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
      let doc_h = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;

      this.app.view.style.width = doc_w + 'px';
      this.app.view.style.height = doc_h + 'px';
      this.app.view.width = doc_w
      this.app.view.height = doc_h;

      this.camera.resize(doc_w, doc_h);
    }

    terminate(){
      this.inputManager.terminate();
      this.app.view.remove();
    }
  
    update(delta) {
      //console.clear();
      //console.log(this.bullets.length);
      //update players
      for (let i = 0; i < this.players.length; i++) {
        if(!this.players[i].isDead)
        this.players[i].updateTransform(delta);
      }
  
      //update bullets
      for (let i = 0; i < this.bullets.length; i++) {
        //remove dead bullets
        if (this.bullets[i].isDead) {
          this.bullets[i].destroy();
          this.bullets.splice(i, 1);
          //i--;
          continue;
        }
        this.bullets[i].update(delta);
      }
      //bullets collisions
      for (let i = 0; i < this.bullets.length; i++) {
        //bullets player collision
        for (let j = 0; j < this.players.length; j++) {
          if(this.players[j] != this.bullets[i].player && !this.players[j].isDead){
            bulletPlayerCollision(this.bullets[i], this.players[j]);
          }
        }
  
        //bullets level collisions
        for(let j = 0; j < this.solidColliders.length; j++){
          bulletSolidCollision(this.bullets[i], this.solidColliders[j]);
        }
  
      }

      //partical Systems
      for (let i = 0; i < this.particleSystems.length; i++) {
        //remove dead bullets
        if (this.particleSystems[i].isFinished) {
          this.particleSystems.splice(i, 1);
          //i--;
          continue;
        }
        this.particleSystems[i].update(delta);
      }
  
      //render
      if(!this.camera) return;
      this.camera.update(delta);
      for(let i = 0; i < this.app.stage.children.length; i++){
        var child = this.app.stage.children[i];
        if(child.worldPos != null){
          let screenPos = this.camera.worldToScreenPosition(child.worldPos);
          child.transform.position.x = screenPos.x;
          child.transform.position.y = screenPos.y;
        }
      }
      
    }
  
    createPlayer(_data) {
      if(_data.id < this.players.length) return;
      this.players.push(new Player(_data, this));
    }
  
    removePlayer(id) {
      this.players[id].destroy();
      this.players.splice(id, 1);
    }

    assignPlayerById(_id){
      this.clientPlayer = this.players[_id];
      this.camera.setTarget(this.clientPlayer);
    }
  
    updateServer(data) {
      //update players server data
      for (let i = 0; i < data.players.length; i++) {
        this.players[i].updateServerPos(data.players[i], data.delta);
        if(data.players[i].shot){
          this.playerShot(this.players[i]);
        }
        if (data.players[i].health != null) {
          if(data.players[i].health == 0)
            this.playerDied(this.players[i])
          this.players[i].updateHealth(data.players[i].health);
        }
      }
  
    }
  
    playerShot(player){
      let x = player.firePointPos.x;
      let y = player.firePointPos.y;
      let vx = 800 * Math.cos(player.serverTransform.rotation);
      let vy = 800 * Math.sin(player.serverTransform.rotation);
      let newBullet = new Bullet(player, x, y, vx, vy, this.app);
      player.shootAnim();
      this.bullets.push(newBullet);
      //this.particleSystems.push(new PlayerExplosion(player.pos, player.color, this.app.stage));
    }

    playerDied(player){
      if(player.isDead) return;
      this.particleSystems.push(new PlayerExplosion(player.pos, player.color, this.app.stage));
    }

    getInputData(){
      if(!this.clientPlayer.isDead)
      return this.inputManager.getInputData();
    }
  
}

class Camera{
  constructor(_width, _height){
    this.pos = new Vector2D(0,0);
    this.size = new Vector2D(_width, _height);
    this.target = null;
    this.speed = Infinity;
  }
  setTarget(_t){
    this.target = _t;
    this.pos.x = this.target.pos.x;
    this.pos.y = this.target.pos.y;
  }
  worldToScreenPosition(_pos){
    let cornerPos = {x : this.pos.x-this.size.x/2, y : this.pos.y-this.size.y/2};
    return {x : _pos.x - cornerPos.x, y : _pos.y - cornerPos.y};
  }
  resize(_w, _h){
    this.size.x = _w;
    this.size.y = _h;
  }
  update(_delta){
    if(this.target == null) return;
    //this.pos = Vector2D.lerp(this.pos, this.target.pos, 1-Math.pow(0.1, _delta));
    this.pos = Vector2D.lerp(this.pos, this.target.pos, 1);
    //this.pos.x += (this.target.pos.x > this.pos.x) ? 1 : -1;
    //this.pos.x += (this.target.pos.x - this.pos.x)/Math.abs(this.target.pos.x - this.pos.x);
    //this.pos.y += (this.target.pos.y - this.pos.y)/Math.abs(this.target.pos.y - this.pos.y);
  }
}

class PlayerExplosion{
  constructor(_pos, _color, _container){
    this.container = _container;
    this.pos = new Vector2D(_pos.x, _pos.y);
    this.isFinished = false;

    this.lifeTime = 0;
    this.desiredLifeTime = 0.33;
    this.innerRadius = 0;
    this.radius = 50;

    this.graphic = new PIXI.Graphics();
    this.graphic.lineStyle(2, 0xFFFF00);
    this.graphic.beginFill(0xFFFFFF);
    this.graphic.drawCircle(0, 0, this.radius);
    this.graphic.endFill();

    this.container.addChild(this.graphic);
    Object.assign(this.graphic, {worldPos : {x : this.pos.x, y : this.pos.y}} );

    this.trails = new Array(6);
    for(let i = 0; i < this.trails.length; i++){
      let a = Math.random() * 2 * Math.PI;
      this.trails[i] = new Spark(_pos.x, _pos.y, Math.cos(a), Math.sin(a), this.container);
    }
  }
  update(_delta){
    this.lifeTime += _delta;
    if(this.lifeTime >= this.desiredLifeTime){
      this.isFinished = true;
      this.destroy();
      return;
    }
    this.innerRadius = lerp(0, this.radius, Math.min(0.25 + this.lifeTime/this.desiredLifeTime, 1));
    this.graphic.clear();
    this.graphic.lineStyle(4, 0xFFFF00);
    this.graphic.beginFill(0xFFFFFF);
    this.graphic.drawCircle(0, 0, this.radius);
    this.graphic.endFill();
    this.graphic.lineStyle(4, 0xFF0000);
    this.graphic.beginFill(0x000000);
    this.graphic.drawCircle(0, 0, this.innerRadius);
    this.graphic.endFill();

    for(let i = 0; i < this.trails.length; i++){
      this.trails[i].update(_delta);
    }
  }
  destroy(){
    for(let i = 0; i < this.trails.length; i++){
      this.trails[i].destroy(this.container);
    }
    this.container.removeChild(this.graphic);
  }
}

class Spark{
  constructor(_px, _py, _vx, _vy, _container){
    this.vel = new Vector2D(_vx, _vy);

    this.graphic = new PIXI.Graphics();
    this.graphic.lineStyle(2, 0xFFFF00);
    this.graphic.beginFill(0xFF0000);
    this.graphic.drawCircle(0, 0, 10);
    this.graphic.endFill();
    _container.addChild(this.graphic);
    Object.assign(this.graphic, {worldPos : {x : _px, y : _py}} );
  }
  update(_delta){
    this.graphic.worldPos.x += this.vel.x*_delta * 300;
    this.graphic.worldPos.y += this.vel.y*_delta * 300;
    this.graphic.scale.x *= 0.95;
    this.graphic.scale.y *= 0.95;
  }
  destroy(_container){
    _container.removeChild(this.graphic);
  }
}

function lerp(s, e, t){return s + (e-s)*t}

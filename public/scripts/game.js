const Game = {

    initialized: false,
  
    init: function(data) {
      this.map = data.map;
  
      this.players = new Array(data.playerCount).fill(null);
      this.clientPlayer = null;
  
      this.bullets = [];
  
      let doc_w = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
      let doc_h = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;

      this.app = new PIXI.Application({
        width: doc_w,
        height: doc_h,
        backgroundColor: 0x000000,
        resolution: window.devicePixelRatio || 1,
      });
  
      document.getElementById('gameDiv').appendChild(this.app.view);
  
      this.initialized = true;
  
      //add players
      for(let i = 0; i < data.players.length; i++){
        this.createPlayer(data.players[i].id, data.players[i]);
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
      
  
    },

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
    },

    terminate : function(){
      this.map = null;
  
      this.players = null;
  
      this.bullets = null;

      this.app.view.remove();

      this.app = null;
  
      this.initialized = false;
    },
  
    update: function(delta) {
      //console.clear();
      //console.log(this.bullets.length);
      //update players
      for (let i = 0; i < this.players.length; i++) {
        if(this.players[i] != null && !this.players[i].isDead)
        this.players[i].updateTransform(delta);
      }
  
      //update bullets
      for (let i = 0; i < this.bullets.length; i++) {
        //remove dead bullets
        if (this.bullets[i].isDead) {
          this.bullets[i].destroy();
          this.bullets.splice(i, 1);
          continue;
        }
        this.bullets[i].update(delta);
      }
      //bullets collisions
      loop1:
      for (let i = 0; i < this.bullets.length; i++) {
        //bullets player collision
        for (let j = 0; j < this.players.length; j++) {
          if (this.players[j] == null || this.bullets[i].id == j || this.players[j].dead) continue;
          if (this.doesBulletPlayerOverlap(this.bullets[i], this.players[j])) { this.bullets[i].isDead = true; continue;}
        }
  
        //bullets level collisions
        /*for(let j = 0; j < this.solidColliders.length; j++){
          let sCol = this.solidColliders[j];
          if(sCol instanceof SolidPolygonCollider){
            for(let i = 0; i < sCol.walls.length; i++){
              if(CollisionDetection.cirlce2solidWall(sCol, sCol.walls[i])){
                this.bullets[i].isDead = true;
                continue loop1;
              }
                
            }
          }

        }*/
  
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
      
    },
  
    createPlayer: function(id, data) {
      if(this.players[id] != null) return;
      this.players[id] = new Player(data, this.app);
    },
  
    removePlayer: function(id) {
      this.players[id].destroy();
      this.players[id] = null;
    },

    assignPlayerById(_id){
      this.clientPlayer = this.players[_id];
      this.camera.setTarget(this.clientPlayer);
    },
  
    updateServer: function(data) {
      //update players server data
      for (let i = 0; i < data.players.length; i++) {
        this.players[i].updateServerPos(data.players[i], data.delta);
        if(data.players[i].shot){
          this.playerShot(this.players[i]);
        }
        if (data.players[i].health != null) {
          this.players[i].updateHealth(data.players[i].health);
        }
      }
  
    },
  
    playerShot(player){
      let x = player.firePointPos.x;
      let y = player.firePointPos.y;
      let vx = 800 * Math.cos(player.serverTransform.rotation);
      let vy = 800 * Math.sin(player.serverTransform.rotation);
      let newBullet = new Bullet(x, y, vx, vy,player.color, this.app);
      this.bullets.push(newBullet);
    },
  
    resolveBulletRectCollision(bullet, rect) {
      if (bullet.pos.x + bullet.radius >= rect.x &&
        bullet.pos.x - bullet.radius <= rect.x + rect.w &&
        bullet.pos.y + bullet.radius >= rect.y &&
        bullet.pos.y - bullet.radius <= rect.y + rect.h) {
        bullet.isDead = true;
      }
    },

    resolveBulletBallCollision(bullet, ball) {
      if( Math.abs( Math.pow(bullet.pos.x - ball.x, 2) + Math.pow(bullet.pos.y - ball.y, 2) ) <= Math.pow(bullet.radius + ball.r, 2) ){
        bullet.isDead = true;
      }
    },
  
    doesBulletPlayerOverlap: function(bullet, player) {
      let x1 = bullet.pos.x;
      let y1 = bullet.pos.y;
  
      let x2 = player.pos.x;
      let y2 = player.pos.y;
  
      let r1 = player.radius;
      let r2 = bullet.radius;
  
      return Math.abs((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2)) <= (r1 + r2) * (r1 + r2);
    }
}

class Camera{
  constructor(_width, _height){
    this.pos = {x : 300, y : 300};
    this.size = {x : _width, y : _height};
    this.target = null;
    this.speed = Infinity;
  }
  setTarget(_t){
    this.target = _t;
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
    this.pos.x = this.lerp(this.pos.x, this.target.pos.x, _delta*this.speed);
    this.pos.y = this.lerp(this.pos.y, this.target.pos.y, _delta*this.speed);
  }
  lerp(start, end, time){time = Math.min(time, 1); return start * (1-time) + end * time;}
}

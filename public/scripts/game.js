const Game = {

    initialized: false,
  
    init: function(data) {
      this.map = data.map;
  
      this.players = [null, null, null, null];
  
      this.playersKD = [
        {kills : 0, deaths: 0},
        {kills : 0, deaths: 0},
        {kills : 0, deaths: 0},
        {kills : 0, deaths: 0}
      ];
  
      this.bullets = [];
  
      let doc_w = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
      let doc_h = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;

      this.app = new PIXI.Application({
        width: doc_w,
        height: doc_h,
        backgroundColor: 0x000000,
        resolution: window.devicePixelRatio || 1,
      });

      this.camera = new Camera(doc_w, doc_h);
  
      document.getElementById('gameDiv').appendChild(this.app.view);
  
      this.app.view.addEventListener('mousedown', () => {
        InputManager.mouseDownTrigger(true);
      });
  
      this.app.view.addEventListener('mouseleave', () => {
        InputManager.mouseDownTrigger(false);
      });
  
      this.app.view.addEventListener('mouseup', () => {
        InputManager.mouseDownTrigger(false);
      });
  
      this.initialized = true;
  
      //add players
      for(let i = 0; i < data.players.length; i++){
        this.createPlayer(data.players[i].id, data.players[i]);
      }

      //add balls
      this.balls = [];
      for(let i = 0; i < data.map.balls.length; i++){
        const lr = data.map.balls[i];
        this.addBall(lr.x, lr.y, lr.r);
        this.balls.push(lr);
      }

      //add vertex shapes
      for(let i = 0; i < data.map.vertexShapes.length; i++){
        let t = data.map.vertexShapes[i];
        this.addVertexShape(t);
      }

      //add regular polygons
      for(let i = 0; i < data.map.regularPolygons.length; i++){
        let t = data.map.regularPolygons[i];
        this.addRegularPolygon(t);
      }
  
    },

    resizeRequest(){
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
  
      this.playersKD = null;
  
      this.bullets = null;

      this.app.view.remove();

      this.app = null;
  
      this.initialized = false;
  
      this.rects = null;
      this.balls = null;
    },
  
    addVertexShape: function(s){
      var graphic = new PIXI.Graphics();

      graphic.lineStyle(2, 0xFFFFFF);
      graphic.moveTo(s[0][0], s[0][1]);

      for(let j = 1; j < s.length; j++){
        graphic.lineTo(s[j][0], s[j][1]);
      }

      Object.assign(graphic, {worldPos : {x : 0, y : 0}} );
      this.app.stage.addChild(graphic);
    },

    addRegularPolygon(_data){
      var graphic = new PIXI.Graphics();
      graphic.lineStyle(2, 0xFFFFFF);

      var angle = 2*Math.PI/_data.verticies;
      var rotation = 2*Math.PI*_data.rotation/360;

      var sx = _data.x + Math.round(Math.cos(rotation)*_data.radius);
      var sy = _data.y + Math.round(Math.sin(rotation)*_data.radius);

      graphic.moveTo(sx, sy);

      for(let i = 1; i < _data.verticies; i++){
        let x = _data.x + Math.round(Math.cos(rotation + angle*i)*_data.radius);
        let y = _data.y + Math.round(Math.sin(rotation + angle*i)*_data.radius);
        graphic.lineTo(x, y);
      }

      graphic.lineTo(sx, sy);

      Object.assign(graphic, {worldPos : {x : 0, y : 0}} );
      this.app.stage.addChild(graphic);
    },

    addBall: function(x,y,r){
      var graphic = new PIXI.Graphics();

      graphic.x = x;
      graphic.y = y;
      graphic.lineStyle(2, 0xFFFFFF);
      graphic.drawCircle(0,0, r);
  
      Object.assign(graphic, {worldPos : {x : x, y : y}} );
      this.app.stage.addChild(graphic);
    },
  
    update: function(delta) {
  
      //update players
      for (let i = 0; i < this.players.length; i++) {
        if(this.players[i] != null && !this.players[i].isDead)
        this.players[i].updateTransform(delta);
      }
  
      //update bullets
      for (let i = 0; i < this.bullets.length; i++) {
        //remove dead bullets
        if (this.bullets[i].isDead) {
          this.bullets[i].destroy(this.app);
          this.bullets.splice(i, 1);
          continue;
        }
  
        this.bullets[i].update(delta);
  
        if (this.isBulletOut(this.bullets[i])) {this.bullets[i].isDead = true; continue;}
  
        //bullets player collision
        for (let j = 0; j < this.players.length; j++) {
          if (this.players[j] == null || this.bullets[i].id == j || this.players[j].dead) continue;
          if (this.doesBulletPlayerOverlap(this.bullets[i], this.players[j])) { this.bullets[i].isDead = true; continue;}
        }
  
        //bullets level collisions
        for(let j = 0; j < this.balls.length; j++){
          this.resolveBulletBallCollision(this.bullets[i], this.balls[j]);
          if(this.bullets[i].isDead) continue;
        }
  
      }
  
      //render
      this.camera.pos.x = this.players[InputManager.playerId].pos.x;
      this.camera.pos.y = this.players[InputManager.playerId].pos.y;
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
  
    updateServer: function(data) {
      //kill and deaths
      if(data.KD != null){
        for(let i = 0; i < data.KD.length; i++){
          this.playersKD[data.KD[i].idK].kills++;
          this.playersKD[data.KD[i].idD].deaths++;
        }
      }
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
      let id = player.id;
      let x = player.firePointPos.x;
      let y = player.firePointPos.y;
      let vx = 800 * Math.cos(player.serverTransform.rotation - Math.PI/2);
      let vy = 800 * Math.sin(player.serverTransform.rotation - Math.PI/2);
      let newBullet = new Bullet(id, x, y, vx, vy, this.app);
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
  
    isBulletOut: function(bullet) {
      return bullet.pos.x - bullet.radius < 0 ||
        bullet.pos.x + bullet.radius >= this.map.width ||
        bullet.pos.y - bullet.radius < 0 ||
        bullet.pos.y + bullet.radius >= this.map.height;
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
  }
  worldToScreenPosition(_pos){
    let cornerPos = {x : this.pos.x-this.size.x/2, y : this.pos.y-this.size.y/2};
    return {x : _pos.x - cornerPos.x, y : _pos.y - cornerPos.y};
  }
  resize(_w, _h){
    this.size.x = _w;
    this.size.y = _h;
  }
}

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
      let canvasDimensions = CropDimensionsToRatio(doc_w*0.98, doc_h*0.98, this.map.ratio_w, this.map.ratio_h);
  
      this.app = new PIXI.Application({
        width: this.map.width,
        height: this.map.height,
        backgroundColor: 0x101010,
        resolution: canvasDimensions.x/this.map.width/*window.devicePixelRatio || 1*/,
      });
  
      this.app.view.style.marginLeft = (doc_w - canvasDimensions.x)/2 + 'px';
      this.app.view.style.marginTop = (doc_h - canvasDimensions.y)/2 + 'px';
  
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
  
      //add rects
      this.rects = [];
      for(let i = 0; i < data.map.rects.length; i++){
        const lr = data.map.rects[i];
        this.addRect(lr.x, lr.y, lr.w, lr.h, lr.r);
        this.rects.push(lr);
      }
  
    },
  
    addRect: function(x,y,w,h,r){
      const graphic = new PIXI.Graphics();
      graphic.x = x;
      graphic.y = y;
      //left bottom circle
      graphic.beginFill(0xEEEEEE);
      graphic.drawCircle(r, h-r, r);
      //graphic.endFill();
      //right bottom circle
      //graphic.beginFill(0xFF00FF);
      graphic.drawCircle(w-r, h-r, r);
      //graphic.endFill();
      //left top circle
      //graphic.beginFill(0xFF00FF);
      graphic.drawCircle(r, r, r);
      //graphic.endFill();
      //right top circle
      //graphic.beginFill(0xFF00FF);
      graphic.drawCircle(w-r, r, r);
      //graphic.endFill();
      //line top
      //graphic.lineStyle(1, 0xffffff).moveTo(r, 0).lineTo(w-r, 0);
      //line bottom
      //graphic.lineStyle(1, 0xffffff).moveTo(r,  h).lineTo(w-r, h);
      //line left
      //graphic.lineStyle(1, 0xffffff).moveTo(0, r).lineTo(0, h-r);
      //line right
      //graphic.lineStyle(1, 0xffffff).moveTo(w, r).lineTo( w, h-r);
      //graphic.beginFill(0xFF00FF);
      graphic.drawRect(r,0,w-r*2,h);
      graphic.drawRect(0,r,w,h-r*2);
      graphic.endFill();
  
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
        for(let j = 0; j < this.rects.length; j++){
          this.resolveBulletRectCollision(this.bullets[i], this.rects[j]);
          if(this.bullets[i].isDead) continue;
        }
  
      }
  
  
    },
  
    createPlayer: function(id, data) {
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
      let vx = 600 * Math.cos(player.serverTransform.rotation - Math.PI/2);
      let vy = 600 * Math.sin(player.serverTransform.rotation - Math.PI/2);
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
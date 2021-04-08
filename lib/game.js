'use strict';
const playerModule = require('./player.js');
const rectModule = require('./rect.js');
const colModule = require('./collisions.js');

class Game {
  constructor(map) {
    this.players = [null, null, null, null];
    this.bullets = new Array();

    this.map = map;
    this.staticColliders = new Array();
    for(let i = 0; i < this.map.rects.length; i++){
      let t = this.map.rects[i];
      this.staticColliders.push(new rectModule.SolidRectCollider(t.x, t.y, t.w, t.h, t.r));
    }
    for(let i = 0; i < this.map.balls.length; i++){
      let t = this.map.balls[i];
      this.staticColliders.push(new rectModule.SolidCircleCollider(t.x, t.y, t.r));
    }
  }

  update(delta) {

    for (let i = 0; i < this.players.length; i++) {
      if (this.players[i] == null) continue;

      //update
      this.players[i].update(delta);

      //player player collision
      for (let j = 0; j < this.players.length; j++) {
        if (this.players[j] == null || j == i || this.players[j].isDead) continue;
        colModule.dynamicCircleX2(this.players[i].collider, this.players[j].collider);
      }

      //level collision
      //this.playerBoundriesCollision(this.players[i]);
      for (let j = 0; j < this.staticColliders.length; j++) {
          if(this.staticColliders[j] instanceof rectModule.SolidRectCollider)
            colModule.dynamicCircleStaticRect(this.players[i].collider, this.staticColliders[j]);
          else if(this.staticColliders[j] instanceof rectModule.SolidCircleCollider)
            colModule.dynamicCircleStaticCircle(this.players[i].collider, this.staticColliders[j]);
      }
    }

    //bullets
    for (let i = 0; i < this.bullets.length; i++) {

      //remove dead bullets
      if (this.bullets[i].isDestroyed) {
        this.bullets.splice(i, 1);
        continue;
      }

      //update
      this.bullets[i].update(delta);
      //level collision
      /*if (this.isBulletOut(this.bullets[i])) {
        this.bullets[i].isDestroyed = true;
        continue;
      }*/
      for (let j = 0; j < this.staticColliders.length; j++) {
        if (this.bullets[i].isDestroyed) continue;
          if(this.staticColliders[j] instanceof rectModule.SolidRectCollider)
            colModule.triggerCircle2Rect(this.bullets[i].collider, this.staticColliders[j]);
          else if(this.staticColliders[j] instanceof rectModule.SolidCircleCollider)
            colModule.resolveBulletBallCollision(this.bullets[i].collider, this.staticColliders[j]);
      }

      //player bullet collisions
      
      for (let j = 0; j < this.players.length; j++) {
        if ( this.players[j] == null || this.players[j].isDead) continue;
        colModule.triggerCircle2Circle(this.players[j].collider, this.bullets[i].collider);
        //console.log(this.bullets[i]);
        if(this.bullets[i].isDestroyed) continue;
      }

    }

  }

  //players
  removePlayer(id) {
    this.players[id] = null;
  }

  createNewPlayer(data) {
    for (let i = 0; i < this.players.length; i++) {
      if (this.players[i] == null){
        let np = new playerModule.Player(this, i, this.map.spawn_points[i].x, this.map.spawn_points[i].y, data.nick, data.color);
        this.players[i] = np;
        return np;
      } 
    }
  }

  getRespawnPos(){
    let r = Math.floor(Math.random() * this.map.spawn_points.length);
    let p = {
      x: this.map.spawn_points[r].x,
      y: this.map.spawn_points[r].y,
    };
    return p;
  }

  //collisions

  isBulletOut(bullet) {
    return bullet.transform.pos.x - bullet.radius < 0 ||
      bullet.transform.pos.x + bullet.radius >= this.map.width ||
      bullet.transform.pos.y - bullet.radius < 0 ||
      bullet.transform.pos.y + bullet.radius >= this.map.height;
  }

  playerBoundriesCollision(player) {
    if (player.transform.pos.x - player.radius < 0) {
      player.transform.pos.x = player.radius;
      player.rigidbody.vel.x = 0;
    } else if (player.transform.pos.x + player.radius > this.map.width) {
      player.transform.pos.x = this.map.width - player.radius;
      player.rigidbody.vel.x = 0;
    }
    if (player.transform.pos.y - player.radius < 0) {
      player.transform.pos.y = player.radius;
      player.rigidbody.vel.y = 0;
    } else if (player.transform.pos.y + player.radius > this.map.height) {
      player.transform.pos.y = this.map.height - player.radius;
      player.rigidbody.vel.y = 0;
    }
  }

  getEmitData() {
    var emitData = {
      players: [],
    };
    for (let i = 0; i < this.players.length; i++) {
      if (this.players[i] == null) continue;
      let player_data = this.players[i].getEmitData();
      emitData.players.push(player_data);
    }

    /*if (this.emitDataKD.length > 0) {
      emitData.KD = this.emitDataKD;
      this.emitDataKD = [];
    }*/

    return emitData;
  }

  getInitData() {
    const data = {
      map : this.map,
      players: []
    };

    for (let i = 0; i < this.players.length; i++) {
      if (this.players[i] != null) {
        data.players.push(this.players[i].getInitData());
      }
    }

    return data;
  }
}

module.exports.Game = Game;

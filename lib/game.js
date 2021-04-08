'use strict';
const playerModule = require('./player.js');
const rectModule = require('./rect.js');
const colModule = require('./collisions.js');
const utils = require('./utils.js');

class Game {
  constructor(map) {
    this.players = [null, null, null, null];
    this.entities = new Array();

    this.map = map;
    this.solidColliders = new Array();
    for(let i = 0; i < this.map.rects.length; i++){
      let t = this.map.rects[i];
      this.solidColliders.push(new rectModule.SolidRectCollider(t.x, t.y, t.w, t.h, t.r));
    }
    for(let i = 0; i < this.map.balls.length; i++){
      let t = this.map.balls[i];
      this.solidColliders.push(new rectModule.SolidCircleCollider(t.x, t.y, t.r));
    }
    this.solidColliders.push(new rectModule.SolidWallCollider(0,0,this.map.width,0, utils.BOTTOM));
    this.solidColliders.push(new rectModule.SolidWallCollider(0,0,0,this.map.height, utils.RIGHT));
    this.solidColliders.push(new rectModule.SolidWallCollider(this.map.width,0,this.map.width,this.map.height, utils.LEFT));
    this.solidColliders.push(new rectModule.SolidWallCollider(0,this.map.height,this.map.width,this.map.height, utils.TOP));
  }

  update(delta) {

    loop1:
    for(var i = 0; i < this.entities.length; i++){
      if (this.entities[i].isDestroyed) {
        this.entities.splice(i, 1);
        continue loop1;
      }

      for (let j = 0; j < this.solidColliders.length; j++) {
        colModule.entitySolidCollision(this.entities[i].collider, this.solidColliders[j]);
        
        if(this.entities[i].isDestroyed){
          //this.entities.splice(i, 1);
          continue loop1;
        } 
      }
       
      loop2:
      for (let j = 0; j < this.entities.length; j++) {
        if(j == i) continue loop2;
        colModule.entity2entityCollision(this.entities[i].collider, this.entities[j].collider);
        
        if(this.entities[i].isDestroyed){
          //this.entities.splice(i, 1);
          continue loop1;
        } 
      } 

      this.entities[i].update(delta);
    }

  }

  //players
  removePlayer(id) {
    this.players[id].destroy();
    this.players[id] = null;
  }

  createNewPlayer(data) {
    for (let i = 0; i < this.players.length; i++) {
      if (this.players[i] == null){
        let np = new playerModule.Player(this, i, this.map.spawn_points[i].x, this.map.spawn_points[i].y, data.nick, data.color);
        this.players[i] = np;
        this.instanciateEntity(np);
        return np;
      } 
    }
  }

  instanciateEntity(e){
    this.entities.push(e);
  }

  getRespawnPos(){
    let r = Math.floor(Math.random() * this.map.spawn_points.length);
    let p = {
      x: this.map.spawn_points[r].x,
      y: this.map.spawn_points[r].y,
    };
    return p;
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

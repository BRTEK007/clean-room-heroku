'use strict';
const Player = require('./entity/Player.js');
const {SolidCircleCollider, createRegularPolygonCollider, createVertexShapeCollider} = require('./physics/collidersModule.js');
const {checkForCollision, resolveCollision} = require('./physics/collisionsModule.js');

module.exports = class Game {
  constructor(map) {
    this.players = new Array();
    this.entities = new Array();

    this.map = map;
    this.solidColliders = new Array();
    for(let i = 0; i < this.map.balls.length; i++){
      let t = this.map.balls[i];
      this.solidColliders.push(new SolidCircleCollider(t.x, t.y, t.r));
    }
    for(let i = 0; i < this.map.vertexShapes.length; i++){
      let t = this.map.vertexShapes[i];
      this.solidColliders.push(createVertexShapeCollider(t));
    }
    for(let i = 0; i < this.map.regularPolygons.length; i++){
      let t = this.map.regularPolygons[i];
      this.solidColliders.push(createRegularPolygonCollider(t));
    }
  }

  update(delta) {
    //update end remove entities
    for(var i = 0; i < this.entities.length; i++){
      if (this.entities[i].isDestroyed) {
        this.entities.splice(i, 1);
        i--;
        continue;
      }
      if(this.entities[i].isDisabled) continue;
      this.entities[i].update(delta);
    }
    
    //detect collisions
    var collisions = [];
    for(var i = 0; i < this.entities.length; i++){

      if(this.entities[i].collider.isDisabled)  continue;

      var closestCollision = null;

      for (let j = i+1; j < this.entities.length; j++) {//j = i+1, j != i
        if(!this.entities[j].collider.isDisabled){
          let new_collision = checkForCollision(this.entities[i].collider, this.entities[j].collider)[0];
          if(closestCollision == null)//or time is lover
            closestCollision = new_collision;
        }
      }
      
      for (let j = 0; j < this.solidColliders.length; j++) {
        let new_collision = checkForCollision(this.entities[i].collider, this.solidColliders[j])[0];
        if(closestCollision == null)//or time is lover
          closestCollision = new_collision;
      }

      if(closestCollision != null) collisions.push(closestCollision);
    }

    //resolve collisions
    for(var i = 0; i < collisions.length; i++){
      resolveCollision(collisions[i]);
    }

  }

  //players
  removePlayer(id) {
    this.players[id].destroy();
    this.players.splice(id, 1);
    for(let i = 0; i < this.players.length; i++){
      this.players[i].id = i;
    }
  }

  createNewPlayer(data) {
    let pos = this.getRespawnPos();
    let np = new Player(this, this.players.length, pos.x, pos.y, data.nick, data.color);
    this.instanciateEntity(np);
    this.players.push(np);
    return np;
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
      let player_data = this.players[i].getEmitData();
      emitData.players.push(player_data);
    }

    return emitData;
  }

  getInitData() {
    const data = {
      map : this.map,
      playerCount : this.players.length,
      players: []
    };

    for (let i = 0; i < this.players.length; i++) {
        data.players.push(this.players[i].getInitData());
    }

    return data;
  }
}

'use strict';
const playerModule = require('./player.js');
const rectModule = require('./rect.js');
const colModule = require('./collisions.js');
const utils = require('./utils.js');
const SolidCollider = require('./entity/SolidCollider.js');
const { CircleShape } = require('./physics/shapes.js');

class Game {
  constructor(map) {
    this.players = [null, null, null, null];
    this.entities = new Array();

    this.map = map;
    this.solidColliders = new Array();
    for(let i = 0; i < this.map.balls.length; i++){
      let t = this.map.balls[i];
      this.solidColliders.push(new SolidCollider(t.x, t.y, new CircleShape(t.r)));
    }
    for(let i = 0; i < this.map.vertexShapes.length; i++){
      let t = this.map.vertexShapes[i];
      for(let j = 0; j < t.length-1; j++){
        this.solidColliders.push(new rectModule.SolidWallCollider(t[j][0], t[j][1], t[j+1][0], t[j+1][1]));
      }
    }
    for(let i = 0; i < this.map.regularPolygons.length; i++){
      let t = this.map.regularPolygons[i];
      this.addRegularPolygon(t);
    }
  }

  addRegularPolygon(_data){
    var angle = 2*Math.PI/_data.verticies;
    var rotation = 2*Math.PI*_data.rotation/360;
    for(let i = 0; i < _data.verticies-1; i++){
      let x = _data.x + Math.round(Math.cos(rotation + angle*i)*_data.radius);
      let y = _data.y + Math.round(Math.sin(rotation + angle*i)*_data.radius);
      let nx = _data.x + Math.round(Math.cos(rotation + angle*(i+1))*_data.radius);
      let ny = _data.y + Math.round(Math.sin(rotation + angle*(i+1))*_data.radius);
      this.solidColliders.push(new rectModule.SolidWallCollider(x, y, nx, ny));
      if(i == _data.verticies-2){
        this.solidColliders.push(
          new rectModule.SolidWallCollider(nx, ny, _data.x + Math.round(Math.cos(rotation)*_data.radius), _data.y + Math.round(Math.sin(rotation)*_data.radius))
        );
      }
    }

  }

  update(delta) {
    //update end remove entities
    for(var i = 0; i < this.entities.length; i++){
      if (this.entities[i].isDestroyed) {
        this.entities.splice(i, 1);
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

      for (let j = i+1; j < this.entities.length; j++) {
        if(!this.entities[j].collider.isDisabled){
          let new_collision = colModule.checkForCollision(this.entities[i].collider, this.entities[j].collider);
          if(closestCollision == null)//or time is lover
            closestCollision = new_collision;
        }
      }
      
      for (let j = 0; j < this.solidColliders.length; j++) {
        let new_collision = colModule.checkForCollision(this.entities[i].collider, this.solidColliders[j]);
        if(closestCollision == null)//or time is lover
          closestCollision = new_collision;
      }

      if(closestCollision != null) collisions.push(closestCollision);
    }

    //resolve collisions
    for(var i = 0; i < collisions.length; i++){
      colModule.resolveCollision(collisions[i]);
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

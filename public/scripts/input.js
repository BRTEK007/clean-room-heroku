const InputManager = {
    lastSentInput: {
      x: 0,
      y: 0,
      rotation: 0,
      mx: 0,
      my: 0,
      mouseDown: false
    },
    currentInput: {
      x: 0,
      y: 0,
      mx: 0,
      my: 0,
      rotation: 0,
      mouseDown: false
    },
    playerId: null,
  
    getInputData: function() {
      if (this.playerId == null || Game.players[this.playerId].dead) return null;
  
      let mousePos = Game.app.renderer.plugins.interaction.mouse.global;
      this.currentInput.mx = Math.round(mousePos.x);
      this.currentInput.my = Math.round(mousePos.y);
  
      let inputToSend = {};
      let inputEmpty = true;
  
      if (this.lastSentInput.x != this.currentInput.x) {
        inputToSend.x = this.currentInput.x;
        this.lastSentInput.x = this.currentInput.x;
        inputEmpty = false;
      }
  
      if (this.lastSentInput.y != this.currentInput.y) {
        inputToSend.y = this.currentInput.y;
        this.lastSentInput.y = this.currentInput.y;
        inputEmpty = false;
      }
  
      if (Math.sqrt(Math.pow(this.lastSentInput.mx - this.currentInput.mx, 2) + Math.pow(this.lastSentInput.my - this.currentInput.my, 2)) > 30 &&
        this.currentInput.mx >= 0 && this.currentInput.mx <  Game.map.width && this.currentInput.my >= 0 && this.currentInput.my < Game.map.height) {
        inputToSend.mousePos = this.currentInput.my * Game.map.width + this.currentInput.mx;
        this.lastSentInput.mx = this.currentInput.mx;
        this.lastSentInput.my = this.currentInput.my;
        inputEmpty = false;
      }
  
      if (this.lastSentInput.mouseDown != this.currentInput.mouseDown) {
        inputToSend.mouseDown = this.currentInput.mouseDown;
        this.lastSentInput.mouseDown = this.currentInput.mouseDown;
        inputEmpty = false;
      }
  
      return inputEmpty ? null : inputToSend;
  
    },
  
    assignPlayerId: function(id) {
      this.playerId = id;
    },
  
    keyPressed: function(key) {
      switch (key) {
        case 'ArrowRight':
        case 'KeyD':
          this.currentInput.x = 1;
          break;
        case 'ArrowLeft':
        case 'KeyA':
          this.currentInput.x = -1;
          break;
        case 'ArrowUp':
        case 'KeyW':
          this.currentInput.y = -1;
          break;
        case 'ArrowDown':
        case 'KeyS':
          this.currentInput.y = 1;
          break;
  
      }
    },
  
    keyReleased: function(key) {
      switch (key) {
        case 'ArrowRight': case 'KeyD':
          this.currentInput.x = 0;
          break;
        case 'ArrowLeft': case 'KeyA':
          this.currentInput.x = 0;
          break;
        case 'ArrowUp': case 'KeyW':
          this.currentInput.y = 0;
          break;
        case 'ArrowDown': case 'KeyS':
          this.currentInput.y = 0;
          break;
      }
    },
  
    mouseDownTrigger: function(m) {
      this.currentInput.mouseDown = m;
    }
  
  }
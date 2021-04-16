const InputManager = {
    lastSentInput: {
      x: 0,
      y: 0,
      rotation: 0,
      mouseDown: false
    },
    currentInput: {
      x: 0,
      y: 0,
      rotation: 0,
      mouseDown: false
    },
  
    getInputData: function() {
      if (Game.clientPlayer == null || Game.clientPlayer.dead) return null;
  
      let mousePos = Game.app.renderer.plugins.interaction.mouse.global;

      var dist_Y = Game.clientPlayer.graphic.transform.position.y - mousePos.y;
      var dist_X = Game.clientPlayer.graphic.transform.position.x - mousePos.x;
      var angle = Math.atan2(dist_Y, dist_X) - Math.PI / 2;
      this.currentInput.rotation = Math.round(angle*100)/100;
  
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
  
      if (this.lastSentInput.rotation != this.currentInput.rotation) {
        inputToSend.rotation = this.currentInput.rotation;
        this.lastSentInput.rotation = this.currentInput.rotation;
        inputEmpty = false;
      }
  
      if (this.lastSentInput.mouseDown != this.currentInput.mouseDown) {
        inputToSend.mouseDown = this.currentInput.mouseDown;
        this.lastSentInput.mouseDown = this.currentInput.mouseDown;
        inputEmpty = false;
      }
  
      return inputEmpty ? null : inputToSend;
  
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
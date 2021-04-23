class InputManager{

  constructor(){
    this.lastSentInput = {
      x: 0,
      y: 0,
      action: false
    };
    this.currentInput = {
      x: 0,
      y: 0,
      action: false
    };
    this.listenerKeyDown = (e) => {this.keyPressed(e)};
    this.listenerKeyUp = (e) => {this.keyReleased(e)};
    window.addEventListener('keydown', this.listenerKeyDown);
    window.addEventListener('keyup', this.listenerKeyUp);
  }
  
    getInputData(){
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
  
      if (this.lastSentInput.action != this.currentInput.action) {
        inputToSend.action = this.currentInput.action;
        this.lastSentInput.action = this.currentInput.action;
        inputEmpty = false;
      }
      return inputEmpty ? null : inputToSend;
    }
  
    keyPressed(e){
      switch (e.code) {
        
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
         case 'Space':
            this.currentInput.action = true;
          break;
  
      }
    }
  
    keyReleased(e){
      switch (e.code) {
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
        case 'Space':
            this.currentInput.action = false;
          break;
      }
    }

    terminate(){
      window.removeEventListener('keydown',  this.listenerKeyDown);
      window.removeEventListener('keyup',  this.listenerKeyUp);
    }
  
  }
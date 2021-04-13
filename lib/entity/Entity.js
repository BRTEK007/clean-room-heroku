module.exports = class Entity{
    constructor(){
      this.rigidbody = null;
      this.transform = null;
      this.collider = null;
      this.isDestroyed = false;
      this.isDisabled = false;
    }
  
    update(delta){
      if(this.rigidbody != null)
        this.rigidbody.update(delta);
    }
  
    destroy(){
      this.isDestroyed = true;
    }
}
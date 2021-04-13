module.exports = class Collider{
    constructor(_transform, _shape, _options = {}){
      this.transform = _transform;
      this.shape = _shape;
      this.rigidbody = _options.rigidbody || null;
      this.isTrigger = _options.isTrigger || false;
      //this.isDynamic = this.rigidbody ? true : false;
      this.isDisabled = false;
      this.layer = 0;
      this.onEntityCollision = (other) => {};
      //this.onSolidCollision = () => {};
    }
}
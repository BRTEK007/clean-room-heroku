module.exports = class Vector2D{
    constructor(x, y){
        this.x = x;
        this.y = y;
    }
  
    add(v){
        return new Vector2D(this.x+v.x, this.y+v.y);
    }
  
    subtr(v){
        return new Vector2D(this.x-v.x, this.y-v.y);
    }
  
    mag(){
        return Math.sqrt(this.x**2 + this.y**2);
    }
  
    mult(n){
        return new Vector2D(this.x*n, this.y*n);
    }
  
    normal(){
        return new Vector2D(-this.y, this.x).unit();
    }
  
    unit(){
        if(this.mag() === 0){
            return new Vector2D(0,0);
        } else {
            return new Vector2D(this.x/this.mag(), this.y/this.mag());
        }
    }
    
    static dot(v1, v2){
        return v1.x*v2.x + v1.y*v2.y;
    }

    static distSquare(v1, v2){
        return (v1.x-v2.x)*(v1.x-v2.x) + (v1.y-v2.y)*(v1.y-v2.y);
    }

    static dist(v1, v2){
        return Math.sqrt((v1.x-v2.x)*(v1.x-v2.x) + (v1.y-v2.y)*(v1.y-v2.y));
    }
}
exports.TOP = 'T';
exports.RIGHT = 'R';
exports.BOTTOM = 'B';
exports.LEFT = 'L';


exports.lookAtRotation = (fx, fy, tx, ty) => {
    var dist_Y = fy - ty;
    var dist_X = fx - tx;
    var angle = Math.atan2(dist_Y, dist_X) - Math.PI / 2;
    return angle;
}
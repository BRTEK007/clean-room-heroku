function encode(data){
    const formattedData = {
      d: 20 - data.delta * 1000,
      t: data.time,
      p: []
    };
    //players positions
    for (let i = 0; i < data.players.length; i++) {
      let arr = [
        data.players[i].id,
        Math.round(data.players[i].x),
        Math.round(data.players[i].y),
        Math.round(data.players[i].rotation * 100),
        (data.players[i].shot ? 1 : 0),
        data.players[i].health
      ];
      formattedData.p.push(arr);
    }
    //
    if (data.KD != null) {
      formattedData.s = [];
      for (let i = 0; i < data.KD.length; i++) {
        formattedData.s.push([
          data.KD[i].idK,
          data.KD[i].idD,
        ]);
      }
    }
    return formattedData;
}

module.exports.encode = encode;
const PORT = process.env.PORT || 3000;
const http = require('http');

http.createServer(function (req, res) {
  res.write('Siemaneczko ziomeczki!');
  res.end(); 
}).listen(PORT);
const http = require('http');

const server = http.createServer((req, res) => {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end('Server is running on port 3000\n');
});

server.listen(3000, () => {
    console.log('Server listening on port 3000');
});
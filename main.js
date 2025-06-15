import { parseFile } from './agent/parserAgent.js';

const result = await parseFile('./exemplo.js');
console.log(JSON.stringify(result, null, 2));

const http = require('http');

const server = http.createServer((req, res) => {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end('Server is running on port 3000\n');
});

server.listen(3000, () => {
    console.log('Server listening on port 3000');
});
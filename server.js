const http = require('http');
const fs = require('fs');

http.createServer((req, res) => {
    // console.log(req.url);
    if (req.url == '/') {
        fs.readFile('playAsBlack.html', function (err, data) {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.write(data);
            return res.end();
        });
    } else if (req.url.endsWith('.js')) {
        fs.readFile(req.url.slice(1), function (err, data) {
            res.writeHead(200, { 'Content-Type': 'application/javascript' });
            res.write(data);
            return res.end();
        });
    } else if (req.url == '/engine.wasm') {
        fs.readFile('engine.wasm', function (err, data) {
            res.writeHead(200, { 'Content-Type': 'application/wasm' });
            res.write(data);
            return res.end();
        });
    } else if (req.url.endsWith('.css')) {
        fs.readFile(req.url.slice(1), function (err, data) {
            res.writeHead(200, { 'Content-Type': 'text/css' });
            res.write(data);
            return res.end();
        });
    } else if (req.url.endsWith('.svg')) {
        fs.readFile(req.url.slice(1), function (err, data) {
            res.writeHead(200, { 'Content-Type': 'image/svg+xml' });
            res.write(data);
            return res.end();
        });
    } else {
        res.statusCode = 404;
        return res.end();
    }
}).listen(6969);

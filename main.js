var http = require('http');

var server = http.createServer(function (req, res) {
	console.log('Starting request processing');
	res.writeHead(200, {
		'Content-Type': 'text/plain; charset=UTF-8'
	});
	res.end('Hello world!');
});

server.listen(3000, function () {
	console.log('listening on *:3000');
});

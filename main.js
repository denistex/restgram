var http = require('http')

const log = require('./lib/logging')

var server = http.createServer(function (req, res) {
  console.log('Starting request processing')
  res.writeHead(200, {
    'Content-Type': 'text/plain; charset=UTF-8'
  })
  res.end('Hello world!')
})

server.listen(3000, function () {
  log.info('listening on *:3000')
})

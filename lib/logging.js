const winston = require('winston')

if (process.env.LOG_LEVEL) {
  winston.level = process.env.LOG_LEVEL
}

module.exports = exports = winston

winston.debug('logging init')
winston.debug('log level: ' + winston.level)
winston.debug('logging ready')

const winston = require('winston')

if (process.env.LOG_LEVEL) {
  winston.level = process.env.LOG_LEVEL
}

module.exports = exports = winston

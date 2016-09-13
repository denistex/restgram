const winston = require('winston')

winston.remove(winston.transports.Console)
winston.add(winston.transports.Console, {
  colorize: true,
  timestamp: () => new Date().toISOString(),
  formatter: function(options) {
    return options.timestamp()
      + ' ' + ('       ' + options.level.toUpperCase()).slice(-7)
      + ' ' + (undefined !== options.message ? options.message : '')
      + (options.meta && Object.keys(options.meta).length ? ' | ' + JSON.stringify(options.meta) : '')
  }
})

if (process.env.LOG_LEVEL) {
  winston.level = process.env.LOG_LEVEL
}


module.exports = exports = winston

winston.debug('logging init')
winston.debug('log level: ' + winston.level)
winston.debug('logging ready')

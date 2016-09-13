const log = require('./logging')

log.debug('config init')
log.debug('values: ')

;[
  'AUTH_DATA',
  'PHONE',
  'API_ID',
  'API_HASH'
].forEach(name => {
  const value = process.env[name]
  log.debug('\t' + name + ': ' + value)

  const property = name.toLowerCase()
  Object.defineProperty(module.exports, property, {
    value: value,
    writable: false,
    configurable: false,
    enumerable: false
  })
})

log.debug('config ready')

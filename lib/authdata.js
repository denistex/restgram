const log = require('./logging')
const fs = require('fs')
const tlink = require('telegram.link')()

log.debug('authdata init')

const PASSWORD = 'qwerty'

class AuthData {
  constructor (data = {}) {
    log.debug('authdata ctor')
    this._data = data
  }

  static load (filePath) {
    let data = undefined
    try {
      log.debug('load authdata')
      data = JSON.parse(fs.readFileSync(filePath))
      log.debug('authdata loaded')
    } catch (error) {
      log.warn('authdata load failed (it is ok on very first launch)', {error})
    }
    return new AuthData(data)
  }

  save (filePath) {
    log.debug('save authdata')
    const stream = fs.createWriteStream(filePath)
    stream.write(JSON.stringify(this._data))
    stream.end()
    log.debug('authdata saved')
  }

  get dataCenter () { return this._data.dataCenter }
  set dataCenter (value) { this._data.dataCenter = value }

  get authKey () {
    return this._data.authKey
      ? tlink.retrieveAuthKey(new Buffer(this._data.authKey, 'base64'), PASSWORD)
      : null;
  }

  set authKey (value) {
    this._data.authKey = value.encrypt(PASSWORD).toString('base64')
  }
}

module.exports = exports = AuthData

log.debug('authdata ready')

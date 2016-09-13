const log = require('./logging')
const config = require('./config')
const AuthData = require('./authdata')
const os = require('os')
const tlink = require('telegram.link')()
const clone = require('clone')

log.debug('client init')

const app = {
  id: config.api_id,
  hash: config.api_hash,
  version: require('../package.json').version,
  lang: 'en',
  deviceModel: os.type().replace('Darwin', 'OS_X'),
  systemVersion: os.platform() + '/' + os.release()
}

function connect (authKey) {
  const dataCenter = gState.authData.dataCenter || tlink.PROD_PRIMARY_DC

  log.debug('new connection', {dataCenter})

  const application = clone(app)
  if (authKey) {
    application.authKey = authKey
  }

  return new Promise(resolve => {
    const client = tlink.createClient(application, dataCenter, () => {
      log.debug('connected')
      resolve({client})
    })

    client.on('error', reconnect)
  })
}

function requestAuthKey (data) {
  log.debug('request auth key')

  return new Promise(resolve => {
    data.client.createAuthKey(auth => {
      log.debug('auth key received', {authKeyId: auth.key.id.toString('hex')})
      data.authKey = auth.key
      resolve(data)
    })
  })
}

function requestDataCenters (data) {
  log.debug('request data centers')

  return new Promise(resolve => {
    data.client.getDataCenters(function (response) {
      log.debug('data centers received', {response: response.toPrintable()})

      if (response.current !== response.nearest) {
        log.warn('current data center is not the nearest one')
      }

      data.dataCenters = response

      resolve(data)
    })
  })
}

function sendAuthCode (data) {
  log.debug('send auth code')

  const SEND_TO_TELEGRAM = 5

  return new Promise((resolve, reject) => {
    data.client.auth.sendCode(config.phone, SEND_TO_TELEGRAM, app.lang, response => {
      if (response.instanceOf('mtproto.type.Rpc_error')) {
        switch (response.error_code) {
          case 303:
            log.debug('data center change required')
            reject(data.dataCenters['DC_' + response.error_message.slice(-1)])
            break
          default:
            reject(new Error(response.error_message))
        }
      } else {
        log.debug('auth code sent', {response: response.toPrintable()})
        log.info('sign in with code as HTTP GET parameter: ' +
          'http://RESTGRAM_HOST:RESTGRAM_PORT/sign_in?code=CODE')
        data.codeHash = response.phone_code_hash
        resolve(data)
      }
    })
  })
}

const gState = {
  client: null,
  authData: AuthData.load(config.auth_data),
  codeHash: null
}

function saveState ({ client = null, authKey = null, codeHash = null }) {
  if (client) {
    gState.client = client
    log.debug('client stored')
  }

  if (authKey) {
    gState.authData.authKey = authKey
    log.debug('auth key stored')
  }

  if (codeHash) {
    gState.codeHash = codeHash
    log.debug('code hash stored')
  }
}

function disconnect () {
  if (gState.client) {
    gState.client.end()
    log.debug('client disconnected')

    gState.client = null
    log.debug('client cleared')
  }

  if (gState.codeHash) {
    gState.codeHash = null
    log.debug('code hash cleared')
  }
}

function floodWait (message) {
  return new Promise((resolve, reject) => {
    const match = message.match(/FLOOD_WAIT_(\d+)$/)
    if (match && match[1]) {
      const DECIMAL = 10
      const seconds = parseInt(match[1], DECIMAL)
      if (!isNaN(seconds)) {
        setTimeout(resolve, seconds)
      } else {
        log.warn('parse error', {match})
        reject()
      }
    } else {
      log.warn('parse error', {message})
      reject()
    }
  })
}

function reconnect (reason) {
  if (reason instanceof Error) {
    const message = reason.message.toString()
    if (message === 'PHONE_NUMBER_INVALID') {
      shutdown(reason)
    } else {
      log.warn(reason.stack)
      disconnect()
      if (message.startsWith('FLOOD_WAIT_')) {
        floodWait(message)
          .then(() => start())
          .catch(() => shutdown(reason))
      } else {
        start()
      }
    }
  } else {
    disconnect()
    if (reason) {
      gState.authData.dataCenter = reason
    }
    start()
  }
}

function start () {
  if (gState.authData.authKey) {
    connect(gState.authData.authKey)
      .then(saveState)
      .then(() => log.debug('client ready'))
      .catch(reconnect)
  } else {
    connect()
      .then(requestAuthKey)
      .then(requestDataCenters)
      .then(sendAuthCode)
      .then(saveState)
      .then(() => log.debug('client ready'))
      .catch(reconnect)
  }
}

function shutdown (error) {
  if (error) {
    log.error(error.stack)
  }
  disconnect()
  log.debug('shutdown')
  process.exit(1)
}

start()

module.exports.signIn = code => {
  return new Promise((resolve, reject) => {
    const phone = config.phone
    const codeHash = gState.codeHash

    if (codeHash && code) {
      log.debug('signing in', {phone, codeHash, code})
      gState.client.auth.signIn(phone, codeHash, code, response => {
        if (response.instanceOf('mtproto.type.Rpc_error')) {
          log.debug('sign in failed', {response: response.toPrintable()})
          reject()
        } else {
          log.debug('signed in', {response: response.toPrintable()})
          gState.authData.save(config.auth_data)
          resolve()
        }
      })
    } else {
      log.warn('sign in failed: code hash is empty', {phone, code})
      reject()
    }
  })
}

module.exports.getContacts = () => {
  log.debug('contacts request')
  return gState.client.contacts.getContacts('')
}

module.exports.checkPhone = phone => {
  log.debug('check phone')
  return gState.client.auth.checkPhone(phone)
}

module.exports.importContacts = (contacts, replace) => {
  log.debug('importing contacts')
  return new Promise(resolve => resolve('not implemented yet'))
}

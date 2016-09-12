const log = require('./logging')
const config = require('./config')
const os = require('os')
const tlink = require('telegram.link')()

log.debug('client init')

const app = {
  id: config.api_id,
  hash: config.api_hash,
  version: require('../package.json').version,
  lang: 'en',
  deviceModel: os.type().replace('Darwin', 'OS_X'),
  systemVersion: os.platform() + '/' + os.release()
}

function connect (dataCenter = tlink.PROD_PRIMARY_DC) {
  log.debug('new connection (' + JSON.stringify(dataCenter) + ')')

  return new Promise(resolve => {
    const client = tlink.createClient(app, dataCenter, () => {
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
      log.debug('auth key received: ' + auth.key.id.toString('hex'))
      data.authKey = auth.key
      resolve(data)
    })
  })
}

function checkDataCenters (data) {
  log.debug('data centers check')

  return new Promise(resolve => {
    data.client.getDataCenters(function (response) {
      log.debug('data centers received: ', response.toPrintable())

      if (response.current !== response.nearest) {
        log.warning('current data center is not the nearest one')
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
        log.debug('auth code sent, response: ' + JSON.stringify(response))
        log.info('send auth code back as HTTP GET parameter: ' +
          'http://RESTGRAM_HOST:RESTGRAM_PORT/set_auth_code?code=CODE')
        data.codeHash = response.phone_code_hash
        resolve(data)
      }
    })
  })
}

const gData = {
  client: null,
  authKey: null,
  codeHash: null
}

function save ({ client = null, authKey = null, codeHash = null }) {
  gData.client = client
  log.debug('client stored')

  gData.authKey = authKey
  log.debug('auth key stored')

  gData.codeHash = codeHash
  log.debug('code hash stored')
}

function clear () {
  if (gData.client) {
    gData.client.end()
    log.debug('client disconnected')

    gData.client = null
    log.debug('client deleted')
  }

  if (gData.authKey) {
    gData.authKey = null
    log.debug('auth key deleted')
  }

  if (gData.codeHash) {
    gData.codeHash = null
    log.debug('auth code deleted')
  }
}

function reconnect (reason) {
  if (reason instanceof Error) {
    if (reason.message === 'PHONE_NUMBER_INVALID') {
      shutdown(reason.message)
    } else {
      log.error('an error occurred: \'' + reason + '\' stack: ' + reason.stack)
      clear()
      start()
    }
  } else {
    clear()
    start(reason)
  }
}

function start (dataCenter) {
  connect(dataCenter)
    .then(requestAuthKey)
    .then(checkDataCenters)
    .then(sendAuthCode)
    .then(save)
    .then(() => log.debug('client ready'))
    .catch(reconnect)
}

function shutdown (error) {
  if (error) {
    log.fatal('fatal error occurred: ' + error)
  }
  clear()
  log.debug('shutdown')
  process.exit(1)
}

start()

module.exports.signIn = code => {
  return new Promise((resolve, reject) => {
    log.debug('signing in: ' + config.phone + ' ' + gData.codeHash + ' ' + code)
    gData.client.auth.signIn(config.phone, gData.codeHash, code, response => {
      if (response.instanceOf('mtproto.type.Rpc_error')) {
        reject(new Error(response.error_message))
      } else {
        log.debug('signed in: ' + JSON.stringify(response))
        resolve(response)
      }
    })
  })
}

module.exports.getContacts = () => {
  log.debug('contacts request')
  return gData.client.contacts.getContacts('')
}

module.exports.importContacts = (contacts, replace) => {
  log.debug('importing contacts')
  return new Promise(resolve => resolve('not implemented yet'))
}

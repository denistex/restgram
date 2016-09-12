const express = require('express')
const log = require('./lib/logging')
const client = require('./lib/client')

const app = express()

app.get('/get_user_id_by_phone', (req, res) => {
  res.send('Not implemented yet.')
})

app.get('/set_auth_code', (req, res) => {
  client.signIn(req.query.code)
    .then(() => res.send('ok'))
})

app.listen(3000, () => {
  log.debug('listening on *:3000')
})

const express = require('express')
const log = require('./lib/logging')
const client = require('./lib/client')

const app = express()

app.get('/get_user_id_by_phone', (req, res) => {
  res.send('not implemented yet')
})

app.get('/sign_in', (req, res) => {
  client.signIn(req.query.code)
    .then(() => res.send('ok'))
    .catch(() => res.send('error'))
})

app.get('/get_contacts', (req, res) => {
  client.getContacts()
    .then(contacts => res.send(JSON.stringify(contacts)))
})

app.get('/import_contact', (req, res) => {
  client.importContacts([{
    client_id: 0,
    phone: req.query.phone,
    first_name: 'first_name',
    last_name: 'last_name'
  }], false)
    .then(imported => res.send(JSON.stringify(imported)))
})

app.listen(3000, () => {
  log.debug('listening on *:3000')
})

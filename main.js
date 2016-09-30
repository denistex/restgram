const express = require('express')
const log = require('./lib/logging')
const client = require('./lib/client')

const app = express()

app.get('/sign_in', (req, res) => {
  client.signIn(req.query.code)
    .then(() => res.status(200).json({status: 'ok'}))
    .catch(() => res.status(400).json({status: 'error', type: 'unknown'}))
})

app.get('/get_contacts', (req, res) => {
  client.getContacts()
    .then(contacts => res.status(200).json(contacts))
    .catch(error => res.status(400).json(error))
})

app.get('/get_full_user', (req, res) => {
  client.getFullUser(req.query.user_id)
    .then(user => {
      const result = { status: 'error', type: 'unknown' }
      try {
        res.status(200).json({
          status: 'ok',
          data: {
            user_id: user.user.id,
            first_name: user.user.first_name,
            last_name: user.user.last_name
          }
        })
      } catch (error) {
        res.status(400).json(result)
      }
    })
    .catch(error => res.status(400).json(error))
})

app.get('/check_phone', (req, res) => {
  client.checkPhone(req.query.phone)
    .then(result => res.status(200).json(result))
    .catch(error => res.status(400).json(error))
})

app.get('/import_contact', (req, res) => {
  client.importContacts([{
    client_id: 0,
    phone: req.query.phone,
    first_name: req.query.first_name || 'UNKNOWN',
    last_name: req.query.last_name || 'UNKNOWN'
  }], false)
    .then(imported => {
      const result = { status: 'error', type: 'unknown' }
      try {
        res.status(200).json({
          status: 'ok',
          data: { user_id: imported.users.list[0].id }
        })
      } catch (error) {
        res.status(400).json(result)
      }
    })
    .catch(error => res.status(400).json(error))
})

app.listen(3000, () => {
  log.debug('listening on *:3000')
})

const { assoc } = require('ramda')
const { json, redirect } = require('../..')

const db = require('../lib/db')('users')

exports.createUser = req =>
  db.put(req.body)
    .then(json)
    .then(assoc('statusCode', 201))

exports.fetchUser = req =>
  db.get(req.params.id)
    .then(json)

exports.fetchUsers = () =>
  db.where({ keys: false })
    .then(json)

exports.oldUsers = () =>
  redirect('/api/users')

exports.updateUser = req =>
  db.patch(assoc('id', req.params.id, req.body))
    .then(json)

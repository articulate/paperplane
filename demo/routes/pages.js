require('pug/register')
const { objOf } = require('ramda')
const { html }  = require('../..')

const db   = require('../lib/db')('users')
const home = require('../views/home')

exports.home = () =>
  db.where({ keys: false })
    .then(objOf('users'))
    .then(home)
    .then(html)

require('pug/register')
const { objOf } = require('ramda')
const { html }  = require('../..')

const db   = require('../lib/db')('courses')
const home = require('../views/home')

exports.home = () =>
  db.where({ keys: false })
    .then(objOf('courses'))
    .then(home)
    .then(html)

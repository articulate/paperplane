require('pug/register')
const { Async } = require('crocks')
const { objOf } = require('ramda')
const { html }  = require('../..')

const db   = require('../lib/db')('users')
const home = require('../views/home')

const where = Async.fromPromise(db.where)

exports.home = () =>
  where({ keys: false })
    .map(objOf('users'))
    .map(home)
    .map(html)

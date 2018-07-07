const { always, compose, prop } = require('ramda')
const { json, methods, routes, send, serve } = require('../..')

const pages = require('./pages')
const users = require('./users')

const error = () => {
  throw new Error('this code is broken')
}

module.exports = routes({
  '/api/old-users': methods({
    GET: users.oldUsers
  }),

  '/api/users': methods({
    GET:  users.fetchUsers,
    POST: users.createUser
  }),

  '/api/users/:id': methods({
    GET:   users.fetchUser,
    PATCH: users.updateUser,
    PUT:   users.updateUser
  }),

  '/cookies': compose(json, prop('cookies')),

  '/error': error,

  '/health': always(send()),

  '/public/:path+': serve({ root: 'demo/public' }),

  '/': methods({
    GET: pages.home
  })
})

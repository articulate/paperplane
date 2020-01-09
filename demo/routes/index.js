const { validate } = require('@articulate/funky')
const Boom = require('@hapi/boom')
const { NotAcceptable } = require('http-errors')
const Joi = require('joi')
const { always, compose, prop } = require('ramda')
const { json, methods, routes, send, serve } = require('../..')

const pages = require('./pages')
const users = require('./users')

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

  '/errors/basic': () => { throw new Error('this code is broken') },

  '/errors/boom': () => { throw Boom.conflict() },

  '/errors/http': () => { throw new NotAcceptable() },

  '/errors/joi': () => validate(Joi.string(), 123),

  '/health': always(send()),

  '/public/:path+': serve({ root: 'demo/public' }),

  '/': methods({
    GET: pages.home
  })
})

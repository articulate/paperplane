require('./lib/seed')()
const { compose, prop } = require('ramda')
const http = require('http')

const { json, logger, methods, mount, parseJson,
        redirect, routes, static } = require('..')

const {
  createUser,
  fetchUser,
  fetchUsers,
  updateUser
} = require('./api/users')

const { home } = require('./api/pages')

const port = process.env.PORT || 3000

const listening = err =>
  err ? console.error(err) : console.info(`Listening on port: ${port}`)

const endpoints = routes({
  '/': methods({
    GET: home
  }),

  '/cookies': compose(json, prop('cookies')),

  '/public/:path+': static({ root: 'demo/public' }),

  '/users': methods({
    GET:  fetchUsers,
    POST: createUser
  }),

  '/users/:id': methods({
    GET:   fetchUser,
    PATCH: updateUser,
    PUT:   updateUser
  }),

  '/error': () => { throw new Error('this code is broken') },

  '/old-users': () => redirect('/users')
})

const app  = compose(endpoints, parseJson)
const opts = { errLogger: logger, logger }

http.createServer(mount(app, opts)).listen(port, listening)

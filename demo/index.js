require('./lib/seed')()
const { compose } = require('ramda')
const http = require('http')
const util = require('util')

const { logger, methods, mount, parseJson,
        redirect, routes, static } = require('..')

const {
  createCourse,
  fetchCourse,
  fetchCourses,
  updateCourse
} = require('./api/courses')

const { home } = require('./api/pages')

const port = process.env.PORT || 3000

const listening = err =>
  err ? console.error(err) : console.info(`Listening on port: ${port}`)

const endpoints = routes({
  '/': methods({
    GET: home
  }),

  '/public/:path+': static({ root: 'demo/public' }),

  '/courses': methods({
    GET:  fetchCourses,
    POST: createCourse
  }),

  '/courses/:id': methods({
    GET:   fetchCourse,
    PATCH: updateCourse,
    PUT:   updateCourse
  }),

  '/error': () => { throw new Error('this code is broken') },

  '/old-courses': () => redirect('/courses')
})

const app  = compose(endpoints, parseJson)
const opts = { errLogger: logger, logger }

http.createServer(mount(app, opts)).listen(port, listening)

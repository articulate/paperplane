const { compose } = require('ramda')
const http = require('http')
const { json, methods, mount, parseJson, routes } = require('..')

const {
  createCourse,
  fetchCourse,
  fetchCourses,
  updateCourse
} = require('./lib/courses')

const port = 3000

const listening = err =>
  err ? console.error(err) : console.info(`Listening on port: ${port}`)

const endpoints = routes({
  '/courses': methods({
    GET:  fetchCourses,
    POST: createCourse
  }),

  '/courses/:id': methods({
    GET:   fetchCourse,
    PATCH: updateCourse,
    PUT:   updateCourse
  })
})

const app = compose(endpoints, parseJson)

http.createServer(mount(app)).listen(port, listening)

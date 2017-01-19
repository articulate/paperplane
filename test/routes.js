const { always: K, compose, objOf, path } = require('ramda')
const http    = require('http')
const request = require('supertest')

const json   = require('../lib/json')
const routes = require('../lib/routes')
const mount  = require('../lib/mount')

describe('routes', function() {
  const app = routes({
    '/users':     K(json([])),
    '/users/:id': compose(objOf('body'), path(['params', 'id']))
  })

  const server = http.createServer(mount(app))

  it('routes to handler matching the request url', function(done) {
    request(server).get('/users').expect(200, [], done)
  })

  it('parses the route params for matched routes', function(done) {
    request(server).get('/users/bob').expect(200, 'bob', done)
  })

  it('404 Not Founds for unmatched routes', function(done) {
    request(server).get('/not-found').expect(404, done)
  })
})

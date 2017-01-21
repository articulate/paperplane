const { always: K, compose, objOf, path } = require('ramda')
const http    = require('http')
const request = require('supertest')

const { json, mount, routes } = require('..')

describe('routes', function() {
  const app = routes({
    '/users':     K(json([])),
    '/users/:id': compose(objOf('body'), path(['params', 'id']))
  })

  const server = http.createServer(mount(app)),
        agent  = request.agent(server)

  it('routes to handler matching the request url', function(done) {
    agent.get('/users').expect(200, [], done)
  })

  it('parses the route params for matched routes', function(done) {
    agent.get('/users/bob').expect(200, 'bob', done)
  })

  it('404 Not Founds for unmatched routes', function(done) {
    agent.get('/not-found').expect(404, done)
  })
})

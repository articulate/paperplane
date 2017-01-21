const { always: K  } = require('ramda')
const http    = require('http')
const request = require('supertest')

const mount  = require('../lib/mount')
const routes = require('../lib/routes')
const static = require('../lib/static')

describe('static', function() {
  const app = routes({
    '/foo': K({ body: 'bar' }),
    '/pub/:path+': static({ root: 'test/fixtures' })
  })

  const server = http.createServer(mount(app)),
        agent  = request.agent(server)

  it('responds with found static files', function(done) {
    agent.get('/pub/static-file.txt').expect(200, 'testing testing\n', done)
  })

  it('404 Not Founds for missing static files', function(done) {
    agent.get('/pub/not-a-file.png').expect(404, done)
  })
})

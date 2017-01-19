const { always: K } = require('ramda')
const http    = require('http')
const request = require('supertest')

const methods = require('../lib/methods')
const mount   = require('../lib/mount')

describe('methods', function() {
  const app = methods({
    GET: K({ body: 'GET' }),
    PUT: K({ body: 'PUT' })
  })

  const server = http.createServer(mount(app))

  it('routes to the handler matching the request method', function(done) {
    request(server).get('/').expect(200, 'GET', done)
  })

  it('404 Not Founds when no matching method is found', function(done) {
    request(server).post('/').send({}).expect(404, done)
  })
})

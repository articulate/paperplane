const { always: K, compose, merge, objOf, prop } = require('ramda')
const { expect } = require('chai')
const http       = require('http')
const request    = require('supertest')

const mount  = require('../lib/mount')
const routes = require('../lib/routes')
const static = require('../lib/static')

describe('static', function() {
  const app = routes({
    '/foo': K({ body: 'bar' }),
    '/public/:path+': static({ root: 'test/fixtures' })
  })

  const server = http.createServer(mount(app))

  it('responds with found static files', function(done) {
    request(server)
      .get('/public/static-file.txt')
      .expect(200, 'testing testing\n', done)
  })

  it('404 Not Founds for missing static files', function(done) {
    request(server)
      .get('/public/not-a-file.png')
      .expect(404, done)
  })
})

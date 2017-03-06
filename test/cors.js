const { always: K } = require('ramda')
const http    = require('http')
const request = require('supertest')

const { cors, mount, send } = require('..')

describe('cors', function() {
  describe('with no options specified', function() {
    const app    = cors(K(send())),
          server = http.createServer(mount(app)),
          agent  = request.agent(server)

    describe('receiving an OPTIONS request', function() {
      it('responds with a 204', function(done) {
        agent.options('/').expect(204, done)
      })

      it('defaults the credentials to true', function(done) {
        agent.options('/').expect('access-control-allow-credentials', 'true', done)
      })

      it('defaults the headers to "content-type"', function(done) {
        agent.options('/').expect('access-control-allow-headers', 'content-type', done)
      })

      it('defaults the methods to "GET,POST,OPTIONS,PUT,PATCH,DELETE"', function(done) {
        agent.options('/').expect('access-control-allow-methods', 'GET,POST,OPTIONS,PUT,PATCH,DELETE', done)
      })

      it('defaults the origin to "*"', function(done) {
        agent.options('/').expect('access-control-allow-origin', '*', done)
      })

      it('reflects the supplied "access-control-request-headers"', function(done) {
        agent.options('/')
          .set('access-control-request-headers', 'content-length')
          .expect('access-control-allow-headers', 'content-length', done)
      })

      it('reflects the supplied "access-control-request-method"', function(done) {
        agent.options('/')
          .set('access-control-request-method', 'POST')
          .expect('access-control-allow-methods', 'POST', done)
      })
    })

    describe('receiving the actual request', function() {
      it('defaults the credentials to true', function(done) {
        agent.get('/').expect('access-control-allow-credentials', 'true', done)
      })

      it('defaults the origin to "*"', function(done) {
        agent.get('/').expect('access-control-allow-origin', '*', done)
      })
    })
  })

  describe('with options specified', function() {
    const opts = {
      credentials: 'false',
      headers: 'x-custom-header',
      methods: 'GET,PUT',
      origin: 'https://articulate.com'
    }

    const app    = cors(K(send()), opts),
          server = http.createServer(mount(app)),
          agent  = request.agent(server)

    describe('receiving an OPTIONS request', function() {
      it('responds with a 204', function(done) {
        agent.options('/').expect(204, done)
      })

      it('overrides the default credentials', function(done) {
        agent.options('/').expect('access-control-allow-credentials', opts.credentials, done)
      })

      it('overrides the default headers', function(done) {
        agent.options('/').expect('access-control-allow-headers', opts.headers, done)
      })

      it('overrides the default methods', function(done) {
        agent.options('/').expect('access-control-allow-methods', opts.methods, done)
      })

      it('overrides the default origin', function(done) {
        agent.options('/').expect('access-control-allow-origin', opts.origin, done)
      })
    })

    describe('receiving the actual request', function () {
      it('overrides the default credentials', function(done) {
        agent.get('/').expect('access-control-allow-credentials', opts.credentials, done)
      })

      it('overrides the default origin', function(done) {
        agent.get('/').expect('access-control-allow-origin', opts.origin, done)
      })
    })
  })
})

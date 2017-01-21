const { always: K, compose, pick, prop } = require('ramda')
const { expect }   = require('chai')
const { NotFound } = require('http-errors')
const Boom    = require('boom')
const http    = require('http')
const request = require('supertest')
const str     = require('string-to-stream')

const { json, mount, routes } = require('..')
const spy = require('./lib/spy')

describe('mount', function() {
  const app = routes({
    '/body':   pick(['body']),
    '/boom':   () => { throw Boom.notFound() },
    '/buffer': K({ body: Buffer.from([0x62, 0x75, 0x66, 0x66, 0x65, 0x72]) }),
    '/cookie': compose(json, prop('cookies')),
    '/error':  () => { throw new Error('error') },
    '/http':   () => { throw new NotFound() },
    '/json':   K(json({})),
    '/none':   K({ body: undefined }),
    '/stream': K({ body: str('stream') }),
    '/string': K({ body: 'string' }),
    '/url':    compose(json, pick(['pathname', 'query']))
  })

  const errLogger = spy(),
        logger    = spy(),
        server    = http.createServer(mount(app, { errLogger, logger })),
        agent     = request.agent(server)

  afterEach(function() {
    errLogger.reset()
    logger.reset()
  })

  describe('request', function() {
    it('reads the whole body', function(done) {
      agent.post('/body').send('body').expect(200, 'body', done)
    })

    it('parses the pathname and query', function(done) {
      agent.get('/url?foo=bar')
        .expect(200, { pathname: '/url', query: { foo: 'bar' } }, done)
    })

    it('parses the cookies', function(done) {
      agent.get('/cookie')
        .set('cookie', 'foo=bar; equation=E%3Dmc%5E2')
        .end((err, res) => {
          expect(res.body.foo).to.equal('bar')
          expect(res.body.equation).to.equal('E=mc^2')
          done()
        })
    })
  })

  describe('response body', function() {
    it('accepts a buffer', function(done) {
      agent.get('/buffer').expect(200, 'buffer', done)
    })

    it('accepts a string', function(done) {
      agent.get('/string').expect(200, 'string', done)
    })

    it('accepts a stream', function(done) {
      agent.get('/stream').expect(200, 'stream', done)
    })

    it('accepts undefined to denote a no-content body', function(done) {
      agent.get('/none').expect(200, done)
    })
  })

  describe('response headers', function() {
    it('accepts an object of headers', function(done) {
      agent.get('/json').expect('content-type', 'application/json', done)
    })

    it('defaults the content-type to "application/octet-stream"', function(done) {
      agent.get('/string').expect('content-type', 'application/octet-stream', done)
    })

    it('sets the content-length header for buffers', function(done) {
      agent.get('/buffer').expect('content-length', '6', done)
    })

    it('sets the content-length header for strings', function(done) {
      agent.get('/string').expect('content-length', '6', done)
    })

    it('sets the etag header for buffers', function(done) {
      agent.get('/buffer').expect('etag', '"6-fy20I6SbMFRZFHMy+wHPhw"', done)
    })

    it('sets the etag header for strings', function(done) {
      agent.get('/string').expect('etag', '"6-tFz/4ITdPSDZKL7oXnsPIQ"', done)
    })
  })

  describe('errors', function() {
    it('defaults statusCode to 500', function(done) {
      agent.get('/error').expect(500, done)
    })

    it('catches and formats boom errors', function(done) {
      agent.get('/boom').expect(404, done)
    })

    it('catches and formats http-errors', function(done) {
      agent.get('/http').expect(404, done)
    })
  })

  describe('logging', function() {
    it('logs and rethrows errors if errLogger supplied', function(done) {
      agent.get('/error').end((err, res) => {
        expect(errLogger.calls.length).to.equal(1)
        expect(res.statusCode).to.equal(500)
        done()
      })
    })

    it('logs requests and responses', function(done) {
      agent.get('/string').end(() => {
        expect(logger.calls.length).to.equal(1)
        expect(logger.calls[0].req).to.exist
        expect(logger.calls[0].res).to.exist
        done()
      })
    })
  })
})

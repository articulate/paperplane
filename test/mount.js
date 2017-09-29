const { always: K, compose, pick, prop } = require('ramda')
const { expect }   = require('chai')
const { NotFound } = require('http-errors')
const Boom    = require('boom')
const http    = require('http')
const Joi     = require('joi')
const request = require('supertest')
const str     = require('string-to-stream')

const assertBody              = require('./lib/assertBody')
const { json, mount, routes } = require('..')
const promisify               = require('./lib/promisify')
const spy                     = require('./lib/spy')

const validate = promisify(Joi.validate, Joi)

describe('mount', () => {
  const app = routes({
    '/body':     pick(['body']),
    '/boom':     () => { throw Boom.notFound() },
    '/buffer':   K({ body: Buffer.from([0x62,0x75,0x66,0x66,0x65,0x72]) }),
    '/cookie':   compose(json, prop('cookies')),
    '/error':    () => { throw new Error('error') },
    '/http':     () => { throw new NotFound() },
    '/joi':      () => validate(123, Joi.string()),
    '/json':     K(json({})),
    '/protocol': compose(json, pick(['protocol'])),
    '/none':     K({ body: undefined }),
    '/stream':   K({ body: str('stream') }),
    '/string':   K({ body: 'string' }),
    '/url':      compose(json, pick(['pathname', 'query']))
  })

  const errLogger = spy(),
        logger    = spy(),
        server    = http.createServer(mount(app, { errLogger, logger })),
        agent     = request.agent(server)

  afterEach(() => {
    errLogger.reset()
    logger.reset()
  })

  describe('request', () => {
    it('reads the whole body', () =>
      agent.post('/body').send('body').expect(200).then(assertBody('body'))
    )

    it('parses the pathname and query', () =>
      agent.get('/url?foo=bar')
        .expect(200, { pathname: '/url', query: { foo: 'bar' } })
    )

    it('parses the protocol', () =>
      agent.get('/protocol')
        .expect(200, { protocol: 'http' })
    )

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

  describe('request headers', () => {
    describe('if-none-match header does not match etag', () => {
      it('returns 200 with full response body', () =>
        agent.get('/string').set({ 'if-none-match': '"not-the-right-etag"' })
          .expect(200)
          .expect('etag', '"6-tFz/4ITdPSDZKL7oXnsPIQ"')
          .then(assertBody('string'))
      )
    })

    describe('if-none-match header matches etag', () => {
      it('returns 304 with empty response body', () =>
        agent.get('/string').set({ 'if-none-match': '"6-tFz/4ITdPSDZKL7oXnsPIQ"' })
          .expect(304, '')
          .expect('etag', '"6-tFz/4ITdPSDZKL7oXnsPIQ"')
      )
    })

    describe('when content-length is "0"', () => {
      it('does not parse the body', () =>
        agent.get('/body')
          .set('content-length', '0')
          .expect(200)
      )
    })
  })

  describe('response body', () => {
    it('accepts a buffer', () =>
      agent.get('/buffer').expect(200).then(assertBody('buffer'))
    )

    it('accepts a string', () =>
      agent.get('/string').expect(200).then(assertBody('string'))
    )

    it('accepts a stream', () =>
      agent.get('/stream').expect(200, 'stream')
    )

    it('accepts undefined to denote a no-content body', () =>
      agent.get('/none').expect(200, '')
    )
  })

  describe('response headers', () => {
    it('accepts an object of headers', () =>
      agent.get('/json').expect('content-type', 'application/json')
    )

    it('defaults the content-type to "application/octet-stream"', () =>
      agent.get('/string').expect('content-type', 'application/octet-stream')
    )

    it('sets the content-length header for buffers', () =>
      agent.get('/buffer').expect('content-length', '6')
    )

    it('sets the content-length header for strings', () =>
      agent.get('/string').expect('content-length', '6')
    )

    it('sets the etag header for buffers', () =>
      agent.get('/buffer').expect('etag', '"6-fy20I6SbMFRZFHMy+wHPhw"')
    )

    it('sets the etag header for strings', () =>
      agent.get('/string').expect('etag', '"6-tFz/4ITdPSDZKL7oXnsPIQ"')
    )
  })

  describe('errors', () => {
    it('defaults statusCode to 500', () =>
      agent.get('/error').expect(500)
    )

    it('catches and formats boom errors', () =>
      agent.get('/boom').expect(404)
    )

    it('catches and formats http-errors', () =>
      agent.get('/http').expect(404)
    )

    it('catches and formats joi errors', () =>
      agent.get('/joi').expect(400)
    )
  })

  describe('logging', () => {
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

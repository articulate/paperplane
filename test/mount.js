const { always: K, compose, pick, prop } = require('ramda')
const { Async }    = require('crocks')
const { expect }   = require('chai')
const { NotFound } = require('http-errors')
const { validate } = require('@articulate/funky')
const Boom         = require('boom')
const future       = require('redux-future').default
const http         = require('http')
const Joi          = require('joi')
const request      = require('supertest')
const spy          = require('@articulate/spy')
const str          = require('string-to-stream')

const assertBody  = require('./lib/assertBody')
const errorStream = require('./lib/errorStream')

const { json, mount, routes } = require('..')

describe('mount', () => {
  const app = routes({
    '/body':     pick(['body']),
    '/boom':     () => { throw Boom.notFound() },
    '/broke':    () => ({ body: errorStream() }),
    '/buffer':   K({ body: Buffer.from([0x62,0x75,0x66,0x66,0x65,0x72]) }),
    '/cookie':   compose(json, prop('cookies')),
    '/error':    () => { throw new Error('error') },
    '/http':     () => { throw new NotFound() },
    '/joi':      () => validate(Joi.string(), 123),
    '/json':     K(json({})),
    '/protocol': compose(json, pick(['protocol'])),
    '/none':     K({ body: undefined }),
    '/stream':   () => ({ body: str('stream') }),
    '/string':   K({ body: 'string' }),
    '/url':      compose(json, pick(['pathname', 'query']))
  })

  const cry    = spy()
  const logger = spy()

  afterEach(() => {
    cry.reset()
    logger.reset()
  })

  describe('with { lambda: false } (default)', () => {
    const server = http.createServer(mount({ app, cry, logger }))
    const agent  = request.agent(server)

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

      describe('when content-type is missing', () => {
        it('does not explode', () =>
          agent.post('/body')
            .send('body')
            .set('content-type', '')
            .expect(200)
        )
      })

      it('uses x-forwarded-proto when present', () =>
        agent.get('/protocol')
          .set('x-forwarded-proto', 'https')
          .expect(200, { protocol: 'https' })
      )
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

      it('drops body if method is HEAD', () =>
        agent.head('/buffer')
          .expect(200, undefined)
          .expect('content-length', '6')
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
      it('logs errors to supplied cry function', function(done) {
        agent.get('/error').end((err, res) => {
          expect(cry.calls.length).to.equal(1)
          expect(cry.calls[0][0].req).to.exist
          expect(res.statusCode).to.equal(500)
          done()
        })
      })

      it('logs requests and responses', function(done) {
        agent.get('/string').end(() => {
          expect(logger.calls.length).to.equal(1)
          expect(logger.calls[0][0].req).to.exist
          expect(logger.calls[0][0].res).to.exist
          done()
        })
      })
    })

    describe('when called with no options', () => {
      const server = http.createServer(mount())
      const agent  = request.agent(server)

      it('acts as an echo server', () =>
        agent.post('/').send({ a: 'b' }).expect(200, { a: 'b' })
      )
    })

    describe('when supplied with redux middleware', () => {
      const app = routes({
        '/async': () => Async.of({ body: 'async' })
      })

      const middleware = [ future ]
      const server     = http.createServer(mount({ app, middleware }))
      const agent      = request.agent(server)

      it('supports handlers that return ADTs', () =>
        agent.get('/async').expect(200).then(assertBody('async'))
      )
    })
  })

  describe('with { lambda: true }', () => {
    const handler = mount({ app, cry, lambda: true, logger })

    describe('request', () => {
      it('reads the whole body', () =>
        handler({
          httpMethod: 'POST',
          path: '/body',
          body: 'body'
        }).then(res =>
          expect(res).to.include({
            body: 'body',
            statusCode: 200
          })
        )
      )

      it('parses the pathname and query', () =>
        handler({
          httpMethod: 'GET',
          path: '/url',
          queryStringParameters: { foo: 'bar' }
        }).then(res =>
          expect(res).to.include({
            body: '{"pathname":"/url","query":{"foo":"bar"}}',
            statusCode: 200
          })
        )
      )

      it('parses the protocol', () =>
        handler({
          httpMethod: 'GET',
          path: '/protocol'
        }).then(res =>
          expect(res).to.include({
            body: '{"protocol":"http"}',
            statusCode: 200
          })
        )
      )

      it('parses the cookies', () =>
        handler({
          httpMethod: 'GET',
          path: '/cookie',
          headers: { cookie: 'foo=bar; equation=E%3Dmc%5E2' }
        }).then(res =>
          expect(res).to.include({
            body: '{"foo":"bar","equation":"E=mc^2"}',
            statusCode: 200
          })
        )
      )
    })

    describe('request headers', () => {
      describe('if-none-match header does not match etag', () => {
        it('returns 200 with full response body', () =>
          handler({
            httpMethod: 'GET',
            path: '/string',
            headers: { 'if-none-match': '"not-the-right-etag"' }
          }).then(res => {
            expect(res).to.include({
              body: 'string',
              statusCode: 200
            })
            expect(res.headers).to.include({
              etag: '"6-tFz/4ITdPSDZKL7oXnsPIQ"'
            })
          })
        )
      })

      describe('if-none-match header matches etag', () => {
        it('returns 304 with empty response body', () =>
          handler({
            httpMethod: 'GET',
            path: '/string',
            headers: { 'if-none-match': '"6-tFz/4ITdPSDZKL7oXnsPIQ"' }
          }).then(res => {
            expect(res.body).to.be.undefined
            expect(res.headers).to.include({
              etag: '"6-tFz/4ITdPSDZKL7oXnsPIQ"'
            })
            expect(res.statusCode).to.equal(304)
          })
        )
      })

      describe('when content-length is "0"', () => {
        it('does not parse the body', () =>
          handler({
            httpMethod: 'GET',
            path: '/body',
            headers: { 'content-length': '0' }
          }).then(res =>
            expect(res.statusCode).to.equal(200)
          )
        )
      })

      describe('when content-type is missing', () => {
        it('does not explode', () =>
          handler({
            httpMethod: 'POST',
            path: '/body',
            headers: { 'content-type': '' },
            body: 'body'
          }).then(res =>
            expect(res.statusCode).to.equal(200)
          )
        )
      })

      it('uses x-forwarded-proto when present', () =>
        handler({
          httpMethod: 'GET',
          path: '/protocol',
          headers: { 'x-forwarded-proto': 'https' }
        }).then(res =>
          expect(res).to.include({
            body: '{"protocol":"https"}',
            statusCode: 200
          })
        )
      )
    })

    describe('response body', () => {
      it('accepts a buffer', () =>
        handler({
          httpMethod: 'GET',
          path: '/buffer'
        }).then(res => {
          expect(res.body).to.equal('YnVmZmVy')
          expect(res.headers['content-length']).to.equal(6)
          expect(res.isBase64Encoded).to.be.true
          expect(res.statusCode).to.equal(200)
        })
      )

      it('accepts a string', () =>
        handler({
          httpMethod: 'GET',
          path: '/string'
        }).then(res =>
          expect(res).to.include({
            body: 'string',
            isBase64Encoded: false,
            statusCode: 200
          })
        )
      )

      it('accepts a stream', () =>
        handler({
          httpMethod: 'GET',
          path: '/stream'
        }).then(res =>
          expect(res).to.include({
            body: 'c3RyZWFt',
            isBase64Encoded: true,
            statusCode: 200
          })
        )
      )

      it('accepts undefined to denote a no-content body', () =>
        handler({
          httpMethod: 'GET',
          path: '/none'
        }).then(res => {
          expect(res.body).to.be.undefined
          expect(res.statusCode).to.equal(200)
        })
      )

      it('drops body if method is HEAD', () =>
        handler({
          httpMethod: 'HEAD',
          path: '/buffer'
        }).then(res => {
          expect(res.body).to.be.undefined
          expect(res.headers['content-length']).to.equal(6)
          expect(res.isBase64Encoded).to.be.false
          expect(res.statusCode).to.equal(200)
        })
      )
    })

    describe('response headers', () => {
      it('accepts an object of headers', () =>
        handler({
          httpMethod: 'GET',
          path: '/json'
        }).then(res =>
          expect(res.headers).to.include({
            'content-type': 'application/json'
          })
        )
      )

      it('defaults the content-type to "application/octet-stream"', () =>
        handler({
          httpMethod: 'GET',
          path: '/string'
        }).then(res =>
          expect(res.headers).to.include({
            'content-type': 'application/octet-stream'
          })
        )
      )

      it('sets the content-length header for buffers', () =>
        handler({
          httpMethod: 'GET',
          path: '/buffer'
        }).then(res =>
          expect(res.headers).to.include({
            'content-length': 6
          })
        )
      )

      it('sets the content-length header for strings', () =>
        handler({
          httpMethod: 'GET',
          path: '/string'
        }).then(res =>
          expect(res.headers).to.include({
            'content-length': 6
          })
        )
      )

      it('sets the etag header for buffers', () =>
        handler({
          httpMethod: 'GET',
          path: '/buffer'
        }).then(res =>
          expect(res.headers).to.include({
            'etag': '"6-fy20I6SbMFRZFHMy+wHPhw"'
          })
        )
      )

      it('sets the etag header for strings', () =>
        handler({
          httpMethod: 'GET',
          path: '/string'
        }).then(res =>
          expect(res.headers).to.include({
            'etag': '"6-tFz/4ITdPSDZKL7oXnsPIQ"'
          })
        )
      )
    })

    describe('errors', () => {
      it('defaults statusCode to 500', () =>
        handler({
          httpMethod: 'GET',
          path: '/error'
        }).then(res =>
          expect(res.statusCode).to.equal(500)
        )
      )

      it('catches and formats boom errors', () =>
        handler({
          httpMethod: 'GET',
          path: '/boom'
        }).then(res =>
          expect(res.statusCode).to.equal(404)
        )
      )

      it('catches and formats http-errors', () =>
        handler({
          httpMethod: 'GET',
          path: '/http'
        }).then(res =>
          expect(res.statusCode).to.equal(404)
        )
      )

      it('catches and formats joi errors', () =>
        handler({
          httpMethod: 'GET',
          path: '/joi'
        }).then(res =>
          expect(res.statusCode).to.equal(400)
        )
      )
    })

    describe('logging', () => {
      it('logs errors to supplied cry function', () =>
        handler({
          httpMethod: 'GET',
          path: '/error'
        }).then(res => {
          expect(cry.calls.length).to.equal(1)
          expect(cry.calls[0][0].req).to.exist
          expect(res.statusCode).to.equal(500)
        })
      )

      it('logs requests and responses', () =>
        handler({
          httpMethod: 'GET',
          path: '/string'
        }).then(() => {
          expect(logger.calls.length).to.equal(1)
          expect(logger.calls[0][0].req).to.exist
          expect(logger.calls[0][0].res).to.exist
        })
      )
    })

    describe('when called with no other options', () => {
      const handler = mount({ lambda: true })

      it('acts as an echo server', () =>
        handler({
          httpMethod: 'POST',
          path: '/',
          body: 'body'
        }).then(res =>
          expect(res).to.include({
            body: 'body',
            statusCode: 200
          })
        )
      )
    })

    describe('when supplied with redux middleware', () => {
      const app = routes({
        '/async': () => Async.of({ body: 'async' })
      })

      const middleware = [ future ]
      const handler    = mount({ app, lambda: true, middleware })

      it('supports handlers that return ADTs', () =>
        handler({
          httpMethod: 'GET',
          path: '/async'
        }).then(res =>
          expect(res).to.include({
            body: 'async',
            statusCode: 200
          })
        )
      )
    })
  })
})

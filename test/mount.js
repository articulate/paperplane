const { always: K, compose, pick, prop } = require('ramda')
const { Async }    = require('crocks')
const { expect }   = require('chai')
const { NotFound } = require('http-errors')
const { validate } = require('@articulate/funky')
const Boom         = require('boom')
const future       = require('redux-future').default
const http         = require('http')
const Joi          = require('joi')
// const property     = require('prop-factory')
const request      = require('supertest')
const spy          = require('@articulate/spy')
const str          = require('string-to-stream')

const assertBody              = require('./lib/assertBody')
const { json, mount, routes } = require('..')

describe('mount', () => {
  const app = routes({
    '/body':     pick(['body']),
    '/boom':     () => { throw Boom.notFound() },
    '/buffer':   K({ body: Buffer.from([0x62,0x75,0x66,0x66,0x65,0x72]) }),
    '/cookie':   compose(json, prop('cookies')),
    '/error':    () => { throw new Error('error') },
    '/http':     () => { throw new NotFound() },
    '/joi':      () => validate(Joi.string(), 123),
    '/json':     K(json({})),
    '/protocol': compose(json, pick(['protocol'])),
    '/none':     K({ body: undefined }),
    '/stream':   K({ body: str('stream') }),
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

    //   it('parses the protocol', () =>
    //     agent.get('/protocol')
    //       .expect(200, { protocol: 'http' })
    //   )

    //   it('parses the cookies', function(done) {
    //     agent.get('/cookie')
    //       .set('cookie', 'foo=bar; equation=E%3Dmc%5E2')
    //       .end((err, res) => {
    //         expect(res.body.foo).to.equal('bar')
    //         expect(res.body.equation).to.equal('E=mc^2')
    //         done()
    //       })
    //   })
    })

    // describe('request headers', () => {
    //   describe('if-none-match header does not match etag', () => {
    //     it('returns 200 with full response body', () =>
    //       agent.get('/string').set({ 'if-none-match': '"not-the-right-etag"' })
    //         .expect(200)
    //         .expect('etag', '"6-tFz/4ITdPSDZKL7oXnsPIQ"')
    //         .then(assertBody('string'))
    //     )
    //   })

    //   describe('if-none-match header matches etag', () => {
    //     it('returns 304 with empty response body', () =>
    //       agent.get('/string').set({ 'if-none-match': '"6-tFz/4ITdPSDZKL7oXnsPIQ"' })
    //         .expect(304, '')
    //         .expect('etag', '"6-tFz/4ITdPSDZKL7oXnsPIQ"')
    //     )
    //   })

    //   describe('when content-length is "0"', () => {
    //     it('does not parse the body', () =>
    //       agent.get('/body')
    //         .set('content-length', '0')
    //         .expect(200)
    //     )
    //   })

    //   describe('when content-type is missing', () => {
    //     it('does not explode', () =>
    //       agent.post('/body')
    //         .send('body')
    //         .set('content-type', '')
    //         .expect(200)
    //     )
    //   })

    //   it('uses x-forwarded-proto when present', () =>
    //     agent.get('/protocol')
    //       .set('x-forwarded-proto', 'https')
    //       .expect(200, { protocol: 'https' })
    //   )
    // })

    // describe('response body', () => {
    //   it('accepts a buffer', () =>
    //     agent.get('/buffer').expect(200).then(assertBody('buffer'))
    //   )

    //   it('accepts a string', () =>
    //     agent.get('/string').expect(200).then(assertBody('string'))
    //   )

    //   it('accepts a stream', () =>
    //     agent.get('/stream').expect(200, 'stream')
    //   )

    //   it('accepts undefined to denote a no-content body', () =>
    //     agent.get('/none').expect(200, '')
    //   )
    // })

    // describe('response headers', () => {
    //   it('accepts an object of headers', () =>
    //     agent.get('/json').expect('content-type', 'application/json')
    //   )

    //   it('defaults the content-type to "application/octet-stream"', () =>
    //     agent.get('/string').expect('content-type', 'application/octet-stream')
    //   )

    //   it('sets the content-length header for buffers', () =>
    //     agent.get('/buffer').expect('content-length', '6')
    //   )

    //   it('sets the content-length header for strings', () =>
    //     agent.get('/string').expect('content-length', '6')
    //   )

    //   it('sets the etag header for buffers', () =>
    //     agent.get('/buffer').expect('etag', '"6-fy20I6SbMFRZFHMy+wHPhw"')
    //   )

    //   it('sets the etag header for strings', () =>
    //     agent.get('/string').expect('etag', '"6-tFz/4ITdPSDZKL7oXnsPIQ"')
    //   )
    // })

    // describe('errors', () => {
    //   it('defaults statusCode to 500', () =>
    //     agent.get('/error').expect(500)
    //   )

    //   it('catches and formats boom errors', () =>
    //     agent.get('/boom').expect(404)
    //   )

    //   it('catches and formats http-errors', () =>
    //     agent.get('/http').expect(404)
    //   )

    //   it('catches and formats joi errors', () =>
    //     agent.get('/joi').expect(400)
    //   )
    // })

    // describe('logging', () => {
    //   it('logs errors to supplied cry function', function(done) {
    //     agent.get('/error').end((err, res) => {
    //       expect(cry.calls.length).to.equal(1)
    //       expect(cry.calls[0][0].req).to.exist
    //       expect(res.statusCode).to.equal(500)
    //       done()
    //     })
    //   })

    //   it('logs requests and responses', function(done) {
    //     agent.get('/string').end(() => {
    //       expect(logger.calls.length).to.equal(1)
    //       expect(logger.calls[0][0].req).to.exist
    //       expect(logger.calls[0][0].res).to.exist
    //       done()
    //     })
    //   })
    // })

    // describe('when called with no options', () => {
    //   const server = http.createServer(mount())
    //   const agent  = request.agent(server)

    //   it('acts as an echo server', () =>
    //     agent.post('/').send({ a: 'b' }).expect(200, { a: 'b' })
    //   )
    // })

    // describe('when supplied with redux middleware', () => {
    //   const app = routes({
    //     '/async': () => Async.of({ body: 'async' })
    //   })

    //   const middleware = [ future ]
    //   const server     = http.createServer(mount({ app, middleware }))
    //   const agent      = request.agent(server)

    //   it('supports handlers that return ADTs', () =>
    //     agent.get('/async').expect(200).then(assertBody('async'))
    //   )
    // })

  //   const event = {
  //     headers: { 'X-Forwarded-Proto': 'https' },
  //     httpMethod: 'GET',
  //     path: '/json'
  //   }

  //   const handler = mount({ app, lambda: true })
  //   const res     = property()

  //   beforeEach(() =>
  //     handler(event).then(res)
  //   )

  //   it('supports Lambda proxy integration', () => {
  //     expect(res().body).to.equal('{}')
  //     expect(res().statusCode).to.equal(200)
  //     expect(res().headers).to.eql({
  //       'content-length': 2,
  //       'content-type': 'application/json',
  //       'etag': '"2-mZFLkyvTelC5g8XnyQrpOw"'
  //     })
  //   })
  })
})

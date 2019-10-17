const { composeP }    = require('ramda')
const { expect }      = require('chai')
const http            = require('http')
const request         = require('supertest')
const spy             = require('@articulate/spy')

// brute-force silence warnings from appearing in tests
delete require.cache[require.resolve('..')]
delete require.cache[require.resolve('../lib/use')]
const _warn = console.warn
console.warn = spy()
const { json, mount, use } = require('..')
console.warn = _warn

describe('server middleware', () => {

  const cry    = spy()
  const logger = spy()

  const myapp = () => Promise.resolve(json({ mock: 'response' }))

  afterEach(() => {
    cry.reset()
    logger.reset()
  })

  context('with { lambda: false }', () => {
    context('with one middleware function', () => {
      const middleSpy = spy()

      const middle = (req, res, next) => {
        middleSpy(req, res)
        res.setHeader('X-Foo', req.headers['x-bar'])
        next()
      }

      const app = composeP(myapp, use(middle))

      const server =
        http.createServer(mount({ app, cry, logger }))

      const agent  = request.agent(server)

      afterEach(() => {
        middleSpy.reset()
      })

      it('calls middleware & responds', () =>
        agent.get('/')
          .set('X-Bar', 'Baz')
          .expect(200)
          .expect('X-Foo', 'Baz')
          .then(() => {
            expect(middleSpy.calls).to.have.a.lengthOf(1)
          })
      )
    })

    context('with multiple middleware functions', () => {
      const middleSpy = spy()

      const middle1 = (req, res, next) => {
        middleSpy(req, res)
        res.setHeader('X-Foo', parseInt(req.headers['x-foo'], 10) - 20)
        next()
      }

      const middle2 = (req, res, next) => {
        middleSpy(req, res)
        res.setHeader('X-Foo', parseInt(res.getHeader('X-Foo'), 10) * 3)
        next()
      }

      const middle3 = (req, res, next) => {
        middleSpy(req, res)
        res.setHeader('X-Foo', parseInt(res.getHeader('X-Foo'), 10) + 15)
        next()
      }

      const app = composeP(myapp, use(middle3), use(middle2), use(middle1))

      const server =
        http.createServer(mount({ app, cry, logger }))

      const agent  = request.agent(server)

      afterEach(() => {
        middleSpy.reset()
      })

      it('applies middleware in order', () =>
        agent.get('/')
          .set('X-Foo', '50')
          .expect(200)
          .expect('X-Foo', '105')
          .then(() => {
            expect(middleSpy.calls).to.have.a.lengthOf(3)
          })
      )
    })

    context('with middleware that alters response body', () => {
      const middleSpy = spy()

      const middle = (req, res, next) => {
        middleSpy(req, res)

        const _end = res.end

        res.end = function (chunk, ...rest) {
          const payload = JSON.parse(chunk)
          payload.mock = 'foobar'
          const transformed = JSON.stringify(payload)
          return _end.call(this, transformed, ...rest)
        }

        next()
      }

      const app = composeP(myapp, use(middle))

      const server =
        http.createServer(mount({ app, cry, logger }))

      const agent  = request.agent(server)

      afterEach(() => {
        middleSpy.reset()
      })

      it('calls middleware & responds', () =>
        agent.get('/')
          .expect(200, { mock: 'foobar' })
          .then(() => {
            expect(middleSpy.calls).to.have.a.lengthOf(1)
          })
      )
    })

    context('with middleware that ends response', () => {
      const middleSpy = spy()

      const middle = (req, res, next) => {
        middleSpy(req, res)
        res.statusCode = 304
        res.end()
        next()
      }

      const app = composeP(myapp, use(middle))

      const server =
        http.createServer(mount({ app, cry, logger }))

      const agent  = request.agent(server)

      afterEach(() => {
        middleSpy.reset()
      })

      it('calls middleware & responds', () =>
        agent.get('/')
          .expect(304)
          .then(() => {
            expect(middleSpy.calls).to.have.a.lengthOf(1)
          })
      )
    })

    context('with erroring middleware', () => {
      const middleSpy = spy()

      const middle = (req, res) => {
        middleSpy(req, res)
        throw new Error('foobar')
      }

      const app = composeP(myapp, use(middle))

      const server =
        http.createServer(mount({ app, cry, logger }))

      const agent  = request.agent(server)

      afterEach(() => {
        middleSpy.reset()
      })

      it('calls middleware & responds', () =>
        agent.get('/')
          .expect(500, { message: 'foobar', name: 'Error' })
          .then(() => {
            expect(middleSpy.calls).to.have.a.lengthOf(1)
          })
      )
    })
  })

  context('with { lambda: true }', () => {
    context('with  middleware function', () => {
      const middleSpy = spy()

      const middle = (req, res, next) => {
        middleSpy(req, res)
        next()
      }

      const app = composeP(myapp, use(middle))

      const handler = mount({ lambda: true, app, cry, logger })

      afterEach(() => {
        middleSpy.reset()
      })

      it('ignors middleware & responds', () =>
        handler({
          httpMethod: 'GET',
        })
          .then(res => {
            expect(res)
              .to.have.property('body')
              .that.deep.equals('{"mock":"response"}')
            expect(middleSpy.calls).to.have.a.lengthOf(0)
          })
      )
    })
  })
})

const { composeP }     = require('ramda')
const { expect }      = require('chai')
const http            = require('http')
const request         = require('supertest')
const spy             = require('@articulate/spy')

const { mount, use } = require('..')

describe('server middleware', () => {

  const cry    = spy()
  const logger = spy()

  const myapp = () => Promise.resolve({ statusCode: 200 })

  afterEach(() => {
    cry.reset()
    logger.reset()
  })

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

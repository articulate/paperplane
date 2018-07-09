const { always: K } = require('ramda')
const Boom    = require('boom')
const http    = require('http')
const request = require('supertest')

const { cors, mount, send } = require('..')

const boomError   = () => { throw Boom.notFound() }
const joiError    = () => { throw Object.assign(new Error(), { isJoi: true }) }
const systemError = () => { throw new Error() }

describe('cors', () => {
  describe('with no options specified', () => {
    const app    = cors(K(send()))
    const server = http.createServer(mount({ app }))
    const agent  = request.agent(server)

    describe('receiving an OPTIONS request', () => {
      it('responds with a 204', () =>
        agent.options('/').expect(204)
      )

      it('defaults the credentials to true', () =>
        agent.options('/').expect('access-control-allow-credentials', 'true')
      )

      it('defaults the headers to "content-type"', () =>
        agent.options('/').expect('access-control-allow-headers', 'content-type')
      )

      it('defaults the methods to "GET,POST,OPTIONS,PUT,PATCH,DELETE"', () =>
        agent.options('/').expect('access-control-allow-methods', 'GET,POST,OPTIONS,PUT,PATCH,DELETE')
      )

      it('defaults the origin to "*"', () =>
        agent.options('/').expect('access-control-allow-origin', '*')
      )

      it('reflects the supplied "access-control-request-headers"', () =>
        agent.options('/')
          .set('access-control-request-headers', 'content-length')
          .expect('access-control-allow-headers', 'content-length')
      )

      it('reflects the supplied "access-control-request-method"', () =>
        agent.options('/')
          .set('access-control-request-method', 'POST')
          .expect('access-control-allow-methods', 'POST')
      )
    })

    describe('receiving the actual request', () => {
      describe('when the request succeeds', () => {
        const app    = cors(K(send()))
        const server = http.createServer(mount({ app }))
        const agent  = request.agent(server)

        it('defaults the credentials to true', () =>
          agent.get('/').expect('access-control-allow-credentials', 'true')
        )

        it('defaults the origin to "*"', () =>
          agent.get('/').expect('access-control-allow-origin', '*')
        )
      })

      describe('when the request succeeds, no content', () => {
        const app    = cors(K({ statusCode: 204 }))
        const server = http.createServer(mount({ app }))
        const agent  = request.agent(server)

        it('defaults the credentials to true', () =>
          agent.get('/').expect('access-control-allow-credentials', 'true')
        )

        it('defaults the origin to "*"', () =>
          agent.get('/').expect('access-control-allow-origin', '*')
        )
      })

      describe('when the request fails with boom', () => {
        const app    = cors(boomError)
        const server = http.createServer(mount({ app }))
        const agent  = request.agent(server)

        it('defaults the credentials to true', () =>
          agent.get('/').expect('access-control-allow-credentials', 'true')
        )

        it('defaults the origin to "*"', () =>
          agent.get('/').expect('access-control-allow-origin', '*')
        )
      })

      describe('when the request fails with joi', () => {
        const app    = cors(joiError)
        const server = http.createServer(mount({ app }))
        const agent  = request.agent(server)

        it('defaults the credentials to true', () =>
          agent.get('/').expect('access-control-allow-credentials', 'true')
        )

        it('defaults the origin to "*"', () =>
          agent.get('/').expect('access-control-allow-origin', '*')
        )
      })

      describe('when the request fails', () => {
        const app    = cors(systemError)
        const server = http.createServer(mount({ app }))
        const agent  = request.agent(server)

        it('defaults the credentials to true', () =>
          agent.get('/').expect('access-control-allow-credentials', 'true')
        )

        it('defaults the origin to "*"', () =>
          agent.get('/').expect('access-control-allow-origin', '*')
        )
      })
    })
  })

  describe('with options specified', () => {
    const opts = {
      credentials: 'false',
      headers: 'x-custom-header',
      methods: 'GET,PUT'
    }

    const app    = cors(K(send()), opts)
    const server = http.createServer(mount({ app }))
    const agent  = request.agent(server)

    describe('receiving an OPTIONS request', () => {
      it('responds with a 204', () =>
        agent.options('/').expect(204)
      )

      it('overrides the default credentials', () =>
        agent.options('/').expect('access-control-allow-credentials', opts.credentials)
      )

      it('overrides the default headers', () =>
        agent.options('/').expect('access-control-allow-headers', opts.headers)
      )

      it('overrides the default methods', () =>
        agent.options('/').expect('access-control-allow-methods', opts.methods)
      )
    })

    describe('receiving the actual request', function () {
      it('overrides the default credentials', () =>
        agent.get('/').expect('access-control-allow-credentials', opts.credentials)
      )
    })
  })

  describe('cors origin', () => {
    describe('when "*"', () => {
      const opts   = { origin: '*' }
      const app    = cors(K(send()), opts)
      const server = http.createServer(mount({ app }))
      const agent  = request.agent(server)

      it('allows all origins', () =>
        agent.options('/').expect('access-control-allow-origin', '*')
      )
    })

    describe('when true', () => {
      const origin = 'https://articulate.com'
      const opts   = { origin: true }
      const app    = cors(K(send()), opts)
      const server = http.createServer(mount({ app }))
      const agent  = request.agent(server)

      it('reflects the request origin', () =>
        agent.options('/').set('origin', origin)
          .expect('access-control-allow-origin', origin)
      )
    })

    describe('when regex', () => {
      const origin = 'https://dev.articulate.zone'
      const opts   = { origin: /\.articulate\.[com|zone]/ }
      const app    = cors(K(send()), opts)
      const server = http.createServer(mount({ app }))
      const agent  = request.agent(server)

      it('allows valid origins', () =>
        agent.options('/').set('origin', origin)
          .expect('access-control-allow-origin', origin)
      )

      it('disallows invalid origins', () =>
        agent.options('/').set('origin', 'https://dev.notarticulate.zone')
          .expect('access-control-allow-origin', 'false')
      )
    })
  })
})

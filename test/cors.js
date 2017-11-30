const { always: K } = require('ramda')
const http    = require('http')
const request = require('supertest')
const Boom = require('boom')

const { cors, mount, send } = require('..')

describe('cors', () => {
  describe('with no options specified', () => {
    describe('receiving an OPTIONS request', () => {
      const app    = cors(K(send())),
            server = http.createServer(mount(app)),
            agent  = request.agent(server)

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
        const app    = cors(K(send())),
              server = http.createServer(mount(app)),
              agent  = request.agent(server)

        it('defaults the credentials to true', () =>
          agent.get('/').expect('access-control-allow-credentials', 'true')
        )

        it('defaults the origin to "*"', () =>
          agent.get('/').expect('access-control-allow-origin', '*')
        )
      })

      describe('when the request fails with boom', () => {
        const app    = cors(() => { throw Boom.notFound() }),
              server = http.createServer(mount(app)),
              agent  = request.agent(server)

        it('defaults the credentials to true', () =>
          agent.get('/').expect('access-control-allow-credentials', 'true')
        )

        it('defaults the origin to "*"', () =>
          agent.get('/').expect('access-control-allow-origin', '*')
        )
      })

      describe('when the request fails with joi', () => {
        const app = cors(() => { throw Object.assign(new Error(), {
                isJoi: true, // quack
              }) }),
              server = http.createServer(mount(app)),
              agent  = request.agent(server)

        it('defaults the credentials to true', () =>
          agent.get('/').expect('access-control-allow-credentials', 'true')
        )

        it('defaults the origin to "*"', () =>
          agent.get('/').expect('access-control-allow-origin', '*')
        )
      })

       describe('when the request fails', () => {
        const app    = cors(() => { throw new Error('foobar') }),
              server = http.createServer(mount(app)),
              agent  = request.agent(server)

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
      methods: 'GET,PUT',
      origin: 'https://articulate.com'
    }

    const app    = cors(K(send()), opts),
          server = http.createServer(mount(app)),
          agent  = request.agent(server)

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

      it('overrides the default origin', () =>
        agent.options('/').expect('access-control-allow-origin', opts.origin)
      )
    })

    describe('receiving the actual request', function () {
      it('overrides the default credentials', () =>
        agent.get('/').expect('access-control-allow-credentials', opts.credentials)
      )

      it('overrides the default origin', () =>
        agent.get('/').expect('access-control-allow-origin', opts.origin)
      )
    })
  })
})

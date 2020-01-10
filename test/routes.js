const { expect } = require('chai')
const { always: K, compose, pick } = require('ramda')
const http    = require('http')
const request = require('supertest')

const { json, mount, routes } = require('..')

describe('routes', () => {
  const getUser =
    compose(json, pick(['params', 'route']))

  const app = routes({
    '/users':     K(json([])),
    '/users/:id': getUser
  })

  const server = http.createServer(mount({ app }))
  const agent  = request.agent(server)

  it('routes to handler matching the request url', () =>
    agent.get('/users').expect(200, [])
  )

  it('parses the route params for matched routes', () =>
    agent.get('/users/bob').expect(200, {
      params: { id: 'bob' },
      route: '/users/:id'
    })
  )

  it('404 Not Founds for unmatched routes', () =>
    agent.get('/not-found')
      .expect(404)
      .then(res => {
        expect(res.body).to.eql({
          error: 'Not Found',
          message: 'Not Found',
          statusCode: 404
        })
      })
  )
})

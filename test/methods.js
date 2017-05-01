const { always: K } = require('ramda')
const http    = require('http')
const request = require('supertest')

const { methods, mount } = require('..')

describe('methods', function() {
  const app = methods({
    GET: K({ body: 'GET' }),
    PUT: K({ body: 'PUT' })
  })

  const server = http.createServer(mount(app)),
        agent  = request.agent(server)

  it('routes to the handler matching the request method', () =>
    agent.get('/').expect(200, 'GET')
  )

  it('also responds to HEAD if GET provided', () =>
    agent.head('/').expect(200)
  );

  it('404 Not Founds when no matching method is found', () =>
    agent.post('/').send({}).expect(404)
  )
})

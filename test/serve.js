const { always: K  } = require('ramda')
const { EOL } = require('os')
const http    = require('http')
const request = require('supertest')

const { mount, routes, serve } = require('..')

describe('serve', () => {
  const app = routes({
    '/foo': K({ body: 'bar' }),
    '/pub/:path+': serve({ root: 'test/fixtures' })
  })

  const server = http.createServer(mount(app)),
        agent  = request.agent(server)

  it('responds with found static files', () =>
    agent.get('/pub/static-file.txt').expect(200, 'testing testing' + EOL)
  )

  it('404 Not Founds for missing static files', () =>
    agent.get('/pub/not-a-file.png').expect(404)
  )
})

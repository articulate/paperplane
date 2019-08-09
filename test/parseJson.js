const { expect } = require('chai')
const http = require('http')
const { composeP, is, objOf, pipe, prop, tap } = require('ramda')
const { Readable } = require('stream')
const { rename } = require('@articulate/funky')
const request = require('supertest')

const { json, mount, parseJson, routes } = require('..')

describe('parseJson', () => {
  const endpoints =
    routes({
      '/json': pipe(
        prop('body'),
        rename('name', 'pkgName'),
        json
      ),

      '/plain': pipe(
        prop('body'),
        is(Readable),
        objOf('isReadable'),
        json
      )
    })

  const app =
    composeP(endpoints, parseJson)

  const cry =
    tap(console.error)

  const body = '{"name":"paperplane"}'

  describe('with { lambda: false } (default)', () => {
    const server = http.createServer(mount({ app, cry }))
    const agent = request.agent(server)

    it('parses when content-type is "application/json"', () =>
      agent.post('/json')
        .type('application/json')
        .send(body)
        .expect(200, { pkgName: 'paperplane' })
    )

    it('parses when json content-type includes a charset', () =>
      agent.post('/json')
        .type('application/json; charset=utf-8')
        .send(body)
        .expect(200, { pkgName: 'paperplane' })
    )

    it('does not parse when content-type is not json', () =>
      agent.post('/plain')
        .type('text/plain')
        .send('just plain text')
        .expect(200, { isReadable: true })
    )
  })

  describe('with { lambda: true }', () => {
    const handler = mount({ app, cry, lambda: true })

    it('parses when content-type is "application/json"', () =>
      handler({
        httpMethod: 'POST',
        path: '/json',
        headers: {
          'content-type': 'application/json'
        },
        body
      }).then(res =>
        expect(res).to.include({
          body: '{"pkgName":"paperplane"}',
          statusCode: 200
        })
      )
    )

    it('parses when json content-type includes a charset', () =>
      handler({
        httpMethod: 'POST',
        path: '/json',
        headers: {
          'content-type': 'application/json; charset=utf-8'
        },
        body
      }).then(res =>
        expect(res).to.include({
          body: '{"pkgName":"paperplane"}',
          statusCode: 200
        })
      )
    )

    it('does not parse when content-type is not json', () =>
      handler({
        httpMethod: 'POST',
        path: '/plain',
        headers: {
          'content-type': 'text/plain'
        },
        body
      }).then(res =>
        expect(res).to.include({
          body: '{"isReadable":false}',
          statusCode: 200
        })
      )
    )
  })
})

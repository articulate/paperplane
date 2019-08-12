const { assemble } = require('@articulate/funky')
const { expect } = require('chai')
const http = require('http')
const { is, pipe, pipeP, prop, tap } = require('ramda')
const { Readable } = require('stream')
const request = require('supertest')

const { bufferBody, json, mount, routes } = require('..')

describe('bufferBody', () => {
  const app =
    routes({
      '/bufferme': pipeP(
        bufferBody,
        prop('body'),
        assemble({
          isReadable: is(Readable),
          isString: is(String)
        }),
        json
      ),

      '/lambda': pipe(
        prop('body'),
        assemble({
          isReadable: is(Readable),
          isString: is(String)
        }),
        json
      )
    })

  const cry =
    tap(console.error)

  describe('with { lambda: false } (default)', () => {
    const server = http.createServer(mount({ app, cry }))
    const agent = request.agent(server)

    it('buffers the body', () =>
      agent.post('/bufferme')
        .type('text/plain')
        .send('body')
        .expect(200, {
          isReadable: false,
          isString: true
        })
    )

    it('does not buffer when content-length is zero', () =>
      agent.post('/bufferme')
        .type('text/plain')
        .send('')
        .expect(200, {
          isReadable: true,
          isString: false
        })
    )
  })

  describe('with { lambda: true }', () => {
    const handler = mount({ app, cry, lambda: true })

    it('the body is already buffered by AWS', () =>
      handler({
        httpMethod: 'POST',
        path: '/lambda',
        headers: {
          'content-type': 'text/plain'
        },
        body: 'body'
      }).then(res =>
        expect(res).to.include({
          body: '{"isReadable":false,"isString":true}',
          statusCode: 200
        })
      )
    )
  })
})

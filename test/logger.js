const { expect } = require('chai')

const { logger } = require('..')

describe('logger', () => {
  const message = {
    foo: 'bar',
    req: {
      body: 'not included',
      headers: {
        'content-type': 'application/json'
      },
      method: 'POST',
      url: '/users'
    },
    res: {
      body: 'not included',
      statusCode: 201
    }
  }

  const output = JSON.parse(logger(message))

  it('includes request headers', () => {
    expect(output.req.headers).to.be.an('object')
    expect(output.req.headers['content-type']).to.equal(message.req.headers['content-type'])
  })

  it('includes request method', () =>
    expect(output.req.method).to.equal(message.req.method)
  )

  it('includes request url', () =>
    expect(output.req.url).to.equal(message.req.url)
  )

  it('omits other request properties', () =>
    expect(output.req.body).to.be.undefined
  )

  it('includes response statusCode', () =>
    expect(output.res.statusCode).to.equal(message.res.statusCode)
  )

  it('omits other response properties', () =>
    expect(output.res.body).to.be.undefined
  )

  it('passes thru other message properties unchanged', () =>
    expect(output.foo).to.equal('bar')
  )

  describe('when used as the errLogger', () => {
    const err = JSON.parse(logger(new Error('message')))

    it('includes the error message', () =>
      expect(err.message).to.equal('message')
    )

    it('includes the error name', () =>
      expect(err.name).to.equal('Error')
    )

    it('includes the error stack', () =>
      expect(err.stack).to.exist
    )
  })
})

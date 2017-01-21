const { expect } = require('chai')

const { logger } = require('..')

describe('logger', function() {
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

  it('includes request headers', function() {
    expect(output.req.headers).to.be.an('object')
    expect(output.req.headers['content-type']).to.equal(message.req.headers['content-type'])
  })

  it('includes request method', function() {
    expect(output.req.method).to.equal(message.req.method)
  })

  it('includes request url', function() {
    expect(output.req.url).to.equal(message.req.url)
  })

  it('omits other request properties', function() {
    expect(output.req.body).to.be.undefined
  })

  it('includes response statusCode', function() {
    expect(output.res.statusCode).to.equal(message.res.statusCode)
  })

  it('omits other response properties', function() {
    expect(output.res.body).to.be.undefined
  })

  it('passes thru other message properties unchanged', function() {
    expect(output.foo).to.equal('bar')
  })
})

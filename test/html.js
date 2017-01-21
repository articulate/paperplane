const { expect } = require('chai')

const { html } = require('..')

describe('html', function() {
  const body = '<html></html>',
        res  = html(body)

  it('includes the body in the response', function() {
    expect(res.body).to.equal(body)
  })

  it('sets the "content-type" header to "text/html"', function() {
    expect(res.headers).to.be.an('object')
    expect(res.headers['content-type']).to.equal('text/html')
  })

  it('sets the statusCode to 200', function() {
    expect(res.statusCode).to.equal(200)
  })
})

const { expect } = require('chai')

const { html } = require('..')

describe('html', () => {
  const body = '<html></html>',
        res  = html(body)

  it('includes the body in the response', () =>
    expect(res.body).to.equal(body)
  )

  it('sets the "content-type" header to "text/html"', () => {
    expect(res.headers).to.be.an('object')
    expect(res.headers['content-type']).to.equal('text/html')
  })

  it('sets the statusCode to 200', () =>
    expect(res.statusCode).to.equal(200)
  )
})

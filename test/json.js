const { expect } = require('chai')

const json = require('../lib/json')

describe('json', function() {
  const body = { foo: 'bar' },
        res  = json(body)

  it('stringifies the body', function() {
    expect(res.body).to.equal(JSON.stringify(body))
  })

  it('sets the "content-type" header to "application/json"', function() {
    expect(res.headers).to.be.an('object')
    expect(res.headers['content-type']).to.equal('application/json')
  })

  it('sets the statusCode to 200', function() {
    expect(res.statusCode).to.equal(200)
  })
})
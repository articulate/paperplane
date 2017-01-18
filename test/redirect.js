const { expect } = require('chai')

const redirect = require('../lib/redirect')

describe('redirect', function() {
  const location = '/new-location',
        res = redirect(location)

  it('sets the "location" header', function() {
    expect(res.headers).to.be.an('object')
    expect(res.headers.location).to.equal(location)
  })

  it('defaults the statusCode to 302', function() {
    expect(res.statusCode).to.equal(302)
  })

  it('accepts statusCode as the second arg', function() {
    expect(redirect(location, 301).statusCode).to.equal(301)
  })
})

const { expect } = require('chai')
const CorsError = require('../lib/cors-error')

describe('cors error object', () => {

  it('is an `Error`', () => {
    expect(CorsError.prototype).to.be.instanceOf(Error)
  })

  it('constructs', () => {
    const err = new Error('foobar')
    const headers = { mock: 'headers' }
    const result = new CorsError(err, headers)
    expect(result.err).to.equal(err)
    expect(result.headers).to.equal(headers)
  })

  it('unwraps `CorsError`', () => {
    const err = new Error('foobar')
    const headers = { mock: 'headers' }
    const result = new CorsError(err, headers)
    expect(CorsError.unwrap(result)).to.equal(err)
  })

  it('passes through other errors', () => {
    const err = new Error('foobar')
    expect(CorsError.unwrap(err)).to.equal(err)
  })

})

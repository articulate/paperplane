const { expect } = require('chai')
const { always: K, objOf } = require('ramda')
const prop = require('prop-factory')

const methods = require('../lib/methods')

describe('methods', function() {
  const app = methods({
    GET: K({ body: 'GET' }),
    PUT: K({ body: 'PUT' })
  })

  const req = objOf('method')

  describe('when a request method matches', function() {
    const res = prop()

    beforeEach(function() {
      return app(req('GET')).then(res)
    })

    it('routes to that handler function', function() {
      expect(res().body).to.equal('GET')
    })
  })

  describe('when no request methods match', function() {
    const res = prop()

    beforeEach(function() {
      return app(req('POST')).catch(res)
    })

    it('booms with a 404 Not Found', function() {
      expect(res().isBoom).to.be.true
      expect(res().output.statusCode).to.equal(404)
    })
  })
})

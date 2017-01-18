const { expect } = require('chai')
const { compose, objOf, path } = require('ramda')
const prop = require('prop-factory')

const routes = require('../lib/routes')

describe('routes', function() {
  const app = routes({
    '/users/:id': compose(objOf('body'), path(['params', 'id'])),
  })

  const req = objOf('pathname')

  describe('when a route pattern matches', function() {
    const res = prop()

    beforeEach(function() {
      return app(req('/users/123')).then(res)
    })

    it('parses the route params && routes to that handler function', function() {
      expect(res().body).to.equal('123')
    })
  })

  describe('when no routes patterns match', function() {
    const res = prop()

    beforeEach(function() {
      return app(req('/wrong/route')).catch(res)
    })

    it('booms with a 404 Not Found', function() {
      expect(res().isBoom).to.be.true
      expect(res().output.statusCode).to.equal(404)
    })
  })
})

const { compose, curry, prop } = require('ramda')
const { expect }               = require('chai')

const assertBody = body =>
  compose(softEqual(body), prop('body'))

const softEqual = curry((a, b) =>
  expect(a == b).to.be.true
)

module.exports = assertBody

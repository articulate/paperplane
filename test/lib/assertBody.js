const { curry, propSatisfies } = require('ramda')
const { expect }               = require('chai')

const assertBody = body =>
  propSatisfies(softEqual(body), 'body')

const softEqual = curry((a, b) =>
  expect(a == b).to.be.true
)

module.exports = assertBody

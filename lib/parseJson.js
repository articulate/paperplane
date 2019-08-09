const {
  compose, composeP, evolve, ifElse, length, path, test, when
} = require('ramda')

const { resolve } = require('@articulate/funky')

const { bufferBody } = require('./bufferBody')

const isJson =
  compose(test(/json/), path(['headers', 'content-type']))

const parse =
  when(length, JSON.parse)

const bufferThenParse =
  composeP(evolve({ body: parse }), bufferBody)

// parseJson :: Request -> Promise Request
exports.parseJson =
  ifElse(isJson, bufferThenParse, resolve)

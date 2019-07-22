const { compose, evolve, length, path, test, when } = require('ramda')

const isJson =
  compose(test(/json/), path(['headers', 'content-type']))

const parse =
  when(length, JSON.parse)

const parseJson =
  when(isJson, evolve({ body: parse }))

module.exports = { parseJson }

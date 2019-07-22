const { compose, evolve, length, path, test, when } = require('ramda')

const isJson =
  compose(test(/json/), path(['headers', 'content-type']))

const parse =
  when(length, JSON.parse)

exports.parseJson =
  when(isJson, evolve({ body: parse }))

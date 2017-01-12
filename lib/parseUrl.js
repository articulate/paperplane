const qs  = require('qs')
const url = require('url')

const { compose, evolve, merge, pick, prop } = require('ramda')

const parse = compose(evolve({ query: qs.parse }), url.parse, prop('url'))

const parseUrl = req =>
  merge(req, pick(['pathname', 'query'], parse(req)))

module.exports = parseUrl

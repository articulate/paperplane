const qs  = require('qs')
const url = require('url')

const { compose, evolve, merge, pick, prop } = require('ramda')

const parseUrl = compose(evolve({ query: qs.parse }), url.parse, prop('url'))

module.exports = req =>
  merge(req, pick(['pathname', 'query'], parseUrl(req)))

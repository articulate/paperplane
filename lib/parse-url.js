const qs  = require('qs')
const url = require('url')

const {
  assoc, converge, evolve, identity, merge, pick, pipe, prop
} = require('ramda')

const parseUrl = pipe(
  prop('url'),
  url.parse,
  evolve({ query: qs.parse }),
  pick(['pathname', 'query'])
)

const protocol = req =>
  req.headers['x-forwarded-proto'] ||
  req.connection.encrypted ? 'https' : 'http'

module.exports = pipe(
  converge(merge, [ identity, parseUrl ]),
  converge(assoc('protocol'), [ protocol, identity ])
)

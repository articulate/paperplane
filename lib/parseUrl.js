const { assocWith } = require('@articulate/funky')
const qs  = require('qs')
const url = require('url')

const {
  converge, evolve, identity, merge, pick, pipe, prop
} = require('ramda')

const pathParts =
  pipe(
    prop('url'),
    url.parse,
    evolve({ query: qs.parse }),
    pick(['pathname', 'query'])
  )

const protocol = req =>
  req.headers['x-forwarded-proto'] ||
  req.connection.encrypted ? 'https' : 'http'

exports.parseUrl =
  pipe(
    converge(merge, [ identity, pathParts ]),
    assocWith('protocol', protocol)
  )

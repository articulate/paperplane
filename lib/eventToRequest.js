const { assocWith, renameAll } = require('@articulate/funky')
const url = require('url')

const {
  assoc, compose, evolve, pathOr, pick, pipe, reduce, toPairs
} = require('ramda')

const cleanEvent =
  pick([
    'body',
    'headers',
    'httpMethod',
    'path',
    'queryStringParameters'
  ])

const downcaseHeader = (headers, [ key, val ]) =>
  assoc(key.toLowerCase(), val, headers)

const downcaseHeaders =
  evolve({ headers: compose(reduce(downcaseHeader, {}), toPairs) })

const formatRequest =
  renameAll({
    httpMethod: 'method',
    path: 'pathname',
    queryStringParameters: 'query'
  })

const forwardedProto =
  pathOr('http', ['headers', 'x-forwarded-proto'])

const rebuildUrl =
  compose(url.format, pick(['pathname', 'query']))

const eventToRequest =
  pipe(
    cleanEvent,
    formatRequest,
    downcaseHeaders,
    assocWith('protocol', forwardedProto),
    assocWith('url', rebuildUrl)
  )

module.exports = eventToRequest

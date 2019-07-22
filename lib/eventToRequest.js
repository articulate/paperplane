const { assemble, assocWith } = require('@articulate/funky')
const url = require('url')

const {
  assoc, compose, pathOr, pick, pipe, prop, reduce, toPairs
} = require('ramda')

const downcaseHeader = (headers, [ key, val ]) =>
  assoc(key.toLowerCase(), val, headers)

const downcasedHeaders =
  compose(reduce(downcaseHeader, {}), toPairs, prop('headers'))

const forwardedProto =
  pathOr('http', ['headers', 'x-forwarded-proto'])

const rebuildUrl =
  compose(url.format, pick(['pathname', 'query']))

const eventToRequest =
  pipe(
    assemble({
      body:     prop('body'),
      context:  prop('requestContext'),
      headers:  downcasedHeaders,
      method:   prop('httpMethod'),
      pathname: prop('path'),
      protocol: forwardedProto,
      query:    prop('queryStringParameters')
    }),
    assocWith('url', rebuildUrl)
  )

module.exports = { eventToRequest }

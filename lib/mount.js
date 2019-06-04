const { compose, identity, is, when, tap } = require('ramda')
const { assocWith } = require('@articulate/funky')

const bufferStreams  = require('./bufferStreams')
const cleanRequest   = require('./cleanRequest')
const defaultLogger  = require('./logger')
const error          = require('./error')
const eventToRequest = require('./eventToRequest')
const getBody        = require('./getBody')
const parseCookies   = require('./parseCookies')
const parseUrl       = require('./parseUrl')
const wrap           = require('./wrap')
const writeHTTP      = require('./writeHTTP')
const writeLambda    = require('./writeLambda')

const mount = (opts={}) => {
  const {
    app        = identity,
    cry        = defaultLogger,
    lambda     = false,
    logger     = defaultLogger,
    middleware = []
  } = opts

  const handler =
    middleware.length ? wrap(middleware, app) : app

  const httpListener = (req, res) =>
    Promise.resolve(req)
      .then(assocWith('original', identity))
      .then(getBody)
      .then(parseUrl)
      .then(parseCookies)
      .then(cleanRequest)
      .then(handler)
      .catch(wrapError(req))
      .then(writeHTTP(req, res))
      .then(() => logger({ req, res }))

  const lambdaHandler = req =>
    Promise.resolve(req)
      .then(parseCookies)
      .then(handler)
      .then(bufferStreams)
      .catch(wrapError(req))
      .then(writeLambda(req))
      .then(tap(res => logger({ req, res })))

  const sob = req => err =>
    cry(Object.assign(err, { req }))

  const wrapError = req =>
    when(is(Error), compose(error, tap(sob(req))))

  return lambda ? compose(lambdaHandler, eventToRequest) : httpListener
}

module.exports = mount

const { compose, curry, identity, merge, is, when, tap, tryCatch } = require('ramda')

const { bufferStreams }         = require('./bufferStreams')
const { cleanRequest }          = require('./cleanRequest')
const { error }                 = require('./error')
const { eventToRequest }        = require('./eventToRequest')
const { logger: defaultLogger } = require('./logger')
const { parseCookies }          = require('./parseCookies')
const { parseUrl }              = require('./parseUrl')
const { passThruBody }          = require('./passThruBody')
const { wrap }                  = require('./wrap')
const { writeHTTP }             = require('./writeHTTP')
const { writeLambda }           = require('./writeLambda')

const keepOriginal = res => req => {
  req.original = req
  req.request = req
  req.response = res
  return req
}

exports.mount = (opts={}) => {
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
      .then(keepOriginal(res))
      .then(passThruBody)
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

  const ignoreRejected = obj => Promise.resolve(obj).catch(identity)

  const ignoreIfThrows = fn => tryCatch(fn, identity)

  const safeCry = compose(ignoreRejected, ignoreIfThrows(cry))

  const sob = req => err =>
    safeCry(Object.assign(err, { req }))

  const wrapError = req =>
    when(is(Error), compose(error, tap(sob(req))))

  return lambda
    ? compose(lambdaHandler, eventToRequest)
    : httpListener
}

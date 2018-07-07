const { identity, pipe, tap } = require('ramda')

const cleanRequest  = require('./cleanRequest')
const defaultLogger = require('./logger')
const error         = require('./error')
const getBody       = require('./getBody')
const parseCookies  = require('./parseCookies')
const parseUrl      = require('./parseUrl')
const wrap          = require('./wrap')
const write         = require('./write')

const mount = (opts={}) => {
  const {
    app        = identity,
    cry        = defaultLogger,
    logger     = defaultLogger,
    middleware = []
  } = opts

  const handle = middleware.length ? wrap(middleware, app) : app

  const requestListener = (req, res) =>
    Promise.resolve(req)
      .then(getBody)
      .then(parseUrl)
      .then(parseCookies)
      .then(cleanRequest)
      .then(handle)
      .catch(pipe(
        tap(sob(req)),
        error
      ))
      .then(write(req, res))
      .then(() => logger({ req, res }))

  const sob = req => err =>
    cry(Object.assign(err, { req }))

  return requestListener
}

module.exports = mount

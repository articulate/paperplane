const etag       = require('etag')
const { Stream } = require('stream')

const getBody      = require('./get-body')
const parseCookies = require('./parse-cookies')
const parseUrl     = require('./parse-url')
const { log, rethrow } = require('./util')
const { error, handleableErrors } = require('./error')

const { byteLength, isBuffer } = Buffer

const mount = (app, { errLogger, logger }={}) =>
  (req, res) =>
    Promise.resolve(req)
      .then(getBody)
      .then(parseUrl)
      .then(parseCookies)
      .then(app)
      .catch(handleableErrors)
      .catch(rethrow(errLogger))
      .catch(error)
      .then(write(res))
      .then(log(logger, { req, res }))

const write = res => ({ body, headers={}, statusCode=200 }) => {
  res.statusCode = statusCode

  for (var name in headers)
    res.setHeader(name, headers[name])

  if (!body)
    return res.end()

  if (body instanceof Stream)
    return body.pipe(res)

  if (!res.getHeader('content-type'))
    res.setHeader('content-type', 'application/octet-stream')

  const length = isBuffer(body) ? body.length : byteLength(body)
  res.setHeader('content-length', length)
  res.setHeader('etag', etag(body))
  res.end(body)
}

module.exports = mount

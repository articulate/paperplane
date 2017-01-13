const etag       = require('etag')
const { Stream } = require('stream')

const error    = require('./error')
const getBody  = require('./get-body')
const parseUrl = require('./parse-url')

const { byteLength, isBuffer } = Buffer

const mount = app => (req, res) =>
  Promise.resolve(req)
    .then(getBody)
    .then(parseUrl)
    .then(app)
    .catch(error)
    .then(write(res))

const write = res => ({ body, headers={}, statusCode=200 }) => {
  res.statusCode = statusCode

  for (var name in headers)
    res.setHeader(name, headers[name])

  if (!body)
    return res.end()

  if (!res.getHeader('content-type'))
    res.setHeader('content-type', 'application/octet-stream')

  if (body instanceof Stream)
    return body.pipe(res)

  const length = isBuffer(body) ? body.length : byteLength(body)
  res.setHeader('content-length', length)
  res.setHeader('etag', etag(body))
  res.end(body)
}

module.exports = mount

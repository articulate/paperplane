const etag       = require('etag')
const rawBody    = require('raw-body')
const { Stream } = require('stream')
const typer      = require('media-typer')

const { path, when } = require('ramda')

const { assign } = require('./util')
const error      = require('./error')
const parseUrl   = require('./parseUrl')

const { byteLength, isBuffer } = Buffer

const getBody = req => {
  const encoding = typer.parse(req).parameters.charset
  return rawBody(req, { encoding, length: length(req) })
    .then(assign('body', req))
}

const length = path(['headers', 'content-length'])

const mount = app => (req, res) =>
  Promise.resolve(req)
    .then(when(length, getBody))
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

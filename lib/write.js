const etag       = require('etag')
const { curry }  = require('ramda')
const { Stream } = require('stream')

const { byteLength, isBuffer } = Buffer

const write = (req, res, data) => {
  const { body, headers={}, statusCode=200 } = data

  for (let name in headers)
    res.setHeader(name, headers[name])

  const requestEtag = req.headers['if-none-match']
  const bodyEtag = !(body instanceof Stream) && etag(body || '')
  const supports304Response = statusCode === 200 && ['GET', 'HEAD'].includes(req.method)

  if (supports304Response && requestEtag && requestEtag === bodyEtag) {
    res.setHeader('etag', bodyEtag)
    res.statusCode = 304
    return res.end()
  }

  res.statusCode = statusCode

  if (!body)
    return res.end()

  if (body instanceof Stream)
    return body.pipe(res)

  if (!res.getHeader('content-type'))
    res.setHeader('content-type', 'application/octet-stream')

  const length = isBuffer(body) ? body.length : byteLength(body)
  res.setHeader('content-length', length)
  res.setHeader('etag', bodyEtag)
  res.end(req.method === 'HEAD' ? undefined : body)
}

module.exports = curry(write)

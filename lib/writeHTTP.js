const etag       = require('etag')
const { curry }  = require('ramda')
const { Stream } = require('stream')

const { byteLength, isBuffer } = Buffer

const writeHTTP = (req, res, data) => {
  // bail if middleware has already ended the response
  if (res.finished) return

  const { body, headers = {}, statusCode = 200 } = data

  for (let name in headers)
    res.setHeader(name, headers[name])

  const bodyEtag    = !(body instanceof Stream) && etag(body || '')
  const reqEtag     = req.headers['if-none-match']
  const supports304 = statusCode === 200 && ['GET', 'HEAD'].includes(req.method)

  if (supports304 && reqEtag && reqEtag === bodyEtag) {
    res.setHeader('etag', bodyEtag)
    res.statusCode = 304
    return res.end()
  }

  res.statusCode = statusCode

  if (!body)
    return res.end()

  if (body instanceof Stream) {
    res.flushHeaders()
    return body.pipe(res)
  }

  if (!res.getHeader('content-type'))
    res.setHeader('content-type', 'application/octet-stream')

  const length = isBuffer(body) ? body.length : byteLength(body)
  res.setHeader('content-length', length)
  res.setHeader('etag', bodyEtag)
  res.end(req.method === 'HEAD' ? undefined : body)
}

exports.writeHTTP = curry(writeHTTP)

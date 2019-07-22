const { curry } = require('ramda')
const etag      = require('etag')

const { byteLength, isBuffer } = Buffer

const writeLambda = (req, res) => {
  let {
    body,
    headers = {},
    isBase64Encoded = false,
    statusCode = 200
  } = res

  if (!body)
    return { headers, statusCode }

  const bodyEtag    = etag(body)
  const reqEtag     = req.headers['if-none-match']
  const supports304 = statusCode === 200 && ['GET', 'HEAD'].includes(req.method)

  headers['etag'] = bodyEtag

  if (supports304 && reqEtag && reqEtag === bodyEtag)
    return { headers, statusCode: 304 }

  if (isBuffer(body)) {
    headers['content-length'] = body.length
    body = body.toString('base64')
    isBase64Encoded = true
  } else {
    headers['content-length'] = byteLength(body)
  }

  if (!headers['content-type'])
    headers['content-type'] = 'application/octet-stream'

  if (req.method === 'HEAD') {
    body = undefined
    isBase64Encoded = false
  }

  return { body, headers, isBase64Encoded, statusCode }
}

module.exports = { writeLambda: curry(writeLambda) }

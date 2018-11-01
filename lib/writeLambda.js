const { curry }      = require('ramda')
const etag           = require('etag')
const { promisify }  = require('@articulate/funky')
const { Stream }     = require('stream')
const streamToBuffer = promisify(require('fast-stream-to-buffer'))

const { byteLength, isBuffer } = Buffer

const writeLambda = (req, res) =>
  new Promise((resolve, reject) => {
    let {
      body,
      headers = {},
      isBase64Encoded = false,
      statusCode = 200
    } = res

    if (!body)
      return resolve({ headers, statusCode })

    if (body instanceof Stream)
      return streamToBuffer(body).then(encodeAndRespond, reject)

    if (isBuffer(body))
      return encodeAndRespond(body)

    respond()

    function encodeAndRespond(buffer) {
      body = buffer.toString('base64')
      isBase64Encoded = true
      respond()
    }

    function respond() {
      const bodyEtag    = etag(body)
      const reqEtag     = req.headers['if-none-match']
      const supports304 = statusCode === 200 && ['GET', 'HEAD'].includes(req.method)

      headers['etag'] = bodyEtag

      if (supports304 && reqEtag && reqEtag === bodyEtag) {
        resolve({ headers, statusCode: 304 })
      } else {
        headers['content-length'] = byteLength(body)

        if (!headers['content-type'])
          headers['content-type'] = 'application/octet-stream'

        if (req.method === 'HEAD') {
          body = undefined
          isBase64Encoded = false
        }

        resolve({ body, headers, isBase64Encoded, statusCode })
      }
    }
  })

module.exports = curry(writeLambda)

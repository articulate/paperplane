const { PassThrough } = require('stream')

exports.passThruBody = req => {
  const body = new PassThrough()
  req.original.pipe(body)
  req.body = body
  return req
}

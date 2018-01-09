const sendStream = require('send')

const methods = require('./methods')
const send    = require('./send')

const serve = opts => methods({
  GET: req => send(sendStream(req, req.params.path, opts))
})

module.exports = serve

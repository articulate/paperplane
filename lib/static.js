const sendStream = require('send')

const methods = require('./methods')
const send    = require('./send')

module.exports = opts => methods({
  GET: req => send(sendStream(req, req.params.path, opts))
})

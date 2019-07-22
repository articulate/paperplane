const sendStream = require('send')

const { methods } = require('./methods')
const { send }    = require('./send')

exports.serve = opts => methods({
  GET: req => send(sendStream(req, req.params.path.join('/'), opts))
})

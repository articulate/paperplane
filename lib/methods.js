const Boom = require('boom')

const methods = handlers => req =>
  handlers[req.method]
    ? handlers[req.method](req)
    : Promise.reject(Boom.notFound())

module.exports = methods

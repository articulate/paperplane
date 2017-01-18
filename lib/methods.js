const Boom = require('boom')

const methods = handlers => req =>
  new Promise((resolve, reject) => {
    handlers[req.method]
      ? resolve(handlers[req.method](req))
      : reject(Boom.notFound())
  })

module.exports = methods

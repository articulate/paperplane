const { NotFound } = require('http-errors')

const methods = handlers => req =>
  new Promise((resolve, reject) => {
    handlers[req.method]
      ? resolve(handlers[req.method](req))
      : reject(new NotFound())
  })

module.exports = methods

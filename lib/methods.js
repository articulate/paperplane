const { notFound } = require('./util')

const methods = handlers => req =>
  handlers[req.method]
    ? handlers[req.method](req)
    : Promise.reject(notFound())

module.exports = methods

const Boom = require('boom')
const { compose, prop, when } = require('ramda')

const { copy } = require('./util')

const addHead = when(prop('GET'), copy('GET', 'HEAD'))

const methods = handlers => req =>
  new Promise((resolve, reject) => {
    handlers[req.method]
      ? resolve(handlers[req.method](req))
      : reject(Boom.notFound())
  })

module.exports = compose(methods, addHead)

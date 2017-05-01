const { compose, prop, when } = require('ramda')
const { NotFound } = require('http-errors')

const { copy } = require('./util')

const addHead = when(prop('GET'), copy('GET', 'HEAD'))

const methods = handlers => req =>
  new Promise((resolve, reject) => {
    handlers[req.method]
      ? resolve(handlers[req.method](req))
      : reject(new NotFound())
  })

module.exports = compose(methods, addHead)

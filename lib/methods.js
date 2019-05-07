const Boom = require('@hapi/boom')
const { compose, curry, prop, when } = require('ramda')
const { copyProp } = require('@articulate/funky')

const addHead = when(prop('GET'), copyProp('GET', 'HEAD'))

const methods = (handlers, req) =>
  handlers[req.method]
    ? Promise.resolve(req).then(handlers[req.method])
    : Promise.reject(Boom.notFound())

module.exports = compose(curry(methods), addHead)

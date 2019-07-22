const Boom = require('@hapi/boom')
const { compose, curry, prop, when } = require('ramda')
const { copyProp } = require('@articulate/funky')

const addHead = when(prop('GET'), copyProp('GET', 'HEAD'))

const handleMethods = (handlers, req) =>
  handlers[req.method]
    ? Promise.resolve(req).then(handlers[req.method])
    : Promise.reject(Boom.notFound())

const methods =
  compose(curry(handleMethods), addHead)

module.exports = { methods }

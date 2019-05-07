const Boom = require('@hapi/boom')
const { curry, merge } = require('ramda')
const pathMatch = require('path-match')()

const routes = (handlers, req) => {
  for (let route in handlers) {
    const params = pathMatch(route)(req.pathname)
    if (params) {
      return Promise.resolve(merge(req, { params })).then(handlers[route])
    }
  }
  return Promise.reject(Boom.notFound())
}

module.exports = curry(routes)

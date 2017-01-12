const { assoc, pluck, zipObj } = require('ramda')
const pathToRegexp = require('path-to-regexp')

const { notFound } = require('./util')

const routes = handlers => req => {
  for (var route in handlers) {
    const keys = [],
          vals = pathToRegexp(route, keys).exec(req.pathname)

    if (vals) {
      req = assoc('params', zipObj(pluck('name', keys), vals.slice(1)), req)
      return handlers[route](req)
    }
  }

  return Promise.reject(notFound())
}

module.exports = routes

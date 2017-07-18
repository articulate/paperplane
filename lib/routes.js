const Boom      = require('boom')
const { merge } = require('ramda')
const pathMatch = require('path-match')()

const routes = handlers => req =>
  new Promise((resolve, reject) => {
    for (var route in handlers) {
      const params = pathMatch(route)(req.pathname)
      if (params) return resolve(handlers[route](merge(req, { params })))
    }
    reject(Boom.notFound())
  })

module.exports = routes

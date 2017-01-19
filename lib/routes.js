const { assoc, pluck, zipObj } = require('ramda')
const { NotFound } = require('http-errors')
const pathToReg = require('path-to-regexp')

const routes = handlers => req =>
  new Promise((resolve, reject) => {
    for (var route in handlers) {
      const keys = [],
            vals = pathToReg(route, keys).exec(req.pathname)

      if (vals) {
        req = assoc('params', zipObj(pluck('name', keys), vals.slice(1)), req)
        return resolve(handlers[route](req))
      }
    }

    reject(new NotFound())
  })

module.exports = routes

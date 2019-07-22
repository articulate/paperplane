const {
  apply, applyTo: thrush, compose, curry, ifElse, is, map, prepend
} = require('ramda')

const { promise } = require('./promise')

const noop = Function.prototype

const wrap = (middleware, app, req) =>
  new Promise((resolve, reject) => {
    const dispatch = res => flow(res)

    const finish = ifElse(is(Error), reject, resolve)

    const store = { dispatch, getState: noop }

    const flow = apply(compose,
      map(thrush(store), prepend(promise, middleware))
    )(finish)

    flow(app(req))
  })

exports.wrap = curry(wrap)

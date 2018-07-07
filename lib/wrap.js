const { apply, applyTo: thrush, compose, curry, map } = require('ramda')

const noop = Function.prototype

const wrap = (middleware, app, req) =>
  new Promise((resolve, reject) => {
    const dispatch = res => flow(res)

    const finish = res =>
      typeof res.then === 'function'
        ? res.then(resolve, reject)
        : resolve(res)

    const store = { dispatch, getState: noop }

    const flow = apply(compose)(map(thrush(store), middleware))(finish)

    flow(app(req))
  })

module.exports = curry(wrap)

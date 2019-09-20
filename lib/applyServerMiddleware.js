const { curryN, partial, pipeP } = require('ramda')

const wrap = (req, res) => fn => () =>
  new Promise(partial(fn, [ req, res ]))

const applyServerMiddleware = async (use = [], res, req) => {
  if (use.length > 0) {
    const applyMiddleware = pipeP(...use.map(wrap(req, res)))
    await applyMiddleware()
  }

  return req
}

module.exports = {
  applyServerMiddleware: curryN(3, applyServerMiddleware)
}

const { curry } = require('ramda')

const promise = ({ dispatch }, next, res) =>
  typeof res.then === 'function'
    ? res.then(dispatch, dispatch)
    : next(res)

exports.promise = curry(promise)

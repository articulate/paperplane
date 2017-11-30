const { assoc, curryN, flip, is, when } = require('ramda')
const CorsError = require('./cors-error')

exports.assign = (key, obj) =>
  flip(assoc(key))(obj)

exports.copy = curryN(3, (frum, to, obj) =>
  assoc(to, obj[frum], obj))

exports.log = (logger, output) => () =>
  typeof logger === 'function' && logger(output)

exports.rethrow = logger =>
  when(is(Error), err => {
    typeof logger === 'function' && logger(CorsError.unwrap(err))
    throw err
  })

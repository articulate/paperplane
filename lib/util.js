const { assoc, curry, flip, is, when } = require('ramda')

exports.assign = (key, obj) =>
  flip(assoc(key))(obj)

exports.copy = curry((frum, to, obj) =>
  assoc(to, obj[frum], obj)
)

exports.log = (logger, output) => () =>
  typeof logger === 'function' && logger(output)

exports.rethrow = logger =>
  when(is(Error), err => {
    typeof logger === 'function' && logger(err)
    throw err
  })

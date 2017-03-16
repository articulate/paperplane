const { assoc, ifElse, is, merge, pick, pipe, prop, when } = require('ramda')

const json = require('./json')

const rethrow = err => { throw err }

const boomError = ({ output: { payload, statusCode } }) =>
  merge(json(payload), { statusCode })

const joiError = pipe(
  pick(['details', 'message', 'name']),
  json,
  assoc('statusCode', 400)
)

const systemError = ({ message, name, statusCode=500 }) =>
  merge(json({ message, name }), { statusCode })

exports.error =
  when(is(Error), systemError)

exports.handleableErrors =
  when(is(Error),
    ifElse(prop('isBoom'), boomError,
    ifElse(prop('isJoi'), joiError,
    rethrow)
  ))

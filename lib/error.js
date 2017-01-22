const { assoc, ifElse, is, merge, pick, pipe, prop, when } = require('ramda')

const json = require('./json')

const boomError = ({ output: { payload, statusCode } }) =>
  merge(json(payload), { statusCode })

const joiError = pipe(
  pick(['details', 'message', 'name']),
  json,
  assoc('statusCode', 400)
)

const systemError = ({ message, name, statusCode=500 }) =>
  merge(json({ message, name }), { statusCode })

module.exports =
  when(is(Error),
    ifElse(prop('isBoom'), boomError,
    ifElse(prop('isJoi'), joiError,
    systemError)
  ))

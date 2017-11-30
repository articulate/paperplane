const {
  assoc,
  compose,
  converge,
  ifElse,
  is,
  lensProp,
  merge,
  objOf,
  over,
  pick,
  pipe,
  prop,
  when,
} = require('ramda')

const json = require('./json')
const CorsError = require('./cors-error')

const boomError = ({ output: { payload, statusCode } }) =>
  merge(json(payload), { statusCode })

const joiError = pipe(
  pick(['details', 'message', 'name']),
  json,
  assoc('statusCode', 400)
)

const systemError = ({ message, name, statusCode=500 }) =>
  merge(json({ message, name }), { statusCode })

module.exports = pipe(
  ifElse(is(CorsError), pick([ 'err', 'headers' ]), objOf('err')),
  over(
    lensProp('err'),
    when(is(Error),
      ifElse(prop('isBoom'), boomError,
      ifElse(prop('isJoi'), joiError,
      systemError)
    ))),
  converge(over(lensProp('headers')), [
    compose(merge, prop('headers')),
    prop('err'),
  ]))

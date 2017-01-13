const { ifElse, is, merge, prop, when } = require('ramda')

const json = require('./json')

const boomError = ({ output: { payload, statusCode } }) =>
  merge(json(payload), { statusCode })

const systemError = ({ message, name, statusCode=500 }) =>
  merge(json({ message, name }), { statusCode })

module.exports = when(is(Error), ifElse(prop('isBoom'), boomError, systemError))

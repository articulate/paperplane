const { ifElse, merge, prop } = require('ramda')

const json = require('./json')

const boomError = ({ output: { payload, statusCode } }) =>
  merge(json(payload), { statusCode })

const systemError = ({ message, name, stack, statusCode=500 }) =>
  merge(json({ message, name, stack }), { statusCode })

module.exports = ifElse(prop('isBoom'), boomError, systemError)

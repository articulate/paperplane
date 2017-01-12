const { assoc } = require('ramda')

const json = require('./json')

const error = ({ message, name, stack, statusCode=500 }) =>
  assoc('statusCode', statusCode, json({ message, name, stack }))

module.exports = error

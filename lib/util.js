const { assoc, flip } = require('ramda')

exports.assign = (key, obj) =>
  flip(assoc(key))(obj)

exports.notFound = () =>
  assoc('statusCode', 404, new Error('Not found'))

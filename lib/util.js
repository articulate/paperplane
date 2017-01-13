const { assoc, flip } = require('ramda')

exports.assign = (key, obj) =>
  flip(assoc(key))(obj)

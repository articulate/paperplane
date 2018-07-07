const { assoc, curry, flip, is, when } = require('ramda')

exports.assign = (key, obj) =>
  flip(assoc(key))(obj)

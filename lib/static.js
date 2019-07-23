const { deprecate } = require('util')

const { serve } = require('./serve')

exports.static = deprecate(serve, '[paperplane] static() is deprecated, use serve() instead')

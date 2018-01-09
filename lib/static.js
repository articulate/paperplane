const { deprecate } = require('util')

const serve = require('./serve')

const static = deprecate(serve, '[paperplane] static() is deprecated, use serve() instead')

module.exports = static

const { deprecate } = require('util')

const serve = require('./serve')

module.exports = deprecate(serve, '[paperplane] static() is deprecated, use serve() instead')

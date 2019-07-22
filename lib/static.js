const { deprecate } = require('util')

const serve = require('./serve')

const statik = deprecate(serve, '[paperplane] static() is deprecated, use serve() instead')

module.exports = { static: statik }

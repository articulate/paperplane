const { pick } = require('ramda')

module.exports = pick([
  'body',
  'cookies',
  'headers',
  'method',
  'params',
  'pathname',
  'protocol',
  'query',
  'url'
])

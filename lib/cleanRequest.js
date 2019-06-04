const { pick } = require('ramda')

module.exports = pick([
  'body',
  'cookies',
  'headers',
  'method',
  'original',
  'params',
  'pathname',
  'protocol',
  'query',
  'url'
])

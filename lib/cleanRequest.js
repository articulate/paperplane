const { pick } = require('ramda')

exports.cleanRequest =
  pick([
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

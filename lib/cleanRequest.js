const { pick } = require('ramda')

const cleanRequest =
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

module.exports = { cleanRequest }

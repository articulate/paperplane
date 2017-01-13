const { evolve, pathEq, when } = require('ramda')

module.exports = when(
  pathEq(['headers', 'content-type'], 'application/json'),
  evolve({ body: JSON.parse })
)

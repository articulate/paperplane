const { compose, evolve, pick } = require('ramda')

module.exports = compose(
  console.info,
  JSON.stringify,
  evolve({
    req: pick(['headers', 'method', 'url']),
    res: pick(['statusCode'])
  })
)

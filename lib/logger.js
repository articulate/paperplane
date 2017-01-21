const { compose, evolve, pick, tap } = require('ramda')

module.exports = compose(
  tap(console.info),
  JSON.stringify,
  evolve({
    req: pick(['headers', 'method', 'url']),
    res: pick(['statusCode'])
  })
)

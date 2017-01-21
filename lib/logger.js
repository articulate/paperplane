const { compose, evolve, is, pick, tap, when } = require('ramda')

module.exports = compose(
  tap(console.info),
  JSON.stringify,
  evolve({
    req: pick(['headers', 'method', 'url']),
    res: pick(['statusCode'])
  }),
  when(is(Error), pick(['message', 'name', 'stack']))
)

const { evolve, is, pick, pipe, tap, when } = require('ramda')

module.exports =
  tap(
    pipe(
      when(is(Error), pick(['message', 'name', 'stack'])),
      evolve({
        req: pick(['headers', 'method', 'url']),
        res: pick(['statusCode'])
      }),
      JSON.stringify,
      console.info
    )
  )

const {
  converge, evolve, identity, is, merge, pick, pipe, tap, when
} = require('ramda')

const clean =
  pick(['message', 'name', 'stack'])

const flattenProps =
  converge(merge, [ identity, clean ])

const logger =
  tap(
    pipe(
      when(is(Error), flattenProps),
      evolve({
        req: pick(['headers', 'method', 'url']),
        res: pick(['statusCode'])
      }),
      JSON.stringify,
      console.info
    )
  )

module.exports = logger

const {
  converge, evolve, identity, is, merge, pick, pipe, tap, when
} = require('ramda')

const nonEnumerable =
  pick(['message', 'name', 'stack'])

// flattens non-enumerable props into a serializable object
const flattenProps =
  converge(merge, [ identity, nonEnumerable ])

exports.logger =
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

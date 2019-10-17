const {
  all, compose, curryN, ifElse, nAry, once, partial, props, uncurryN
} = require('ramda')

const { tapP } = require('@articulate/funky')

console.log('FOO')

// applyMiddleware :: ((IncomingMessage, HttpResponse, Function) -> ()) -> Request -> Request
const applyMiddleware = uncurryN(2, middle => tapP(({ request, response }) =>
  new Promise(partial(middle, [ request, response ]))
))

// warn :: String -> * -> ()
const warn =
  curryN(2, once(nAry(1, console.warn)))

// use :: ((IncomingMessage, HttpResponse, Function) -> ()) -> Request -> Request
const use = middle =>
  ifElse(
    compose(all(Boolean), props([ 'request', 'response' ])),
    applyMiddleware(middle),
    tapP(warn('`use` is not supported in lambdas.')),
  )

module.exports = { use }

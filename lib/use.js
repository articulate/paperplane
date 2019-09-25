const { partial } = require('ramda')
const { tapP }    = require('@articulate/funky')

// use :: (IncomingMessage, HttpResponse, Function) -> Request -> Request
const use = middle => tapP(({ request, response }) =>
  new Promise(partial(middle, [ request, response ]))
)

module.exports = { use }

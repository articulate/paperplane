const {
  always, assoc, both, compose, curryN, ifElse, is, objOf,
  path, pathOr
} = require('ramda')

const { evolveP, resolve } = require('@articulate/funky')
const rawBody = curryN(2, require('raw-body'))
const typer = require('media-typer')

const contentLength =
  compose(Number, path(['headers', 'content-length']))

const readbleBody =
  compose(is(Function), path(['body', '_read']))

const bufferable =
  both(contentLength, readbleBody)

const readBody = req =>
  Promise.resolve(req)
    .then(typer.parse)
    .then(pathOr('utf8', ['parameters', 'charset']))
    .catch(always('utf8'))
    .then(objOf('encoding'))
    .then(assoc('length', contentLength(req)))
    .then(rawBody(req))

// bufferBody :: Request -> Promise Request
exports.bufferBody =
  ifElse(bufferable, evolveP({ body: readBody }), resolve)

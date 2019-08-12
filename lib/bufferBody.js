const {
  always, assoc, both, compose, curryN, ifElse,
  is, objOf, path, pathOr
} = require('ramda')

const { assocWithP, resolve } = require('@articulate/funky')
const rawBody = curryN(2, require('raw-body'))
const typer = require('media-typer')

const contentLength =
  compose(Number, path(['headers', 'content-length']))

const readableBody =
  compose(is(Function), path(['body', '_read']))

const bufferable =
  both(contentLength, readableBody)

const readBody = req =>
  Promise.resolve(req)
    .then(typer.parse)
    .then(pathOr('utf8', ['parameters', 'charset']))
    .catch(always('utf8'))
    .then(objOf('encoding'))
    .then(assoc('length', contentLength(req)))
    .then(rawBody(req.body))

// bufferBody :: Request -> Promise Request
exports.bufferBody =
  ifElse(bufferable, assocWithP('body', readBody), resolve)

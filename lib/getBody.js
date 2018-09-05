const {
  always, assoc, compose, curryN, objOf, path, pathOr, when
} = require('ramda')

const { assocWithP } = require('@articulate/funky')
const rawBody = curryN(2, require('raw-body'))
const typer = require('media-typer')

const contentLength = compose(Number, path(['headers', 'content-length']))

const getBody = req =>
  Promise.resolve(req)
    .then(typer.parse)
    .then(pathOr('utf8', ['parameters', 'charset']))
    .catch(always('utf8'))
    .then(objOf('encoding'))
    .then(assoc('length', contentLength(req)))
    .then(rawBody(req))

module.exports = when(contentLength, assocWithP('body', getBody))

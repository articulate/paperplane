const { always, assoc, compose, curryN, objOf, path, when } = require('ramda')
const rawBody = curryN(2, require('raw-body'))
const typer   = require('media-typer')

const { assign } = require('./util')

const contentLength = compose(Number, path(['headers', 'content-length']))

const getBody = req =>
  Promise.resolve(req)
    .then(typer.parse)
    .then(path(['parameters', 'charset']))
    .catch(always('utf8'))
    .then(objOf('encoding'))
    .then(assoc('length', contentLength(req)))
    .then(rawBody(req))
    .then(assign('body', req))

module.exports = when(contentLength, getBody)

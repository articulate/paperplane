const { compose, path, when } = require('ramda')
const rawBody = require('raw-body')
const typer   = require('media-typer')

const { assign } = require('./util')

const contentLength = compose(parseInt, path(['headers', 'content-length']))

const getBody = req => {
  const encoding = typer.parse(req).parameters.charset || 'utf8'
  return rawBody(req, { encoding, length: contentLength(req) })
    .then(assign('body', req))
}

module.exports = when(contentLength, getBody)

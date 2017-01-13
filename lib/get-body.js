const rawBody = require('raw-body')
const typer   = require('media-typer')
const { path, when } = require('ramda')

const { assign } = require('./util')

const contentLength = path(['headers', 'content-length'])

const getBody = req => {
  const encoding = typer.parse(req).parameters.charset || 'utf-8'
  return rawBody(req, { encoding, length: contentLength(req) })
    .then(assign('body', req))
}

module.exports = when(contentLength, getBody)

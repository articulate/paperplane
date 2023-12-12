const qs  = require('qs')
const url = require('url')

const protocol = ({ headers, socket }) =>
  headers['x-forwarded-proto'] ||
  socket.encrypted ? 'https' : 'http'

const pathParts = req => {
  const { pathname, query } = url.parse(req.url)
  return {
    pathname,
    query: qs.parse(query),
    protocol: protocol(req),
  }
}

exports.parseUrl = req => {
  const { pathname, query, protocol } = pathParts(req)
  req.pathname = pathname
  req.query = query
  req.protocol = protocol
  return req
}

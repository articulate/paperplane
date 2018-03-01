const { is, lensProp, merge, over } = require('ramda')

const defs = {
  credentials: 'true',
  headers: 'content-type',
  methods: 'GET,POST,OPTIONS,PUT,PATCH,DELETE',
  origin: '*'
}

const basics = (opts, req) => ({
  'access-control-allow-credentials': opts.credentials || defs.credentials,
  'access-control-allow-origin': chooseOrigin(opts.origin || defs.origin, req.headers.origin)
})

const cors = (app, opts={}) => req =>
  Promise.resolve(req)
    .then(req.method === 'OPTIONS' && options(opts) || app)
    .then(over(lensProp('headers'), merge(basics(opts, req))))
    .catch(corsifyError(opts, req))

const corsifyError = (opts, req) => err => {
  throw Object.assign(err, { headers: basics(opts, req) })
}

const chooseOrigin = (allowed, origin) =>
  allowed === '*' ? '*' :
  allowed === true ? origin :
  is(RegExp, allowed) && allowed.test(origin) ? origin :
  'false'

const options = opts => ({ headers }) => ({
  headers: {
    'access-control-allow-headers': opts.headers || headers['access-control-request-headers'] || defs.headers,
    'access-control-allow-methods': opts.methods || headers['access-control-request-method'] || defs.methods
  },
  statusCode: 204
})

module.exports = cors

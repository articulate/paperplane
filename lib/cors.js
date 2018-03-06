const { always, both, cond, curry, equals, flip,
        is, lensProp, merge, over, pathOr, T, test } = require('ramda')

const defs = {
  credentials: 'true',
  headers: 'content-type',
  methods: 'GET,POST,OPTIONS,PUT,PATCH,DELETE',
  origin: '*'
}

const basics = (opts, req) => ({
  'access-control-allow-credentials': opts.credentials || defs.credentials,
  'access-control-allow-origin': chooseOrigin(opts.origin || defs.origin, pathOr('', ['headers', 'origin'], req))
})

const cors = curry((app, opts={}) => req =>
  Promise.resolve(req)
    .then(req.method === 'OPTIONS' && options(opts) || app)
    .then(over(lensProp('headers'), merge(basics(opts, req))))
    .catch(corsifyError(opts, req))
)

const corsifyError = (opts, req) => err => {
  throw Object.assign(err, { headers: basics(opts, req) })
}

const chooseOrigin = (allowed, origin) =>
  cond([
    [equals('*'), always('*')],
    [equals(true), always(origin)],
    [both(is(RegExp), flip(test)(origin)), always(origin)],
    [T, always('false')],
  ])(allowed)

const options = opts => ({ headers }) => ({
  headers: {
    'access-control-allow-headers': opts.headers || headers['access-control-request-headers'] || defs.headers,
    'access-control-allow-methods': opts.methods || headers['access-control-request-method'] || defs.methods
  },
  statusCode: 204
})

module.exports = cors

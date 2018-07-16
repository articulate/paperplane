# API

| Function | Description |
| -------- | ----------- |
| [`cors`](#cors) | CORS support wrapper |
| [`html`](#html) | response helper, type `text/html` |
| [`json`](#json) | response helper, type `application/json` |
| [`logger`](#logger) | json request logger |
| [`methods`](#methods) | maps request methods to handler functions |
| [`mount`](#mount) | top-level server function wrapper |
| [`parseJson`](#parsejson) | json body parser |
| [`redirect`](#redirect) | redirect response helper |
| [`routes`](#routes) | maps express-style route patterns to handler functions |
| [`send`](#send) | basic response helper |
| [`serve`](#serve) | static file serving handler |

### cors

```haskell
cors :: ((Request -> Promise Response), { k: v }) -> Request -> Promise Response
```

Wraps a top-level handler function to add support for [CORS](http://devdocs.io/http/access_control_cors).  Lifts the handler into a `Promise` chain, so the handler can respond with either a [`Response`](https://github.com/articulate/paperplane/blob/master/docs/getting-started.md#response-object), or a `Promise` that resolves with one.  Also accepts an object with the following optional properties to override the default CORS behavior.

| Property | Type | Overridden header | Default |
| -------- | ---- | ----------------- | ------- |
| `credentials` | `String` | `access-control-allow-credentials` | `'true'` |
| `headers` | `String` | `access-control-allow-headers` | `'content-type'` |
| `methods` | `String` | `access-control-allow-methods` | `'GET,POST,OPTIONS,PUT,PATCH,DELETE'` |
| `origin`  | `Any` | `access-control-allow-origin` | `'*'` |

Acceptable values for `origin` are:

| Value | Type | Description |
| ----- | ---- | ----------- |
| `'*'` | `String` | wildcard, allows any origin access, but only without credentials |
| `true` | `Boolean` | reflect the origin of the request |
| `/domain.com/` | `Regex` | validate the origin against regex |

See also [`parseJson`](#parseJson), [`serve`](#serve).

```js
const { always } = require('ramda')
const http = require('http')
const { cors, mount, send } = require('paperplane')

const endpoint = req =>
  Promise.resolve(req.body).then(send)

const opts = {
  headers: 'x-custom-header',
  methods: 'GET,PUT'
}

const app = cors(endpoint, opts)

http.createServer(mount({ app })).listen(3000)
```

### html

```haskell
html :: (String | Buffer | Stream) -> Response
```

Returns a [`Response`](https://github.com/articulate/paperplane/blob/master/docs/getting-started.md#response-object), with the `content-type` header set to `text/html`.

See also [`json`](#json), [`redirect`](#redirect), [`send`](#send).

```js
const { html } = require('paperplane')
const template = require('../views/template.pug')

const usersPage = () =>
  fetchUsers()
    .then(template)
    .then(html)
```

In the example above, it resolves with a [`Response`](https://github.com/articulate/paperplane/blob/master/docs/getting-started.md#response-object) similar to:

```js
{
  body: '<html>...</html>',
  headers: {
    'content-type': 'text/html'
  },
  statusCode: 200
}
```

### json

```haskell
json :: a -> Response
```

Returns a [`Response`](https://github.com/articulate/paperplane/blob/master/docs/getting-started.md#response-object), with a `body` encoded with `JSON.stringify`, and the `content-type` header set to `application/json`.

See also [`html`](#html), [`redirect`](#redirect), [`send`](#send).

```js
const { json } = require('paperplane')

const users = () =>
  fetchUsers()
    .then(json)
```

In the example above, it resolves with a [`Response`](https://github.com/articulate/paperplane/blob/master/docs/getting-started.md#response-object) similar to:

```js
{
  body: '[{"id":1,"name":"Scott"}]',
  headers: {
    'content-type': 'application/json'
  },
  statusCode: 200
}
```

### logger

```haskell
logger :: a -> a
```

Logs request/response as `json` to `console.info`.  Uses the following whitelist:

```js
{
  req: ['headers', 'method', 'url'],
  res: ['statusCode']
}
```

If the logged value is an error, it only logs `['message', 'name', 'stack']`.

**Note:** This is the default logger used by [`mount`](#mount), but you can also `require` it to modify as needed.  For example, in dev mode you may prefer not to log headers, like this:

```js
const { compose, dissocPath } = require('ramda')
const http = require('http')
const { logger: log, mount, send } = require('paperplane')

const app = () =>
  send() // 200 OK

const isProd = process.env.NODE_ENV === 'production'

const logger = isProd ? log : compose(log, dissocPath(['req', 'headers']))

http.createServer(mount({ app, logger })).listen(3000)
```

Logs will be formatted as `json`, similar to below:

```json
{"req":{"headers":{"host":"localhost:3000","connection":"keep-alive","cache-control":"no-cache","user-agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.98 Safari/537.36","content-type":"application/json","accept":"*/*","accept-encoding":"gzip, deflate, sdch, br","accept-language":"en-US,en;q=0.8"},"method":"GET","url":"/courses/"},"res":{"statusCode":200}}
```

### methods

```haskell
methods :: { k: (Request -> Promise Response) } -> (Request -> Promise Response)
```

Maps handler functions to request methods.  Returns a handler function.  If the method of an incoming request doesn't match, it rejects with a `404 Not Found`.  Use in combination with [`routes`](#routes) to build a routing table of any complexity.

**Note:** If you supply a `GET` handler, `paperplane` will also use it to handle `HEAD` requests.

See also [`mount`](#mount), [`routes`](#routes).

```js
const http = require('http')
const { methods, mount } = require('paperplane')

const { createUser, fetchUsers } = require('./api/users')

const app = methods({
  GET:  fetchUsers,
  POST: createUser
})

http.createServer(mount({ app })).listen(3000)
```

### mount

```haskell
mount :: { k: v } -> (IncomingMessage, ServerResponse) -> ()
```

Wraps a top-level handler function to prepare for mounting as a new `http` server.  Lifts the handler into a `Promise` chain, so the handler can respond with either a synchronous [`Response`](https://github.com/articulate/paperplane/blob/master/docs/getting-started.md#response-object), or a `Promise` or other ADT that resolves with one.  Accepts the following options:


| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |
| `app` | `Request -> m Response` | [`R.identity`](http://devdocs.io/ramda/index#identity) | top-level request handler function |
| `cry` | `Error -> a` | [`paperplane.logger`](#logger) | error logger |
| `logger` | `a -> a` | [`paperplane.logger`](#logger) | request/response logger |
| `middleware` | `[ ReduxMiddleware ]` | `[]` | list of Redux middleware for unwrapping ADT's |

The `cry` option is primarily intended for logging, but is also the correct way to notify your error aggregation service.  All errors passed to the `cry` function will have a `req` property that can be used to include request information in your notification.  For notifying [Airbrake](https://airbrake.io/), use the latest version of [`paperplane-airbrake`](https://github.com/articulate/paperplane-airbrake) for this option.

To support request handlers that return ADT's (such as those provided by the lovely [`crocks`](https://github.com/evilsoft/crocks) library), register a list of appropriate Redux middleware using the `middleware` option.  No, `paperplane` does not use Redux, but Redux middleware make for great little plugins to recursively unwrap ADT's.  You won't need [`redux-promise`](https://github.com/redux-utilities/redux-promise), because `Promise` support is already included, but some common middlewares that may interest you are:

- [`redux-future2`](https://github.com/articulate/redux-future2)
- [`redux-io`](https://github.com/stoeffel/redux-io)
- [`redux-functor`](https://github.com/articulate/redux-functor)

See also [`methods`](#methods), [`routes`](#routes).

```js
const { Async, IO } = require('crocks')
const { compose, pipe, pipeP } = require('ramda')
const future = require('redux-future2')
const http = require('http')
const io = require('redux-io').default
const { mount, parseJson, routes } = require('paperplane')

const airbrake = require('./lib/airbrake')
const logger   = require('./lib/logger')

const endpoints = routes({
  '/async':     Async.of,
  '/io':        IO.of,
  '/promise':   Promise.resolve,
  '/inception': compose(Async.of, IO.of)
})

const app = pipe(
  parseJson,
  pipeP(
    endpoints,
    json
  )
)

const cry = require('paperplane-airbrake')(airbrake)

const middleware = [ future, io('run') ]

http.createServer(mount({ app, cry, logger, middleware })).listen(3000, cry)
```

### parseJson

```haskell
parseJson :: Request -> Request
```

Parses the request body as `json` if available, and if the `content-type` is `application/json`.  Otherwise, passes the [`Request`](https://github.com/articulate/paperplane/blob/master/docs/getting-started.md#request-object) through untouched.

See also [`cors`](#cors), [`serve`](#serve).

```js
const { compose } = require('ramda')
const http = require('http')
const { mount, parseJson, json } = require('paperplane')

const echo = req =>
  Promise.resolve(req.body).then(json)

const app = compose(echo, parseJson)

http.createServer(mount({ app })).listen(3000)
```

### redirect

```haskell
redirect :: (String, Number) -> Response
```

Accept a `Location` and optional `statusCode` (defaults to `302`), and returns a [`Response`](https://github.com/articulate/paperplane/blob/master/docs/getting-started.md#response-object) denoting a redirect.

**Pro-tip:** if you want an earlier function in your composed application to respond with a redirect and skip everything else, just wrap it in a `Promise.reject` (see example below).  The error-handling code in `paperplane` will ignore it since it's not a real error.

See also [`html`](#html), [`json`](#json), [`send`](#send).

```js
const { compose, composeP } = require('ramda')
const http = require('http')
const { html, methods, mount, parseJson, routes, send } = require('paperplane')

const login = require('./views/login')

// Please make your authorization better than this
const authorize = req =>
  req.headers.authorization
    ? Promise.resolve(req)
    : Promise.reject(redirect('/login'))

const echo = req =>
  Promise.resolve(req.body).then(send)

const app = routes({
  '/echo': methods({
    POST: composeP(echo, authorize)
  }),

  '/login': methods({
    GET: compose(html, loginPage)
  })
})

http.createServer(mount({ app })).listen(3000)
```

In the example above, `redirect()` returns a [`Response`](https://github.com/articulate/paperplane/blob/master/docs/getting-started.md#response-object) similar to:

```js
{
  body: '',
  headers: {
    Location: '/login'
  },
  statusCode: 302
}
```

### routes

```haskell
routes :: { k: (Request -> Promise Response) } -> (Request -> Response)
```

Maps handler functions to express-style route patterns.  Returns a handler function.  If the path of an incoming request doesn't match, it rejects with a `404 Not Found`.  Use in combination with [`methods`](#methods) to build a routing table of any complexity.

See also [`methods`](#methods), [`mount`](#mount).

```js
const http = require('http')
const { mount, routes } = require('paperplane')

const { fetchUser, fetchUsers, updateUser } = require('./lib/users')

const app = routes({
  '/users': methods({
    GET: fetchUsers
  }),

  '/users/:id': methods({
    GET: fetchUser,
    PUT: updateUser
  })
})

http.createServer(mount({ app })).listen(3000)
```

### send

```haskell
send :: (String | Buffer | Stream) -> Response
```

The most basic response helper.  Simply accepts a `body`, and returns a properly formatted [`Response`](https://github.com/articulate/paperplane/blob/master/docs/getting-started.md#response-object), without making any further assumptions.

See also [`html`](#html), [`json`](#json), [`redirect`](#redirect).

```js
const { send } = require('paperplane')

send('This is the response body')
```

In the example above, it returns a [`Response`](https://github.com/articulate/paperplane/blob/master/docs/getting-started.md#response-object) similar to:

```js
{
  body: 'This is the response body',
  headers: {},
  statusCode: 200
}
```

### serve

```haskell
serve :: { k: v } -> (Request -> Response)
```

Accepts an options object (see [details here](https://www.npmjs.com/package/send#options)), and returns a handler function for serving static files.  Expects a `req.params.path` to be present on the [`Request`](https://github.com/articulate/paperplane/blob/master/docs/getting-started.md#request-object), so you'll need to format your route pattern similar to the example below, making sure to include a `/:path+` route segment.

Note: this was previously `static`, but that's a keyword, so I renamed it.

See also [`cors`](#cors), [`parseJson`](#parseJson).

```js
const http = require('http')
const { mount, routes, serve } = require('paperplane')

const app = routes({
  '/public/:path+': serve({ root: 'public' })
})

http.createServer(mount({ app })).listen(3000)
```

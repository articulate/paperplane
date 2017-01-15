# API

- [html](#html)           - response helper, type `text/html`
- [json](#json)           - response helper, type `application/json`
- [logger](#logger)       - json request logger
- [methods](#methods)     - maps request methods to handler functions
- [mount](#mount)         - top-level server function wrapper
- [parseJson](#parseJson) - json body parser
- [redirect](#redirect)   - redirect response helper
- [routes](#routes)       - maps express-style route patterns to handler functions
- [send](#send)           - basic response helper
- [static](#static)       - static file serving handler

### html

```haskell
(String | Buffer | Stream) -> Response
```

Returns a [response object](), with the `content-type` header set to `text/html`.

```js
const { html } = require('jackalope')
const template = require('../views/template.pug')

const usersPage = () =>
  fetchUsers()
    .then(template)
    .then(html)
```

In the example above, it resolves with a response similar to:

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
Object -> Response
```

Returns a [response object](), with a `body` encoded with `JSON.stringify`, and the `content-type` header set to `application/json`.

```js
const { json } = require('jackalope')

const users = () =>
  fetchUsers()
    .then(json)
```

In the example above, it resolves with a response similar to:

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
Object -> ()
```

Logs request/response as `json`.  Uses the following whitelists:

- req: `['headers', 'method', 'url']`
- res: `['statusCode']`

Provided as an example logger to use with [mount](#mount), as below.

```js
const http = require('http')
const { logger, mount, send } = require('jackalope')

const app = () =>
  send() // 200 OK

http.createServer(mount(app, { logger })).listen(3000)
```

Logs will be formatted as `json`, similar to below:

```json
{"req":{"headers":{"host":"localhost:3000","connection":"keep-alive","cache-control":"no-cache","user-agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.98 Safari/537.36","content-type":"application/json","accept":"*/*","accept-encoding":"gzip, deflate, sdch, br","accept-language":"en-US,en;q=0.8"},"method":"GET","url":"/courses/"},"res":{"statusCode":200}}
```

### methods

```haskell
{ k: (Request -> Response) } -> (Request -> Response)
```

Maps handler functions to request methods.  Returns a handler function.  If the method of an incoming request doesn't match, it rejects with a `404 Not Found`.  Use in combination with [routes](#routes) to build a routing table of any complexity.

```js
const http = require('http')
const { methods, mount } = require('jackalope')

const { createUser, fetchUsers } = require('./api/users')

const app = methods({
  GET:  fetchUsers,
  POST: createUser
})

http.createServer(mount(app)).listen(3000)
```

### mount

```haskell
((Request -> Response), Object) -> Function
```

Wraps a top-level handler function to prepare for mounting as a new `http` server.  Lifts the handler into a `Promise` chain, so the handler can respond with either a [response object](), or a `Promise` that resolves with one.  Also accepts an options object with `errLogger` and `logger` properties, both of which can be set to [logger](#logger).

```js
const http = require('http')
const { logger, mount, send } = require('jackalope')

const app = req =>
  Promise.resolve(req.body).then(send)

const opts = { errLogger: logger, logger }

http.createServer(mount(app, opts)).listen(3000)
```

### parseJson

```haskell
Request -> Request
```

Parses the request body as `json` if available, and if the `content-type` is `application/json`.  Otherwise, passes the [request object]() through untouched.

```js
const { compose } = require('ramda')
const http = require('http')
const { mount, parseJson, json } = require('jackalope')

const echo = req =>
  Promise.resolve(req.body).then(json)

const app = compose(echo, parseJson)

http.createServer(mount(app)).listen(3000)
```

### redirect

```haskell
(String, Number) -> Response
```

Accept a `Location` and optional `statusCode` (defaults to `302`), and returns a [response object]() denoting a redirect.

**Pro-tip:** if you want an earlier function in your composed application to respond with a redirect and skip everything else, just wrap it in a `Promise.reject` (see example below).  The error-handling code in `jackalope` will ignore it since it's not a real error.

```js
const { compose, composeP } = require('ramda')
const http = require('http')
const { html, methods, mount, parseJson, routes, send } = require('jackalope')

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

http.createServer(mount(app)).listen(3000)
```

In the example above, `redirect()` returns a [response object]() similar to:

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
{ k: (Request -> Response) } -> (Request -> Response)
```

Maps handler functions to express-style route patterns.  Returns a handler function.  If the path of an incoming request doesn't match, it rejects with a `404 Not Found`.  Use in combination with [methods](#methods) to build a routing table of any complexity.

```js
const http = require('http')
const { mount, routes } = require('jackalope')

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

http.createServer(mount(app)).listen(3000)
```

### send

```haskell
(String | Buffer | Stream) -> Response
```

The most basic response helper.  Simply accepts a `body`, and returns a properly formatted [response object](), without making any further assumptions.

```js
const { send } = require('jackalope')

send('This is the response body')
```

In the example above, it returns a response similar to:

```js
{
  body: 'This is the response body',
  headers: {},
  statusCode: 200
}
```

### static

```haskell
Object -> (Request -> Response)
```

Accepts an options object (see [details here](https://www.npmjs.com/package/send#options)), and returns a handler function for serving static files.  Expects a `req.params.path` to be present on the [request object](), so you'll need to format your route pattern similar to the example below, making sure to include a `/:path+` route segment.

```js
const http = require('http')
const { mount, routes, static } = require('jackalope')

const app = routes({
  '/public/:path+': static({ root: 'public' })
})

http.createServer(mount(app)).listen(3000)
```

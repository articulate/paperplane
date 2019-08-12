# Migration Guide

This guide is intended to help with upgrading major versions of `paperplane`.

## Upgrading to v3

### Breaking Changes

The request `body` is now a [`Readable`](https://devdocs.io/node/stream#stream_class_stream_readable) stream, and is no longer buffered into a `String` for you.  As a result, the function signature of `parseJson` has changed, now returning a `Promise` that resolves with the parsed request.  It will buffer the stream for you, so most existing applications will only need to accommodate the new signature.  Steps to migrate your existing app are as follows:

#### 1. Treat `parseJson` as an async function

```js
// Before
const app =
  compose(endpoints, parseJson)

// After
const app =
  composeP(endpoints, parseJson)
```

#### 2. Use `bufferBody` if you rely on a buffered `String`

```js
// Before
const app = req => {
  // req.body is a String here
}

// After
const endpoint = req => {
  // req.body is still a String now
}

const app =
  composeP(endpoint, bufferBody)
```

**Note:**  The one exception is [serverless mode](https://github.com/articulate/paperplane/blob/master/docs/API.md#serverless-deployment), in which the `req.body` is already buffer into a `String` by AWS.  Both `parseJson` and the new `bufferBody` account for this difference, and will behave as expected.

### New feature

A new `bufferBody` helper is available to ease migration in cases where existing applications rely on the previous `v2` buffering behaviour, or in cases where a `text/plain` body just needs buffering.  If you use `parseJson`, then `bufferBody` is not needed.

For more details, see the [`bufferBody` docs](./API.md#bufferbody).

## Upgrading to v2

### Breaking Changes

The function signature of `mount` has changed to a unary function accepting a single options object, and the reporting of errors has been simplified.  Steps to migrate your existing app are as follows:

#### 1. Move your `app` function into the options object.

```js
// Before
http.createServer(mount(app, { logger })).listen(3000)

// After
http.createServer(mount({ app, logger })).listen(3000)
```

Read more about the changes to `mount` [here](./API.md#mount).

#### 2. Use the new `cry` option.

If you are using [Airbrake](https://airbrake.io/), upgrade to the latest [`paperplane-airbrake`](https://github.com/articulate/paperplane-airbrake), and use it as the `cry` option:

```js
// Before
const handler           = require('paperplane-airbrake')
const { mount, logger } = require('paperplane')

const airbrake = require('./lib/airbrake')
const rest     = require('./rest')

const app  = handler(airbrake, rest)
const opts = { errLogger: logger, logger }

http.createServer(mount(app, opts)).listen(3000, logger)

// After
const { mount, logger } = require('paperplane')

const airbrake = require('./lib/airbrake')
const app      = require('./rest')
const cry      = require('paperplane-airbrake')(airbrake)

http.createServer(mount({ app, cry, logger })).listen(3000, cry)
```

If not using Airbrake, you can write your own custom error reporter.  Errors passed to `cry` will include a `req` property that can be used to include request information in your notification.  Here's a cheap example:

```js
const cry = compose(console.error, pick(['message', 'name', 'req', 'stack']))
```

Read more about the new `cry` option [here](./API.md#mount).

### New feature

The `mount` function has gained a new `middleware` option to support request handlers that return [Algebraic Data Types](https://github.com/articulate/paperplane/blob/master/docs/getting-started.md#what-are-algebraic-data-types).  To take advantage of this, register a list of appropriate Redux middleware.

For more details, see the [`mount` docs](./API.md#mount).

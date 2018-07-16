# Migration Guide

This guide is intended to help with upgrading major versions of `paperplane`.

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

The `mount` function has gained a new `middleware` option to support request handlers that return ADT's.  To take advantage of this, register a list of appropriate Redux middleware.

For more details, see the [`mount` docs](./API.md#mount).

# Getting started

- [Motivation](#motivation)
- [Basic concepts](#basic-concepts)
  - [`Request` object](#request-object)
  - [`Response` object](#response-object)
  - [Errors](#errors)
- [Example application](#example-application)
- [What are Algebraic Data Types?](#what-are-algebraic-data-types)

## Motivation

I've written several "rest-ful" `node.js` server apps, all of which were based on one of the two main contenders: `express` or `hapi`, and each time I started stacking up a brand new app, I became frustrated all over again.  It's easy to demonstrate why.

Both frameworks claim to be "minimalist", but both require a significant amount of boilerplate, and neither lends itself to a functional programming (FP) style.  For example, `express` apps are built by stacking middleware functions, each of which takes a variable number of arguments.  Most commonly, the middleware functions accept `req` and `res` objects, along with an optional `next` callback to pass execution to the next middleware.

```js
const express = require('express')

const handler = (req, res, next) =>
  doSomethingAsync(req.body).then(res.json).catch(next)

express()
  .get('/', handler)
  .listen(3000, console.error)
```

You start by creating an `express` instance, and then you wire up the middleware, which in this case is a single route.  The `req` and `res` objects are proxies for the native [`IncomingMessage`](http://devdocs.io/node/http#http_class_http_incomingmessage) and [`ServerResponse`](http://devdocs.io/node/http#http_class_http_serverresponse) objects, heavy-laden with additional helper methods.  Notice also how I had to wedge-in a `Promise` chain: it's not handled out-of-the-box.

To build the exact same app in `hapi` requires even more boilerplate, and even more imperative code.

```js
const Hapi = require('hapi')

const server = new Hapi.Server()

server.connection({
  host: 'localhost',
  port: 3000
})

server.route({
  method: 'GET',
  path:'/hello',
  handler: (request, reply) =>
    reply(doSomethingAsync(request.payload))
})

server.start(console.error)
```

The main pro with `hapi` is that you can "reply" with your `Promise`, but at the end of the day you are still calling a callback: not a very functional approach.  And I think the configuration-over-composition interface speaks for itself.

So lets boil it down.  If I had an "ideal" functional server framework, what would it look like?  I can think of three basic ideas:

1.  A web server is just one big handler function: requests go in, and responses go out.  Sounds functional to me.
2.  We should be able to tack on the complex bits (like routing, compression, body parsing, schema validation, authorization, etc.) with basic function composition.
3.  Request handlers should be allowed to return a `Promise` that eventually resolves with the response.

Over the course of a hackathon, I started with those three goals, and `paperplane` naturally unfolded.

## Basic concepts

To start with, we'd like to build a web app made of a single handler function.  Guess what: `node.js` already has something like that as a part of the [`http`](http://devdocs.io/node/http) module.  It's the [`createServer`](http://devdocs.io/node/http#http_http_createserver_requestlistener) factory, and you use it like this:

```js
const http = require('http')

const app = (req, res) => {
  res.statusCode = 200
  res.end()
}

http.createServer(app).listen(3000)
```

Well that's pretty close to what we're looking for, but the function signature for our `app` is all wrong: it takes both an `IncomingMessage` and a `ServerResponse`, and it drops the return value on the floor:

```haskell
(IncomingMessage, ServerResponse) -> ()
```

Instead we'd prefer a pure function that accepts a request-like input and returns a response-like output:

```haskell
Request -> Promise Response
```

To help with that transformation, `paperplane` provides the [`mount`](https://github.com/articulate/paperplane/blob/master/docs/API.md#mount) function:

```js
const http = require('http')
const { mount } = require('paperplane')

const app = req => ({
  body: null,
  headers: {},
  statusCode: 200
})

http.createServer(mount({ app })).listen(3000)
```

Before we get much further we should go over the `Request` and `Response` objects.

### `Request` object

The `Request` object is the sole input to your handler function, and has the following properties:

| Property | Type | Details |
| -------- | ---- | ------- |
| `body` | [`Readable`](https://devdocs.io/node/stream#stream_class_stream_readable)&vert;`String` | request body, a [`Readable`](https://devdocs.io/node/stream#stream_class_stream_readable) stream by default, or a `String` in [serverless mode](https://github.com/articulate/paperplane/blob/master/docs/API.md#serverless-deployment) |
| `context` | `Object` | [`requestContext`](https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format) from a Lambda proxy event, only present in [serverless mode](https://github.com/articulate/paperplane/blob/master/docs/API.md#serverless-deployment) |
| `cookies` | `Object` | map of cookies, parsed from the `cookie` header |
| `headers` | `Object` | map of headers, with downcased header names as keys |
| `method` | `String` | request method, should be uppercase |
| `original` | [`IncomingMessage`](https://devdocs.io/node/http#http_class_http_incomingmessage) | reference to the original request object, not present in [serverless mode](https://github.com/articulate/paperplane/blob/master/docs/API.md#serverless-deployment), deprecated in favor of `request` |
| `params` | `Object` | map of named route parameters, only present if [`routes`](https://github.com/articulate/paperplane/blob/master/docs/API.md#routes) function used |
| `pathname` | `String` | just the path portion of the request url |
| `protocol` | `String` | `https` if connection is encrypted, otherwise `http` |
| `query` | `Object` | map of query string parameters |
| `request` | [`IncomingMessage`](https://devdocs.io/node/http#http_class_http_incomingmessage) | reference to the original request object, not present in [serverless mode](https://github.com/articulate/paperplane/blob/master/docs/API.md#serverless-deployment) |
| `response` | [`ServerResponse`](https://devdocs.io/node/http#http_class_http_serverresponse) | reference to the original response object, not present in [serverless mode](https://github.com/articulate/paperplane/blob/master/docs/API.md#serverless-deployment) |
| `route` | `String` | matched route pattern, only present if [`routes`](https://github.com/articulate/paperplane/blob/master/docs/API.md#routes) function used |
| `url` | `String` | the full [request url](http://devdocs.io/node/http#http_message_url) |

### `Response` object

Your handler function needs to return a `Response` object, or a `Promise` that resolves to one.  Remember, this is functional programming, so `Response` is not a class.  It's just a POJO with the following properties:

| Property | Type | Details |
| -------- | ---- | ------- |
| `body` | `Buffer`,`Stream`,`String` | can also be falsy for an empty body |
| `headers` | `Object` | defaults to `{}` |
| `statusCode` | `Number` | defaults to `200` |

You can build the `Response` any way you like, either manually like in the example above, or you can use one of the helpers supplied by `paperplane`:

- [`html`](https://github.com/articulate/paperplane/blob/master/docs/API.md#html) - accepts a `body`, and sets the `content-type` header to `text/html` (useful for views)
- [`json`](https://github.com/articulate/paperplane/blob/master/docs/API.md#json) - accepts a `body`, and sets the `content-type` header to `application/json` (useful for `json` API's)
- [`redirect`](https://github.com/articulate/paperplane/blob/master/docs/API.md#redirect) - accepts a `Location` header, and sets an appropriate redirect `statusCode`
- [`send`](https://github.com/articulate/paperplane/blob/master/docs/API.md#send) - accepts a `body`, and returns a basic `Response`

But don't get hung up on using helper functions if you don't like them: what is important is the structure of the `Response`, not how you acheived it.

### Errors

If your handler function either throws or rejects with an `Error`, `paperplane` will catch it and send the client a `json` response describing the error.  If a `statusCode` is present on the `Error`, it will be used for the response.  For example, your handler function might throw like this:

```js
const app = req => {
  const err = new Error("I'm a teapot")
  err.statusCode = 418
  throw err
}
```

In that case, the client would receive a `418` response with the following body:

```json
{
  "message": "I'm a teapot",
  "name": "Error"
}
```

Building fancy errors is made much easier by libraries such as [`boom`](https://www.npmjs.com/package/boom) and [`http-errors`](https://www.npmjs.com/package/http-errors), and `paperplane` can recognize and properly format errors generated by both.  So the handler below will respond with a similarly silly message:

```js
const { ImATeapot } = require('http-errors')
const app = req => { throw new ImATeapot() }
```

Validation is a common source of errors, and [`joi`](https://www.npmjs.com/package/joi) is a library commonly used for validation.  To keep things simple, `paperplane` recognizes and properly formats errors generated by `joi`.

```js
const { denodeify } = require('promise')
const Joi = require('joi')

const validate = denodeify(Joi.validate)
const app = req => validate({ foo: 123 }, Joi.object({ foo: Joi.string() }))
```

A handler function like above will send the client a `400` response with this body:

```json
{
  "details": [
    {
      "message": "\"foo\" must be a string",
      "path": "foo",
      "type": "string.base",
      "context": {
        "value": 123,
        "key": "foo"
      }
    }
  ],
  "message": "child \"foo\" fails because [\"foo\" must be a string]",
  "name": "ValidationError"
}
```

## Example application

Your best bet is to peruse the [demo](https://github.com/articulate/paperplane/blob/master/demo) and the [tests](https://github.com/articulate/paperplane/blob/master/test/mount.js).  Between the two, they cover all the basics.

## What are Algebraic Data Types?

If you've been exposed to functional programming at all, it's possible that you've heard fun words like `monad`, `monoid`, or even `functor` tossed around in conversation.  Types such as `Future`, `Maybe`, or `IO` are good examples of ADT's.  These are tools that can make your job easier in different ways, and if you want to take advantage of them in `paperplane`, there is now [customizable support for that](https://github.com/articulate/paperplane/blob/master/docs/API.md#mount).

Please note that knowledge of such arcane functional magic is not required to harness the power of `paperplane`.  Promise-based request handlers are supported without any additional configuration, so feel free to stick with native Promises if that is where you're most comfortable.

However, if you wish to take the red pill, and see how deep the rabbit hole goes, here are some resources for further study on ADT's:

- [_Professor Frisby's Mostly Adequate Guide to Function Programming_](https://mostly-adequate.gitbooks.io/mostly-adequate-guide/)
- Bartosz Milewski's _Category Theory for programmers_ - [Part 1](https://www.youtube.com/playlist?list=PLbgaMIhjbmEnaH_LTkxLI7FMa2HsnawM_), [Part 2](https://www.youtube.com/playlist?list=PLbgaMIhjbmElia1eCEZNvsVscFef9m0dm), [Part 3](https://www.youtube.com/playlist?list=PLbgaMIhjbmEn64WVX4B08B4h2rOtueWIL)
- [`crocks`](https://github.com/evilsoft/crocks) - a collection of well known Algebraic Data Types in javascript

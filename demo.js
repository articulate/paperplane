const http = require('http')
const { json, methods, mount, routes } = require('.')

const { compose, evolve, map, merge,
        pathEq, prop, toUpper, when } = require('ramda')

const port = 3000

var foo = { bar: 'baz' }

const getFoo = req =>
  Promise.resolve(foo).then(json)

const putFoo = req => {
  console.log('params:', req.params)
  foo = merge(foo, req.body)
  return json(foo)
}

const endpoint = routes({
  '/foos/:id': methods({
    GET: getFoo,
    PUT: putFoo
  })
})

const listening = err =>
  err ? console.error(err) : console.info(`Listening on port: ${port}`)

const parseJson = when(
  pathEq(['headers', 'content-type'], 'application/json'),
  evolve({ body: JSON.parse })
)

const app = compose(endpoint, parseJson)

http.createServer(mount(app)).listen(port, listening)

require('./lib/seed')()

const { compose } = require('ramda')
const future = require('redux-future').default
const http = require('http')
const { mount, parseJson } = require('..')

const logger = require('./lib/logger')
const routes = require('./routes')

const port = process.env.PORT || 3000

const app = compose(routes, parseJson)

const middleware = [ future ]

const server = http.createServer(mount({ app, logger, middleware }))

if (require.main === module) server.listen(port, logger)

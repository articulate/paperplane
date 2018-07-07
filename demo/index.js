require('./lib/seed')()

const { compose } = require('ramda')
const http = require('http')
const { mount, parseJson } = require('..')

const logger = require('./lib/logger')
const routes = require('./routes')

const port = process.env.PORT || 3000

const app = compose(routes, parseJson)

http.createServer(mount({ app, logger })).listen(port, logger)

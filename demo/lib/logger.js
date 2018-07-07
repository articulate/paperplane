const { compose, dissocPath } = require('ramda')
const { logger } = require('../..')

module.exports = compose(logger, dissocPath(['req', 'headers']))

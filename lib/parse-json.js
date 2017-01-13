const { curryN, evolve, flip, when } = require('ramda')
const is = curryN(2, flip(require('type-is')))

module.exports = when(is(['json']), evolve({ body: JSON.parse }))

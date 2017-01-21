const { assoc } = require('ramda')
const { parse } = require('cookie')

module.exports = req =>
  assoc('cookies', parse(req.headers.cookie || ''), req)

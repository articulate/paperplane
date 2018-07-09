const { assoc } = require('ramda')
const { parse } = require('cookie')

const parseCookies = req =>
  assoc('cookies', parse(req.headers.cookie || ''), req)

module.exports = parseCookies

const { assoc } = require('ramda')
const { parse } = require('cookie')

const parseCookie = req =>
  assoc('cookies', parse(req.headers.cookie || ''), req)

module.exports = parseCookie

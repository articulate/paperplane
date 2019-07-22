const { assoc } = require('ramda')
const { parse } = require('cookie')

exports.parseCookies = req =>
  assoc('cookies', parse(req.headers.cookie || ''), req)

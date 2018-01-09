const redirect = (location, statusCode=302) => ({
  body: '',
  headers: { location },
  statusCode
})

module.exports = redirect

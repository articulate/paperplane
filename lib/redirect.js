exports.redirect = (location, statusCode=302) => ({
  body: '',
  headers: { location },
  statusCode
})

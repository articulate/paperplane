module.exports = (location, statusCode=302) => ({
  body: '',
  headers: { location },
  statusCode
})

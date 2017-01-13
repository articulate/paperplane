module.exports = (Location, statusCode=302) => ({
  body: '',
  headers: { Location },
  statusCode
})

module.exports = (Location, statusCode=302) => Promise.reject({
  body: '',
  headers: { Location },
  statusCode
})

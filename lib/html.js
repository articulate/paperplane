module.exports = body => ({
  body,
  headers: {
    'content-type': 'text/html'
  },
  statusCode: 200
})

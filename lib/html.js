exports.html = body => ({
  body,
  headers: {
    'content-type': 'text/html'
  },
  statusCode: 200
})

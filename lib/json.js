exports.json = body => ({
  body: JSON.stringify(body),
  headers: {
    'content-type': 'application/json'
  },
  statusCode: 200
})

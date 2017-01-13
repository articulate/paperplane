const { assoc } = require('ramda')
const { json }  = require('../..')

const db = require('../lib/db')('courses')

exports.createCourse = req =>
  db.put(req.body)
    .then(json)
    .then(assoc('statusCode', 201))

exports.fetchCourse = req =>
  db.get(req.params.id)
    .then(json)

exports.fetchCourses = () =>
  db.where({ keys: false })
    .then(json)

exports.updateCourse = req =>
  db.patch(assoc('id', req.params.id, req.body))
    .then(json)

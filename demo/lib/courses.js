const { json } = require('../..')

const db = require('./db')('courses')

exports.createCourse = req =>
  db.put(req.body)
    .then(json)

exports.fetchCourse = req =>
  db.get(req.params.id)
    .then(json)

exports.fetchCourses = () =>
  db.where({ keys: false })
    .then(json)

exports.updateCourse = req =>
  db.patch(req.body)
    .then(json)

const courses = require('../seeds/courses')
const db = require('./db')('courses')

module.exports = () =>
  Promise.all(courses.map(db.put))

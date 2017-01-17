const db    = require('./db')('users')
const users = require('../seeds/users')

module.exports = () =>
  Promise.all(users.map(db.put))

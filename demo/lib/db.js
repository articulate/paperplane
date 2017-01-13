const levelup = require('levelup')
const memdown = require('memdown')

const { always: K, bind, flip, merge } = require('ramda')

const { promisify } = require('./util')

const patchWith = flip(merge)

module.exports = name => {
  const db = levelup(name, { db: memdown, valueEncoding: 'json' })

  const delPromise = promisify(db.del, db)
  const putPromise = promisify(db.put, db)

  const del = id =>
    delPromise(id).then(K(id))

  const get = promisify(db.get, db)

  const patch = data =>
    get(data.id)
      .catch(K({}))
      .then(patchWith(data))
      .then(put)

  const put = data =>
    putPromise(data.id, data).then(K(data))

  const where = opts =>
    new Promise((resolve, reject) => {
      const result = []
      db.createReadStream(opts)
        .on('data',  bind(result.push, result))
        .on('error', reject)
        .on('close', () => resolve(result))
    })

  return { del, get, patch, put, where }
}

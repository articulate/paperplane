const { Readable } = require('stream')

const errorStream = () => {
  const s = new Readable

  s._read = () => {
    process.nextTick(() => {
      s.emit('error', new Error())
      s.close()
    })
  }

  return s
}

module.exports = errorStream

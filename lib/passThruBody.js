const { assocWith } = require('@articulate/funky')
const { PassThrough } = require('stream')

const passThru = ({ original }) => {
  const body = new PassThrough()
  original.pipe(body)
  return body
}

exports.passThruBody =
  assocWith('body', passThru)

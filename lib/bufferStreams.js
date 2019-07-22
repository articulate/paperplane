const { evolveP, promisify } = require('@articulate/funky')
const { is, when } = require('ramda')
const { Stream } = require('stream')
const streamToBuffer = promisify(require('fast-stream-to-buffer'))

exports.bufferStreams =
  evolveP({ body: when(is(Stream), streamToBuffer) })

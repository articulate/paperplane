const spy = require('@articulate/spy')

console.info = spy()

beforeEach(() =>
  console.info.reset()
)

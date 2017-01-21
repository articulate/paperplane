module.exports = () => {
  const spy = x => spy.calls.push(x)
  spy.calls = []
  spy.reset = () => spy.calls.length = 0
  return spy
}

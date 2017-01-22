module.exports = (fn, ctx) => (...args) =>
  new Promise((res, rej) => {
    fn.call(ctx, ...args, (err, val) => err ? rej(err) : res(val))
  })

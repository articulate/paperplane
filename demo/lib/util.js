exports.promisify = (fn, ctx) => (...args) =>
  new Promise((resolve, reject) => {
    fn.call(ctx, ...args, (err, val) => err ? reject(err) : resolve(val))
  })

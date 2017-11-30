class CorsError extends Error {
  static unwrap(err) {
    return err instanceof CorsError ? err.err : err
  }

  constructor(err, headers, ...params) {
    super(...params)
    Object.assign(this, { err, headers })
  }
}

module.exports = CorsError

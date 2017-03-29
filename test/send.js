const { expect } = require('chai')

const { send } = require('..')

describe('send', () => {
  const body = 'body',
        res  = send(body)

  it('includes the body in the response', () =>
    expect(res.body).to.equal(body)
  )

  it('sets headers to an empty object', () => {
    expect(res.headers).to.be.an('object')
    expect(Object.keys(res.headers).length).to.equal(0)
  })

  it('sets the statusCode to 200', () =>
    expect(res.statusCode).to.equal(200)
  )
})

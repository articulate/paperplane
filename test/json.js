const { expect } = require('chai')

const { json } = require('..')

describe('json', () => {
  const body = { foo: 'bar' },
        res  = json(body)

  it('stringifies the body', () =>
    expect(res.body).to.equal(JSON.stringify(body))
  )

  it('sets the "content-type" header to "application/json"', () => {
    expect(res.headers).to.be.an('object')
    expect(res.headers['content-type']).to.equal('application/json')
  })

  it('sets the statusCode to 200', () =>
    expect(res.statusCode).to.equal(200)
  )
})

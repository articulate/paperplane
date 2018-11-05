const { expect }  = require('chai')

const { parseJson } = require('..')

const request = contentType => ({
  body: '{"foo":"bar"}',
  headers: {
    'content-length': 13,
    'content-type': contentType
  }
})

describe('parseJson', () => {
  describe('when content-type is "application/json"', () => {
    const req = parseJson(request('application/json'))

    it('parses the request body as json', () => {
      expect(req.body).to.be.an('object')
      expect(req.body.foo).to.equal('bar')
    })
  })

  describe('when json content-type includes a charset', () => {
    const req = parseJson(request('application/json; charset=utf-8'))

    it('parses the request body as json', () => {
      expect(req.body).to.be.an('object')
      expect(req.body.foo).to.equal('bar')
    })
  })

  describe('when content-type is not json', () => {
    const req = parseJson(request('text/plain'))

    it('does not parse the request body as json', () =>
      expect(req.body).to.be.a('string')
    )
  })
})

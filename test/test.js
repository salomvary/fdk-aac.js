var expect = require('chai').expect
var fs = require('fs')
var path = require('path')
var aac = require('../fdk-aac')

var testDataPath = path.join(__dirname, 'test.wav')
var testData = new Uint8Array(fs.readFileSync(testDataPath))

describe('fdk-aac', function() {
  it('should encode test file to AAC', function() {
    return aac(testData).then(function (out) {
      expect(out.length).to.be.above(0)
      expect(out).to.be.an.instanceof(Uint8Array)
    })
  })

  it('should fail on an empty file', function(done) {
    aac(new Uint8Array()).then(function () {
      done('Unexpected success')
    }, function (err) {
      try {
        expect(err).to.be.an.instanceof(Error)
        expect(err.status).to.eql(1)
        done()
      } catch (e) {
        done(e)
      }
    })
  })
})

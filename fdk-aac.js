const Module = require('./aac-enc')

/**
 * @callback aacCallback
 * @param {Error=} error
 * @param {Uint8Array=} aac
 */

/** 
 * @param {Uint8Array} wav
 * @param {aacCallback} callback
 */
module.exports = function aac (wav, callback) {
  whenInitialized(function () {
    callMain(wav, callback)
  })
}

let callsWaiting = []

let whenInitialized = function whenInitialized (call) {
  callsWaiting.push(call)
}

Module.onRuntimeInitialized = function () {
  let call
  while ((call = callsWaiting.shift())) {
    call()
  }
  callsWaiting = null
  whenInitialized = function whenInitialized (call) {
    call()
  }
}

let lastError

Module.quit = function (status, throwable) {
  lastError = throwable
}

function callMain (input, callback) {
  lastError = null

  try {
    Module.FS.writeFile('input.wav', input)
    Module.callMain(['input.wav', 'output.aac'])
    if (lastError) {
      callback(lastError)
    } else {
      const aac = Module.FS.readFile('output.aac')
      callback(null, aac)
    }
  } catch (e) {
    callback(e)
  } finally {
    Module.FS.unlink('input.wav')
    Module.FS.unlink('output.aac')
  }
}
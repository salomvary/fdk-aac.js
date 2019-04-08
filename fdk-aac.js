const AacEnc = require('./aac-enc')

let lastError

/**
 * @param {Uint8Array} wav
 * @returns {Promise.<Uint8Array>} aac
 */
module.exports = function aac (wav) {
  const ModuleOptions = {
    quit (status, throwable) {
      lastError = throwable
    }
  }

  // Emscripten's Module.then is not a fully compliant "thenable" and
  // does not allow value chanining
  return new Promise(function (resolve) {
    AacEnc(ModuleOptions).then(function (Module) {
      // FIXME this for some reason synchronously throws
      // instead of rejecting the promise in Node.js
      resolve(callMain(Module, wav))
    })
  })
}

function callMain (Module, input) {
  lastError = null
  try {
    Module.FS.writeFile('input.wav', input)
    Module.callMain(['input.wav', 'output.aac'])
    if (lastError) {
      throw new Error(lastError)
    } else {
      return Module.FS.readFile('output.aac')
    }
  } finally {
    Module.FS.unlink('input.wav')
    Module.FS.unlink('output.aac')
  }
}

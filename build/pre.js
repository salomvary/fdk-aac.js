/* global Module fdkAacWasm */
if (typeof fdkAacWasm !== 'undefined') {
  Module['locateFile'] = function (path, scriptDirectory) {
    if (path === 'aac-enc.wasm') {
      return fdkAacWasm
    } else {
      return scriptDirectory + path
    }
  }
}
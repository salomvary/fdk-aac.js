/* global fdkAac */
/* eslint-env worker */

self.fdkAacWasm = '../aac-enc.wasm'

importScripts('../fdk-aac.umd.js')

self.onmessage = (event) => {
  const url = event.data
  fetch(url)
    .then((response) => response.arrayBuffer())
    .then((wav) => {
      fdkAac(new Uint8Array(wav), function (err, aac) {
        if (err) return console.error(err)
        const file = ('File' in self)
          ? new File([aac.buffer], 'test.aac', {type: 'audio/aac'})
          // Safari does not have File in workers
          : new Blob([aac.buffer], {type: 'audio/aac'})
        self.postMessage(URL.createObjectURL(file))
      })
    })    
}

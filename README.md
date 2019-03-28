# Port of Fraunhofer FDK AAC with Emscripten

**WARNING:** This is an experimental library not tested for production.

This projects ports the Fraunhofer FDK AAC encoder to JavaScript using the
[Emscripten project](https://github.com/kripken/emscripten). Works in modern browsers and in Node.js.

## Demo

A very simple [demo is available here](https://salomvary.com/fdk-aac.js/examples/).

## Builds

- `fdk-aac.js`: use this from Node, Browserify, Webpack
- `fdk-aac.umd.js`: use this directly from the browser

## Usage

See [the example command line utility](bin/encode-aac) and the [example web worker](examples/worker.js).

```js
fetch(url)
    .then((response) => response.arrayBuffer())
    .then((wav) => {
        fdkAac(new Uint8Array(wav), function (err, aac) {
            if (err) return console.error(err)
            const file = new File([aac.buffer], 'test.aac', {type: 'audio/aac'})
            const url = URL.createObjectURL(file)
            // Do something with the file or the url, for example:
            document.querySelector('audio').src = url
        })
    })
```

## Credits

Thanks to [ffmpeg.js](https://github.com/Kagami/ffmpeg.js) for inspiration.

## License

It's complicated. Fraunhofer FDK AAC has a [non-free license](https://github.com/mstorsjo/fdk-aac/blob/master/NOTICE). Talk to your lawyer before using it in any project.

Own library code licensed under [MIT License](https://opensource.org/licenses/MIT).

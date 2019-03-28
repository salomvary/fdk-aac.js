# Port of Fraunhofer FDK AAC with Emscripten

**WARNING:** This is an experimental library not tested for production and
with unclear license situation.

This projects ports the Fraunhofer FDK AAC encoder to JavaScript using the
[Emscripten project](https://github.com/kripken/emscripten). Works in modern browsers and in Node.js.

## Builds

- `fdk-aac.js`: use this from Node, Browserify, Webpack
- `fdk-aac.umd.js`: use this directly from the browser

## Usage

See [the example command line utility](bin/encode-aac) and the [example web worker](examples/worker.js).


## Credits

Thanks to [ffmpeg.js](https://github.com/Kagami/ffmpeg.js) for inspiration.

## License

It's complicated. Fraunhofer FDK AAC has a [non-free license](https://github.com/mstorsjo/fdk-aac/blob/master/NOTICE). Talk to your lawyer before using it in any project.

Own library code licensed under [MIT License](https://opensource.org/licenses/MIT).

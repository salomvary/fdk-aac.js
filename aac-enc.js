
var Module = (function() {
  var _scriptDir = typeof document !== 'undefined' && document.currentScript ? document.currentScript.src : undefined;
  return (
function(Module) {
  Module = Module || {};

// Copyright 2010 The Emscripten Authors.  All rights reserved.
// Emscripten is available under two separate licenses, the MIT license and the
// University of Illinois/NCSA Open Source License.  Both these licenses can be
// found in the LICENSE file.

// The Module object: Our interface to the outside world. We import
// and export values on it. There are various ways Module can be used:
// 1. Not defined. We create it here
// 2. A function parameter, function(Module) { ..generated code.. }
// 3. pre-run appended it, var Module = {}; ..generated code..
// 4. External script tag defines var Module.
// We need to check if Module already exists (e.g. case 3 above).
// Substitution will be replaced with actual code on later stage of the build,
// this way Closure Compiler will not mangle it (e.g. case 4. above).
// Note that if you want to run closure, and also to use Module
// after the generated code, you will need to define   var Module = {};
// before the code. Then that object will be used in the code, and you
// can continue to use Module afterwards as well.
var Module = typeof Module !== 'undefined' ? Module : {};

// --pre-jses are emitted after the Module integration code, so that they can
// refer to Module (if they choose; they can also define Module)
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


// Sometimes an existing Module object exists with properties
// meant to overwrite the default module functionality. Here
// we collect those properties and reapply _after_ we configure
// the current environment's defaults to avoid having to be so
// defensive during initialization.
var moduleOverrides = {};
var key;
for (key in Module) {
  if (Module.hasOwnProperty(key)) {
    moduleOverrides[key] = Module[key];
  }
}

Module['arguments'] = [];
Module['thisProgram'] = './this.program';
Module['quit'] = function(status, toThrow) {
  throw toThrow;
};
Module['preRun'] = [];
Module['postRun'] = [];

// Determine the runtime environment we are in. You can customize this by
// setting the ENVIRONMENT setting at compile time (see settings.js).

var ENVIRONMENT_IS_WEB = false;
var ENVIRONMENT_IS_WORKER = false;
var ENVIRONMENT_IS_NODE = false;
var ENVIRONMENT_IS_SHELL = false;
ENVIRONMENT_IS_WEB = typeof window === 'object';
ENVIRONMENT_IS_WORKER = typeof importScripts === 'function';
ENVIRONMENT_IS_NODE = typeof process === 'object' && typeof require === 'function' && !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_WORKER;
ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;

if (Module['ENVIRONMENT']) {
  throw new Error('Module.ENVIRONMENT has been deprecated. To force the environment, use the ENVIRONMENT compile-time option (for example, -s ENVIRONMENT=web or -s ENVIRONMENT=node)');
}


// Three configurations we can be running in:
// 1) We could be the application main() thread running in the main JS UI thread. (ENVIRONMENT_IS_WORKER == false and ENVIRONMENT_IS_PTHREAD == false)
// 2) We could be the application main() thread proxied to worker. (with Emscripten -s PROXY_TO_WORKER=1) (ENVIRONMENT_IS_WORKER == true, ENVIRONMENT_IS_PTHREAD == false)
// 3) We could be an application pthread running in a worker. (ENVIRONMENT_IS_WORKER == true and ENVIRONMENT_IS_PTHREAD == true)




// `/` should be present at the end if `scriptDirectory` is not empty
var scriptDirectory = '';
function locateFile(path) {
  if (Module['locateFile']) {
    return Module['locateFile'](path, scriptDirectory);
  } else {
    return scriptDirectory + path;
  }
}

if (ENVIRONMENT_IS_NODE) {
  scriptDirectory = __dirname + '/';

  // Expose functionality in the same simple way that the shells work
  // Note that we pollute the global namespace here, otherwise we break in node
  var nodeFS;
  var nodePath;

  Module['read'] = function shell_read(filename, binary) {
    var ret;
      if (!nodeFS) nodeFS = require('fs');
      if (!nodePath) nodePath = require('path');
      filename = nodePath['normalize'](filename);
      ret = nodeFS['readFileSync'](filename);
    return binary ? ret : ret.toString();
  };

  Module['readBinary'] = function readBinary(filename) {
    var ret = Module['read'](filename, true);
    if (!ret.buffer) {
      ret = new Uint8Array(ret);
    }
    assert(ret.buffer);
    return ret;
  };

  if (process['argv'].length > 1) {
    Module['thisProgram'] = process['argv'][1].replace(/\\/g, '/');
  }

  Module['arguments'] = process['argv'].slice(2);

  // MODULARIZE will export the module in the proper place outside, we don't need to export here

  process['on']('uncaughtException', function(ex) {
    // suppress ExitStatus exceptions from showing an error
    if (!(ex instanceof ExitStatus)) {
      throw ex;
    }
  });
  // Currently node will swallow unhandled rejections, but this behavior is
  // deprecated, and in the future it will exit with error status.
  process['on']('unhandledRejection', abort);

  Module['quit'] = function(status) {
    process['exit'](status);
  };

  Module['inspect'] = function () { return '[Emscripten Module object]'; };
} else
if (ENVIRONMENT_IS_SHELL) {


  if (typeof read != 'undefined') {
    Module['read'] = function shell_read(f) {
      return read(f);
    };
  }

  Module['readBinary'] = function readBinary(f) {
    var data;
    if (typeof readbuffer === 'function') {
      return new Uint8Array(readbuffer(f));
    }
    data = read(f, 'binary');
    assert(typeof data === 'object');
    return data;
  };

  if (typeof scriptArgs != 'undefined') {
    Module['arguments'] = scriptArgs;
  } else if (typeof arguments != 'undefined') {
    Module['arguments'] = arguments;
  }

  if (typeof quit === 'function') {
    Module['quit'] = function(status) {
      quit(status);
    }
  }
} else
if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
  if (ENVIRONMENT_IS_WORKER) { // Check worker, not web, since window could be polyfilled
    scriptDirectory = self.location.href;
  } else if (document.currentScript) { // web
    scriptDirectory = document.currentScript.src;
  }
  // When MODULARIZE (and not _INSTANCE), this JS may be executed later, after document.currentScript
  // is gone, so we saved it, and we use it here instead of any other info.
  if (_scriptDir) {
    scriptDirectory = _scriptDir;
  }
  // blob urls look like blob:http://site.com/etc/etc and we cannot infer anything from them.
  // otherwise, slice off the final part of the url to find the script directory.
  // if scriptDirectory does not contain a slash, lastIndexOf will return -1,
  // and scriptDirectory will correctly be replaced with an empty string.
  if (scriptDirectory.indexOf('blob:') !== 0) {
    scriptDirectory = scriptDirectory.substr(0, scriptDirectory.lastIndexOf('/')+1);
  } else {
    scriptDirectory = '';
  }


  Module['read'] = function shell_read(url) {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', url, false);
      xhr.send(null);
      return xhr.responseText;
  };

  if (ENVIRONMENT_IS_WORKER) {
    Module['readBinary'] = function readBinary(url) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, false);
        xhr.responseType = 'arraybuffer';
        xhr.send(null);
        return new Uint8Array(xhr.response);
    };
  }

  Module['readAsync'] = function readAsync(url, onload, onerror) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = 'arraybuffer';
    xhr.onload = function xhr_onload() {
      if (xhr.status == 200 || (xhr.status == 0 && xhr.response)) { // file URLs can return 0
        onload(xhr.response);
        return;
      }
      onerror();
    };
    xhr.onerror = onerror;
    xhr.send(null);
  };

  Module['setWindowTitle'] = function(title) { document.title = title };
} else
{
  throw new Error('environment detection error');
}

// Set up the out() and err() hooks, which are how we can print to stdout or
// stderr, respectively.
// If the user provided Module.print or printErr, use that. Otherwise,
// console.log is checked first, as 'print' on the web will open a print dialogue
// printErr is preferable to console.warn (works better in shells)
// bind(console) is necessary to fix IE/Edge closed dev tools panel behavior.
var out = Module['print'] || (typeof console !== 'undefined' ? console.log.bind(console) : (typeof print !== 'undefined' ? print : null));
var err = Module['printErr'] || (typeof printErr !== 'undefined' ? printErr : ((typeof console !== 'undefined' && console.warn.bind(console)) || out));

// Merge back in the overrides
for (key in moduleOverrides) {
  if (moduleOverrides.hasOwnProperty(key)) {
    Module[key] = moduleOverrides[key];
  }
}
// Free the object hierarchy contained in the overrides, this lets the GC
// reclaim data used e.g. in memoryInitializerRequest, which is a large typed array.
moduleOverrides = undefined;

// perform assertions in shell.js after we set up out() and err(), as otherwise if an assertion fails it cannot print the message
assert(typeof Module['memoryInitializerPrefixURL'] === 'undefined', 'Module.memoryInitializerPrefixURL option was removed, use Module.locateFile instead');
assert(typeof Module['pthreadMainPrefixURL'] === 'undefined', 'Module.pthreadMainPrefixURL option was removed, use Module.locateFile instead');
assert(typeof Module['cdInitializerPrefixURL'] === 'undefined', 'Module.cdInitializerPrefixURL option was removed, use Module.locateFile instead');
assert(typeof Module['filePackagePrefixURL'] === 'undefined', 'Module.filePackagePrefixURL option was removed, use Module.locateFile instead');



// Copyright 2017 The Emscripten Authors.  All rights reserved.
// Emscripten is available under two separate licenses, the MIT license and the
// University of Illinois/NCSA Open Source License.  Both these licenses can be
// found in the LICENSE file.

// {{PREAMBLE_ADDITIONS}}

var STACK_ALIGN = 16;

// stack management, and other functionality that is provided by the compiled code,
// should not be used before it is ready
stackSave = stackRestore = stackAlloc = function() {
  abort('cannot use the stack before compiled code is ready to run, and has provided stack access');
};

function staticAlloc(size) {
  abort('staticAlloc is no longer available at runtime; instead, perform static allocations at compile time (using makeStaticAlloc)');
}

function dynamicAlloc(size) {
  assert(DYNAMICTOP_PTR);
  var ret = HEAP32[DYNAMICTOP_PTR>>2];
  var end = (ret + size + 15) & -16;
  if (end <= _emscripten_get_heap_size()) {
    HEAP32[DYNAMICTOP_PTR>>2] = end;
  } else {
    return 0;
  }
  return ret;
}

function alignMemory(size, factor) {
  if (!factor) factor = STACK_ALIGN; // stack alignment (16-byte) by default
  return Math.ceil(size / factor) * factor;
}

function getNativeTypeSize(type) {
  switch (type) {
    case 'i1': case 'i8': return 1;
    case 'i16': return 2;
    case 'i32': return 4;
    case 'i64': return 8;
    case 'float': return 4;
    case 'double': return 8;
    default: {
      if (type[type.length-1] === '*') {
        return 4; // A pointer
      } else if (type[0] === 'i') {
        var bits = parseInt(type.substr(1));
        assert(bits % 8 === 0, 'getNativeTypeSize invalid bits ' + bits + ', type ' + type);
        return bits / 8;
      } else {
        return 0;
      }
    }
  }
}

function warnOnce(text) {
  if (!warnOnce.shown) warnOnce.shown = {};
  if (!warnOnce.shown[text]) {
    warnOnce.shown[text] = 1;
    err(text);
  }
}

var asm2wasmImports = { // special asm2wasm imports
    "f64-rem": function(x, y) {
        return x % y;
    },
    "debugger": function() {
        debugger;
    }
};



var jsCallStartIndex = 1;
var functionPointers = new Array(0);

// Wraps a JS function as a wasm function with a given signature.
// In the future, we may get a WebAssembly.Function constructor. Until then,
// we create a wasm module that takes the JS function as an import with a given
// signature, and re-exports that as a wasm function.
function convertJsFunctionToWasm(func, sig) {
  // The module is static, with the exception of the type section, which is
  // generated based on the signature passed in.
  var typeSection = [
    0x01, // id: section,
    0x00, // length: 0 (placeholder)
    0x01, // count: 1
    0x60, // form: func
  ];
  var sigRet = sig.slice(0, 1);
  var sigParam = sig.slice(1);
  var typeCodes = {
    'i': 0x7f, // i32
    'j': 0x7e, // i64
    'f': 0x7d, // f32
    'd': 0x7c, // f64
  };

  // Parameters, length + signatures
  typeSection.push(sigParam.length);
  for (var i = 0; i < sigParam.length; ++i) {
    typeSection.push(typeCodes[sigParam[i]]);
  }

  // Return values, length + signatures
  // With no multi-return in MVP, either 0 (void) or 1 (anything else)
  if (sigRet == 'v') {
    typeSection.push(0x00);
  } else {
    typeSection = typeSection.concat([0x01, typeCodes[sigRet]]);
  }

  // Write the overall length of the type section back into the section header
  // (excepting the 2 bytes for the section id and length)
  typeSection[1] = typeSection.length - 2;

  // Rest of the module is static
  var bytes = new Uint8Array([
    0x00, 0x61, 0x73, 0x6d, // magic ("\0asm")
    0x01, 0x00, 0x00, 0x00, // version: 1
  ].concat(typeSection, [
    0x02, 0x07, // import section
      // (import "e" "f" (func 0 (type 0)))
      0x01, 0x01, 0x65, 0x01, 0x66, 0x00, 0x00,
    0x07, 0x05, // export section
      // (export "f" (func 0 (type 0)))
      0x01, 0x01, 0x66, 0x00, 0x00,
  ]));

   // We can compile this wasm module synchronously because it is very small.
  // This accepts an import (at "e.f"), that it reroutes to an export (at "f")
  var module = new WebAssembly.Module(bytes);
  var instance = new WebAssembly.Instance(module, {
    e: {
      f: func
    }
  });
  var wrappedFunc = instance.exports.f;
  return wrappedFunc;
}

// Add a wasm function to the table.
function addFunctionWasm(func, sig) {
  var table = wasmTable;
  var ret = table.length;

  // Grow the table
  try {
    table.grow(1);
  } catch (err) {
    if (!err instanceof RangeError) {
      throw err;
    }
    throw 'Unable to grow wasm table. Use a higher value for RESERVED_FUNCTION_POINTERS or set ALLOW_TABLE_GROWTH.';
  }

  // Insert new element
  try {
    // Attempting to call this with JS function will cause of table.set() to fail
    table.set(ret, func);
  } catch (err) {
    if (!err instanceof TypeError) {
      throw err;
    }
    assert(typeof sig !== 'undefined', 'Missing signature argument to addFunction');
    var wrapped = convertJsFunctionToWasm(func, sig);
    table.set(ret, wrapped);
  }

  return ret;
}

function removeFunctionWasm(index) {
  // TODO(sbc): Look into implementing this to allow re-using of table slots
}

// 'sig' parameter is required for the llvm backend but only when func is not
// already a WebAssembly function.
function addFunction(func, sig) {


  var base = 0;
  for (var i = base; i < base + 0; i++) {
    if (!functionPointers[i]) {
      functionPointers[i] = func;
      return jsCallStartIndex + i;
    }
  }
  throw 'Finished up all reserved function pointers. Use a higher value for RESERVED_FUNCTION_POINTERS.';

}

function removeFunction(index) {

  functionPointers[index-jsCallStartIndex] = null;
}

var funcWrappers = {};

function getFuncWrapper(func, sig) {
  if (!func) return; // on null pointer, return undefined
  assert(sig);
  if (!funcWrappers[sig]) {
    funcWrappers[sig] = {};
  }
  var sigCache = funcWrappers[sig];
  if (!sigCache[func]) {
    // optimize away arguments usage in common cases
    if (sig.length === 1) {
      sigCache[func] = function dynCall_wrapper() {
        return dynCall(sig, func);
      };
    } else if (sig.length === 2) {
      sigCache[func] = function dynCall_wrapper(arg) {
        return dynCall(sig, func, [arg]);
      };
    } else {
      // general case
      sigCache[func] = function dynCall_wrapper() {
        return dynCall(sig, func, Array.prototype.slice.call(arguments));
      };
    }
  }
  return sigCache[func];
}


function makeBigInt(low, high, unsigned) {
  return unsigned ? ((+((low>>>0)))+((+((high>>>0)))*4294967296.0)) : ((+((low>>>0)))+((+((high|0)))*4294967296.0));
}

function dynCall(sig, ptr, args) {
  if (args && args.length) {
    assert(args.length == sig.length-1);
    assert(('dynCall_' + sig) in Module, 'bad function pointer type - no table for sig \'' + sig + '\'');
    return Module['dynCall_' + sig].apply(null, [ptr].concat(args));
  } else {
    assert(sig.length == 1);
    assert(('dynCall_' + sig) in Module, 'bad function pointer type - no table for sig \'' + sig + '\'');
    return Module['dynCall_' + sig].call(null, ptr);
  }
}

var tempRet0 = 0;

var setTempRet0 = function(value) {
  tempRet0 = value;
}

var getTempRet0 = function() {
  return tempRet0;
}

function getCompilerSetting(name) {
  throw 'You must build with -s RETAIN_COMPILER_SETTINGS=1 for getCompilerSetting or emscripten_get_compiler_setting to work';
}

var Runtime = {
  // helpful errors
  getTempRet0: function() { abort('getTempRet0() is now a top-level function, after removing the Runtime object. Remove "Runtime."') },
  staticAlloc: function() { abort('staticAlloc() is now a top-level function, after removing the Runtime object. Remove "Runtime."') },
  stackAlloc: function() { abort('stackAlloc() is now a top-level function, after removing the Runtime object. Remove "Runtime."') },
};

// The address globals begin at. Very low in memory, for code size and optimization opportunities.
// Above 0 is static memory, starting with globals.
// Then the stack.
// Then 'dynamic' memory for sbrk.
var GLOBAL_BASE = 1024;




// === Preamble library stuff ===

// Documentation for the public APIs defined in this file must be updated in:
//    site/source/docs/api_reference/preamble.js.rst
// A prebuilt local version of the documentation is available at:
//    site/build/text/docs/api_reference/preamble.js.txt
// You can also build docs locally as HTML or other formats in site/
// An online HTML version (which may be of a different version of Emscripten)
//    is up at http://kripken.github.io/emscripten-site/docs/api_reference/preamble.js.html


if (typeof WebAssembly !== 'object') {
  abort('No WebAssembly support found. Build with -s WASM=0 to target JavaScript instead.');
}


/** @type {function(number, string, boolean=)} */
function getValue(ptr, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': return HEAP8[((ptr)>>0)];
      case 'i8': return HEAP8[((ptr)>>0)];
      case 'i16': return HEAP16[((ptr)>>1)];
      case 'i32': return HEAP32[((ptr)>>2)];
      case 'i64': return HEAP32[((ptr)>>2)];
      case 'float': return HEAPF32[((ptr)>>2)];
      case 'double': return HEAPF64[((ptr)>>3)];
      default: abort('invalid type for getValue: ' + type);
    }
  return null;
}




// Wasm globals

var wasmMemory;

// Potentially used for direct table calls.
var wasmTable;


//========================================
// Runtime essentials
//========================================

// whether we are quitting the application. no code should run after this.
// set in exit() and abort()
var ABORT = false;

// set by exit() and abort().  Passed to 'onExit' handler.
// NOTE: This is also used as the process return code code in shell environments
// but only when noExitRuntime is false.
var EXITSTATUS = 0;

/** @type {function(*, string=)} */
function assert(condition, text) {
  if (!condition) {
    abort('Assertion failed: ' + text);
  }
}

// Returns the C function with a specified identifier (for C++, you need to do manual name mangling)
function getCFunc(ident) {
  var func = Module['_' + ident]; // closure exported function
  assert(func, 'Cannot call unknown function ' + ident + ', make sure it is exported');
  return func;
}

// C calling interface.
function ccall(ident, returnType, argTypes, args, opts) {
  // For fast lookup of conversion functions
  var toC = {
    'string': function(str) {
      var ret = 0;
      if (str !== null && str !== undefined && str !== 0) { // null string
        // at most 4 bytes per UTF-8 code point, +1 for the trailing '\0'
        var len = (str.length << 2) + 1;
        ret = stackAlloc(len);
        stringToUTF8(str, ret, len);
      }
      return ret;
    },
    'array': function(arr) {
      var ret = stackAlloc(arr.length);
      writeArrayToMemory(arr, ret);
      return ret;
    }
  };

  function convertReturnValue(ret) {
    if (returnType === 'string') return UTF8ToString(ret);
    if (returnType === 'boolean') return Boolean(ret);
    return ret;
  }

  var func = getCFunc(ident);
  var cArgs = [];
  var stack = 0;
  assert(returnType !== 'array', 'Return type should not be "array".');
  if (args) {
    for (var i = 0; i < args.length; i++) {
      var converter = toC[argTypes[i]];
      if (converter) {
        if (stack === 0) stack = stackSave();
        cArgs[i] = converter(args[i]);
      } else {
        cArgs[i] = args[i];
      }
    }
  }
  var ret = func.apply(null, cArgs);
  ret = convertReturnValue(ret);
  if (stack !== 0) stackRestore(stack);
  return ret;
}

function cwrap(ident, returnType, argTypes, opts) {
  return function() {
    return ccall(ident, returnType, argTypes, arguments, opts);
  }
}

/** @type {function(number, number, string, boolean=)} */
function setValue(ptr, value, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': HEAP8[((ptr)>>0)]=value; break;
      case 'i8': HEAP8[((ptr)>>0)]=value; break;
      case 'i16': HEAP16[((ptr)>>1)]=value; break;
      case 'i32': HEAP32[((ptr)>>2)]=value; break;
      case 'i64': (tempI64 = [value>>>0,(tempDouble=value,(+(Math_abs(tempDouble))) >= 1.0 ? (tempDouble > 0.0 ? ((Math_min((+(Math_floor((tempDouble)/4294967296.0))), 4294967295.0))|0)>>>0 : (~~((+(Math_ceil((tempDouble - +(((~~(tempDouble)))>>>0))/4294967296.0)))))>>>0) : 0)],HEAP32[((ptr)>>2)]=tempI64[0],HEAP32[(((ptr)+(4))>>2)]=tempI64[1]); break;
      case 'float': HEAPF32[((ptr)>>2)]=value; break;
      case 'double': HEAPF64[((ptr)>>3)]=value; break;
      default: abort('invalid type for setValue: ' + type);
    }
}

var ALLOC_NORMAL = 0; // Tries to use _malloc()
var ALLOC_STACK = 1; // Lives for the duration of the current function call
var ALLOC_DYNAMIC = 2; // Cannot be freed except through sbrk
var ALLOC_NONE = 3; // Do not allocate

// allocate(): This is for internal use. You can use it yourself as well, but the interface
//             is a little tricky (see docs right below). The reason is that it is optimized
//             for multiple syntaxes to save space in generated code. So you should
//             normally not use allocate(), and instead allocate memory using _malloc(),
//             initialize it with setValue(), and so forth.
// @slab: An array of data, or a number. If a number, then the size of the block to allocate,
//        in *bytes* (note that this is sometimes confusing: the next parameter does not
//        affect this!)
// @types: Either an array of types, one for each byte (or 0 if no type at that position),
//         or a single type which is used for the entire block. This only matters if there
//         is initial data - if @slab is a number, then this does not matter at all and is
//         ignored.
// @allocator: How to allocate memory, see ALLOC_*
/** @type {function((TypedArray|Array<number>|number), string, number, number=)} */
function allocate(slab, types, allocator, ptr) {
  var zeroinit, size;
  if (typeof slab === 'number') {
    zeroinit = true;
    size = slab;
  } else {
    zeroinit = false;
    size = slab.length;
  }

  var singleType = typeof types === 'string' ? types : null;

  var ret;
  if (allocator == ALLOC_NONE) {
    ret = ptr;
  } else {
    ret = [_malloc,
    stackAlloc,
    dynamicAlloc][allocator](Math.max(size, singleType ? 1 : types.length));
  }

  if (zeroinit) {
    var stop;
    ptr = ret;
    assert((ret & 3) == 0);
    stop = ret + (size & ~3);
    for (; ptr < stop; ptr += 4) {
      HEAP32[((ptr)>>2)]=0;
    }
    stop = ret + size;
    while (ptr < stop) {
      HEAP8[((ptr++)>>0)]=0;
    }
    return ret;
  }

  if (singleType === 'i8') {
    if (slab.subarray || slab.slice) {
      HEAPU8.set(/** @type {!Uint8Array} */ (slab), ret);
    } else {
      HEAPU8.set(new Uint8Array(slab), ret);
    }
    return ret;
  }

  var i = 0, type, typeSize, previousType;
  while (i < size) {
    var curr = slab[i];

    type = singleType || types[i];
    if (type === 0) {
      i++;
      continue;
    }
    assert(type, 'Must know what type to store in allocate!');

    if (type == 'i64') type = 'i32'; // special case: we have one i32 here, and one i32 later

    setValue(ret+i, curr, type);

    // no need to look up size unless type changes, so cache it
    if (previousType !== type) {
      typeSize = getNativeTypeSize(type);
      previousType = type;
    }
    i += typeSize;
  }

  return ret;
}

// Allocate memory during any stage of startup - static memory early on, dynamic memory later, malloc when ready
function getMemory(size) {
  if (!runtimeInitialized) return dynamicAlloc(size);
  return _malloc(size);
}




/** @type {function(number, number=)} */
function Pointer_stringify(ptr, length) {
  abort("this function has been removed - you should use UTF8ToString(ptr, maxBytesToRead) instead!");
}

// Given a pointer 'ptr' to a null-terminated ASCII-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.

function AsciiToString(ptr) {
  var str = '';
  while (1) {
    var ch = HEAPU8[((ptr++)>>0)];
    if (!ch) return str;
    str += String.fromCharCode(ch);
  }
}

// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in ASCII form. The copy will require at most str.length+1 bytes of space in the HEAP.

function stringToAscii(str, outPtr) {
  return writeAsciiToMemory(str, outPtr, false);
}


// Given a pointer 'ptr' to a null-terminated UTF8-encoded string in the given array that contains uint8 values, returns
// a copy of that string as a Javascript String object.

var UTF8Decoder = typeof TextDecoder !== 'undefined' ? new TextDecoder('utf8') : undefined;

/**
 * @param {number} idx
 * @param {number=} maxBytesToRead
 * @return {string}
 */
function UTF8ArrayToString(u8Array, idx, maxBytesToRead) {
  var endIdx = idx + maxBytesToRead;
  var endPtr = idx;
  // TextDecoder needs to know the byte length in advance, it doesn't stop on null terminator by itself.
  // Also, use the length info to avoid running tiny strings through TextDecoder, since .subarray() allocates garbage.
  // (As a tiny code save trick, compare endPtr against endIdx using a negation, so that undefined means Infinity)
  while (u8Array[endPtr] && !(endPtr >= endIdx)) ++endPtr;

  if (endPtr - idx > 16 && u8Array.subarray && UTF8Decoder) {
    return UTF8Decoder.decode(u8Array.subarray(idx, endPtr));
  } else {
    var str = '';
    // If building with TextDecoder, we have already computed the string length above, so test loop end condition against that
    while (idx < endPtr) {
      // For UTF8 byte structure, see:
      // http://en.wikipedia.org/wiki/UTF-8#Description
      // https://www.ietf.org/rfc/rfc2279.txt
      // https://tools.ietf.org/html/rfc3629
      var u0 = u8Array[idx++];
      if (!(u0 & 0x80)) { str += String.fromCharCode(u0); continue; }
      var u1 = u8Array[idx++] & 63;
      if ((u0 & 0xE0) == 0xC0) { str += String.fromCharCode(((u0 & 31) << 6) | u1); continue; }
      var u2 = u8Array[idx++] & 63;
      if ((u0 & 0xF0) == 0xE0) {
        u0 = ((u0 & 15) << 12) | (u1 << 6) | u2;
      } else {
        if ((u0 & 0xF8) != 0xF0) warnOnce('Invalid UTF-8 leading byte 0x' + u0.toString(16) + ' encountered when deserializing a UTF-8 string on the asm.js/wasm heap to a JS string!');
        u0 = ((u0 & 7) << 18) | (u1 << 12) | (u2 << 6) | (u8Array[idx++] & 63);
      }

      if (u0 < 0x10000) {
        str += String.fromCharCode(u0);
      } else {
        var ch = u0 - 0x10000;
        str += String.fromCharCode(0xD800 | (ch >> 10), 0xDC00 | (ch & 0x3FF));
      }
    }
  }
  return str;
}

// Given a pointer 'ptr' to a null-terminated UTF8-encoded string in the emscripten HEAP, returns a
// copy of that string as a Javascript String object.
// maxBytesToRead: an optional length that specifies the maximum number of bytes to read. You can omit
//                 this parameter to scan the string until the first \0 byte. If maxBytesToRead is
//                 passed, and the string at [ptr, ptr+maxBytesToReadr[ contains a null byte in the
//                 middle, then the string will cut short at that byte index (i.e. maxBytesToRead will
//                 not produce a string of exact length [ptr, ptr+maxBytesToRead[)
//                 N.B. mixing frequent uses of UTF8ToString() with and without maxBytesToRead may
//                 throw JS JIT optimizations off, so it is worth to consider consistently using one
//                 style or the other.
/**
 * @param {number} ptr
 * @param {number=} maxBytesToRead
 * @return {string}
 */
function UTF8ToString(ptr, maxBytesToRead) {
  return ptr ? UTF8ArrayToString(HEAPU8, ptr, maxBytesToRead) : '';
}

// Copies the given Javascript String object 'str' to the given byte array at address 'outIdx',
// encoded in UTF8 form and null-terminated. The copy will require at most str.length*4+1 bytes of space in the HEAP.
// Use the function lengthBytesUTF8 to compute the exact number of bytes (excluding null terminator) that this function will write.
// Parameters:
//   str: the Javascript string to copy.
//   outU8Array: the array to copy to. Each index in this array is assumed to be one 8-byte element.
//   outIdx: The starting offset in the array to begin the copying.
//   maxBytesToWrite: The maximum number of bytes this function can write to the array.
//                    This count should include the null terminator,
//                    i.e. if maxBytesToWrite=1, only the null terminator will be written and nothing else.
//                    maxBytesToWrite=0 does not write any bytes to the output, not even the null terminator.
// Returns the number of bytes written, EXCLUDING the null terminator.

function stringToUTF8Array(str, outU8Array, outIdx, maxBytesToWrite) {
  if (!(maxBytesToWrite > 0)) // Parameter maxBytesToWrite is not optional. Negative values, 0, null, undefined and false each don't write out any bytes.
    return 0;

  var startIdx = outIdx;
  var endIdx = outIdx + maxBytesToWrite - 1; // -1 for string null terminator.
  for (var i = 0; i < str.length; ++i) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! So decode UTF16->UTF32->UTF8.
    // See http://unicode.org/faq/utf_bom.html#utf16-3
    // For UTF8 byte structure, see http://en.wikipedia.org/wiki/UTF-8#Description and https://www.ietf.org/rfc/rfc2279.txt and https://tools.ietf.org/html/rfc3629
    var u = str.charCodeAt(i); // possibly a lead surrogate
    if (u >= 0xD800 && u <= 0xDFFF) {
      var u1 = str.charCodeAt(++i);
      u = 0x10000 + ((u & 0x3FF) << 10) | (u1 & 0x3FF);
    }
    if (u <= 0x7F) {
      if (outIdx >= endIdx) break;
      outU8Array[outIdx++] = u;
    } else if (u <= 0x7FF) {
      if (outIdx + 1 >= endIdx) break;
      outU8Array[outIdx++] = 0xC0 | (u >> 6);
      outU8Array[outIdx++] = 0x80 | (u & 63);
    } else if (u <= 0xFFFF) {
      if (outIdx + 2 >= endIdx) break;
      outU8Array[outIdx++] = 0xE0 | (u >> 12);
      outU8Array[outIdx++] = 0x80 | ((u >> 6) & 63);
      outU8Array[outIdx++] = 0x80 | (u & 63);
    } else {
      if (outIdx + 3 >= endIdx) break;
      if (u >= 0x200000) warnOnce('Invalid Unicode code point 0x' + u.toString(16) + ' encountered when serializing a JS string to an UTF-8 string on the asm.js/wasm heap! (Valid unicode code points should be in range 0-0x1FFFFF).');
      outU8Array[outIdx++] = 0xF0 | (u >> 18);
      outU8Array[outIdx++] = 0x80 | ((u >> 12) & 63);
      outU8Array[outIdx++] = 0x80 | ((u >> 6) & 63);
      outU8Array[outIdx++] = 0x80 | (u & 63);
    }
  }
  // Null-terminate the pointer to the buffer.
  outU8Array[outIdx] = 0;
  return outIdx - startIdx;
}

// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in UTF8 form. The copy will require at most str.length*4+1 bytes of space in the HEAP.
// Use the function lengthBytesUTF8 to compute the exact number of bytes (excluding null terminator) that this function will write.
// Returns the number of bytes written, EXCLUDING the null terminator.

function stringToUTF8(str, outPtr, maxBytesToWrite) {
  assert(typeof maxBytesToWrite == 'number', 'stringToUTF8(str, outPtr, maxBytesToWrite) is missing the third parameter that specifies the length of the output buffer!');
  return stringToUTF8Array(str, HEAPU8,outPtr, maxBytesToWrite);
}

// Returns the number of bytes the given Javascript string takes if encoded as a UTF8 byte array, EXCLUDING the null terminator byte.
function lengthBytesUTF8(str) {
  var len = 0;
  for (var i = 0; i < str.length; ++i) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! So decode UTF16->UTF32->UTF8.
    // See http://unicode.org/faq/utf_bom.html#utf16-3
    var u = str.charCodeAt(i); // possibly a lead surrogate
    if (u >= 0xD800 && u <= 0xDFFF) u = 0x10000 + ((u & 0x3FF) << 10) | (str.charCodeAt(++i) & 0x3FF);
    if (u <= 0x7F) ++len;
    else if (u <= 0x7FF) len += 2;
    else if (u <= 0xFFFF) len += 3;
    else len += 4;
  }
  return len;
}


// Given a pointer 'ptr' to a null-terminated UTF16LE-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.

var UTF16Decoder = typeof TextDecoder !== 'undefined' ? new TextDecoder('utf-16le') : undefined;
function UTF16ToString(ptr) {
  assert(ptr % 2 == 0, 'Pointer passed to UTF16ToString must be aligned to two bytes!');
  var endPtr = ptr;
  // TextDecoder needs to know the byte length in advance, it doesn't stop on null terminator by itself.
  // Also, use the length info to avoid running tiny strings through TextDecoder, since .subarray() allocates garbage.
  var idx = endPtr >> 1;
  while (HEAP16[idx]) ++idx;
  endPtr = idx << 1;

  if (endPtr - ptr > 32 && UTF16Decoder) {
    return UTF16Decoder.decode(HEAPU8.subarray(ptr, endPtr));
  } else {
    var i = 0;

    var str = '';
    while (1) {
      var codeUnit = HEAP16[(((ptr)+(i*2))>>1)];
      if (codeUnit == 0) return str;
      ++i;
      // fromCharCode constructs a character from a UTF-16 code unit, so we can pass the UTF16 string right through.
      str += String.fromCharCode(codeUnit);
    }
  }
}

// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in UTF16 form. The copy will require at most str.length*4+2 bytes of space in the HEAP.
// Use the function lengthBytesUTF16() to compute the exact number of bytes (excluding null terminator) that this function will write.
// Parameters:
//   str: the Javascript string to copy.
//   outPtr: Byte address in Emscripten HEAP where to write the string to.
//   maxBytesToWrite: The maximum number of bytes this function can write to the array. This count should include the null
//                    terminator, i.e. if maxBytesToWrite=2, only the null terminator will be written and nothing else.
//                    maxBytesToWrite<2 does not write any bytes to the output, not even the null terminator.
// Returns the number of bytes written, EXCLUDING the null terminator.

function stringToUTF16(str, outPtr, maxBytesToWrite) {
  assert(outPtr % 2 == 0, 'Pointer passed to stringToUTF16 must be aligned to two bytes!');
  assert(typeof maxBytesToWrite == 'number', 'stringToUTF16(str, outPtr, maxBytesToWrite) is missing the third parameter that specifies the length of the output buffer!');
  // Backwards compatibility: if max bytes is not specified, assume unsafe unbounded write is allowed.
  if (maxBytesToWrite === undefined) {
    maxBytesToWrite = 0x7FFFFFFF;
  }
  if (maxBytesToWrite < 2) return 0;
  maxBytesToWrite -= 2; // Null terminator.
  var startPtr = outPtr;
  var numCharsToWrite = (maxBytesToWrite < str.length*2) ? (maxBytesToWrite / 2) : str.length;
  for (var i = 0; i < numCharsToWrite; ++i) {
    // charCodeAt returns a UTF-16 encoded code unit, so it can be directly written to the HEAP.
    var codeUnit = str.charCodeAt(i); // possibly a lead surrogate
    HEAP16[((outPtr)>>1)]=codeUnit;
    outPtr += 2;
  }
  // Null-terminate the pointer to the HEAP.
  HEAP16[((outPtr)>>1)]=0;
  return outPtr - startPtr;
}

// Returns the number of bytes the given Javascript string takes if encoded as a UTF16 byte array, EXCLUDING the null terminator byte.

function lengthBytesUTF16(str) {
  return str.length*2;
}

function UTF32ToString(ptr) {
  assert(ptr % 4 == 0, 'Pointer passed to UTF32ToString must be aligned to four bytes!');
  var i = 0;

  var str = '';
  while (1) {
    var utf32 = HEAP32[(((ptr)+(i*4))>>2)];
    if (utf32 == 0)
      return str;
    ++i;
    // Gotcha: fromCharCode constructs a character from a UTF-16 encoded code (pair), not from a Unicode code point! So encode the code point to UTF-16 for constructing.
    // See http://unicode.org/faq/utf_bom.html#utf16-3
    if (utf32 >= 0x10000) {
      var ch = utf32 - 0x10000;
      str += String.fromCharCode(0xD800 | (ch >> 10), 0xDC00 | (ch & 0x3FF));
    } else {
      str += String.fromCharCode(utf32);
    }
  }
}

// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in UTF32 form. The copy will require at most str.length*4+4 bytes of space in the HEAP.
// Use the function lengthBytesUTF32() to compute the exact number of bytes (excluding null terminator) that this function will write.
// Parameters:
//   str: the Javascript string to copy.
//   outPtr: Byte address in Emscripten HEAP where to write the string to.
//   maxBytesToWrite: The maximum number of bytes this function can write to the array. This count should include the null
//                    terminator, i.e. if maxBytesToWrite=4, only the null terminator will be written and nothing else.
//                    maxBytesToWrite<4 does not write any bytes to the output, not even the null terminator.
// Returns the number of bytes written, EXCLUDING the null terminator.

function stringToUTF32(str, outPtr, maxBytesToWrite) {
  assert(outPtr % 4 == 0, 'Pointer passed to stringToUTF32 must be aligned to four bytes!');
  assert(typeof maxBytesToWrite == 'number', 'stringToUTF32(str, outPtr, maxBytesToWrite) is missing the third parameter that specifies the length of the output buffer!');
  // Backwards compatibility: if max bytes is not specified, assume unsafe unbounded write is allowed.
  if (maxBytesToWrite === undefined) {
    maxBytesToWrite = 0x7FFFFFFF;
  }
  if (maxBytesToWrite < 4) return 0;
  var startPtr = outPtr;
  var endPtr = startPtr + maxBytesToWrite - 4;
  for (var i = 0; i < str.length; ++i) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! We must decode the string to UTF-32 to the heap.
    // See http://unicode.org/faq/utf_bom.html#utf16-3
    var codeUnit = str.charCodeAt(i); // possibly a lead surrogate
    if (codeUnit >= 0xD800 && codeUnit <= 0xDFFF) {
      var trailSurrogate = str.charCodeAt(++i);
      codeUnit = 0x10000 + ((codeUnit & 0x3FF) << 10) | (trailSurrogate & 0x3FF);
    }
    HEAP32[((outPtr)>>2)]=codeUnit;
    outPtr += 4;
    if (outPtr + 4 > endPtr) break;
  }
  // Null-terminate the pointer to the HEAP.
  HEAP32[((outPtr)>>2)]=0;
  return outPtr - startPtr;
}

// Returns the number of bytes the given Javascript string takes if encoded as a UTF16 byte array, EXCLUDING the null terminator byte.

function lengthBytesUTF32(str) {
  var len = 0;
  for (var i = 0; i < str.length; ++i) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! We must decode the string to UTF-32 to the heap.
    // See http://unicode.org/faq/utf_bom.html#utf16-3
    var codeUnit = str.charCodeAt(i);
    if (codeUnit >= 0xD800 && codeUnit <= 0xDFFF) ++i; // possibly a lead surrogate, so skip over the tail surrogate.
    len += 4;
  }

  return len;
}

// Allocate heap space for a JS string, and write it there.
// It is the responsibility of the caller to free() that memory.
function allocateUTF8(str) {
  var size = lengthBytesUTF8(str) + 1;
  var ret = _malloc(size);
  if (ret) stringToUTF8Array(str, HEAP8, ret, size);
  return ret;
}

// Allocate stack space for a JS string, and write it there.
function allocateUTF8OnStack(str) {
  var size = lengthBytesUTF8(str) + 1;
  var ret = stackAlloc(size);
  stringToUTF8Array(str, HEAP8, ret, size);
  return ret;
}

// Deprecated: This function should not be called because it is unsafe and does not provide
// a maximum length limit of how many bytes it is allowed to write. Prefer calling the
// function stringToUTF8Array() instead, which takes in a maximum length that can be used
// to be secure from out of bounds writes.
/** @deprecated */
function writeStringToMemory(string, buffer, dontAddNull) {
  warnOnce('writeStringToMemory is deprecated and should not be called! Use stringToUTF8() instead!');

  var /** @type {number} */ lastChar, /** @type {number} */ end;
  if (dontAddNull) {
    // stringToUTF8Array always appends null. If we don't want to do that, remember the
    // character that existed at the location where the null will be placed, and restore
    // that after the write (below).
    end = buffer + lengthBytesUTF8(string);
    lastChar = HEAP8[end];
  }
  stringToUTF8(string, buffer, Infinity);
  if (dontAddNull) HEAP8[end] = lastChar; // Restore the value under the null character.
}

function writeArrayToMemory(array, buffer) {
  assert(array.length >= 0, 'writeArrayToMemory array must have a length (should be an array or typed array)')
  HEAP8.set(array, buffer);
}

function writeAsciiToMemory(str, buffer, dontAddNull) {
  for (var i = 0; i < str.length; ++i) {
    assert(str.charCodeAt(i) === str.charCodeAt(i)&0xff);
    HEAP8[((buffer++)>>0)]=str.charCodeAt(i);
  }
  // Null-terminate the pointer to the HEAP.
  if (!dontAddNull) HEAP8[((buffer)>>0)]=0;
}





function demangle(func) {
  warnOnce('warning: build with  -s DEMANGLE_SUPPORT=1  to link in libcxxabi demangling');
  return func;
}

function demangleAll(text) {
  var regex =
    /__Z[\w\d_]+/g;
  return text.replace(regex,
    function(x) {
      var y = demangle(x);
      return x === y ? x : (y + ' [' + x + ']');
    });
}

function jsStackTrace() {
  var err = new Error();
  if (!err.stack) {
    // IE10+ special cases: It does have callstack info, but it is only populated if an Error object is thrown,
    // so try that as a special-case.
    try {
      throw new Error(0);
    } catch(e) {
      err = e;
    }
    if (!err.stack) {
      return '(no stack trace available)';
    }
  }
  return err.stack.toString();
}

function stackTrace() {
  var js = jsStackTrace();
  if (Module['extraStackTrace']) js += '\n' + Module['extraStackTrace']();
  return demangleAll(js);
}



// Memory management

var PAGE_SIZE = 16384;
var WASM_PAGE_SIZE = 65536;
var ASMJS_PAGE_SIZE = 16777216;

function alignUp(x, multiple) {
  if (x % multiple > 0) {
    x += multiple - (x % multiple);
  }
  return x;
}

var HEAP,
/** @type {ArrayBuffer} */
  buffer,
/** @type {Int8Array} */
  HEAP8,
/** @type {Uint8Array} */
  HEAPU8,
/** @type {Int16Array} */
  HEAP16,
/** @type {Uint16Array} */
  HEAPU16,
/** @type {Int32Array} */
  HEAP32,
/** @type {Uint32Array} */
  HEAPU32,
/** @type {Float32Array} */
  HEAPF32,
/** @type {Float64Array} */
  HEAPF64;

function updateGlobalBuffer(buf) {
  Module['buffer'] = buffer = buf;
}

function updateGlobalBufferViews() {
  Module['HEAP8'] = HEAP8 = new Int8Array(buffer);
  Module['HEAP16'] = HEAP16 = new Int16Array(buffer);
  Module['HEAP32'] = HEAP32 = new Int32Array(buffer);
  Module['HEAPU8'] = HEAPU8 = new Uint8Array(buffer);
  Module['HEAPU16'] = HEAPU16 = new Uint16Array(buffer);
  Module['HEAPU32'] = HEAPU32 = new Uint32Array(buffer);
  Module['HEAPF32'] = HEAPF32 = new Float32Array(buffer);
  Module['HEAPF64'] = HEAPF64 = new Float64Array(buffer);
}


var STATIC_BASE = 1024,
    STACK_BASE = 154816,
    STACKTOP = STACK_BASE,
    STACK_MAX = 5397696,
    DYNAMIC_BASE = 5397696,
    DYNAMICTOP_PTR = 154560;

assert(STACK_BASE % 16 === 0, 'stack must start aligned');
assert(DYNAMIC_BASE % 16 === 0, 'heap must start aligned');



var TOTAL_STACK = 5242880;
if (Module['TOTAL_STACK']) assert(TOTAL_STACK === Module['TOTAL_STACK'], 'the stack size can no longer be determined at runtime')

var TOTAL_MEMORY = Module['TOTAL_MEMORY'] || 16777216;
if (TOTAL_MEMORY < TOTAL_STACK) err('TOTAL_MEMORY should be larger than TOTAL_STACK, was ' + TOTAL_MEMORY + '! (TOTAL_STACK=' + TOTAL_STACK + ')');

// Initialize the runtime's memory
// check for full engine support (use string 'subarray' to avoid closure compiler confusion)
assert(typeof Int32Array !== 'undefined' && typeof Float64Array !== 'undefined' && Int32Array.prototype.subarray !== undefined && Int32Array.prototype.set !== undefined,
       'JS engine does not provide full typed array support');







// Use a provided buffer, if there is one, or else allocate a new one
if (Module['buffer']) {
  buffer = Module['buffer'];
  assert(buffer.byteLength === TOTAL_MEMORY, 'provided buffer should be ' + TOTAL_MEMORY + ' bytes, but it is ' + buffer.byteLength);
} else {
  // Use a WebAssembly memory where available
  if (typeof WebAssembly === 'object' && typeof WebAssembly.Memory === 'function') {
    assert(TOTAL_MEMORY % WASM_PAGE_SIZE === 0);
    wasmMemory = new WebAssembly.Memory({ 'initial': TOTAL_MEMORY / WASM_PAGE_SIZE, 'maximum': TOTAL_MEMORY / WASM_PAGE_SIZE });
    buffer = wasmMemory.buffer;
  } else
  {
    buffer = new ArrayBuffer(TOTAL_MEMORY);
  }
  assert(buffer.byteLength === TOTAL_MEMORY);
  Module['buffer'] = buffer;
}
updateGlobalBufferViews();


HEAP32[DYNAMICTOP_PTR>>2] = DYNAMIC_BASE;


// Initializes the stack cookie. Called at the startup of main and at the startup of each thread in pthreads mode.
function writeStackCookie() {
  assert((STACK_MAX & 3) == 0);
  HEAPU32[(STACK_MAX >> 2)-1] = 0x02135467;
  HEAPU32[(STACK_MAX >> 2)-2] = 0x89BACDFE;
}

function checkStackCookie() {
  if (HEAPU32[(STACK_MAX >> 2)-1] != 0x02135467 || HEAPU32[(STACK_MAX >> 2)-2] != 0x89BACDFE) {
    abort('Stack overflow! Stack cookie has been overwritten, expected hex dwords 0x89BACDFE and 0x02135467, but received 0x' + HEAPU32[(STACK_MAX >> 2)-2].toString(16) + ' ' + HEAPU32[(STACK_MAX >> 2)-1].toString(16));
  }
  // Also test the global address 0 for integrity.
  if (HEAP32[0] !== 0x63736d65 /* 'emsc' */) throw 'Runtime error: The application has corrupted its heap memory area (address zero)!';
}

function abortStackOverflow(allocSize) {
  abort('Stack overflow! Attempted to allocate ' + allocSize + ' bytes on the stack, but stack has only ' + (STACK_MAX - stackSave() + allocSize) + ' bytes available!');
}


  HEAP32[0] = 0x63736d65; /* 'emsc' */



// Endianness check (note: assumes compiler arch was little-endian)
HEAP16[1] = 0x6373;
if (HEAPU8[2] !== 0x73 || HEAPU8[3] !== 0x63) throw 'Runtime error: expected the system to be little-endian!';

function callRuntimeCallbacks(callbacks) {
  while(callbacks.length > 0) {
    var callback = callbacks.shift();
    if (typeof callback == 'function') {
      callback();
      continue;
    }
    var func = callback.func;
    if (typeof func === 'number') {
      if (callback.arg === undefined) {
        Module['dynCall_v'](func);
      } else {
        Module['dynCall_vi'](func, callback.arg);
      }
    } else {
      func(callback.arg === undefined ? null : callback.arg);
    }
  }
}

var __ATPRERUN__  = []; // functions called before the runtime is initialized
var __ATINIT__    = []; // functions called during startup
var __ATMAIN__    = []; // functions called when main() is to be run
var __ATEXIT__    = []; // functions called during shutdown
var __ATPOSTRUN__ = []; // functions called after the main() is called

var runtimeInitialized = false;
var runtimeExited = false;


function preRun() {
  // compatibility - merge in anything from Module['preRun'] at this time
  if (Module['preRun']) {
    if (typeof Module['preRun'] == 'function') Module['preRun'] = [Module['preRun']];
    while (Module['preRun'].length) {
      addOnPreRun(Module['preRun'].shift());
    }
  }
  callRuntimeCallbacks(__ATPRERUN__);
}

function ensureInitRuntime() {
  checkStackCookie();
  if (runtimeInitialized) return;
  runtimeInitialized = true;
  if (!Module["noFSInit"] && !FS.init.initialized) FS.init();
TTY.init();
  callRuntimeCallbacks(__ATINIT__);
}

function preMain() {
  checkStackCookie();
  FS.ignorePermissions = false;
  callRuntimeCallbacks(__ATMAIN__);
}

function exitRuntime() {
  checkStackCookie();
  runtimeExited = true;
}

function postRun() {
  checkStackCookie();
  // compatibility - merge in anything from Module['postRun'] at this time
  if (Module['postRun']) {
    if (typeof Module['postRun'] == 'function') Module['postRun'] = [Module['postRun']];
    while (Module['postRun'].length) {
      addOnPostRun(Module['postRun'].shift());
    }
  }
  callRuntimeCallbacks(__ATPOSTRUN__);
}

function addOnPreRun(cb) {
  __ATPRERUN__.unshift(cb);
}

function addOnInit(cb) {
  __ATINIT__.unshift(cb);
}

function addOnPreMain(cb) {
  __ATMAIN__.unshift(cb);
}

function addOnExit(cb) {
}

function addOnPostRun(cb) {
  __ATPOSTRUN__.unshift(cb);
}

function unSign(value, bits, ignore) {
  if (value >= 0) {
    return value;
  }
  return bits <= 32 ? 2*Math.abs(1 << (bits-1)) + value // Need some trickery, since if bits == 32, we are right at the limit of the bits JS uses in bitshifts
                    : Math.pow(2, bits)         + value;
}
function reSign(value, bits, ignore) {
  if (value <= 0) {
    return value;
  }
  var half = bits <= 32 ? Math.abs(1 << (bits-1)) // abs is needed if bits == 32
                        : Math.pow(2, bits-1);
  if (value >= half && (bits <= 32 || value > half)) { // for huge values, we can hit the precision limit and always get true here. so don't do that
                                                       // but, in general there is no perfect solution here. With 64-bit ints, we get rounding and errors
                                                       // TODO: In i64 mode 1, resign the two parts separately and safely
    value = -2*half + value; // Cannot bitshift half, as it may be at the limit of the bits JS uses in bitshifts
  }
  return value;
}


assert(Math.imul, 'This browser does not support Math.imul(), build with LEGACY_VM_SUPPORT or POLYFILL_OLD_MATH_FUNCTIONS to add in a polyfill');
assert(Math.fround, 'This browser does not support Math.fround(), build with LEGACY_VM_SUPPORT or POLYFILL_OLD_MATH_FUNCTIONS to add in a polyfill');
assert(Math.clz32, 'This browser does not support Math.clz32(), build with LEGACY_VM_SUPPORT or POLYFILL_OLD_MATH_FUNCTIONS to add in a polyfill');
assert(Math.trunc, 'This browser does not support Math.trunc(), build with LEGACY_VM_SUPPORT or POLYFILL_OLD_MATH_FUNCTIONS to add in a polyfill');

var Math_abs = Math.abs;
var Math_cos = Math.cos;
var Math_sin = Math.sin;
var Math_tan = Math.tan;
var Math_acos = Math.acos;
var Math_asin = Math.asin;
var Math_atan = Math.atan;
var Math_atan2 = Math.atan2;
var Math_exp = Math.exp;
var Math_log = Math.log;
var Math_sqrt = Math.sqrt;
var Math_ceil = Math.ceil;
var Math_floor = Math.floor;
var Math_pow = Math.pow;
var Math_imul = Math.imul;
var Math_fround = Math.fround;
var Math_round = Math.round;
var Math_min = Math.min;
var Math_max = Math.max;
var Math_clz32 = Math.clz32;
var Math_trunc = Math.trunc;



// A counter of dependencies for calling run(). If we need to
// do asynchronous work before running, increment this and
// decrement it. Incrementing must happen in a place like
// Module.preRun (used by emcc to add file preloading).
// Note that you can add dependencies in preRun, even though
// it happens right before run - run will be postponed until
// the dependencies are met.
var runDependencies = 0;
var runDependencyWatcher = null;
var dependenciesFulfilled = null; // overridden to take different actions when all run dependencies are fulfilled
var runDependencyTracking = {};

function getUniqueRunDependency(id) {
  var orig = id;
  while (1) {
    if (!runDependencyTracking[id]) return id;
    id = orig + Math.random();
  }
  return id;
}

function addRunDependency(id) {
  runDependencies++;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
  if (id) {
    assert(!runDependencyTracking[id]);
    runDependencyTracking[id] = 1;
    if (runDependencyWatcher === null && typeof setInterval !== 'undefined') {
      // Check for missing dependencies every few seconds
      runDependencyWatcher = setInterval(function() {
        if (ABORT) {
          clearInterval(runDependencyWatcher);
          runDependencyWatcher = null;
          return;
        }
        var shown = false;
        for (var dep in runDependencyTracking) {
          if (!shown) {
            shown = true;
            err('still waiting on run dependencies:');
          }
          err('dependency: ' + dep);
        }
        if (shown) {
          err('(end of list)');
        }
      }, 10000);
    }
  } else {
    err('warning: run dependency added without ID');
  }
}

function removeRunDependency(id) {
  runDependencies--;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
  if (id) {
    assert(runDependencyTracking[id]);
    delete runDependencyTracking[id];
  } else {
    err('warning: run dependency removed without ID');
  }
  if (runDependencies == 0) {
    if (runDependencyWatcher !== null) {
      clearInterval(runDependencyWatcher);
      runDependencyWatcher = null;
    }
    if (dependenciesFulfilled) {
      var callback = dependenciesFulfilled;
      dependenciesFulfilled = null;
      callback(); // can add another dependenciesFulfilled
    }
  }
}

Module["preloadedImages"] = {}; // maps url to image data
Module["preloadedAudios"] = {}; // maps url to audio data


var memoryInitializer = null;






// Copyright 2017 The Emscripten Authors.  All rights reserved.
// Emscripten is available under two separate licenses, the MIT license and the
// University of Illinois/NCSA Open Source License.  Both these licenses can be
// found in the LICENSE file.

// Prefix of data URIs emitted by SINGLE_FILE and related options.
var dataURIPrefix = 'data:application/octet-stream;base64,';

// Indicates whether filename is a base64 data URI.
function isDataURI(filename) {
  return String.prototype.startsWith ?
      filename.startsWith(dataURIPrefix) :
      filename.indexOf(dataURIPrefix) === 0;
}




var wasmBinaryFile = 'aac-enc.wasm';
if (!isDataURI(wasmBinaryFile)) {
  wasmBinaryFile = locateFile(wasmBinaryFile);
}

function getBinary() {
  try {
    if (Module['wasmBinary']) {
      return new Uint8Array(Module['wasmBinary']);
    }
    if (Module['readBinary']) {
      return Module['readBinary'](wasmBinaryFile);
    } else {
      throw "both async and sync fetching of the wasm failed";
    }
  }
  catch (err) {
    abort(err);
  }
}

function getBinaryPromise() {
  // if we don't have the binary yet, and have the Fetch api, use that
  // in some environments, like Electron's render process, Fetch api may be present, but have a different context than expected, let's only use it on the Web
  if (!Module['wasmBinary'] && (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) && typeof fetch === 'function') {
    return fetch(wasmBinaryFile, { credentials: 'same-origin' }).then(function(response) {
      if (!response['ok']) {
        throw "failed to load wasm binary file at '" + wasmBinaryFile + "'";
      }
      return response['arrayBuffer']();
    }).catch(function () {
      return getBinary();
    });
  }
  // Otherwise, getBinary should be able to get it synchronously
  return new Promise(function(resolve, reject) {
    resolve(getBinary());
  });
}

// Create the wasm instance.
// Receives the wasm imports, returns the exports.
function createWasm(env) {
  // prepare imports
  var info = {
    'env': env
    ,
    'global': {
      'NaN': NaN,
      'Infinity': Infinity
    },
    'global.Math': Math,
    'asm2wasm': asm2wasmImports
  };
  // Load the wasm module and create an instance of using native support in the JS engine.
  // handle a generated wasm instance, receiving its exports and
  // performing other necessary setup
  function receiveInstance(instance, module) {
    var exports = instance.exports;
    Module['asm'] = exports;
    removeRunDependency('wasm-instantiate');
  }
  addRunDependency('wasm-instantiate');

  // User shell pages can write their own Module.instantiateWasm = function(imports, successCallback) callback
  // to manually instantiate the Wasm module themselves. This allows pages to run the instantiation parallel
  // to any other async startup actions they are performing.
  if (Module['instantiateWasm']) {
    try {
      return Module['instantiateWasm'](info, receiveInstance);
    } catch(e) {
      err('Module.instantiateWasm callback failed with error: ' + e);
      return false;
    }
  }

  // Async compilation can be confusing when an error on the page overwrites Module
  // (for example, if the order of elements is wrong, and the one defining Module is
  // later), so we save Module and check it later.
  var trueModule = Module;
  function receiveInstantiatedSource(output) {
    // 'output' is a WebAssemblyInstantiatedSource object which has both the module and instance.
    // receiveInstance() will swap in the exports (to Module.asm) so they can be called
    assert(Module === trueModule, 'the Module object should not be replaced during async compilation - perhaps the order of HTML elements is wrong?');
    trueModule = null;
      // TODO: Due to Closure regression https://github.com/google/closure-compiler/issues/3193, the above line no longer optimizes out down to the following line.
      // When the regression is fixed, can restore the above USE_PTHREADS-enabled path.
    receiveInstance(output['instance']);
  }
  function instantiateArrayBuffer(receiver) {
    getBinaryPromise().then(function(binary) {
      return WebAssembly.instantiate(binary, info);
    }).then(receiver, function(reason) {
      err('failed to asynchronously prepare wasm: ' + reason);
      abort(reason);
    });
  }
  // Prefer streaming instantiation if available.
  if (!Module['wasmBinary'] &&
      typeof WebAssembly.instantiateStreaming === 'function' &&
      !isDataURI(wasmBinaryFile) &&
      typeof fetch === 'function') {
    WebAssembly.instantiateStreaming(fetch(wasmBinaryFile, { credentials: 'same-origin' }), info)
      .then(receiveInstantiatedSource, function(reason) {
        // We expect the most common failure cause to be a bad MIME type for the binary,
        // in which case falling back to ArrayBuffer instantiation should work.
        err('wasm streaming compile failed: ' + reason);
        err('falling back to ArrayBuffer instantiation');
        instantiateArrayBuffer(receiveInstantiatedSource);
      });
  } else {
    instantiateArrayBuffer(receiveInstantiatedSource);
  }
  return {}; // no exports yet; we'll fill them in later
}

// Provide an "asm.js function" for the application, called to "link" the asm.js module. We instantiate
// the wasm module at that time, and it receives imports and provides exports and so forth, the app
// doesn't need to care that it is wasm or asm.js.

Module['asm'] = function(global, env, providedBuffer) {
  // memory was already allocated (so js could use the buffer)
  env['memory'] = wasmMemory
  ;
  // import table
  env['table'] = wasmTable = new WebAssembly.Table({
    'initial': 104,
    'maximum': 104,
    'element': 'anyfunc'
  });
  env['__memory_base'] = 1024; // tell the memory segments where to place themselves
  env['__table_base'] = 0; // table starts at 0 by default (even in dynamic linking, for the main module)

  var exports = createWasm(env);
  assert(exports, 'binaryen setup failed (no wasm support?)');
  return exports;
};

// === Body ===

var ASM_CONSTS = [];





// STATICTOP = STATIC_BASE + 153792;
/* global initializers */ /*__ATINIT__.push();*/








/* no memory initializer */
var tempDoublePtr = 154800
assert(tempDoublePtr % 8 == 0);

function copyTempFloat(ptr) { // functions, because inlining this code increases code size too much
  HEAP8[tempDoublePtr] = HEAP8[ptr];
  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];
  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];
  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];
}

function copyTempDouble(ptr) {
  HEAP8[tempDoublePtr] = HEAP8[ptr];
  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];
  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];
  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];
  HEAP8[tempDoublePtr+4] = HEAP8[ptr+4];
  HEAP8[tempDoublePtr+5] = HEAP8[ptr+5];
  HEAP8[tempDoublePtr+6] = HEAP8[ptr+6];
  HEAP8[tempDoublePtr+7] = HEAP8[ptr+7];
}

// {{PRE_LIBRARY}}


  function ___lock() {}
  Module["___lock"] = ___lock;

  
  
  
  function ___setErrNo(value) {
      if (Module['___errno_location']) HEAP32[((Module['___errno_location']())>>2)]=value;
      else err('failed to set errno from JS');
      return value;
    }
  Module["___setErrNo"] = ___setErrNo;
  
  var PATH={splitPath:function (filename) {
        var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
        return splitPathRe.exec(filename).slice(1);
      },normalizeArray:function (parts, allowAboveRoot) {
        // if the path tries to go above the root, `up` ends up > 0
        var up = 0;
        for (var i = parts.length - 1; i >= 0; i--) {
          var last = parts[i];
          if (last === '.') {
            parts.splice(i, 1);
          } else if (last === '..') {
            parts.splice(i, 1);
            up++;
          } else if (up) {
            parts.splice(i, 1);
            up--;
          }
        }
        // if the path is allowed to go above the root, restore leading ..s
        if (allowAboveRoot) {
          for (; up; up--) {
            parts.unshift('..');
          }
        }
        return parts;
      },normalize:function (path) {
        var isAbsolute = path.charAt(0) === '/',
            trailingSlash = path.substr(-1) === '/';
        // Normalize the path
        path = PATH.normalizeArray(path.split('/').filter(function(p) {
          return !!p;
        }), !isAbsolute).join('/');
        if (!path && !isAbsolute) {
          path = '.';
        }
        if (path && trailingSlash) {
          path += '/';
        }
        return (isAbsolute ? '/' : '') + path;
      },dirname:function (path) {
        var result = PATH.splitPath(path),
            root = result[0],
            dir = result[1];
        if (!root && !dir) {
          // No dirname whatsoever
          return '.';
        }
        if (dir) {
          // It has a dirname, strip trailing slash
          dir = dir.substr(0, dir.length - 1);
        }
        return root + dir;
      },basename:function (path) {
        // EMSCRIPTEN return '/'' for '/', not an empty string
        if (path === '/') return '/';
        var lastSlash = path.lastIndexOf('/');
        if (lastSlash === -1) return path;
        return path.substr(lastSlash+1);
      },extname:function (path) {
        return PATH.splitPath(path)[3];
      },join:function () {
        var paths = Array.prototype.slice.call(arguments, 0);
        return PATH.normalize(paths.join('/'));
      },join2:function (l, r) {
        return PATH.normalize(l + '/' + r);
      },resolve:function () {
        var resolvedPath = '',
          resolvedAbsolute = false;
        for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
          var path = (i >= 0) ? arguments[i] : FS.cwd();
          // Skip empty and invalid entries
          if (typeof path !== 'string') {
            throw new TypeError('Arguments to path.resolve must be strings');
          } else if (!path) {
            return ''; // an invalid portion invalidates the whole thing
          }
          resolvedPath = path + '/' + resolvedPath;
          resolvedAbsolute = path.charAt(0) === '/';
        }
        // At this point the path should be resolved to a full absolute path, but
        // handle relative paths to be safe (might happen when process.cwd() fails)
        resolvedPath = PATH.normalizeArray(resolvedPath.split('/').filter(function(p) {
          return !!p;
        }), !resolvedAbsolute).join('/');
        return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
      },relative:function (from, to) {
        from = PATH.resolve(from).substr(1);
        to = PATH.resolve(to).substr(1);
        function trim(arr) {
          var start = 0;
          for (; start < arr.length; start++) {
            if (arr[start] !== '') break;
          }
          var end = arr.length - 1;
          for (; end >= 0; end--) {
            if (arr[end] !== '') break;
          }
          if (start > end) return [];
          return arr.slice(start, end - start + 1);
        }
        var fromParts = trim(from.split('/'));
        var toParts = trim(to.split('/'));
        var length = Math.min(fromParts.length, toParts.length);
        var samePartsLength = length;
        for (var i = 0; i < length; i++) {
          if (fromParts[i] !== toParts[i]) {
            samePartsLength = i;
            break;
          }
        }
        var outputParts = [];
        for (var i = samePartsLength; i < fromParts.length; i++) {
          outputParts.push('..');
        }
        outputParts = outputParts.concat(toParts.slice(samePartsLength));
        return outputParts.join('/');
      }};
  Module["PATH"] = PATH;
  
  var TTY={ttys:[],init:function () {
        // https://github.com/emscripten-core/emscripten/pull/1555
        // if (ENVIRONMENT_IS_NODE) {
        //   // currently, FS.init does not distinguish if process.stdin is a file or TTY
        //   // device, it always assumes it's a TTY device. because of this, we're forcing
        //   // process.stdin to UTF8 encoding to at least make stdin reading compatible
        //   // with text files until FS.init can be refactored.
        //   process['stdin']['setEncoding']('utf8');
        // }
      },shutdown:function () {
        // https://github.com/emscripten-core/emscripten/pull/1555
        // if (ENVIRONMENT_IS_NODE) {
        //   // inolen: any idea as to why node -e 'process.stdin.read()' wouldn't exit immediately (with process.stdin being a tty)?
        //   // isaacs: because now it's reading from the stream, you've expressed interest in it, so that read() kicks off a _read() which creates a ReadReq operation
        //   // inolen: I thought read() in that case was a synchronous operation that just grabbed some amount of buffered data if it exists?
        //   // isaacs: it is. but it also triggers a _read() call, which calls readStart() on the handle
        //   // isaacs: do process.stdin.pause() and i'd think it'd probably close the pending call
        //   process['stdin']['pause']();
        // }
      },register:function (dev, ops) {
        TTY.ttys[dev] = { input: [], output: [], ops: ops };
        FS.registerDevice(dev, TTY.stream_ops);
      },stream_ops:{open:function (stream) {
          var tty = TTY.ttys[stream.node.rdev];
          if (!tty) {
            throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
          }
          stream.tty = tty;
          stream.seekable = false;
        },close:function (stream) {
          // flush any pending line data
          stream.tty.ops.flush(stream.tty);
        },flush:function (stream) {
          stream.tty.ops.flush(stream.tty);
        },read:function (stream, buffer, offset, length, pos /* ignored */) {
          if (!stream.tty || !stream.tty.ops.get_char) {
            throw new FS.ErrnoError(ERRNO_CODES.ENXIO);
          }
          var bytesRead = 0;
          for (var i = 0; i < length; i++) {
            var result;
            try {
              result = stream.tty.ops.get_char(stream.tty);
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
            if (result === undefined && bytesRead === 0) {
              throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
            }
            if (result === null || result === undefined) break;
            bytesRead++;
            buffer[offset+i] = result;
          }
          if (bytesRead) {
            stream.node.timestamp = Date.now();
          }
          return bytesRead;
        },write:function (stream, buffer, offset, length, pos) {
          if (!stream.tty || !stream.tty.ops.put_char) {
            throw new FS.ErrnoError(ERRNO_CODES.ENXIO);
          }
          try {
            for (var i = 0; i < length; i++) {
              stream.tty.ops.put_char(stream.tty, buffer[offset+i]);
            }
          } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES.EIO);
          }
          if (length) {
            stream.node.timestamp = Date.now();
          }
          return i;
        }},default_tty_ops:{get_char:function (tty) {
          if (!tty.input.length) {
            var result = null;
            if (ENVIRONMENT_IS_NODE) {
              // we will read data by chunks of BUFSIZE
              var BUFSIZE = 256;
              var buf = new Buffer(BUFSIZE);
              var bytesRead = 0;
  
              var isPosixPlatform = (process.platform != 'win32'); // Node doesn't offer a direct check, so test by exclusion
  
              var fd = process.stdin.fd;
              if (isPosixPlatform) {
                // Linux and Mac cannot use process.stdin.fd (which isn't set up as sync)
                var usingDevice = false;
                try {
                  fd = fs.openSync('/dev/stdin', 'r');
                  usingDevice = true;
                } catch (e) {}
              }
  
              try {
                bytesRead = fs.readSync(fd, buf, 0, BUFSIZE, null);
              } catch(e) {
                // Cross-platform differences: on Windows, reading EOF throws an exception, but on other OSes,
                // reading EOF returns 0. Uniformize behavior by treating the EOF exception to return 0.
                if (e.toString().indexOf('EOF') != -1) bytesRead = 0;
                else throw e;
              }
  
              if (usingDevice) { fs.closeSync(fd); }
              if (bytesRead > 0) {
                result = buf.slice(0, bytesRead).toString('utf-8');
              } else {
                result = null;
              }
            } else
            if (typeof window != 'undefined' &&
              typeof window.prompt == 'function') {
              // Browser.
              result = window.prompt('Input: ');  // returns null on cancel
              if (result !== null) {
                result += '\n';
              }
            } else if (typeof readline == 'function') {
              // Command line.
              result = readline();
              if (result !== null) {
                result += '\n';
              }
            }
            if (!result) {
              return null;
            }
            tty.input = intArrayFromString(result, true);
          }
          return tty.input.shift();
        },put_char:function (tty, val) {
          if (val === null || val === 10) {
            out(UTF8ArrayToString(tty.output, 0));
            tty.output = [];
          } else {
            if (val != 0) tty.output.push(val); // val == 0 would cut text output off in the middle.
          }
        },flush:function (tty) {
          if (tty.output && tty.output.length > 0) {
            out(UTF8ArrayToString(tty.output, 0));
            tty.output = [];
          }
        }},default_tty1_ops:{put_char:function (tty, val) {
          if (val === null || val === 10) {
            err(UTF8ArrayToString(tty.output, 0));
            tty.output = [];
          } else {
            if (val != 0) tty.output.push(val);
          }
        },flush:function (tty) {
          if (tty.output && tty.output.length > 0) {
            err(UTF8ArrayToString(tty.output, 0));
            tty.output = [];
          }
        }}};
  Module["TTY"] = TTY;
  
  var MEMFS={ops_table:null,mount:function (mount) {
        return MEMFS.createNode(null, '/', 16384 | 511 /* 0777 */, 0);
      },createNode:function (parent, name, mode, dev) {
        if (FS.isBlkdev(mode) || FS.isFIFO(mode)) {
          // no supported
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (!MEMFS.ops_table) {
          MEMFS.ops_table = {
            dir: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr,
                lookup: MEMFS.node_ops.lookup,
                mknod: MEMFS.node_ops.mknod,
                rename: MEMFS.node_ops.rename,
                unlink: MEMFS.node_ops.unlink,
                rmdir: MEMFS.node_ops.rmdir,
                readdir: MEMFS.node_ops.readdir,
                symlink: MEMFS.node_ops.symlink
              },
              stream: {
                llseek: MEMFS.stream_ops.llseek
              }
            },
            file: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr
              },
              stream: {
                llseek: MEMFS.stream_ops.llseek,
                read: MEMFS.stream_ops.read,
                write: MEMFS.stream_ops.write,
                allocate: MEMFS.stream_ops.allocate,
                mmap: MEMFS.stream_ops.mmap,
                msync: MEMFS.stream_ops.msync
              }
            },
            link: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr,
                readlink: MEMFS.node_ops.readlink
              },
              stream: {}
            },
            chrdev: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr
              },
              stream: FS.chrdev_stream_ops
            }
          };
        }
        var node = FS.createNode(parent, name, mode, dev);
        if (FS.isDir(node.mode)) {
          node.node_ops = MEMFS.ops_table.dir.node;
          node.stream_ops = MEMFS.ops_table.dir.stream;
          node.contents = {};
        } else if (FS.isFile(node.mode)) {
          node.node_ops = MEMFS.ops_table.file.node;
          node.stream_ops = MEMFS.ops_table.file.stream;
          node.usedBytes = 0; // The actual number of bytes used in the typed array, as opposed to contents.length which gives the whole capacity.
          // When the byte data of the file is populated, this will point to either a typed array, or a normal JS array. Typed arrays are preferred
          // for performance, and used by default. However, typed arrays are not resizable like normal JS arrays are, so there is a small disk size
          // penalty involved for appending file writes that continuously grow a file similar to std::vector capacity vs used -scheme.
          node.contents = null; 
        } else if (FS.isLink(node.mode)) {
          node.node_ops = MEMFS.ops_table.link.node;
          node.stream_ops = MEMFS.ops_table.link.stream;
        } else if (FS.isChrdev(node.mode)) {
          node.node_ops = MEMFS.ops_table.chrdev.node;
          node.stream_ops = MEMFS.ops_table.chrdev.stream;
        }
        node.timestamp = Date.now();
        // add the new node to the parent
        if (parent) {
          parent.contents[name] = node;
        }
        return node;
      },getFileDataAsRegularArray:function (node) {
        if (node.contents && node.contents.subarray) {
          var arr = [];
          for (var i = 0; i < node.usedBytes; ++i) arr.push(node.contents[i]);
          return arr; // Returns a copy of the original data.
        }
        return node.contents; // No-op, the file contents are already in a JS array. Return as-is.
      },getFileDataAsTypedArray:function (node) {
        if (!node.contents) return new Uint8Array;
        if (node.contents.subarray) return node.contents.subarray(0, node.usedBytes); // Make sure to not return excess unused bytes.
        return new Uint8Array(node.contents);
      },expandFileStorage:function (node, newCapacity) {
        var prevCapacity = node.contents ? node.contents.length : 0;
        if (prevCapacity >= newCapacity) return; // No need to expand, the storage was already large enough.
        // Don't expand strictly to the given requested limit if it's only a very small increase, but instead geometrically grow capacity.
        // For small filesizes (<1MB), perform size*2 geometric increase, but for large sizes, do a much more conservative size*1.125 increase to
        // avoid overshooting the allocation cap by a very large margin.
        var CAPACITY_DOUBLING_MAX = 1024 * 1024;
        newCapacity = Math.max(newCapacity, (prevCapacity * (prevCapacity < CAPACITY_DOUBLING_MAX ? 2.0 : 1.125)) | 0);
        if (prevCapacity != 0) newCapacity = Math.max(newCapacity, 256); // At minimum allocate 256b for each file when expanding.
        var oldContents = node.contents;
        node.contents = new Uint8Array(newCapacity); // Allocate new storage.
        if (node.usedBytes > 0) node.contents.set(oldContents.subarray(0, node.usedBytes), 0); // Copy old data over to the new storage.
        return;
      },resizeFileStorage:function (node, newSize) {
        if (node.usedBytes == newSize) return;
        if (newSize == 0) {
          node.contents = null; // Fully decommit when requesting a resize to zero.
          node.usedBytes = 0;
          return;
        }
        if (!node.contents || node.contents.subarray) { // Resize a typed array if that is being used as the backing store.
          var oldContents = node.contents;
          node.contents = new Uint8Array(new ArrayBuffer(newSize)); // Allocate new storage.
          if (oldContents) {
            node.contents.set(oldContents.subarray(0, Math.min(newSize, node.usedBytes))); // Copy old data over to the new storage.
          }
          node.usedBytes = newSize;
          return;
        }
        // Backing with a JS array.
        if (!node.contents) node.contents = [];
        if (node.contents.length > newSize) node.contents.length = newSize;
        else while (node.contents.length < newSize) node.contents.push(0);
        node.usedBytes = newSize;
      },node_ops:{getattr:function (node) {
          var attr = {};
          // device numbers reuse inode numbers.
          attr.dev = FS.isChrdev(node.mode) ? node.id : 1;
          attr.ino = node.id;
          attr.mode = node.mode;
          attr.nlink = 1;
          attr.uid = 0;
          attr.gid = 0;
          attr.rdev = node.rdev;
          if (FS.isDir(node.mode)) {
            attr.size = 4096;
          } else if (FS.isFile(node.mode)) {
            attr.size = node.usedBytes;
          } else if (FS.isLink(node.mode)) {
            attr.size = node.link.length;
          } else {
            attr.size = 0;
          }
          attr.atime = new Date(node.timestamp);
          attr.mtime = new Date(node.timestamp);
          attr.ctime = new Date(node.timestamp);
          // NOTE: In our implementation, st_blocks = Math.ceil(st_size/st_blksize),
          //       but this is not required by the standard.
          attr.blksize = 4096;
          attr.blocks = Math.ceil(attr.size / attr.blksize);
          return attr;
        },setattr:function (node, attr) {
          if (attr.mode !== undefined) {
            node.mode = attr.mode;
          }
          if (attr.timestamp !== undefined) {
            node.timestamp = attr.timestamp;
          }
          if (attr.size !== undefined) {
            MEMFS.resizeFileStorage(node, attr.size);
          }
        },lookup:function (parent, name) {
          throw FS.genericErrors[ERRNO_CODES.ENOENT];
        },mknod:function (parent, name, mode, dev) {
          return MEMFS.createNode(parent, name, mode, dev);
        },rename:function (old_node, new_dir, new_name) {
          // if we're overwriting a directory at new_name, make sure it's empty.
          if (FS.isDir(old_node.mode)) {
            var new_node;
            try {
              new_node = FS.lookupNode(new_dir, new_name);
            } catch (e) {
            }
            if (new_node) {
              for (var i in new_node.contents) {
                throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
              }
            }
          }
          // do the internal rewiring
          delete old_node.parent.contents[old_node.name];
          old_node.name = new_name;
          new_dir.contents[new_name] = old_node;
          old_node.parent = new_dir;
        },unlink:function (parent, name) {
          delete parent.contents[name];
        },rmdir:function (parent, name) {
          var node = FS.lookupNode(parent, name);
          for (var i in node.contents) {
            throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
          }
          delete parent.contents[name];
        },readdir:function (node) {
          var entries = ['.', '..']
          for (var key in node.contents) {
            if (!node.contents.hasOwnProperty(key)) {
              continue;
            }
            entries.push(key);
          }
          return entries;
        },symlink:function (parent, newname, oldpath) {
          var node = MEMFS.createNode(parent, newname, 511 /* 0777 */ | 40960, 0);
          node.link = oldpath;
          return node;
        },readlink:function (node) {
          if (!FS.isLink(node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          return node.link;
        }},stream_ops:{read:function (stream, buffer, offset, length, position) {
          var contents = stream.node.contents;
          if (position >= stream.node.usedBytes) return 0;
          var size = Math.min(stream.node.usedBytes - position, length);
          assert(size >= 0);
          if (size > 8 && contents.subarray) { // non-trivial, and typed array
            buffer.set(contents.subarray(position, position + size), offset);
          } else {
            for (var i = 0; i < size; i++) buffer[offset + i] = contents[position + i];
          }
          return size;
        },write:function (stream, buffer, offset, length, position, canOwn) {
  
          if (!length) return 0;
          var node = stream.node;
          node.timestamp = Date.now();
  
          if (buffer.subarray && (!node.contents || node.contents.subarray)) { // This write is from a typed array to a typed array?
            if (canOwn) {
              assert(position === 0, 'canOwn must imply no weird position inside the file');
              node.contents = buffer.subarray(offset, offset + length);
              node.usedBytes = length;
              return length;
            } else if (node.usedBytes === 0 && position === 0) { // If this is a simple first write to an empty file, do a fast set since we don't need to care about old data.
              node.contents = new Uint8Array(buffer.subarray(offset, offset + length));
              node.usedBytes = length;
              return length;
            } else if (position + length <= node.usedBytes) { // Writing to an already allocated and used subrange of the file?
              node.contents.set(buffer.subarray(offset, offset + length), position);
              return length;
            }
          }
  
          // Appending to an existing file and we need to reallocate, or source data did not come as a typed array.
          MEMFS.expandFileStorage(node, position+length);
          if (node.contents.subarray && buffer.subarray) node.contents.set(buffer.subarray(offset, offset + length), position); // Use typed array write if available.
          else {
            for (var i = 0; i < length; i++) {
             node.contents[position + i] = buffer[offset + i]; // Or fall back to manual write if not.
            }
          }
          node.usedBytes = Math.max(node.usedBytes, position+length);
          return length;
        },llseek:function (stream, offset, whence) {
          var position = offset;
          if (whence === 1) {  // SEEK_CUR.
            position += stream.position;
          } else if (whence === 2) {  // SEEK_END.
            if (FS.isFile(stream.node.mode)) {
              position += stream.node.usedBytes;
            }
          }
          if (position < 0) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          return position;
        },allocate:function (stream, offset, length) {
          MEMFS.expandFileStorage(stream.node, offset + length);
          stream.node.usedBytes = Math.max(stream.node.usedBytes, offset + length);
        },mmap:function (stream, buffer, offset, length, position, prot, flags) {
          if (!FS.isFile(stream.node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
          }
          var ptr;
          var allocated;
          var contents = stream.node.contents;
          // Only make a new copy when MAP_PRIVATE is specified.
          if ( !(flags & 2) &&
                (contents.buffer === buffer || contents.buffer === buffer.buffer) ) {
            // We can't emulate MAP_SHARED when the file is not backed by the buffer
            // we're mapping to (e.g. the HEAP buffer).
            allocated = false;
            ptr = contents.byteOffset;
          } else {
            // Try to avoid unnecessary slices.
            if (position > 0 || position + length < stream.node.usedBytes) {
              if (contents.subarray) {
                contents = contents.subarray(position, position + length);
              } else {
                contents = Array.prototype.slice.call(contents, position, position + length);
              }
            }
            allocated = true;
            ptr = _malloc(length);
            if (!ptr) {
              throw new FS.ErrnoError(ERRNO_CODES.ENOMEM);
            }
            buffer.set(contents, ptr);
          }
          return { ptr: ptr, allocated: allocated };
        },msync:function (stream, buffer, offset, length, mmapFlags) {
          if (!FS.isFile(stream.node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
          }
          if (mmapFlags & 2) {
            // MAP_PRIVATE calls need not to be synced back to underlying fs
            return 0;
          }
  
          var bytesWritten = MEMFS.stream_ops.write(stream, buffer, 0, length, offset, false);
          // should we check if bytesWritten and length are the same?
          return 0;
        }}};
  Module["MEMFS"] = MEMFS;
  
  var IDBFS={dbs:{},indexedDB:function () {
        if (typeof indexedDB !== 'undefined') return indexedDB;
        var ret = null;
        if (typeof window === 'object') ret = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
        assert(ret, 'IDBFS used, but indexedDB not supported');
        return ret;
      },DB_VERSION:21,DB_STORE_NAME:"FILE_DATA",mount:function (mount) {
        // reuse all of the core MEMFS functionality
        return MEMFS.mount.apply(null, arguments);
      },syncfs:function (mount, populate, callback) {
        IDBFS.getLocalSet(mount, function(err, local) {
          if (err) return callback(err);
  
          IDBFS.getRemoteSet(mount, function(err, remote) {
            if (err) return callback(err);
  
            var src = populate ? remote : local;
            var dst = populate ? local : remote;
  
            IDBFS.reconcile(src, dst, callback);
          });
        });
      },getDB:function (name, callback) {
        // check the cache first
        var db = IDBFS.dbs[name];
        if (db) {
          return callback(null, db);
        }
  
        var req;
        try {
          req = IDBFS.indexedDB().open(name, IDBFS.DB_VERSION);
        } catch (e) {
          return callback(e);
        }
        if (!req) {
          return callback("Unable to connect to IndexedDB");
        }
        req.onupgradeneeded = function(e) {
          var db = e.target.result;
          var transaction = e.target.transaction;
  
          var fileStore;
  
          if (db.objectStoreNames.contains(IDBFS.DB_STORE_NAME)) {
            fileStore = transaction.objectStore(IDBFS.DB_STORE_NAME);
          } else {
            fileStore = db.createObjectStore(IDBFS.DB_STORE_NAME);
          }
  
          if (!fileStore.indexNames.contains('timestamp')) {
            fileStore.createIndex('timestamp', 'timestamp', { unique: false });
          }
        };
        req.onsuccess = function() {
          db = req.result;
  
          // add to the cache
          IDBFS.dbs[name] = db;
          callback(null, db);
        };
        req.onerror = function(e) {
          callback(this.error);
          e.preventDefault();
        };
      },getLocalSet:function (mount, callback) {
        var entries = {};
  
        function isRealDir(p) {
          return p !== '.' && p !== '..';
        };
        function toAbsolute(root) {
          return function(p) {
            return PATH.join2(root, p);
          }
        };
  
        var check = FS.readdir(mount.mountpoint).filter(isRealDir).map(toAbsolute(mount.mountpoint));
  
        while (check.length) {
          var path = check.pop();
          var stat;
  
          try {
            stat = FS.stat(path);
          } catch (e) {
            return callback(e);
          }
  
          if (FS.isDir(stat.mode)) {
            check.push.apply(check, FS.readdir(path).filter(isRealDir).map(toAbsolute(path)));
          }
  
          entries[path] = { timestamp: stat.mtime };
        }
  
        return callback(null, { type: 'local', entries: entries });
      },getRemoteSet:function (mount, callback) {
        var entries = {};
  
        IDBFS.getDB(mount.mountpoint, function(err, db) {
          if (err) return callback(err);
  
          try {
            var transaction = db.transaction([IDBFS.DB_STORE_NAME], 'readonly');
            transaction.onerror = function(e) {
              callback(this.error);
              e.preventDefault();
            };
  
            var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
            var index = store.index('timestamp');
  
            index.openKeyCursor().onsuccess = function(event) {
              var cursor = event.target.result;
  
              if (!cursor) {
                return callback(null, { type: 'remote', db: db, entries: entries });
              }
  
              entries[cursor.primaryKey] = { timestamp: cursor.key };
  
              cursor.continue();
            };
          } catch (e) {
            return callback(e);
          }
        });
      },loadLocalEntry:function (path, callback) {
        var stat, node;
  
        try {
          var lookup = FS.lookupPath(path);
          node = lookup.node;
          stat = FS.stat(path);
        } catch (e) {
          return callback(e);
        }
  
        if (FS.isDir(stat.mode)) {
          return callback(null, { timestamp: stat.mtime, mode: stat.mode });
        } else if (FS.isFile(stat.mode)) {
          // Performance consideration: storing a normal JavaScript array to a IndexedDB is much slower than storing a typed array.
          // Therefore always convert the file contents to a typed array first before writing the data to IndexedDB.
          node.contents = MEMFS.getFileDataAsTypedArray(node);
          return callback(null, { timestamp: stat.mtime, mode: stat.mode, contents: node.contents });
        } else {
          return callback(new Error('node type not supported'));
        }
      },storeLocalEntry:function (path, entry, callback) {
        try {
          if (FS.isDir(entry.mode)) {
            FS.mkdir(path, entry.mode);
          } else if (FS.isFile(entry.mode)) {
            FS.writeFile(path, entry.contents, { canOwn: true });
          } else {
            return callback(new Error('node type not supported'));
          }
  
          FS.chmod(path, entry.mode);
          FS.utime(path, entry.timestamp, entry.timestamp);
        } catch (e) {
          return callback(e);
        }
  
        callback(null);
      },removeLocalEntry:function (path, callback) {
        try {
          var lookup = FS.lookupPath(path);
          var stat = FS.stat(path);
  
          if (FS.isDir(stat.mode)) {
            FS.rmdir(path);
          } else if (FS.isFile(stat.mode)) {
            FS.unlink(path);
          }
        } catch (e) {
          return callback(e);
        }
  
        callback(null);
      },loadRemoteEntry:function (store, path, callback) {
        var req = store.get(path);
        req.onsuccess = function(event) { callback(null, event.target.result); };
        req.onerror = function(e) {
          callback(this.error);
          e.preventDefault();
        };
      },storeRemoteEntry:function (store, path, entry, callback) {
        var req = store.put(entry, path);
        req.onsuccess = function() { callback(null); };
        req.onerror = function(e) {
          callback(this.error);
          e.preventDefault();
        };
      },removeRemoteEntry:function (store, path, callback) {
        var req = store.delete(path);
        req.onsuccess = function() { callback(null); };
        req.onerror = function(e) {
          callback(this.error);
          e.preventDefault();
        };
      },reconcile:function (src, dst, callback) {
        var total = 0;
  
        var create = [];
        Object.keys(src.entries).forEach(function (key) {
          var e = src.entries[key];
          var e2 = dst.entries[key];
          if (!e2 || e.timestamp > e2.timestamp) {
            create.push(key);
            total++;
          }
        });
  
        var remove = [];
        Object.keys(dst.entries).forEach(function (key) {
          var e = dst.entries[key];
          var e2 = src.entries[key];
          if (!e2) {
            remove.push(key);
            total++;
          }
        });
  
        if (!total) {
          return callback(null);
        }
  
        var errored = false;
        var completed = 0;
        var db = src.type === 'remote' ? src.db : dst.db;
        var transaction = db.transaction([IDBFS.DB_STORE_NAME], 'readwrite');
        var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
  
        function done(err) {
          if (err) {
            if (!done.errored) {
              done.errored = true;
              return callback(err);
            }
            return;
          }
          if (++completed >= total) {
            return callback(null);
          }
        };
  
        transaction.onerror = function(e) {
          done(this.error);
          e.preventDefault();
        };
  
        // sort paths in ascending order so directory entries are created
        // before the files inside them
        create.sort().forEach(function (path) {
          if (dst.type === 'local') {
            IDBFS.loadRemoteEntry(store, path, function (err, entry) {
              if (err) return done(err);
              IDBFS.storeLocalEntry(path, entry, done);
            });
          } else {
            IDBFS.loadLocalEntry(path, function (err, entry) {
              if (err) return done(err);
              IDBFS.storeRemoteEntry(store, path, entry, done);
            });
          }
        });
  
        // sort paths in descending order so files are deleted before their
        // parent directories
        remove.sort().reverse().forEach(function(path) {
          if (dst.type === 'local') {
            IDBFS.removeLocalEntry(path, done);
          } else {
            IDBFS.removeRemoteEntry(store, path, done);
          }
        });
      }};
  Module["IDBFS"] = IDBFS;
  
  var NODEFS={isWindows:false,staticInit:function () {
        NODEFS.isWindows = !!process.platform.match(/^win/);
        var flags = process["binding"]("constants");
        // Node.js 4 compatibility: it has no namespaces for constants
        if (flags["fs"]) {
          flags = flags["fs"];
        }
        NODEFS.flagsForNodeMap = {
          "1024": flags["O_APPEND"],
          "64": flags["O_CREAT"],
          "128": flags["O_EXCL"],
          "0": flags["O_RDONLY"],
          "2": flags["O_RDWR"],
          "4096": flags["O_SYNC"],
          "512": flags["O_TRUNC"],
          "1": flags["O_WRONLY"]
        };
      },bufferFrom:function (arrayBuffer) {
        // Node.js < 4.5 compatibility: Buffer.from does not support ArrayBuffer
        // Buffer.from before 4.5 was just a method inherited from Uint8Array
        // Buffer.alloc has been added with Buffer.from together, so check it instead
        return Buffer.alloc ? Buffer.from(arrayBuffer) : new Buffer(arrayBuffer);
      },mount:function (mount) {
        assert(ENVIRONMENT_IS_NODE);
        return NODEFS.createNode(null, '/', NODEFS.getMode(mount.opts.root), 0);
      },createNode:function (parent, name, mode, dev) {
        if (!FS.isDir(mode) && !FS.isFile(mode) && !FS.isLink(mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var node = FS.createNode(parent, name, mode);
        node.node_ops = NODEFS.node_ops;
        node.stream_ops = NODEFS.stream_ops;
        return node;
      },getMode:function (path) {
        var stat;
        try {
          stat = fs.lstatSync(path);
          if (NODEFS.isWindows) {
            // Node.js on Windows never represents permission bit 'x', so
            // propagate read bits to execute bits
            stat.mode = stat.mode | ((stat.mode & 292) >> 2);
          }
        } catch (e) {
          if (!e.code) throw e;
          throw new FS.ErrnoError(ERRNO_CODES[e.code]);
        }
        return stat.mode;
      },realPath:function (node) {
        var parts = [];
        while (node.parent !== node) {
          parts.push(node.name);
          node = node.parent;
        }
        parts.push(node.mount.opts.root);
        parts.reverse();
        return PATH.join.apply(null, parts);
      },flagsForNode:function (flags) {
        flags &= ~0x200000 /*O_PATH*/; // Ignore this flag from musl, otherwise node.js fails to open the file.
        flags &= ~0x800 /*O_NONBLOCK*/; // Ignore this flag from musl, otherwise node.js fails to open the file.
        flags &= ~0x8000 /*O_LARGEFILE*/; // Ignore this flag from musl, otherwise node.js fails to open the file.
        flags &= ~0x80000 /*O_CLOEXEC*/; // Some applications may pass it; it makes no sense for a single process.
        var newFlags = 0;
        for (var k in NODEFS.flagsForNodeMap) {
          if (flags & k) {
            newFlags |= NODEFS.flagsForNodeMap[k];
            flags ^= k;
          }
        }
  
        if (!flags) {
          return newFlags;
        } else {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
      },node_ops:{getattr:function (node) {
          var path = NODEFS.realPath(node);
          var stat;
          try {
            stat = fs.lstatSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          // node.js v0.10.20 doesn't report blksize and blocks on Windows. Fake them with default blksize of 4096.
          // See http://support.microsoft.com/kb/140365
          if (NODEFS.isWindows && !stat.blksize) {
            stat.blksize = 4096;
          }
          if (NODEFS.isWindows && !stat.blocks) {
            stat.blocks = (stat.size+stat.blksize-1)/stat.blksize|0;
          }
          return {
            dev: stat.dev,
            ino: stat.ino,
            mode: stat.mode,
            nlink: stat.nlink,
            uid: stat.uid,
            gid: stat.gid,
            rdev: stat.rdev,
            size: stat.size,
            atime: stat.atime,
            mtime: stat.mtime,
            ctime: stat.ctime,
            blksize: stat.blksize,
            blocks: stat.blocks
          };
        },setattr:function (node, attr) {
          var path = NODEFS.realPath(node);
          try {
            if (attr.mode !== undefined) {
              fs.chmodSync(path, attr.mode);
              // update the common node structure mode as well
              node.mode = attr.mode;
            }
            if (attr.timestamp !== undefined) {
              var date = new Date(attr.timestamp);
              fs.utimesSync(path, date, date);
            }
            if (attr.size !== undefined) {
              fs.truncateSync(path, attr.size);
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },lookup:function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          var mode = NODEFS.getMode(path);
          return NODEFS.createNode(parent, name, mode);
        },mknod:function (parent, name, mode, dev) {
          var node = NODEFS.createNode(parent, name, mode, dev);
          // create the backing node for this in the fs root as well
          var path = NODEFS.realPath(node);
          try {
            if (FS.isDir(node.mode)) {
              fs.mkdirSync(path, node.mode);
            } else {
              fs.writeFileSync(path, '', { mode: node.mode });
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          return node;
        },rename:function (oldNode, newDir, newName) {
          var oldPath = NODEFS.realPath(oldNode);
          var newPath = PATH.join2(NODEFS.realPath(newDir), newName);
          try {
            fs.renameSync(oldPath, newPath);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },unlink:function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          try {
            fs.unlinkSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },rmdir:function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          try {
            fs.rmdirSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },readdir:function (node) {
          var path = NODEFS.realPath(node);
          try {
            return fs.readdirSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },symlink:function (parent, newName, oldPath) {
          var newPath = PATH.join2(NODEFS.realPath(parent), newName);
          try {
            fs.symlinkSync(oldPath, newPath);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },readlink:function (node) {
          var path = NODEFS.realPath(node);
          try {
            path = fs.readlinkSync(path);
            path = NODEJS_PATH.relative(NODEJS_PATH.resolve(node.mount.opts.root), path);
            return path;
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        }},stream_ops:{open:function (stream) {
          var path = NODEFS.realPath(stream.node);
          try {
            if (FS.isFile(stream.node.mode)) {
              stream.nfd = fs.openSync(path, NODEFS.flagsForNode(stream.flags));
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },close:function (stream) {
          try {
            if (FS.isFile(stream.node.mode) && stream.nfd) {
              fs.closeSync(stream.nfd);
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },read:function (stream, buffer, offset, length, position) {
          // Node.js < 6 compatibility: node errors on 0 length reads
          if (length === 0) return 0;
          try {
            return fs.readSync(stream.nfd, NODEFS.bufferFrom(buffer.buffer), offset, length, position);
          } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },write:function (stream, buffer, offset, length, position) {
          try {
            return fs.writeSync(stream.nfd, NODEFS.bufferFrom(buffer.buffer), offset, length, position);
          } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },llseek:function (stream, offset, whence) {
          var position = offset;
          if (whence === 1) {  // SEEK_CUR.
            position += stream.position;
          } else if (whence === 2) {  // SEEK_END.
            if (FS.isFile(stream.node.mode)) {
              try {
                var stat = fs.fstatSync(stream.nfd);
                position += stat.size;
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES[e.code]);
              }
            }
          }
  
          if (position < 0) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
  
          return position;
        }}};
  Module["NODEFS"] = NODEFS;
  
  var WORKERFS={DIR_MODE:16895,FILE_MODE:33279,reader:null,mount:function (mount) {
        assert(ENVIRONMENT_IS_WORKER);
        if (!WORKERFS.reader) WORKERFS.reader = new FileReaderSync();
        var root = WORKERFS.createNode(null, '/', WORKERFS.DIR_MODE, 0);
        var createdParents = {};
        function ensureParent(path) {
          // return the parent node, creating subdirs as necessary
          var parts = path.split('/');
          var parent = root;
          for (var i = 0; i < parts.length-1; i++) {
            var curr = parts.slice(0, i+1).join('/');
            // Issue 4254: Using curr as a node name will prevent the node
            // from being found in FS.nameTable when FS.open is called on
            // a path which holds a child of this node,
            // given that all FS functions assume node names
            // are just their corresponding parts within their given path,
            // rather than incremental aggregates which include their parent's
            // directories.
            if (!createdParents[curr]) {
              createdParents[curr] = WORKERFS.createNode(parent, parts[i], WORKERFS.DIR_MODE, 0);
            }
            parent = createdParents[curr];
          }
          return parent;
        }
        function base(path) {
          var parts = path.split('/');
          return parts[parts.length-1];
        }
        // We also accept FileList here, by using Array.prototype
        Array.prototype.forEach.call(mount.opts["files"] || [], function(file) {
          WORKERFS.createNode(ensureParent(file.name), base(file.name), WORKERFS.FILE_MODE, 0, file, file.lastModifiedDate);
        });
        (mount.opts["blobs"] || []).forEach(function(obj) {
          WORKERFS.createNode(ensureParent(obj["name"]), base(obj["name"]), WORKERFS.FILE_MODE, 0, obj["data"]);
        });
        (mount.opts["packages"] || []).forEach(function(pack) {
          pack['metadata'].files.forEach(function(file) {
            var name = file.filename.substr(1); // remove initial slash
            WORKERFS.createNode(ensureParent(name), base(name), WORKERFS.FILE_MODE, 0, pack['blob'].slice(file.start, file.end));
          });
        });
        return root;
      },createNode:function (parent, name, mode, dev, contents, mtime) {
        var node = FS.createNode(parent, name, mode);
        node.mode = mode;
        node.node_ops = WORKERFS.node_ops;
        node.stream_ops = WORKERFS.stream_ops;
        node.timestamp = (mtime || new Date).getTime();
        assert(WORKERFS.FILE_MODE !== WORKERFS.DIR_MODE);
        if (mode === WORKERFS.FILE_MODE) {
          node.size = contents.size;
          node.contents = contents;
        } else {
          node.size = 4096;
          node.contents = {};
        }
        if (parent) {
          parent.contents[name] = node;
        }
        return node;
      },node_ops:{getattr:function (node) {
          return {
            dev: 1,
            ino: undefined,
            mode: node.mode,
            nlink: 1,
            uid: 0,
            gid: 0,
            rdev: undefined,
            size: node.size,
            atime: new Date(node.timestamp),
            mtime: new Date(node.timestamp),
            ctime: new Date(node.timestamp),
            blksize: 4096,
            blocks: Math.ceil(node.size / 4096),
          };
        },setattr:function (node, attr) {
          if (attr.mode !== undefined) {
            node.mode = attr.mode;
          }
          if (attr.timestamp !== undefined) {
            node.timestamp = attr.timestamp;
          }
        },lookup:function (parent, name) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        },mknod:function (parent, name, mode, dev) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        },rename:function (oldNode, newDir, newName) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        },unlink:function (parent, name) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        },rmdir:function (parent, name) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        },readdir:function (node) {
          var entries = ['.', '..'];
          for (var key in node.contents) {
            if (!node.contents.hasOwnProperty(key)) {
              continue;
            }
            entries.push(key);
          }
          return entries;
        },symlink:function (parent, newName, oldPath) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        },readlink:function (node) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }},stream_ops:{read:function (stream, buffer, offset, length, position) {
          if (position >= stream.node.size) return 0;
          var chunk = stream.node.contents.slice(position, position + length);
          var ab = WORKERFS.reader.readAsArrayBuffer(chunk);
          buffer.set(new Uint8Array(ab), offset);
          return chunk.size;
        },write:function (stream, buffer, offset, length, position) {
          throw new FS.ErrnoError(ERRNO_CODES.EIO);
        },llseek:function (stream, offset, whence) {
          var position = offset;
          if (whence === 1) {  // SEEK_CUR.
            position += stream.position;
          } else if (whence === 2) {  // SEEK_END.
            if (FS.isFile(stream.node.mode)) {
              position += stream.node.size;
            }
          }
          if (position < 0) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          return position;
        }}};
  Module["WORKERFS"] = WORKERFS;
  
  var ERRNO_MESSAGES={0:"Success",1:"Not super-user",2:"No such file or directory",3:"No such process",4:"Interrupted system call",5:"I/O error",6:"No such device or address",7:"Arg list too long",8:"Exec format error",9:"Bad file number",10:"No children",11:"No more processes",12:"Not enough core",13:"Permission denied",14:"Bad address",15:"Block device required",16:"Mount device busy",17:"File exists",18:"Cross-device link",19:"No such device",20:"Not a directory",21:"Is a directory",22:"Invalid argument",23:"Too many open files in system",24:"Too many open files",25:"Not a typewriter",26:"Text file busy",27:"File too large",28:"No space left on device",29:"Illegal seek",30:"Read only file system",31:"Too many links",32:"Broken pipe",33:"Math arg out of domain of func",34:"Math result not representable",35:"File locking deadlock error",36:"File or path name too long",37:"No record locks available",38:"Function not implemented",39:"Directory not empty",40:"Too many symbolic links",42:"No message of desired type",43:"Identifier removed",44:"Channel number out of range",45:"Level 2 not synchronized",46:"Level 3 halted",47:"Level 3 reset",48:"Link number out of range",49:"Protocol driver not attached",50:"No CSI structure available",51:"Level 2 halted",52:"Invalid exchange",53:"Invalid request descriptor",54:"Exchange full",55:"No anode",56:"Invalid request code",57:"Invalid slot",59:"Bad font file fmt",60:"Device not a stream",61:"No data (for no delay io)",62:"Timer expired",63:"Out of streams resources",64:"Machine is not on the network",65:"Package not installed",66:"The object is remote",67:"The link has been severed",68:"Advertise error",69:"Srmount error",70:"Communication error on send",71:"Protocol error",72:"Multihop attempted",73:"Cross mount point (not really error)",74:"Trying to read unreadable message",75:"Value too large for defined data type",76:"Given log. name not unique",77:"f.d. invalid for this operation",78:"Remote address changed",79:"Can   access a needed shared lib",80:"Accessing a corrupted shared lib",81:".lib section in a.out corrupted",82:"Attempting to link in too many libs",83:"Attempting to exec a shared library",84:"Illegal byte sequence",86:"Streams pipe error",87:"Too many users",88:"Socket operation on non-socket",89:"Destination address required",90:"Message too long",91:"Protocol wrong type for socket",92:"Protocol not available",93:"Unknown protocol",94:"Socket type not supported",95:"Not supported",96:"Protocol family not supported",97:"Address family not supported by protocol family",98:"Address already in use",99:"Address not available",100:"Network interface is not configured",101:"Network is unreachable",102:"Connection reset by network",103:"Connection aborted",104:"Connection reset by peer",105:"No buffer space available",106:"Socket is already connected",107:"Socket is not connected",108:"Can't send after socket shutdown",109:"Too many references",110:"Connection timed out",111:"Connection refused",112:"Host is down",113:"Host is unreachable",114:"Socket already connected",115:"Connection already in progress",116:"Stale file handle",122:"Quota exceeded",123:"No medium (in tape drive)",125:"Operation canceled",130:"Previous owner died",131:"State not recoverable"};
  Module["ERRNO_MESSAGES"] = ERRNO_MESSAGES;
  
  var ERRNO_CODES={EPERM:1,ENOENT:2,ESRCH:3,EINTR:4,EIO:5,ENXIO:6,E2BIG:7,ENOEXEC:8,EBADF:9,ECHILD:10,EAGAIN:11,EWOULDBLOCK:11,ENOMEM:12,EACCES:13,EFAULT:14,ENOTBLK:15,EBUSY:16,EEXIST:17,EXDEV:18,ENODEV:19,ENOTDIR:20,EISDIR:21,EINVAL:22,ENFILE:23,EMFILE:24,ENOTTY:25,ETXTBSY:26,EFBIG:27,ENOSPC:28,ESPIPE:29,EROFS:30,EMLINK:31,EPIPE:32,EDOM:33,ERANGE:34,ENOMSG:42,EIDRM:43,ECHRNG:44,EL2NSYNC:45,EL3HLT:46,EL3RST:47,ELNRNG:48,EUNATCH:49,ENOCSI:50,EL2HLT:51,EDEADLK:35,ENOLCK:37,EBADE:52,EBADR:53,EXFULL:54,ENOANO:55,EBADRQC:56,EBADSLT:57,EDEADLOCK:35,EBFONT:59,ENOSTR:60,ENODATA:61,ETIME:62,ENOSR:63,ENONET:64,ENOPKG:65,EREMOTE:66,ENOLINK:67,EADV:68,ESRMNT:69,ECOMM:70,EPROTO:71,EMULTIHOP:72,EDOTDOT:73,EBADMSG:74,ENOTUNIQ:76,EBADFD:77,EREMCHG:78,ELIBACC:79,ELIBBAD:80,ELIBSCN:81,ELIBMAX:82,ELIBEXEC:83,ENOSYS:38,ENOTEMPTY:39,ENAMETOOLONG:36,ELOOP:40,EOPNOTSUPP:95,EPFNOSUPPORT:96,ECONNRESET:104,ENOBUFS:105,EAFNOSUPPORT:97,EPROTOTYPE:91,ENOTSOCK:88,ENOPROTOOPT:92,ESHUTDOWN:108,ECONNREFUSED:111,EADDRINUSE:98,ECONNABORTED:103,ENETUNREACH:101,ENETDOWN:100,ETIMEDOUT:110,EHOSTDOWN:112,EHOSTUNREACH:113,EINPROGRESS:115,EALREADY:114,EDESTADDRREQ:89,EMSGSIZE:90,EPROTONOSUPPORT:93,ESOCKTNOSUPPORT:94,EADDRNOTAVAIL:99,ENETRESET:102,EISCONN:106,ENOTCONN:107,ETOOMANYREFS:109,EUSERS:87,EDQUOT:122,ESTALE:116,ENOTSUP:95,ENOMEDIUM:123,EILSEQ:84,EOVERFLOW:75,ECANCELED:125,ENOTRECOVERABLE:131,EOWNERDEAD:130,ESTRPIPE:86};
  Module["ERRNO_CODES"] = ERRNO_CODES;
  
  var _stdin=154576;
  Module["_stdin"] = _stdin;
  
  var _stdout=154592;
  Module["_stdout"] = _stdout;
  
  var _stderr=154608;
  Module["_stderr"] = _stderr;var FS={root:null,mounts:[],devices:{},streams:[],nextInode:1,nameTable:null,currentPath:"/",initialized:false,ignorePermissions:true,trackingDelegate:{},tracking:{openFlags:{READ:1,WRITE:2}},ErrnoError:null,genericErrors:{},filesystems:null,syncFSRequests:0,handleFSError:function (e) {
        if (!(e instanceof FS.ErrnoError)) throw e + ' : ' + stackTrace();
        return ___setErrNo(e.errno);
      },lookupPath:function (path, opts) {
        path = PATH.resolve(FS.cwd(), path);
        opts = opts || {};
  
        if (!path) return { path: '', node: null };
  
        var defaults = {
          follow_mount: true,
          recurse_count: 0
        };
        for (var key in defaults) {
          if (opts[key] === undefined) {
            opts[key] = defaults[key];
          }
        }
  
        if (opts.recurse_count > 8) {  // max recursive lookup of 8
          throw new FS.ErrnoError(40);
        }
  
        // split the path
        var parts = PATH.normalizeArray(path.split('/').filter(function(p) {
          return !!p;
        }), false);
  
        // start at the root
        var current = FS.root;
        var current_path = '/';
  
        for (var i = 0; i < parts.length; i++) {
          var islast = (i === parts.length-1);
          if (islast && opts.parent) {
            // stop resolving
            break;
          }
  
          current = FS.lookupNode(current, parts[i]);
          current_path = PATH.join2(current_path, parts[i]);
  
          // jump to the mount's root node if this is a mountpoint
          if (FS.isMountpoint(current)) {
            if (!islast || (islast && opts.follow_mount)) {
              current = current.mounted.root;
            }
          }
  
          // by default, lookupPath will not follow a symlink if it is the final path component.
          // setting opts.follow = true will override this behavior.
          if (!islast || opts.follow) {
            var count = 0;
            while (FS.isLink(current.mode)) {
              var link = FS.readlink(current_path);
              current_path = PATH.resolve(PATH.dirname(current_path), link);
  
              var lookup = FS.lookupPath(current_path, { recurse_count: opts.recurse_count });
              current = lookup.node;
  
              if (count++ > 40) {  // limit max consecutive symlinks to 40 (SYMLOOP_MAX).
                throw new FS.ErrnoError(40);
              }
            }
          }
        }
  
        return { path: current_path, node: current };
      },getPath:function (node) {
        var path;
        while (true) {
          if (FS.isRoot(node)) {
            var mount = node.mount.mountpoint;
            if (!path) return mount;
            return mount[mount.length-1] !== '/' ? mount + '/' + path : mount + path;
          }
          path = path ? node.name + '/' + path : node.name;
          node = node.parent;
        }
      },hashName:function (parentid, name) {
        var hash = 0;
  
  
        for (var i = 0; i < name.length; i++) {
          hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
        }
        return ((parentid + hash) >>> 0) % FS.nameTable.length;
      },hashAddNode:function (node) {
        var hash = FS.hashName(node.parent.id, node.name);
        node.name_next = FS.nameTable[hash];
        FS.nameTable[hash] = node;
      },hashRemoveNode:function (node) {
        var hash = FS.hashName(node.parent.id, node.name);
        if (FS.nameTable[hash] === node) {
          FS.nameTable[hash] = node.name_next;
        } else {
          var current = FS.nameTable[hash];
          while (current) {
            if (current.name_next === node) {
              current.name_next = node.name_next;
              break;
            }
            current = current.name_next;
          }
        }
      },lookupNode:function (parent, name) {
        var err = FS.mayLookup(parent);
        if (err) {
          throw new FS.ErrnoError(err, parent);
        }
        var hash = FS.hashName(parent.id, name);
        for (var node = FS.nameTable[hash]; node; node = node.name_next) {
          var nodeName = node.name;
          if (node.parent.id === parent.id && nodeName === name) {
            return node;
          }
        }
        // if we failed to find it in the cache, call into the VFS
        return FS.lookup(parent, name);
      },createNode:function (parent, name, mode, rdev) {
        if (!FS.FSNode) {
          FS.FSNode = function(parent, name, mode, rdev) {
            if (!parent) {
              parent = this;  // root node sets parent to itself
            }
            this.parent = parent;
            this.mount = parent.mount;
            this.mounted = null;
            this.id = FS.nextInode++;
            this.name = name;
            this.mode = mode;
            this.node_ops = {};
            this.stream_ops = {};
            this.rdev = rdev;
          };
  
          FS.FSNode.prototype = {};
  
          // compatibility
          var readMode = 292 | 73;
          var writeMode = 146;
  
          // NOTE we must use Object.defineProperties instead of individual calls to
          // Object.defineProperty in order to make closure compiler happy
          Object.defineProperties(FS.FSNode.prototype, {
            read: {
              get: function() { return (this.mode & readMode) === readMode; },
              set: function(val) { val ? this.mode |= readMode : this.mode &= ~readMode; }
            },
            write: {
              get: function() { return (this.mode & writeMode) === writeMode; },
              set: function(val) { val ? this.mode |= writeMode : this.mode &= ~writeMode; }
            },
            isFolder: {
              get: function() { return FS.isDir(this.mode); }
            },
            isDevice: {
              get: function() { return FS.isChrdev(this.mode); }
            }
          });
        }
  
        var node = new FS.FSNode(parent, name, mode, rdev);
  
        FS.hashAddNode(node);
  
        return node;
      },destroyNode:function (node) {
        FS.hashRemoveNode(node);
      },isRoot:function (node) {
        return node === node.parent;
      },isMountpoint:function (node) {
        return !!node.mounted;
      },isFile:function (mode) {
        return (mode & 61440) === 32768;
      },isDir:function (mode) {
        return (mode & 61440) === 16384;
      },isLink:function (mode) {
        return (mode & 61440) === 40960;
      },isChrdev:function (mode) {
        return (mode & 61440) === 8192;
      },isBlkdev:function (mode) {
        return (mode & 61440) === 24576;
      },isFIFO:function (mode) {
        return (mode & 61440) === 4096;
      },isSocket:function (mode) {
        return (mode & 49152) === 49152;
      },flagModes:{"r":0,"rs":1052672,"r+":2,"w":577,"wx":705,"xw":705,"w+":578,"wx+":706,"xw+":706,"a":1089,"ax":1217,"xa":1217,"a+":1090,"ax+":1218,"xa+":1218},modeStringToFlags:function (str) {
        var flags = FS.flagModes[str];
        if (typeof flags === 'undefined') {
          throw new Error('Unknown file open mode: ' + str);
        }
        return flags;
      },flagsToPermissionString:function (flag) {
        var perms = ['r', 'w', 'rw'][flag & 3];
        if ((flag & 512)) {
          perms += 'w';
        }
        return perms;
      },nodePermissions:function (node, perms) {
        if (FS.ignorePermissions) {
          return 0;
        }
        // return 0 if any user, group or owner bits are set.
        if (perms.indexOf('r') !== -1 && !(node.mode & 292)) {
          return 13;
        } else if (perms.indexOf('w') !== -1 && !(node.mode & 146)) {
          return 13;
        } else if (perms.indexOf('x') !== -1 && !(node.mode & 73)) {
          return 13;
        }
        return 0;
      },mayLookup:function (dir) {
        var err = FS.nodePermissions(dir, 'x');
        if (err) return err;
        if (!dir.node_ops.lookup) return 13;
        return 0;
      },mayCreate:function (dir, name) {
        try {
          var node = FS.lookupNode(dir, name);
          return 17;
        } catch (e) {
        }
        return FS.nodePermissions(dir, 'wx');
      },mayDelete:function (dir, name, isdir) {
        var node;
        try {
          node = FS.lookupNode(dir, name);
        } catch (e) {
          return e.errno;
        }
        var err = FS.nodePermissions(dir, 'wx');
        if (err) {
          return err;
        }
        if (isdir) {
          if (!FS.isDir(node.mode)) {
            return 20;
          }
          if (FS.isRoot(node) || FS.getPath(node) === FS.cwd()) {
            return 16;
          }
        } else {
          if (FS.isDir(node.mode)) {
            return 21;
          }
        }
        return 0;
      },mayOpen:function (node, flags) {
        if (!node) {
          return 2;
        }
        if (FS.isLink(node.mode)) {
          return 40;
        } else if (FS.isDir(node.mode)) {
          if (FS.flagsToPermissionString(flags) !== 'r' || // opening for write
              (flags & 512)) { // TODO: check for O_SEARCH? (== search for dir only)
            return 21;
          }
        }
        return FS.nodePermissions(node, FS.flagsToPermissionString(flags));
      },MAX_OPEN_FDS:4096,nextfd:function (fd_start, fd_end) {
        fd_start = fd_start || 0;
        fd_end = fd_end || FS.MAX_OPEN_FDS;
        for (var fd = fd_start; fd <= fd_end; fd++) {
          if (!FS.streams[fd]) {
            return fd;
          }
        }
        throw new FS.ErrnoError(24);
      },getStream:function (fd) {
        return FS.streams[fd];
      },createStream:function (stream, fd_start, fd_end) {
        if (!FS.FSStream) {
          FS.FSStream = function(){};
          FS.FSStream.prototype = {};
          // compatibility
          Object.defineProperties(FS.FSStream.prototype, {
            object: {
              get: function() { return this.node; },
              set: function(val) { this.node = val; }
            },
            isRead: {
              get: function() { return (this.flags & 2097155) !== 1; }
            },
            isWrite: {
              get: function() { return (this.flags & 2097155) !== 0; }
            },
            isAppend: {
              get: function() { return (this.flags & 1024); }
            }
          });
        }
        // clone it, so we can return an instance of FSStream
        var newStream = new FS.FSStream();
        for (var p in stream) {
          newStream[p] = stream[p];
        }
        stream = newStream;
        var fd = FS.nextfd(fd_start, fd_end);
        stream.fd = fd;
        FS.streams[fd] = stream;
        return stream;
      },closeStream:function (fd) {
        FS.streams[fd] = null;
      },chrdev_stream_ops:{open:function (stream) {
          var device = FS.getDevice(stream.node.rdev);
          // override node's stream ops with the device's
          stream.stream_ops = device.stream_ops;
          // forward the open call
          if (stream.stream_ops.open) {
            stream.stream_ops.open(stream);
          }
        },llseek:function () {
          throw new FS.ErrnoError(29);
        }},major:function (dev) {
        return ((dev) >> 8);
      },minor:function (dev) {
        return ((dev) & 0xff);
      },makedev:function (ma, mi) {
        return ((ma) << 8 | (mi));
      },registerDevice:function (dev, ops) {
        FS.devices[dev] = { stream_ops: ops };
      },getDevice:function (dev) {
        return FS.devices[dev];
      },getMounts:function (mount) {
        var mounts = [];
        var check = [mount];
  
        while (check.length) {
          var m = check.pop();
  
          mounts.push(m);
  
          check.push.apply(check, m.mounts);
        }
  
        return mounts;
      },syncfs:function (populate, callback) {
        if (typeof(populate) === 'function') {
          callback = populate;
          populate = false;
        }
  
        FS.syncFSRequests++;
  
        if (FS.syncFSRequests > 1) {
          console.log('warning: ' + FS.syncFSRequests + ' FS.syncfs operations in flight at once, probably just doing extra work');
        }
  
        var mounts = FS.getMounts(FS.root.mount);
        var completed = 0;
  
        function doCallback(err) {
          assert(FS.syncFSRequests > 0);
          FS.syncFSRequests--;
          return callback(err);
        }
  
        function done(err) {
          if (err) {
            if (!done.errored) {
              done.errored = true;
              return doCallback(err);
            }
            return;
          }
          if (++completed >= mounts.length) {
            doCallback(null);
          }
        };
  
        // sync all mounts
        mounts.forEach(function (mount) {
          if (!mount.type.syncfs) {
            return done(null);
          }
          mount.type.syncfs(mount, populate, done);
        });
      },mount:function (type, opts, mountpoint) {
        var root = mountpoint === '/';
        var pseudo = !mountpoint;
        var node;
  
        if (root && FS.root) {
          throw new FS.ErrnoError(16);
        } else if (!root && !pseudo) {
          var lookup = FS.lookupPath(mountpoint, { follow_mount: false });
  
          mountpoint = lookup.path;  // use the absolute path
          node = lookup.node;
  
          if (FS.isMountpoint(node)) {
            throw new FS.ErrnoError(16);
          }
  
          if (!FS.isDir(node.mode)) {
            throw new FS.ErrnoError(20);
          }
        }
  
        var mount = {
          type: type,
          opts: opts,
          mountpoint: mountpoint,
          mounts: []
        };
  
        // create a root node for the fs
        var mountRoot = type.mount(mount);
        mountRoot.mount = mount;
        mount.root = mountRoot;
  
        if (root) {
          FS.root = mountRoot;
        } else if (node) {
          // set as a mountpoint
          node.mounted = mount;
  
          // add the new mount to the current mount's children
          if (node.mount) {
            node.mount.mounts.push(mount);
          }
        }
  
        return mountRoot;
      },unmount:function (mountpoint) {
        var lookup = FS.lookupPath(mountpoint, { follow_mount: false });
  
        if (!FS.isMountpoint(lookup.node)) {
          throw new FS.ErrnoError(22);
        }
  
        // destroy the nodes for this mount, and all its child mounts
        var node = lookup.node;
        var mount = node.mounted;
        var mounts = FS.getMounts(mount);
  
        Object.keys(FS.nameTable).forEach(function (hash) {
          var current = FS.nameTable[hash];
  
          while (current) {
            var next = current.name_next;
  
            if (mounts.indexOf(current.mount) !== -1) {
              FS.destroyNode(current);
            }
  
            current = next;
          }
        });
  
        // no longer a mountpoint
        node.mounted = null;
  
        // remove this mount from the child mounts
        var idx = node.mount.mounts.indexOf(mount);
        assert(idx !== -1);
        node.mount.mounts.splice(idx, 1);
      },lookup:function (parent, name) {
        return parent.node_ops.lookup(parent, name);
      },mknod:function (path, mode, dev) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        if (!name || name === '.' || name === '..') {
          throw new FS.ErrnoError(22);
        }
        var err = FS.mayCreate(parent, name);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.mknod) {
          throw new FS.ErrnoError(1);
        }
        return parent.node_ops.mknod(parent, name, mode, dev);
      },create:function (path, mode) {
        mode = mode !== undefined ? mode : 438 /* 0666 */;
        mode &= 4095;
        mode |= 32768;
        return FS.mknod(path, mode, 0);
      },mkdir:function (path, mode) {
        mode = mode !== undefined ? mode : 511 /* 0777 */;
        mode &= 511 | 512;
        mode |= 16384;
        return FS.mknod(path, mode, 0);
      },mkdirTree:function (path, mode) {
        var dirs = path.split('/');
        var d = '';
        for (var i = 0; i < dirs.length; ++i) {
          if (!dirs[i]) continue;
          d += '/' + dirs[i];
          try {
            FS.mkdir(d, mode);
          } catch(e) {
            if (e.errno != 17) throw e;
          }
        }
      },mkdev:function (path, mode, dev) {
        if (typeof(dev) === 'undefined') {
          dev = mode;
          mode = 438 /* 0666 */;
        }
        mode |= 8192;
        return FS.mknod(path, mode, dev);
      },symlink:function (oldpath, newpath) {
        if (!PATH.resolve(oldpath)) {
          throw new FS.ErrnoError(2);
        }
        var lookup = FS.lookupPath(newpath, { parent: true });
        var parent = lookup.node;
        if (!parent) {
          throw new FS.ErrnoError(2);
        }
        var newname = PATH.basename(newpath);
        var err = FS.mayCreate(parent, newname);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.symlink) {
          throw new FS.ErrnoError(1);
        }
        return parent.node_ops.symlink(parent, newname, oldpath);
      },rename:function (old_path, new_path) {
        var old_dirname = PATH.dirname(old_path);
        var new_dirname = PATH.dirname(new_path);
        var old_name = PATH.basename(old_path);
        var new_name = PATH.basename(new_path);
        // parents must exist
        var lookup, old_dir, new_dir;
        try {
          lookup = FS.lookupPath(old_path, { parent: true });
          old_dir = lookup.node;
          lookup = FS.lookupPath(new_path, { parent: true });
          new_dir = lookup.node;
        } catch (e) {
          throw new FS.ErrnoError(16);
        }
        if (!old_dir || !new_dir) throw new FS.ErrnoError(2);
        // need to be part of the same mount
        if (old_dir.mount !== new_dir.mount) {
          throw new FS.ErrnoError(18);
        }
        // source must exist
        var old_node = FS.lookupNode(old_dir, old_name);
        // old path should not be an ancestor of the new path
        var relative = PATH.relative(old_path, new_dirname);
        if (relative.charAt(0) !== '.') {
          throw new FS.ErrnoError(22);
        }
        // new path should not be an ancestor of the old path
        relative = PATH.relative(new_path, old_dirname);
        if (relative.charAt(0) !== '.') {
          throw new FS.ErrnoError(39);
        }
        // see if the new path already exists
        var new_node;
        try {
          new_node = FS.lookupNode(new_dir, new_name);
        } catch (e) {
          // not fatal
        }
        // early out if nothing needs to change
        if (old_node === new_node) {
          return;
        }
        // we'll need to delete the old entry
        var isdir = FS.isDir(old_node.mode);
        var err = FS.mayDelete(old_dir, old_name, isdir);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        // need delete permissions if we'll be overwriting.
        // need create permissions if new doesn't already exist.
        err = new_node ?
          FS.mayDelete(new_dir, new_name, isdir) :
          FS.mayCreate(new_dir, new_name);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!old_dir.node_ops.rename) {
          throw new FS.ErrnoError(1);
        }
        if (FS.isMountpoint(old_node) || (new_node && FS.isMountpoint(new_node))) {
          throw new FS.ErrnoError(16);
        }
        // if we are going to change the parent, check write permissions
        if (new_dir !== old_dir) {
          err = FS.nodePermissions(old_dir, 'w');
          if (err) {
            throw new FS.ErrnoError(err);
          }
        }
        try {
          if (FS.trackingDelegate['willMovePath']) {
            FS.trackingDelegate['willMovePath'](old_path, new_path);
          }
        } catch(e) {
          console.log("FS.trackingDelegate['willMovePath']('"+old_path+"', '"+new_path+"') threw an exception: " + e.message);
        }
        // remove the node from the lookup hash
        FS.hashRemoveNode(old_node);
        // do the underlying fs rename
        try {
          old_dir.node_ops.rename(old_node, new_dir, new_name);
        } catch (e) {
          throw e;
        } finally {
          // add the node back to the hash (in case node_ops.rename
          // changed its name)
          FS.hashAddNode(old_node);
        }
        try {
          if (FS.trackingDelegate['onMovePath']) FS.trackingDelegate['onMovePath'](old_path, new_path);
        } catch(e) {
          console.log("FS.trackingDelegate['onMovePath']('"+old_path+"', '"+new_path+"') threw an exception: " + e.message);
        }
      },rmdir:function (path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var err = FS.mayDelete(parent, name, true);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.rmdir) {
          throw new FS.ErrnoError(1);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(16);
        }
        try {
          if (FS.trackingDelegate['willDeletePath']) {
            FS.trackingDelegate['willDeletePath'](path);
          }
        } catch(e) {
          console.log("FS.trackingDelegate['willDeletePath']('"+path+"') threw an exception: " + e.message);
        }
        parent.node_ops.rmdir(parent, name);
        FS.destroyNode(node);
        try {
          if (FS.trackingDelegate['onDeletePath']) FS.trackingDelegate['onDeletePath'](path);
        } catch(e) {
          console.log("FS.trackingDelegate['onDeletePath']('"+path+"') threw an exception: " + e.message);
        }
      },readdir:function (path) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        if (!node.node_ops.readdir) {
          throw new FS.ErrnoError(20);
        }
        return node.node_ops.readdir(node);
      },unlink:function (path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var err = FS.mayDelete(parent, name, false);
        if (err) {
          // According to POSIX, we should map EISDIR to EPERM, but
          // we instead do what Linux does (and we must, as we use
          // the musl linux libc).
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.unlink) {
          throw new FS.ErrnoError(1);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(16);
        }
        try {
          if (FS.trackingDelegate['willDeletePath']) {
            FS.trackingDelegate['willDeletePath'](path);
          }
        } catch(e) {
          console.log("FS.trackingDelegate['willDeletePath']('"+path+"') threw an exception: " + e.message);
        }
        parent.node_ops.unlink(parent, name);
        FS.destroyNode(node);
        try {
          if (FS.trackingDelegate['onDeletePath']) FS.trackingDelegate['onDeletePath'](path);
        } catch(e) {
          console.log("FS.trackingDelegate['onDeletePath']('"+path+"') threw an exception: " + e.message);
        }
      },readlink:function (path) {
        var lookup = FS.lookupPath(path);
        var link = lookup.node;
        if (!link) {
          throw new FS.ErrnoError(2);
        }
        if (!link.node_ops.readlink) {
          throw new FS.ErrnoError(22);
        }
        return PATH.resolve(FS.getPath(link.parent), link.node_ops.readlink(link));
      },stat:function (path, dontFollow) {
        var lookup = FS.lookupPath(path, { follow: !dontFollow });
        var node = lookup.node;
        if (!node) {
          throw new FS.ErrnoError(2);
        }
        if (!node.node_ops.getattr) {
          throw new FS.ErrnoError(1);
        }
        return node.node_ops.getattr(node);
      },lstat:function (path) {
        return FS.stat(path, true);
      },chmod:function (path, mode, dontFollow) {
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(1);
        }
        node.node_ops.setattr(node, {
          mode: (mode & 4095) | (node.mode & ~4095),
          timestamp: Date.now()
        });
      },lchmod:function (path, mode) {
        FS.chmod(path, mode, true);
      },fchmod:function (fd, mode) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(9);
        }
        FS.chmod(stream.node, mode);
      },chown:function (path, uid, gid, dontFollow) {
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(1);
        }
        node.node_ops.setattr(node, {
          timestamp: Date.now()
          // we ignore the uid / gid for now
        });
      },lchown:function (path, uid, gid) {
        FS.chown(path, uid, gid, true);
      },fchown:function (fd, uid, gid) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(9);
        }
        FS.chown(stream.node, uid, gid);
      },truncate:function (path, len) {
        if (len < 0) {
          throw new FS.ErrnoError(22);
        }
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: true });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(1);
        }
        if (FS.isDir(node.mode)) {
          throw new FS.ErrnoError(21);
        }
        if (!FS.isFile(node.mode)) {
          throw new FS.ErrnoError(22);
        }
        var err = FS.nodePermissions(node, 'w');
        if (err) {
          throw new FS.ErrnoError(err);
        }
        node.node_ops.setattr(node, {
          size: len,
          timestamp: Date.now()
        });
      },ftruncate:function (fd, len) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(9);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(22);
        }
        FS.truncate(stream.node, len);
      },utime:function (path, atime, mtime) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        node.node_ops.setattr(node, {
          timestamp: Math.max(atime, mtime)
        });
      },open:function (path, flags, mode, fd_start, fd_end) {
        if (path === "") {
          throw new FS.ErrnoError(2);
        }
        flags = typeof flags === 'string' ? FS.modeStringToFlags(flags) : flags;
        mode = typeof mode === 'undefined' ? 438 /* 0666 */ : mode;
        if ((flags & 64)) {
          mode = (mode & 4095) | 32768;
        } else {
          mode = 0;
        }
        var node;
        if (typeof path === 'object') {
          node = path;
        } else {
          path = PATH.normalize(path);
          try {
            var lookup = FS.lookupPath(path, {
              follow: !(flags & 131072)
            });
            node = lookup.node;
          } catch (e) {
            // ignore
          }
        }
        // perhaps we need to create the node
        var created = false;
        if ((flags & 64)) {
          if (node) {
            // if O_CREAT and O_EXCL are set, error out if the node already exists
            if ((flags & 128)) {
              throw new FS.ErrnoError(17);
            }
          } else {
            // node doesn't exist, try to create it
            node = FS.mknod(path, mode, 0);
            created = true;
          }
        }
        if (!node) {
          throw new FS.ErrnoError(2);
        }
        // can't truncate a device
        if (FS.isChrdev(node.mode)) {
          flags &= ~512;
        }
        // if asked only for a directory, then this must be one
        if ((flags & 65536) && !FS.isDir(node.mode)) {
          throw new FS.ErrnoError(20);
        }
        // check permissions, if this is not a file we just created now (it is ok to
        // create and write to a file with read-only permissions; it is read-only
        // for later use)
        if (!created) {
          var err = FS.mayOpen(node, flags);
          if (err) {
            throw new FS.ErrnoError(err);
          }
        }
        // do truncation if necessary
        if ((flags & 512)) {
          FS.truncate(node, 0);
        }
        // we've already handled these, don't pass down to the underlying vfs
        flags &= ~(128 | 512);
  
        // register the stream with the filesystem
        var stream = FS.createStream({
          node: node,
          path: FS.getPath(node),  // we want the absolute path to the node
          flags: flags,
          seekable: true,
          position: 0,
          stream_ops: node.stream_ops,
          // used by the file family libc calls (fopen, fwrite, ferror, etc.)
          ungotten: [],
          error: false
        }, fd_start, fd_end);
        // call the new stream's open function
        if (stream.stream_ops.open) {
          stream.stream_ops.open(stream);
        }
        if (Module['logReadFiles'] && !(flags & 1)) {
          if (!FS.readFiles) FS.readFiles = {};
          if (!(path in FS.readFiles)) {
            FS.readFiles[path] = 1;
            console.log("FS.trackingDelegate error on read file: " + path);
          }
        }
        try {
          if (FS.trackingDelegate['onOpenFile']) {
            var trackingFlags = 0;
            if ((flags & 2097155) !== 1) {
              trackingFlags |= FS.tracking.openFlags.READ;
            }
            if ((flags & 2097155) !== 0) {
              trackingFlags |= FS.tracking.openFlags.WRITE;
            }
            FS.trackingDelegate['onOpenFile'](path, trackingFlags);
          }
        } catch(e) {
          console.log("FS.trackingDelegate['onOpenFile']('"+path+"', flags) threw an exception: " + e.message);
        }
        return stream;
      },close:function (stream) {
        if (FS.isClosed(stream)) {
          throw new FS.ErrnoError(9);
        }
        if (stream.getdents) stream.getdents = null; // free readdir state
        try {
          if (stream.stream_ops.close) {
            stream.stream_ops.close(stream);
          }
        } catch (e) {
          throw e;
        } finally {
          FS.closeStream(stream.fd);
        }
        stream.fd = null;
      },isClosed:function (stream) {
        return stream.fd === null;
      },llseek:function (stream, offset, whence) {
        if (FS.isClosed(stream)) {
          throw new FS.ErrnoError(9);
        }
        if (!stream.seekable || !stream.stream_ops.llseek) {
          throw new FS.ErrnoError(29);
        }
        if (whence != 0 /* SEEK_SET */ && whence != 1 /* SEEK_CUR */ && whence != 2 /* SEEK_END */) {
          throw new FS.ErrnoError(22);
        }
        stream.position = stream.stream_ops.llseek(stream, offset, whence);
        stream.ungotten = [];
        return stream.position;
      },read:function (stream, buffer, offset, length, position) {
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(22);
        }
        if (FS.isClosed(stream)) {
          throw new FS.ErrnoError(9);
        }
        if ((stream.flags & 2097155) === 1) {
          throw new FS.ErrnoError(9);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(21);
        }
        if (!stream.stream_ops.read) {
          throw new FS.ErrnoError(22);
        }
        var seeking = typeof position !== 'undefined';
        if (!seeking) {
          position = stream.position;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(29);
        }
        var bytesRead = stream.stream_ops.read(stream, buffer, offset, length, position);
        if (!seeking) stream.position += bytesRead;
        return bytesRead;
      },write:function (stream, buffer, offset, length, position, canOwn) {
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(22);
        }
        if (FS.isClosed(stream)) {
          throw new FS.ErrnoError(9);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(9);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(21);
        }
        if (!stream.stream_ops.write) {
          throw new FS.ErrnoError(22);
        }
        if (stream.flags & 1024) {
          // seek to the end before writing in append mode
          FS.llseek(stream, 0, 2);
        }
        var seeking = typeof position !== 'undefined';
        if (!seeking) {
          position = stream.position;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(29);
        }
        var bytesWritten = stream.stream_ops.write(stream, buffer, offset, length, position, canOwn);
        if (!seeking) stream.position += bytesWritten;
        try {
          if (stream.path && FS.trackingDelegate['onWriteToFile']) FS.trackingDelegate['onWriteToFile'](stream.path);
        } catch(e) {
          console.log("FS.trackingDelegate['onWriteToFile']('"+stream.path+"') threw an exception: " + e.message);
        }
        return bytesWritten;
      },allocate:function (stream, offset, length) {
        if (FS.isClosed(stream)) {
          throw new FS.ErrnoError(9);
        }
        if (offset < 0 || length <= 0) {
          throw new FS.ErrnoError(22);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(9);
        }
        if (!FS.isFile(stream.node.mode) && !FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(19);
        }
        if (!stream.stream_ops.allocate) {
          throw new FS.ErrnoError(95);
        }
        stream.stream_ops.allocate(stream, offset, length);
      },mmap:function (stream, buffer, offset, length, position, prot, flags) {
        // TODO if PROT is PROT_WRITE, make sure we have write access
        if ((stream.flags & 2097155) === 1) {
          throw new FS.ErrnoError(13);
        }
        if (!stream.stream_ops.mmap) {
          throw new FS.ErrnoError(19);
        }
        return stream.stream_ops.mmap(stream, buffer, offset, length, position, prot, flags);
      },msync:function (stream, buffer, offset, length, mmapFlags) {
        if (!stream || !stream.stream_ops.msync) {
          return 0;
        }
        return stream.stream_ops.msync(stream, buffer, offset, length, mmapFlags);
      },munmap:function (stream) {
        return 0;
      },ioctl:function (stream, cmd, arg) {
        if (!stream.stream_ops.ioctl) {
          throw new FS.ErrnoError(25);
        }
        return stream.stream_ops.ioctl(stream, cmd, arg);
      },readFile:function (path, opts) {
        opts = opts || {};
        opts.flags = opts.flags || 'r';
        opts.encoding = opts.encoding || 'binary';
        if (opts.encoding !== 'utf8' && opts.encoding !== 'binary') {
          throw new Error('Invalid encoding type "' + opts.encoding + '"');
        }
        var ret;
        var stream = FS.open(path, opts.flags);
        var stat = FS.stat(path);
        var length = stat.size;
        var buf = new Uint8Array(length);
        FS.read(stream, buf, 0, length, 0);
        if (opts.encoding === 'utf8') {
          ret = UTF8ArrayToString(buf, 0);
        } else if (opts.encoding === 'binary') {
          ret = buf;
        }
        FS.close(stream);
        return ret;
      },writeFile:function (path, data, opts) {
        opts = opts || {};
        opts.flags = opts.flags || 'w';
        var stream = FS.open(path, opts.flags, opts.mode);
        if (typeof data === 'string') {
          var buf = new Uint8Array(lengthBytesUTF8(data)+1);
          var actualNumBytes = stringToUTF8Array(data, buf, 0, buf.length);
          FS.write(stream, buf, 0, actualNumBytes, undefined, opts.canOwn);
        } else if (ArrayBuffer.isView(data)) {
          FS.write(stream, data, 0, data.byteLength, undefined, opts.canOwn);
        } else {
          throw new Error('Unsupported data type');
        }
        FS.close(stream);
      },cwd:function () {
        return FS.currentPath;
      },chdir:function (path) {
        var lookup = FS.lookupPath(path, { follow: true });
        if (lookup.node === null) {
          throw new FS.ErrnoError(2);
        }
        if (!FS.isDir(lookup.node.mode)) {
          throw new FS.ErrnoError(20);
        }
        var err = FS.nodePermissions(lookup.node, 'x');
        if (err) {
          throw new FS.ErrnoError(err);
        }
        FS.currentPath = lookup.path;
      },createDefaultDirectories:function () {
        FS.mkdir('/tmp');
        FS.mkdir('/home');
        FS.mkdir('/home/web_user');
      },createDefaultDevices:function () {
        // create /dev
        FS.mkdir('/dev');
        // setup /dev/null
        FS.registerDevice(FS.makedev(1, 3), {
          read: function() { return 0; },
          write: function(stream, buffer, offset, length, pos) { return length; }
        });
        FS.mkdev('/dev/null', FS.makedev(1, 3));
        // setup /dev/tty and /dev/tty1
        // stderr needs to print output using Module['printErr']
        // so we register a second tty just for it.
        TTY.register(FS.makedev(5, 0), TTY.default_tty_ops);
        TTY.register(FS.makedev(6, 0), TTY.default_tty1_ops);
        FS.mkdev('/dev/tty', FS.makedev(5, 0));
        FS.mkdev('/dev/tty1', FS.makedev(6, 0));
        // setup /dev/[u]random
        var random_device;
        if (typeof crypto === 'object' && typeof crypto['getRandomValues'] === 'function') {
          // for modern web browsers
          var randomBuffer = new Uint8Array(1);
          random_device = function() { crypto.getRandomValues(randomBuffer); return randomBuffer[0]; };
        } else
        if (ENVIRONMENT_IS_NODE) {
          // for nodejs with or without crypto support included
          try {
            var crypto_module = require('crypto');
            // nodejs has crypto support
            random_device = function() { return crypto_module['randomBytes'](1)[0]; };
          } catch (e) {
            // nodejs doesn't have crypto support
          }
        } else
        {}
        if (!random_device) {
          // we couldn't find a proper implementation, as Math.random() is not suitable for /dev/random, see emscripten-core/emscripten/pull/7096
          random_device = function() { abort("no cryptographic support found for random_device. consider polyfilling it if you want to use something insecure like Math.random(), e.g. put this in a --pre-js: var crypto = { getRandomValues: function(array) { for (var i = 0; i < array.length; i++) array[i] = (Math.random()*256)|0 } };"); };
        }
        FS.createDevice('/dev', 'random', random_device);
        FS.createDevice('/dev', 'urandom', random_device);
        // we're not going to emulate the actual shm device,
        // just create the tmp dirs that reside in it commonly
        FS.mkdir('/dev/shm');
        FS.mkdir('/dev/shm/tmp');
      },createSpecialDirectories:function () {
        // create /proc/self/fd which allows /proc/self/fd/6 => readlink gives the name of the stream for fd 6 (see test_unistd_ttyname)
        FS.mkdir('/proc');
        FS.mkdir('/proc/self');
        FS.mkdir('/proc/self/fd');
        FS.mount({
          mount: function() {
            var node = FS.createNode('/proc/self', 'fd', 16384 | 511 /* 0777 */, 73);
            node.node_ops = {
              lookup: function(parent, name) {
                var fd = +name;
                var stream = FS.getStream(fd);
                if (!stream) throw new FS.ErrnoError(9);
                var ret = {
                  parent: null,
                  mount: { mountpoint: 'fake' },
                  node_ops: { readlink: function() { return stream.path } }
                };
                ret.parent = ret; // make it look like a simple root node
                return ret;
              }
            };
            return node;
          }
        }, {}, '/proc/self/fd');
      },createStandardStreams:function () {
        // TODO deprecate the old functionality of a single
        // input / output callback and that utilizes FS.createDevice
        // and instead require a unique set of stream ops
  
        // by default, we symlink the standard streams to the
        // default tty devices. however, if the standard streams
        // have been overwritten we create a unique device for
        // them instead.
        if (Module['stdin']) {
          FS.createDevice('/dev', 'stdin', Module['stdin']);
        } else {
          FS.symlink('/dev/tty', '/dev/stdin');
        }
        if (Module['stdout']) {
          FS.createDevice('/dev', 'stdout', null, Module['stdout']);
        } else {
          FS.symlink('/dev/tty', '/dev/stdout');
        }
        if (Module['stderr']) {
          FS.createDevice('/dev', 'stderr', null, Module['stderr']);
        } else {
          FS.symlink('/dev/tty1', '/dev/stderr');
        }
  
        // open default streams for the stdin, stdout and stderr devices
        var stdin = FS.open('/dev/stdin', 'r');
        var stdout = FS.open('/dev/stdout', 'w');
        var stderr = FS.open('/dev/stderr', 'w');
        assert(stdin.fd === 0, 'invalid handle for stdin (' + stdin.fd + ')');
        assert(stdout.fd === 1, 'invalid handle for stdout (' + stdout.fd + ')');
        assert(stderr.fd === 2, 'invalid handle for stderr (' + stderr.fd + ')');
      },ensureErrnoError:function () {
        if (FS.ErrnoError) return;
        FS.ErrnoError = function ErrnoError(errno, node) {
          this.node = node;
          this.setErrno = function(errno) {
            this.errno = errno;
            for (var key in ERRNO_CODES) {
              if (ERRNO_CODES[key] === errno) {
                this.code = key;
                break;
              }
            }
          };
          this.setErrno(errno);
          this.message = ERRNO_MESSAGES[errno];
          // Node.js compatibility: assigning on this.stack fails on Node 4 (but fixed on Node 8)
          if (this.stack) Object.defineProperty(this, "stack", { value: (new Error).stack, writable: true });
          if (this.stack) this.stack = demangleAll(this.stack);
        };
        FS.ErrnoError.prototype = new Error();
        FS.ErrnoError.prototype.constructor = FS.ErrnoError;
        // Some errors may happen quite a bit, to avoid overhead we reuse them (and suffer a lack of stack info)
        [2].forEach(function(code) {
          FS.genericErrors[code] = new FS.ErrnoError(code);
          FS.genericErrors[code].stack = '<generic error, no stack>';
        });
      },staticInit:function () {
        FS.ensureErrnoError();
  
        FS.nameTable = new Array(4096);
  
        FS.mount(MEMFS, {}, '/');
  
        FS.createDefaultDirectories();
        FS.createDefaultDevices();
        FS.createSpecialDirectories();
  
        FS.filesystems = {
          'MEMFS': MEMFS,
          'IDBFS': IDBFS,
          'NODEFS': NODEFS,
          'WORKERFS': WORKERFS,
        };
      },init:function (input, output, error) {
        assert(!FS.init.initialized, 'FS.init was previously called. If you want to initialize later with custom parameters, remove any earlier calls (note that one is automatically added to the generated code)');
        FS.init.initialized = true;
  
        FS.ensureErrnoError();
  
        // Allow Module.stdin etc. to provide defaults, if none explicitly passed to us here
        Module['stdin'] = input || Module['stdin'];
        Module['stdout'] = output || Module['stdout'];
        Module['stderr'] = error || Module['stderr'];
  
        FS.createStandardStreams();
      },quit:function () {
        FS.init.initialized = false;
        // force-flush all streams, so we get musl std streams printed out
        var fflush = Module['_fflush'];
        if (fflush) fflush(0);
        // close all of our streams
        for (var i = 0; i < FS.streams.length; i++) {
          var stream = FS.streams[i];
          if (!stream) {
            continue;
          }
          FS.close(stream);
        }
      },getMode:function (canRead, canWrite) {
        var mode = 0;
        if (canRead) mode |= 292 | 73;
        if (canWrite) mode |= 146;
        return mode;
      },joinPath:function (parts, forceRelative) {
        var path = PATH.join.apply(null, parts);
        if (forceRelative && path[0] == '/') path = path.substr(1);
        return path;
      },absolutePath:function (relative, base) {
        return PATH.resolve(base, relative);
      },standardizePath:function (path) {
        return PATH.normalize(path);
      },findObject:function (path, dontResolveLastLink) {
        var ret = FS.analyzePath(path, dontResolveLastLink);
        if (ret.exists) {
          return ret.object;
        } else {
          ___setErrNo(ret.error);
          return null;
        }
      },analyzePath:function (path, dontResolveLastLink) {
        // operate from within the context of the symlink's target
        try {
          var lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
          path = lookup.path;
        } catch (e) {
        }
        var ret = {
          isRoot: false, exists: false, error: 0, name: null, path: null, object: null,
          parentExists: false, parentPath: null, parentObject: null
        };
        try {
          var lookup = FS.lookupPath(path, { parent: true });
          ret.parentExists = true;
          ret.parentPath = lookup.path;
          ret.parentObject = lookup.node;
          ret.name = PATH.basename(path);
          lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
          ret.exists = true;
          ret.path = lookup.path;
          ret.object = lookup.node;
          ret.name = lookup.node.name;
          ret.isRoot = lookup.path === '/';
        } catch (e) {
          ret.error = e.errno;
        };
        return ret;
      },createFolder:function (parent, name, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        return FS.mkdir(path, mode);
      },createPath:function (parent, path, canRead, canWrite) {
        parent = typeof parent === 'string' ? parent : FS.getPath(parent);
        var parts = path.split('/').reverse();
        while (parts.length) {
          var part = parts.pop();
          if (!part) continue;
          var current = PATH.join2(parent, part);
          try {
            FS.mkdir(current);
          } catch (e) {
            // ignore EEXIST
          }
          parent = current;
        }
        return current;
      },createFile:function (parent, name, properties, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        return FS.create(path, mode);
      },createDataFile:function (parent, name, data, canRead, canWrite, canOwn) {
        var path = name ? PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name) : parent;
        var mode = FS.getMode(canRead, canWrite);
        var node = FS.create(path, mode);
        if (data) {
          if (typeof data === 'string') {
            var arr = new Array(data.length);
            for (var i = 0, len = data.length; i < len; ++i) arr[i] = data.charCodeAt(i);
            data = arr;
          }
          // make sure we can write to the file
          FS.chmod(node, mode | 146);
          var stream = FS.open(node, 'w');
          FS.write(stream, data, 0, data.length, 0, canOwn);
          FS.close(stream);
          FS.chmod(node, mode);
        }
        return node;
      },createDevice:function (parent, name, input, output) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(!!input, !!output);
        if (!FS.createDevice.major) FS.createDevice.major = 64;
        var dev = FS.makedev(FS.createDevice.major++, 0);
        // Create a fake device that a set of stream ops to emulate
        // the old behavior.
        FS.registerDevice(dev, {
          open: function(stream) {
            stream.seekable = false;
          },
          close: function(stream) {
            // flush any pending line data
            if (output && output.buffer && output.buffer.length) {
              output(10);
            }
          },
          read: function(stream, buffer, offset, length, pos /* ignored */) {
            var bytesRead = 0;
            for (var i = 0; i < length; i++) {
              var result;
              try {
                result = input();
              } catch (e) {
                throw new FS.ErrnoError(5);
              }
              if (result === undefined && bytesRead === 0) {
                throw new FS.ErrnoError(11);
              }
              if (result === null || result === undefined) break;
              bytesRead++;
              buffer[offset+i] = result;
            }
            if (bytesRead) {
              stream.node.timestamp = Date.now();
            }
            return bytesRead;
          },
          write: function(stream, buffer, offset, length, pos) {
            for (var i = 0; i < length; i++) {
              try {
                output(buffer[offset+i]);
              } catch (e) {
                throw new FS.ErrnoError(5);
              }
            }
            if (length) {
              stream.node.timestamp = Date.now();
            }
            return i;
          }
        });
        return FS.mkdev(path, mode, dev);
      },createLink:function (parent, name, target, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        return FS.symlink(target, path);
      },forceLoadFile:function (obj) {
        if (obj.isDevice || obj.isFolder || obj.link || obj.contents) return true;
        var success = true;
        if (typeof XMLHttpRequest !== 'undefined') {
          throw new Error("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.");
        } else if (Module['read']) {
          // Command-line.
          try {
            // WARNING: Can't read binary files in V8's d8 or tracemonkey's js, as
            //          read() will try to parse UTF8.
            obj.contents = intArrayFromString(Module['read'](obj.url), true);
            obj.usedBytes = obj.contents.length;
          } catch (e) {
            success = false;
          }
        } else {
          throw new Error('Cannot load without read() or XMLHttpRequest.');
        }
        if (!success) ___setErrNo(5);
        return success;
      },createLazyFile:function (parent, name, url, canRead, canWrite) {
        // Lazy chunked Uint8Array (implements get and length from Uint8Array). Actual getting is abstracted away for eventual reuse.
        function LazyUint8Array() {
          this.lengthKnown = false;
          this.chunks = []; // Loaded chunks. Index is the chunk number
        }
        LazyUint8Array.prototype.get = function LazyUint8Array_get(idx) {
          if (idx > this.length-1 || idx < 0) {
            return undefined;
          }
          var chunkOffset = idx % this.chunkSize;
          var chunkNum = (idx / this.chunkSize)|0;
          return this.getter(chunkNum)[chunkOffset];
        }
        LazyUint8Array.prototype.setDataGetter = function LazyUint8Array_setDataGetter(getter) {
          this.getter = getter;
        }
        LazyUint8Array.prototype.cacheLength = function LazyUint8Array_cacheLength() {
          // Find length
          var xhr = new XMLHttpRequest();
          xhr.open('HEAD', url, false);
          xhr.send(null);
          if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
          var datalength = Number(xhr.getResponseHeader("Content-length"));
          var header;
          var hasByteServing = (header = xhr.getResponseHeader("Accept-Ranges")) && header === "bytes";
          var usesGzip = (header = xhr.getResponseHeader("Content-Encoding")) && header === "gzip";
  
          var chunkSize = 1024*1024; // Chunk size in bytes
  
          if (!hasByteServing) chunkSize = datalength;
  
          // Function to get a range from the remote URL.
          var doXHR = (function(from, to) {
            if (from > to) throw new Error("invalid range (" + from + ", " + to + ") or no bytes requested!");
            if (to > datalength-1) throw new Error("only " + datalength + " bytes available! programmer error!");
  
            // TODO: Use mozResponseArrayBuffer, responseStream, etc. if available.
            var xhr = new XMLHttpRequest();
            xhr.open('GET', url, false);
            if (datalength !== chunkSize) xhr.setRequestHeader("Range", "bytes=" + from + "-" + to);
  
            // Some hints to the browser that we want binary data.
            if (typeof Uint8Array != 'undefined') xhr.responseType = 'arraybuffer';
            if (xhr.overrideMimeType) {
              xhr.overrideMimeType('text/plain; charset=x-user-defined');
            }
  
            xhr.send(null);
            if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
            if (xhr.response !== undefined) {
              return new Uint8Array(xhr.response || []);
            } else {
              return intArrayFromString(xhr.responseText || '', true);
            }
          });
          var lazyArray = this;
          lazyArray.setDataGetter(function(chunkNum) {
            var start = chunkNum * chunkSize;
            var end = (chunkNum+1) * chunkSize - 1; // including this byte
            end = Math.min(end, datalength-1); // if datalength-1 is selected, this is the last block
            if (typeof(lazyArray.chunks[chunkNum]) === "undefined") {
              lazyArray.chunks[chunkNum] = doXHR(start, end);
            }
            if (typeof(lazyArray.chunks[chunkNum]) === "undefined") throw new Error("doXHR failed!");
            return lazyArray.chunks[chunkNum];
          });
  
          if (usesGzip || !datalength) {
            // if the server uses gzip or doesn't supply the length, we have to download the whole file to get the (uncompressed) length
            chunkSize = datalength = 1; // this will force getter(0)/doXHR do download the whole file
            datalength = this.getter(0).length;
            chunkSize = datalength;
            console.log("LazyFiles on gzip forces download of the whole file when length is accessed");
          }
  
          this._length = datalength;
          this._chunkSize = chunkSize;
          this.lengthKnown = true;
        }
        if (typeof XMLHttpRequest !== 'undefined') {
          if (!ENVIRONMENT_IS_WORKER) throw 'Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc';
          var lazyArray = new LazyUint8Array();
          Object.defineProperties(lazyArray, {
            length: {
              get: function() {
                if(!this.lengthKnown) {
                  this.cacheLength();
                }
                return this._length;
              }
            },
            chunkSize: {
              get: function() {
                if(!this.lengthKnown) {
                  this.cacheLength();
                }
                return this._chunkSize;
              }
            }
          });
  
          var properties = { isDevice: false, contents: lazyArray };
        } else {
          var properties = { isDevice: false, url: url };
        }
  
        var node = FS.createFile(parent, name, properties, canRead, canWrite);
        // This is a total hack, but I want to get this lazy file code out of the
        // core of MEMFS. If we want to keep this lazy file concept I feel it should
        // be its own thin LAZYFS proxying calls to MEMFS.
        if (properties.contents) {
          node.contents = properties.contents;
        } else if (properties.url) {
          node.contents = null;
          node.url = properties.url;
        }
        // Add a function that defers querying the file size until it is asked the first time.
        Object.defineProperties(node, {
          usedBytes: {
            get: function() { return this.contents.length; }
          }
        });
        // override each stream op with one that tries to force load the lazy file first
        var stream_ops = {};
        var keys = Object.keys(node.stream_ops);
        keys.forEach(function(key) {
          var fn = node.stream_ops[key];
          stream_ops[key] = function forceLoadLazyFile() {
            if (!FS.forceLoadFile(node)) {
              throw new FS.ErrnoError(5);
            }
            return fn.apply(null, arguments);
          };
        });
        // use a custom read function
        stream_ops.read = function stream_ops_read(stream, buffer, offset, length, position) {
          if (!FS.forceLoadFile(node)) {
            throw new FS.ErrnoError(5);
          }
          var contents = stream.node.contents;
          if (position >= contents.length)
            return 0;
          var size = Math.min(contents.length - position, length);
          assert(size >= 0);
          if (contents.slice) { // normal array
            for (var i = 0; i < size; i++) {
              buffer[offset + i] = contents[position + i];
            }
          } else {
            for (var i = 0; i < size; i++) { // LazyUint8Array from sync binary XHR
              buffer[offset + i] = contents.get(position + i);
            }
          }
          return size;
        };
        node.stream_ops = stream_ops;
        return node;
      },createPreloadedFile:function (parent, name, url, canRead, canWrite, onload, onerror, dontCreateFile, canOwn, preFinish) {
        Browser.init(); // XXX perhaps this method should move onto Browser?
        // TODO we should allow people to just pass in a complete filename instead
        // of parent and name being that we just join them anyways
        var fullname = name ? PATH.resolve(PATH.join2(parent, name)) : parent;
        var dep = getUniqueRunDependency('cp ' + fullname); // might have several active requests for the same fullname
        function processData(byteArray) {
          function finish(byteArray) {
            if (preFinish) preFinish();
            if (!dontCreateFile) {
              FS.createDataFile(parent, name, byteArray, canRead, canWrite, canOwn);
            }
            if (onload) onload();
            removeRunDependency(dep);
          }
          var handled = false;
          Module['preloadPlugins'].forEach(function(plugin) {
            if (handled) return;
            if (plugin['canHandle'](fullname)) {
              plugin['handle'](byteArray, fullname, finish, function() {
                if (onerror) onerror();
                removeRunDependency(dep);
              });
              handled = true;
            }
          });
          if (!handled) finish(byteArray);
        }
        addRunDependency(dep);
        if (typeof url == 'string') {
          Browser.asyncLoad(url, function(byteArray) {
            processData(byteArray);
          }, onerror);
        } else {
          processData(url);
        }
      },indexedDB:function () {
        return window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
      },DB_NAME:function () {
        return 'EM_FS_' + window.location.pathname;
      },DB_VERSION:20,DB_STORE_NAME:"FILE_DATA",saveFilesToDB:function (paths, onload, onerror) {
        onload = onload || function(){};
        onerror = onerror || function(){};
        var indexedDB = FS.indexedDB();
        try {
          var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        openRequest.onupgradeneeded = function openRequest_onupgradeneeded() {
          console.log('creating db');
          var db = openRequest.result;
          db.createObjectStore(FS.DB_STORE_NAME);
        };
        openRequest.onsuccess = function openRequest_onsuccess() {
          var db = openRequest.result;
          var transaction = db.transaction([FS.DB_STORE_NAME], 'readwrite');
          var files = transaction.objectStore(FS.DB_STORE_NAME);
          var ok = 0, fail = 0, total = paths.length;
          function finish() {
            if (fail == 0) onload(); else onerror();
          }
          paths.forEach(function(path) {
            var putRequest = files.put(FS.analyzePath(path).object.contents, path);
            putRequest.onsuccess = function putRequest_onsuccess() { ok++; if (ok + fail == total) finish() };
            putRequest.onerror = function putRequest_onerror() { fail++; if (ok + fail == total) finish() };
          });
          transaction.onerror = onerror;
        };
        openRequest.onerror = onerror;
      },loadFilesFromDB:function (paths, onload, onerror) {
        onload = onload || function(){};
        onerror = onerror || function(){};
        var indexedDB = FS.indexedDB();
        try {
          var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        openRequest.onupgradeneeded = onerror; // no database to load from
        openRequest.onsuccess = function openRequest_onsuccess() {
          var db = openRequest.result;
          try {
            var transaction = db.transaction([FS.DB_STORE_NAME], 'readonly');
          } catch(e) {
            onerror(e);
            return;
          }
          var files = transaction.objectStore(FS.DB_STORE_NAME);
          var ok = 0, fail = 0, total = paths.length;
          function finish() {
            if (fail == 0) onload(); else onerror();
          }
          paths.forEach(function(path) {
            var getRequest = files.get(path);
            getRequest.onsuccess = function getRequest_onsuccess() {
              if (FS.analyzePath(path).exists) {
                FS.unlink(path);
              }
              FS.createDataFile(PATH.dirname(path), PATH.basename(path), getRequest.result, true, true, true);
              ok++;
              if (ok + fail == total) finish();
            };
            getRequest.onerror = function getRequest_onerror() { fail++; if (ok + fail == total) finish() };
          });
          transaction.onerror = onerror;
        };
        openRequest.onerror = onerror;
      }};
  Module["FS"] = FS;var SYSCALLS={DEFAULT_POLLMASK:5,mappings:{},umask:511,calculateAt:function (dirfd, path) {
        if (path[0] !== '/') {
          // relative path
          var dir;
          if (dirfd === -100) {
            dir = FS.cwd();
          } else {
            var dirstream = FS.getStream(dirfd);
            if (!dirstream) throw new FS.ErrnoError(ERRNO_CODES.EBADF);
            dir = dirstream.path;
          }
          path = PATH.join2(dir, path);
        }
        return path;
      },doStat:function (func, path, buf) {
        try {
          var stat = func(path);
        } catch (e) {
          if (e && e.node && PATH.normalize(path) !== PATH.normalize(FS.getPath(e.node))) {
            // an error occurred while trying to look up the path; we should just report ENOTDIR
            return -ERRNO_CODES.ENOTDIR;
          }
          throw e;
        }
        HEAP32[((buf)>>2)]=stat.dev;
        HEAP32[(((buf)+(4))>>2)]=0;
        HEAP32[(((buf)+(8))>>2)]=stat.ino;
        HEAP32[(((buf)+(12))>>2)]=stat.mode;
        HEAP32[(((buf)+(16))>>2)]=stat.nlink;
        HEAP32[(((buf)+(20))>>2)]=stat.uid;
        HEAP32[(((buf)+(24))>>2)]=stat.gid;
        HEAP32[(((buf)+(28))>>2)]=stat.rdev;
        HEAP32[(((buf)+(32))>>2)]=0;
        HEAP32[(((buf)+(36))>>2)]=stat.size;
        HEAP32[(((buf)+(40))>>2)]=4096;
        HEAP32[(((buf)+(44))>>2)]=stat.blocks;
        HEAP32[(((buf)+(48))>>2)]=(stat.atime.getTime() / 1000)|0;
        HEAP32[(((buf)+(52))>>2)]=0;
        HEAP32[(((buf)+(56))>>2)]=(stat.mtime.getTime() / 1000)|0;
        HEAP32[(((buf)+(60))>>2)]=0;
        HEAP32[(((buf)+(64))>>2)]=(stat.ctime.getTime() / 1000)|0;
        HEAP32[(((buf)+(68))>>2)]=0;
        HEAP32[(((buf)+(72))>>2)]=stat.ino;
        return 0;
      },doMsync:function (addr, stream, len, flags) {
        var buffer = new Uint8Array(HEAPU8.subarray(addr, addr + len));
        FS.msync(stream, buffer, 0, len, flags);
      },doMkdir:function (path, mode) {
        // remove a trailing slash, if one - /a/b/ has basename of '', but
        // we want to create b in the context of this function
        path = PATH.normalize(path);
        if (path[path.length-1] === '/') path = path.substr(0, path.length-1);
        FS.mkdir(path, mode, 0);
        return 0;
      },doMknod:function (path, mode, dev) {
        // we don't want this in the JS API as it uses mknod to create all nodes.
        switch (mode & 61440) {
          case 32768:
          case 8192:
          case 24576:
          case 4096:
          case 49152:
            break;
          default: return -ERRNO_CODES.EINVAL;
        }
        FS.mknod(path, mode, dev);
        return 0;
      },doReadlink:function (path, buf, bufsize) {
        if (bufsize <= 0) return -ERRNO_CODES.EINVAL;
        var ret = FS.readlink(path);
  
        var len = Math.min(bufsize, lengthBytesUTF8(ret));
        var endChar = HEAP8[buf+len];
        stringToUTF8(ret, buf, bufsize+1);
        // readlink is one of the rare functions that write out a C string, but does never append a null to the output buffer(!)
        // stringToUTF8() always appends a null byte, so restore the character under the null byte after the write.
        HEAP8[buf+len] = endChar;
  
        return len;
      },doAccess:function (path, amode) {
        if (amode & ~7) {
          // need a valid mode
          return -ERRNO_CODES.EINVAL;
        }
        var node;
        var lookup = FS.lookupPath(path, { follow: true });
        node = lookup.node;
        var perms = '';
        if (amode & 4) perms += 'r';
        if (amode & 2) perms += 'w';
        if (amode & 1) perms += 'x';
        if (perms /* otherwise, they've just passed F_OK */ && FS.nodePermissions(node, perms)) {
          return -ERRNO_CODES.EACCES;
        }
        return 0;
      },doDup:function (path, flags, suggestFD) {
        var suggest = FS.getStream(suggestFD);
        if (suggest) FS.close(suggest);
        return FS.open(path, flags, 0, suggestFD, suggestFD).fd;
      },doReadv:function (stream, iov, iovcnt, offset) {
        var ret = 0;
        for (var i = 0; i < iovcnt; i++) {
          var ptr = HEAP32[(((iov)+(i*8))>>2)];
          var len = HEAP32[(((iov)+(i*8 + 4))>>2)];
          var curr = FS.read(stream, HEAP8,ptr, len, offset);
          if (curr < 0) return -1;
          ret += curr;
          if (curr < len) break; // nothing more to read
        }
        return ret;
      },doWritev:function (stream, iov, iovcnt, offset) {
        var ret = 0;
        for (var i = 0; i < iovcnt; i++) {
          var ptr = HEAP32[(((iov)+(i*8))>>2)];
          var len = HEAP32[(((iov)+(i*8 + 4))>>2)];
          var curr = FS.write(stream, HEAP8,ptr, len, offset);
          if (curr < 0) return -1;
          ret += curr;
        }
        return ret;
      },varargs:0,get:function (varargs) {
        SYSCALLS.varargs += 4;
        var ret = HEAP32[(((SYSCALLS.varargs)-(4))>>2)];
        return ret;
      },getStr:function () {
        var ret = UTF8ToString(SYSCALLS.get());
        return ret;
      },getStreamFromFD:function () {
        var stream = FS.getStream(SYSCALLS.get());
        if (!stream) throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        return stream;
      },getSocketFromFD:function () {
        var socket = SOCKFS.getSocket(SYSCALLS.get());
        if (!socket) throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        return socket;
      },getSocketAddress:function (allowNull) {
        var addrp = SYSCALLS.get(), addrlen = SYSCALLS.get();
        if (allowNull && addrp === 0) return null;
        var info = __read_sockaddr(addrp, addrlen);
        if (info.errno) throw new FS.ErrnoError(info.errno);
        info.addr = DNS.lookup_addr(info.addr) || info.addr;
        return info;
      },get64:function () {
        var low = SYSCALLS.get(), high = SYSCALLS.get();
        if (low >= 0) assert(high === 0);
        else assert(high === -1);
        return low;
      },getZero:function () {
        assert(SYSCALLS.get() === 0);
      }};
  Module["SYSCALLS"] = SYSCALLS;function ___syscall140(which, varargs) {SYSCALLS.varargs = varargs;
  try {
   // llseek
      var stream = SYSCALLS.getStreamFromFD(), offset_high = SYSCALLS.get(), offset_low = SYSCALLS.get(), result = SYSCALLS.get(), whence = SYSCALLS.get();
      // NOTE: offset_high is unused - Emscripten's off_t is 32-bit
      var offset = offset_low;
      FS.llseek(stream, offset, whence);
      HEAP32[((result)>>2)]=stream.position;
      if (stream.getdents && offset === 0 && whence === 0) stream.getdents = null; // reset readdir state
      return 0;
    } catch (e) {
    if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
    return -e.errno;
  }
  }
  Module["___syscall140"] = ___syscall140;

  function ___syscall145(which, varargs) {SYSCALLS.varargs = varargs;
  try {
   // readv
      var stream = SYSCALLS.getStreamFromFD(), iov = SYSCALLS.get(), iovcnt = SYSCALLS.get();
      return SYSCALLS.doReadv(stream, iov, iovcnt);
    } catch (e) {
    if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
    return -e.errno;
  }
  }
  Module["___syscall145"] = ___syscall145;

  function ___syscall146(which, varargs) {SYSCALLS.varargs = varargs;
  try {
   // writev
      var stream = SYSCALLS.getStreamFromFD(), iov = SYSCALLS.get(), iovcnt = SYSCALLS.get();
      return SYSCALLS.doWritev(stream, iov, iovcnt);
    } catch (e) {
    if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
    return -e.errno;
  }
  }
  Module["___syscall146"] = ___syscall146;

  function ___syscall221(which, varargs) {SYSCALLS.varargs = varargs;
  try {
   // fcntl64
      var stream = SYSCALLS.getStreamFromFD(), cmd = SYSCALLS.get();
      switch (cmd) {
        case 0: {
          var arg = SYSCALLS.get();
          if (arg < 0) {
            return -ERRNO_CODES.EINVAL;
          }
          var newStream;
          newStream = FS.open(stream.path, stream.flags, 0, arg);
          return newStream.fd;
        }
        case 1:
        case 2:
          return 0;  // FD_CLOEXEC makes no sense for a single process.
        case 3:
          return stream.flags;
        case 4: {
          var arg = SYSCALLS.get();
          stream.flags |= arg;
          return 0;
        }
        case 12:
        /* case 12: Currently in musl F_GETLK64 has same value as F_GETLK, so omitted to avoid duplicate case blocks. If that changes, uncomment this */ {
          
          var arg = SYSCALLS.get();
          var offset = 0;
          // We're always unlocked.
          HEAP16[(((arg)+(offset))>>1)]=2;
          return 0;
        }
        case 13:
        case 14:
        /* case 13: Currently in musl F_SETLK64 has same value as F_SETLK, so omitted to avoid duplicate case blocks. If that changes, uncomment this */
        /* case 14: Currently in musl F_SETLKW64 has same value as F_SETLKW, so omitted to avoid duplicate case blocks. If that changes, uncomment this */
          
          
          return 0; // Pretend that the locking is successful.
        case 16:
        case 8:
          return -ERRNO_CODES.EINVAL; // These are for sockets. We don't have them fully implemented yet.
        case 9:
          // musl trusts getown return values, due to a bug where they must be, as they overlap with errors. just return -1 here, so fnctl() returns that, and we set errno ourselves.
          ___setErrNo(ERRNO_CODES.EINVAL);
          return -1;
        default: {
          return -ERRNO_CODES.EINVAL;
        }
      }
    } catch (e) {
    if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
    return -e.errno;
  }
  }
  Module["___syscall221"] = ___syscall221;

  function ___syscall5(which, varargs) {SYSCALLS.varargs = varargs;
  try {
   // open
      var pathname = SYSCALLS.getStr(), flags = SYSCALLS.get(), mode = SYSCALLS.get() // optional TODO
      var stream = FS.open(pathname, flags, mode);
      return stream.fd;
    } catch (e) {
    if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
    return -e.errno;
  }
  }
  Module["___syscall5"] = ___syscall5;

  function ___syscall54(which, varargs) {SYSCALLS.varargs = varargs;
  try {
   // ioctl
      var stream = SYSCALLS.getStreamFromFD(), op = SYSCALLS.get();
      switch (op) {
        case 21509:
        case 21505: {
          if (!stream.tty) return -ERRNO_CODES.ENOTTY;
          return 0;
        }
        case 21510:
        case 21511:
        case 21512:
        case 21506:
        case 21507:
        case 21508: {
          if (!stream.tty) return -ERRNO_CODES.ENOTTY;
          return 0; // no-op, not actually adjusting terminal settings
        }
        case 21519: {
          if (!stream.tty) return -ERRNO_CODES.ENOTTY;
          var argp = SYSCALLS.get();
          HEAP32[((argp)>>2)]=0;
          return 0;
        }
        case 21520: {
          if (!stream.tty) return -ERRNO_CODES.ENOTTY;
          return -ERRNO_CODES.EINVAL; // not supported
        }
        case 21531: {
          var argp = SYSCALLS.get();
          return FS.ioctl(stream, op, argp);
        }
        case 21523: {
          // TODO: in theory we should write to the winsize struct that gets
          // passed in, but for now musl doesn't read anything on it
          if (!stream.tty) return -ERRNO_CODES.ENOTTY;
          return 0;
        }
        case 21524: {
          // TODO: technically, this ioctl call should change the window size.
          // but, since emscripten doesn't have any concept of a terminal window
          // yet, we'll just silently throw it away as we do TIOCGWINSZ
          if (!stream.tty) return -ERRNO_CODES.ENOTTY;
          return 0;
        }
        default: abort('bad ioctl syscall ' + op);
      }
    } catch (e) {
    if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
    return -e.errno;
  }
  }
  Module["___syscall54"] = ___syscall54;

  function ___syscall6(which, varargs) {SYSCALLS.varargs = varargs;
  try {
   // close
      var stream = SYSCALLS.getStreamFromFD();
      FS.close(stream);
      return 0;
    } catch (e) {
    if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
    return -e.errno;
  }
  }
  Module["___syscall6"] = ___syscall6;

  function ___unlock() {}
  Module["___unlock"] = ___unlock;

  function ___wait() {}
  Module["___wait"] = ___wait;

  function _emscripten_get_heap_size() {
      return TOTAL_MEMORY;
    }
  Module["_emscripten_get_heap_size"] = _emscripten_get_heap_size;

  
  function abortOnCannotGrowMemory(requestedSize) {
      abort('Cannot enlarge memory arrays to size ' + requestedSize + ' bytes (OOM). Either (1) compile with  -s TOTAL_MEMORY=X  with X higher than the current value ' + TOTAL_MEMORY + ', (2) compile with  -s ALLOW_MEMORY_GROWTH=1  which allows increasing the size at runtime, or (3) if you want malloc to return NULL (0) instead of this abort, compile with  -s ABORTING_MALLOC=0 ');
    }
  Module["abortOnCannotGrowMemory"] = abortOnCannotGrowMemory;function _emscripten_resize_heap(requestedSize) {
      abortOnCannotGrowMemory(requestedSize);
    }
  Module["_emscripten_resize_heap"] = _emscripten_resize_heap;

   

  
  function _emscripten_memcpy_big(dest, src, num) {
      HEAPU8.set(HEAPU8.subarray(src, src+num), dest);
    }
  Module["_emscripten_memcpy_big"] = _emscripten_memcpy_big;
  
   

   

   

   
FS.staticInit();;
if (ENVIRONMENT_IS_NODE) { var fs = require("fs"); var NODEJS_PATH = require("path"); NODEFS.staticInit(); };
var ASSERTIONS = true;

// Copyright 2017 The Emscripten Authors.  All rights reserved.
// Emscripten is available under two separate licenses, the MIT license and the
// University of Illinois/NCSA Open Source License.  Both these licenses can be
// found in the LICENSE file.

/** @type {function(string, boolean=, number=)} */
function intArrayFromString(stringy, dontAddNull, length) {
  var len = length > 0 ? length : lengthBytesUTF8(stringy)+1;
  var u8array = new Array(len);
  var numBytesWritten = stringToUTF8Array(stringy, u8array, 0, u8array.length);
  if (dontAddNull) u8array.length = numBytesWritten;
  return u8array;
}

function intArrayToString(array) {
  var ret = [];
  for (var i = 0; i < array.length; i++) {
    var chr = array[i];
    if (chr > 0xFF) {
      if (ASSERTIONS) {
        assert(false, 'Character code ' + chr + ' (' + String.fromCharCode(chr) + ')  at offset ' + i + ' not in 0x00-0xFF.');
      }
      chr &= 0xFF;
    }
    ret.push(String.fromCharCode(chr));
  }
  return ret.join('');
}


// ASM_LIBRARY EXTERN PRIMITIVES: Int8Array,Int32Array


function nullFunc_ii(x) { err("Invalid function pointer called with signature 'ii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");  err("Build with ASSERTIONS=2 for more info.");abort(x) }

function nullFunc_iiii(x) { err("Invalid function pointer called with signature 'iiii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");  err("Build with ASSERTIONS=2 for more info.");abort(x) }

function nullFunc_iiiiiiiiiii(x) { err("Invalid function pointer called with signature 'iiiiiiiiiii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");  err("Build with ASSERTIONS=2 for more info.");abort(x) }

function nullFunc_iiiiiiiiiiiiii(x) { err("Invalid function pointer called with signature 'iiiiiiiiiiiiii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");  err("Build with ASSERTIONS=2 for more info.");abort(x) }

function nullFunc_vi(x) { err("Invalid function pointer called with signature 'vi'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");  err("Build with ASSERTIONS=2 for more info.");abort(x) }

function nullFunc_viii(x) { err("Invalid function pointer called with signature 'viii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");  err("Build with ASSERTIONS=2 for more info.");abort(x) }

var asmGlobalArg = {}

var asmLibraryArg = {
  "abort": abort,
  "setTempRet0": setTempRet0,
  "getTempRet0": getTempRet0,
  "abortStackOverflow": abortStackOverflow,
  "nullFunc_ii": nullFunc_ii,
  "nullFunc_iiii": nullFunc_iiii,
  "nullFunc_iiiiiiiiiii": nullFunc_iiiiiiiiiii,
  "nullFunc_iiiiiiiiiiiiii": nullFunc_iiiiiiiiiiiiii,
  "nullFunc_vi": nullFunc_vi,
  "nullFunc_viii": nullFunc_viii,
  "___lock": ___lock,
  "___setErrNo": ___setErrNo,
  "___syscall140": ___syscall140,
  "___syscall145": ___syscall145,
  "___syscall146": ___syscall146,
  "___syscall221": ___syscall221,
  "___syscall5": ___syscall5,
  "___syscall54": ___syscall54,
  "___syscall6": ___syscall6,
  "___unlock": ___unlock,
  "___wait": ___wait,
  "_emscripten_get_heap_size": _emscripten_get_heap_size,
  "_emscripten_memcpy_big": _emscripten_memcpy_big,
  "_emscripten_resize_heap": _emscripten_resize_heap,
  "abortOnCannotGrowMemory": abortOnCannotGrowMemory,
  "tempDoublePtr": tempDoublePtr,
  "DYNAMICTOP_PTR": DYNAMICTOP_PTR
}
// EMSCRIPTEN_START_ASM
var asm =Module["asm"]// EMSCRIPTEN_END_ASM
(asmGlobalArg, asmLibraryArg, buffer);

var real__FDK_Fetch = asm["_FDK_Fetch"]; asm["_FDK_Fetch"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__FDK_Fetch.apply(null, arguments);
};

var real__FDK_InitBitBuffer = asm["_FDK_InitBitBuffer"]; asm["_FDK_InitBitBuffer"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__FDK_InitBitBuffer.apply(null, arguments);
};

var real__FDK_ResetBitBuffer = asm["_FDK_ResetBitBuffer"]; asm["_FDK_ResetBitBuffer"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__FDK_ResetBitBuffer.apply(null, arguments);
};

var real__FDK_chMapDescr_getMapValue = asm["_FDK_chMapDescr_getMapValue"]; asm["_FDK_chMapDescr_getMapValue"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__FDK_chMapDescr_getMapValue.apply(null, arguments);
};

var real__FDK_chMapDescr_init = asm["_FDK_chMapDescr_init"]; asm["_FDK_chMapDescr_init"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__FDK_chMapDescr_init.apply(null, arguments);
};

var real__FDK_get32 = asm["_FDK_get32"]; asm["_FDK_get32"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__FDK_get32.apply(null, arguments);
};

var real__FDK_getValidBits = asm["_FDK_getValidBits"]; asm["_FDK_getValidBits"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__FDK_getValidBits.apply(null, arguments);
};

var real__FDK_pushBack = asm["_FDK_pushBack"]; asm["_FDK_pushBack"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__FDK_pushBack.apply(null, arguments);
};

var real__FDK_pushForward = asm["_FDK_pushForward"]; asm["_FDK_pushForward"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__FDK_pushForward.apply(null, arguments);
};

var real__FDK_put = asm["_FDK_put"]; asm["_FDK_put"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__FDK_put.apply(null, arguments);
};

var real__FDK_sacenc_close = asm["_FDK_sacenc_close"]; asm["_FDK_sacenc_close"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__FDK_sacenc_close.apply(null, arguments);
};

var real__FDK_sacenc_encode = asm["_FDK_sacenc_encode"]; asm["_FDK_sacenc_encode"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__FDK_sacenc_encode.apply(null, arguments);
};

var real__FDK_sacenc_getInfo = asm["_FDK_sacenc_getInfo"]; asm["_FDK_sacenc_getInfo"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__FDK_sacenc_getInfo.apply(null, arguments);
};

var real__FDK_sacenc_getLibInfo = asm["_FDK_sacenc_getLibInfo"]; asm["_FDK_sacenc_getLibInfo"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__FDK_sacenc_getLibInfo.apply(null, arguments);
};

var real__FDK_sacenc_init = asm["_FDK_sacenc_init"]; asm["_FDK_sacenc_init"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__FDK_sacenc_init.apply(null, arguments);
};

var real__FDK_sacenc_open = asm["_FDK_sacenc_open"]; asm["_FDK_sacenc_open"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__FDK_sacenc_open.apply(null, arguments);
};

var real__FDK_sacenc_setParam = asm["_FDK_sacenc_setParam"]; asm["_FDK_sacenc_setParam"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__FDK_sacenc_setParam.apply(null, arguments);
};

var real__FDK_toolsGetLibInfo = asm["_FDK_toolsGetLibInfo"]; asm["_FDK_toolsGetLibInfo"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__FDK_toolsGetLibInfo.apply(null, arguments);
};

var real__FDKaacEnc_AacInitDefaultConfig = asm["_FDKaacEnc_AacInitDefaultConfig"]; asm["_FDKaacEnc_AacInitDefaultConfig"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__FDKaacEnc_AacInitDefaultConfig.apply(null, arguments);
};

var real__FDKaacEnc_CalcBitsPerFrame = asm["_FDKaacEnc_CalcBitsPerFrame"]; asm["_FDKaacEnc_CalcBitsPerFrame"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__FDKaacEnc_CalcBitsPerFrame.apply(null, arguments);
};

var real__FDKaacEnc_Close = asm["_FDKaacEnc_Close"]; asm["_FDKaacEnc_Close"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__FDKaacEnc_Close.apply(null, arguments);
};

var real__FDKaacEnc_EncodeFrame = asm["_FDKaacEnc_EncodeFrame"]; asm["_FDKaacEnc_EncodeFrame"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__FDKaacEnc_EncodeFrame.apply(null, arguments);
};

var real__FDKaacEnc_GetBitReservoirState = asm["_FDKaacEnc_GetBitReservoirState"]; asm["_FDKaacEnc_GetBitReservoirState"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__FDKaacEnc_GetBitReservoirState.apply(null, arguments);
};

var real__FDKaacEnc_GetVBRBitrate = asm["_FDKaacEnc_GetVBRBitrate"]; asm["_FDKaacEnc_GetVBRBitrate"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__FDKaacEnc_GetVBRBitrate.apply(null, arguments);
};

var real__FDKaacEnc_Initialize = asm["_FDKaacEnc_Initialize"]; asm["_FDKaacEnc_Initialize"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__FDKaacEnc_Initialize.apply(null, arguments);
};

var real__FDKaacEnc_LimitBitrate = asm["_FDKaacEnc_LimitBitrate"]; asm["_FDKaacEnc_LimitBitrate"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__FDKaacEnc_LimitBitrate.apply(null, arguments);
};

var real__FDKaacEnc_Open = asm["_FDKaacEnc_Open"]; asm["_FDKaacEnc_Open"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__FDKaacEnc_Open.apply(null, arguments);
};

var real__FDKaalloc = asm["_FDKaalloc"]; asm["_FDKaalloc"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__FDKaalloc.apply(null, arguments);
};

var real__FDKaalloc_L = asm["_FDKaalloc_L"]; asm["_FDKaalloc_L"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__FDKaalloc_L.apply(null, arguments);
};

var real__FDKafree = asm["_FDKafree"]; asm["_FDKafree"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__FDKafree.apply(null, arguments);
};

var real__FDKafree_L = asm["_FDKafree_L"]; asm["_FDKafree_L"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__FDKafree_L.apply(null, arguments);
};

var real__FDKcalloc = asm["_FDKcalloc"]; asm["_FDKcalloc"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__FDKcalloc.apply(null, arguments);
};

var real__FDKcalloc_L = asm["_FDKcalloc_L"]; asm["_FDKcalloc_L"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__FDKcalloc_L.apply(null, arguments);
};

var real__FDKfree = asm["_FDKfree"]; asm["_FDKfree"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__FDKfree.apply(null, arguments);
};

var real__FDKfree_L = asm["_FDKfree_L"]; asm["_FDKfree_L"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__FDKfree_L.apply(null, arguments);
};

var real__FDKmemclear = asm["_FDKmemclear"]; asm["_FDKmemclear"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__FDKmemclear.apply(null, arguments);
};

var real__FDKmemcpy = asm["_FDKmemcpy"]; asm["_FDKmemcpy"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__FDKmemcpy.apply(null, arguments);
};

var real__FDKmemmove = asm["_FDKmemmove"]; asm["_FDKmemmove"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__FDKmemmove.apply(null, arguments);
};

var real__FDKsbrEnc_EncodeIcc = asm["_FDKsbrEnc_EncodeIcc"]; asm["_FDKsbrEnc_EncodeIcc"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__FDKsbrEnc_EncodeIcc.apply(null, arguments);
};

var real__FDKsbrEnc_EncodeIid = asm["_FDKsbrEnc_EncodeIid"]; asm["_FDKsbrEnc_EncodeIid"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__FDKsbrEnc_EncodeIid.apply(null, arguments);
};

var real__FDKsbrEnc_WritePSBitstream = asm["_FDKsbrEnc_WritePSBitstream"]; asm["_FDKsbrEnc_WritePSBitstream"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__FDKsbrEnc_WritePSBitstream.apply(null, arguments);
};

var real__FDKsprintf = asm["_FDKsprintf"]; asm["_FDKsprintf"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__FDKsprintf.apply(null, arguments);
};

var real___Z10FDKcrcInitP11FDK_CRCINFOjjj = asm["__Z10FDKcrcInitP11FDK_CRCINFOjjj"]; asm["__Z10FDKcrcInitP11FDK_CRCINFOjjj"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z10FDKcrcInitP11FDK_CRCINFOjjj.apply(null, arguments);
};

var real___Z10PSEnc_InitP19T_PARAMETRIC_STEREOP14T_PSENC_CONFIGiiPh = asm["__Z10PSEnc_InitP19T_PARAMETRIC_STEREOP14T_PSENC_CONFIGiiPh"]; asm["__Z10PSEnc_InitP19T_PARAMETRIC_STEREOP14T_PSENC_CONFIGiiPh"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z10PSEnc_InitP19T_PARAMETRIC_STEREOP14T_PSENC_CONFIGiiPh.apply(null, arguments);
};

var real___Z10mdct_blockP6mdct_tPKsiPliiPK8FIXP_DPKiPs = asm["__Z10mdct_blockP6mdct_tPKsiPliiPK8FIXP_DPKiPs"]; asm["__Z10mdct_blockP6mdct_tPKsiPliiPK8FIXP_DPKiPs"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z10mdct_blockP6mdct_tPKsiPliiPK8FIXP_DPKiPs.apply(null, arguments);
};

var real___Z10setCplxVecP8FIXP_DPKli = asm["__Z10setCplxVecP8FIXP_DPKli"]; asm["__Z10setCplxVecP8FIXP_DPKli"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z10setCplxVecP8FIXP_DPKli.apply(null, arguments);
};

var real___Z11FDKcrcResetP11FDK_CRCINFO = asm["__Z11FDKcrcResetP11FDK_CRCINFO"]; asm["__Z11FDKcrcResetP11FDK_CRCINFO"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z11FDKcrcResetP11FDK_CRCINFO.apply(null, arguments);
};

var real___Z11copyCplxVecP8FIXP_DPKPKS_i = asm["__Z11copyCplxVecP8FIXP_DPKPKS_i"]; asm["__Z11copyCplxVecP8FIXP_DPKPKS_i"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z11copyCplxVecP8FIXP_DPKPKS_i.apply(null, arguments);
};

var real___Z11scaleValuesPlPKlii = asm["__Z11scaleValuesPlPKlii"]; asm["__Z11scaleValuesPlPKlii"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z11scaleValuesPlPKlii.apply(null, arguments);
};

var real___Z11scaleValuesPlii = asm["__Z11scaleValuesPlii"]; asm["__Z11scaleValuesPlii"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z11scaleValuesPlii.apply(null, arguments);
};

var real___Z12FDKcrcEndRegP11FDK_CRCINFOP13FDK_BITSTREAMi = asm["__Z12FDKcrcEndRegP11FDK_CRCINFOP13FDK_BITSTREAMi"]; asm["__Z12FDKcrcEndRegP11FDK_CRCINFOP13FDK_BITSTREAMi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z12FDKcrcEndRegP11FDK_CRCINFOP13FDK_BITSTREAMi.apply(null, arguments);
};

var real___Z12FDKcrcGetCRCP11FDK_CRCINFO = asm["__Z12FDKcrcGetCRCP11FDK_CRCINFO"]; asm["__Z12FDKcrcGetCRCP11FDK_CRCINFO"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z12FDKcrcGetCRCP11FDK_CRCINFO.apply(null, arguments);
};

var real___Z12LdDataVectorPlS_i = asm["__Z12LdDataVectorPlS_i"]; asm["__Z12LdDataVectorPlS_i"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z12LdDataVectorPlS_i.apply(null, arguments);
};

var real___Z12PSEnc_CreatePP19T_PARAMETRIC_STEREO = asm["__Z12PSEnc_CreatePP19T_PARAMETRIC_STEREO"]; asm["__Z12PSEnc_CreatePP19T_PARAMETRIC_STEREO"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z12PSEnc_CreatePP19T_PARAMETRIC_STEREO.apply(null, arguments);
};

var real___Z13CLpc_AnalysisPliPKsiiS_Pi = asm["__Z13CLpc_AnalysisPliPKsiiS_Pi"]; asm["__Z13CLpc_AnalysisPliPKsiiS_Pi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z13CLpc_AnalysisPliPKsiiS_Pi.apply(null, arguments);
};

var real___Z13PSEnc_DestroyPP19T_PARAMETRIC_STEREO = asm["__Z13PSEnc_DestroyPP19T_PARAMETRIC_STEREO"]; asm["__Z13PSEnc_DestroyPP19T_PARAMETRIC_STEREO"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z13PSEnc_DestroyPP19T_PARAMETRIC_STEREO.apply(null, arguments);
};

var real___Z13sumUpCplxPow2PK8FIXP_DPKiiPii = asm["__Z13sumUpCplxPow2PK8FIXP_DPKiiPii"]; asm["__Z13sumUpCplxPow2PK8FIXP_DPKiiPii"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z13sumUpCplxPow2PK8FIXP_DPKiiPii.apply(null, arguments);
};

var real___Z14FDKcrcStartRegP11FDK_CRCINFOP13FDK_BITSTREAMi = asm["__Z14FDKcrcStartRegP11FDK_CRCINFOP13FDK_BITSTREAMi"]; asm["__Z14FDKcrcStartRegP11FDK_CRCINFOP13FDK_BITSTREAMi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z14FDKcrcStartRegP11FDK_CRCINFOP13FDK_BITSTREAMi.apply(null, arguments);
};

var real___Z14adtsWrite_InitP11STRUCT_ADTSP12CODER_CONFIG = asm["__Z14adtsWrite_InitP11STRUCT_ADTSP12CODER_CONFIG"]; asm["__Z14adtsWrite_InitP11STRUCT_ADTSP12CODER_CONFIG"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z14adtsWrite_InitP11STRUCT_ADTSP12CODER_CONFIG.apply(null, arguments);
};

var real___Z14fDivNormSignedllPi = asm["__Z14fDivNormSignedllPi"]; asm["__Z14fDivNormSignedllPi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z14fDivNormSignedllPi.apply(null, arguments);
};

var real___Z14getScalefactorPKli = asm["__Z14getScalefactorPKli"]; asm["__Z14getScalefactorPKli"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z14getScalefactorPKli.apply(null, arguments);
};

var real___Z15FDKaacEnc_BCNewPP13BITCNTR_STATEPh = asm["__Z15FDKaacEnc_BCNewPP13BITCNTR_STATEPh"]; asm["__Z15FDKaacEnc_BCNewPP13BITCNTR_STATEPh"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z15FDKaacEnc_BCNewPP13BITCNTR_STATEPh.apply(null, arguments);
};

var real___Z15FDKaacEnc_QCNewPP8QC_STATEiPh = asm["__Z15FDKaacEnc_QCNewPP8QC_STATEiPh"]; asm["__Z15FDKaacEnc_QCNewPP8QC_STATEiPh"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z15FDKaacEnc_QCNewPP8QC_STATEiPh.apply(null, arguments);
};

var real___Z15GetRam_PsEncodei = asm["__Z15GetRam_PsEncodei"]; asm["__Z15GetRam_PsEncodei"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z15GetRam_PsEncodei.apply(null, arguments);
};

var real___Z15fdkFreeMatrix1DPv = asm["__Z15fdkFreeMatrix1DPv"]; asm["__Z15fdkFreeMatrix1DPv"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z15fdkFreeMatrix1DPv.apply(null, arguments);
};

var real___Z15fdkFreeMatrix2DPPv = asm["__Z15fdkFreeMatrix2DPPv"]; asm["__Z15fdkFreeMatrix2DPPv"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z15fdkFreeMatrix2DPPv.apply(null, arguments);
};

var real___Z15fdkFreeMatrix3DPPPv = asm["__Z15fdkFreeMatrix3DPPPv"]; asm["__Z15fdkFreeMatrix3DPPPv"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z15fdkFreeMatrix3DPPPv.apply(null, arguments);
};

var real___Z16CLpc_ParcorToLpcPKsPsiPl = asm["__Z16CLpc_ParcorToLpcPKsPsiPl"]; asm["__Z16CLpc_ParcorToLpcPKsPsiPl"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z16CLpc_ParcorToLpcPKsPsiPl.apply(null, arguments);
};

var real___Z16FDK_deinterleavePKlPsjjj = asm["__Z16FDK_deinterleavePKlPsjjj"]; asm["__Z16FDK_deinterleavePKlPsjjj"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z16FDK_deinterleavePKlPsjjj.apply(null, arguments);
};

var real___Z16FDK_deinterleavePKsPsjjj = asm["__Z16FDK_deinterleavePKsPsjjj"]; asm["__Z16FDK_deinterleavePKsPsjjj"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z16FDK_deinterleavePKsPsjjj.apply(null, arguments);
};

var real___Z16FDKaacEnc_PsyNewPP12PSY_INTERNALiiPh = asm["__Z16FDKaacEnc_PsyNewPP12PSY_INTERNALiiPh"]; asm["__Z16FDKaacEnc_PsyNewPP12PSY_INTERNALiiPh"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z16FDKaacEnc_PsyNewPP12PSY_INTERNALiiPh.apply(null, arguments);
};

var real___Z16FDKaacEnc_QCInitP8QC_STATEP7QC_INITm = asm["__Z16FDKaacEnc_QCInitP8QC_STATEP7QC_INITm"]; asm["__Z16FDKaacEnc_QCInitP8QC_STATEP7QC_INITm"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z16FDKaacEnc_QCInitP8QC_STATEP7QC_INITm.apply(null, arguments);
};

var real___Z16FDKaacEnc_QCMainP8QC_STATEPP7PSY_OUTPP6QC_OUTiP15CHANNEL_MAPPING17AUDIO_OBJECT_TYPEja = asm["__Z16FDKaacEnc_QCMainP8QC_STATEPP7PSY_OUTPP6QC_OUTiP15CHANNEL_MAPPING17AUDIO_OBJECT_TYPEja"]; asm["__Z16FDKaacEnc_QCMainP8QC_STATEPP7PSY_OUTPP6QC_OUTiP15CHANNEL_MAPPING17AUDIO_OBJECT_TYPEja"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z16FDKaacEnc_QCMainP8QC_STATEPP7PSY_OUTPP6QC_OUTiP15CHANNEL_MAPPING17AUDIO_OBJECT_TYPEja.apply(null, arguments);
};

var real___Z16FreeRam_PsEncodePP11T_PS_ENCODE = asm["__Z16FreeRam_PsEncodePP11T_PS_ENCODE"]; asm["__Z16FreeRam_PsEncodePP11T_PS_ENCODE"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z16FreeRam_PsEncodePP11T_PS_ENCODE.apply(null, arguments);
};

var real___Z16autoCorr2nd_cplxP11ACORR_COEFSPKlS2_i = asm["__Z16autoCorr2nd_cplxP11ACORR_COEFSPKlS2_i"]; asm["__Z16autoCorr2nd_cplxP11ACORR_COEFSPKlS2_i"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z16autoCorr2nd_cplxP11ACORR_COEFSPKlS2_i.apply(null, arguments);
};

var real___Z16calcCoherenceVecPlPKlS1_S1_S1_iii = asm["__Z16calcCoherenceVecPlPKlS1_S1_S1_iii"]; asm["__Z16calcCoherenceVecPlPKlS1_S1_S1_iii"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z16calcCoherenceVecPlPKlS1_S1_S1_iii.apply(null, arguments);
};

var real___Z16fDivNormHighPrecllPi = asm["__Z16fDivNormHighPrecllPi"]; asm["__Z16fDivNormHighPrecllPi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z16fDivNormHighPrecllPi.apply(null, arguments);
};

var real___Z16getChannelConfig12CHANNEL_MODEh = asm["__Z16getChannelConfig12CHANNEL_MODEh"]; asm["__Z16getChannelConfig12CHANNEL_MODEh"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z16getChannelConfig12CHANNEL_MODEh.apply(null, arguments);
};

var real___Z17CLpc_AutoToParcorPliPsiS_Pi = asm["__Z17CLpc_AutoToParcorPliPsiS_Pi"]; asm["__Z17CLpc_AutoToParcorPliPsiS_Pi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z17CLpc_AutoToParcorPliPsiS_Pi.apply(null, arguments);
};

var real___Z17FDK_MpegsEnc_InitP11MPS_ENCODER17AUDIO_OBJECT_TYPEjjjjjj = asm["__Z17FDK_MpegsEnc_InitP11MPS_ENCODER17AUDIO_OBJECT_TYPEjjjjjj"]; asm["__Z17FDK_MpegsEnc_InitP11MPS_ENCODER17AUDIO_OBJECT_TYPEjjjjjj"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z17FDK_MpegsEnc_InitP11MPS_ENCODER17AUDIO_OBJECT_TYPEjjjjjj.apply(null, arguments);
};

var real___Z17FDK_MpegsEnc_OpenPP11MPS_ENCODER = asm["__Z17FDK_MpegsEnc_OpenPP11MPS_ENCODER"]; asm["__Z17FDK_MpegsEnc_OpenPP11MPS_ENCODER"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z17FDK_MpegsEnc_OpenPP11MPS_ENCODER.apply(null, arguments);
};

var real___Z17FDKaacEnc_BCClosePP13BITCNTR_STATE = asm["__Z17FDKaacEnc_BCClosePP13BITCNTR_STATE"]; asm["__Z17FDKaacEnc_BCClosePP13BITCNTR_STATE"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z17FDKaacEnc_BCClosePP13BITCNTR_STATE.apply(null, arguments);
};

var real___Z17FDKaacEnc_QCClosePP8QC_STATEPP6QC_OUT = asm["__Z17FDKaacEnc_QCClosePP8QC_STATEPP6QC_OUT"]; asm["__Z17FDKaacEnc_QCClosePP8QC_STATEPP6QC_OUT"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z17FDKaacEnc_QCClosePP8QC_STATEPP6QC_OUT.apply(null, arguments);
};

var real___Z17FDKaacEnc_TnsSyncP8TNS_DATAPKS_P8TNS_INFOS4_iiPK10TNS_CONFIG = asm["__Z17FDKaacEnc_TnsSyncP8TNS_DATAPKS_P8TNS_INFOS4_iiPK10TNS_CONFIG"]; asm["__Z17FDKaacEnc_TnsSyncP8TNS_DATAPKS_P8TNS_INFOS4_iiPK10TNS_CONFIG"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z17FDKaacEnc_TnsSyncP8TNS_DATAPKS_P8TNS_INFOS4_iiPK10TNS_CONFIG.apply(null, arguments);
};

var real___Z17FDKaacEnc_psyInitP12PSY_INTERNALPP7PSY_OUTii17AUDIO_OBJECT_TYPEP15CHANNEL_MAPPING = asm["__Z17FDKaacEnc_psyInitP12PSY_INTERNALPP7PSY_OUTii17AUDIO_OBJECT_TYPEP15CHANNEL_MAPPING"]; asm["__Z17FDKaacEnc_psyInitP12PSY_INTERNALPP7PSY_OUTii17AUDIO_OBJECT_TYPEP15CHANNEL_MAPPING"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z17FDKaacEnc_psyInitP12PSY_INTERNALPP7PSY_OUTii17AUDIO_OBJECT_TYPEP15CHANNEL_MAPPING.apply(null, arguments);
};

var real___Z17FDKaacEnc_psyMainiP11PSY_ELEMENTP11PSY_DYNAMICP17PSY_CONFIGURATIONP15PSY_OUT_ELEMENTPsjPii = asm["__Z17FDKaacEnc_psyMainiP11PSY_ELEMENTP11PSY_DYNAMICP17PSY_CONFIGURATIONP15PSY_OUT_ELEMENTPsjPii"]; asm["__Z17FDKaacEnc_psyMainiP11PSY_ELEMENTP11PSY_DYNAMICP17PSY_CONFIGURATIONP15PSY_OUT_ELEMENTPsjPii"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z17FDKaacEnc_psyMainiP11PSY_ELEMENTP11PSY_DYNAMICP17PSY_CONFIGURATIONP15PSY_OUT_ELEMENTPsjPii.apply(null, arguments);
};

var real___Z17FDKgetWindowSlopeii = asm["__Z17FDKgetWindowSlopeii"]; asm["__Z17FDKgetWindowSlopeii"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z17FDKgetWindowSlopeii.apply(null, arguments);
};

var real___Z17FDKsbrEnc_AddLeftPiS_i = asm["__Z17FDKsbrEnc_AddLeftPiS_i"]; asm["__Z17FDKsbrEnc_AddLeftPiS_i"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z17FDKsbrEnc_AddLeftPiS_i.apply(null, arguments);
};

var real___Z17GetAACdynamic_RAMi = asm["__Z17GetAACdynamic_RAMi"]; asm["__Z17GetAACdynamic_RAMi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z17GetAACdynamic_RAMi.apply(null, arguments);
};

var real___Z17GetRam_SbrChanneli = asm["__Z17GetRam_SbrChanneli"]; asm["__Z17GetRam_SbrChanneli"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z17GetRam_SbrChanneli.apply(null, arguments);
};

var real___Z17GetRam_SbrElementi = asm["__Z17GetRam_SbrElementi"]; asm["__Z17GetRam_SbrElementi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z17GetRam_SbrElementi.apply(null, arguments);
};

var real___Z17GetRam_SbrEncoderi = asm["__Z17GetRam_SbrEncoderi"]; asm["__Z17GetRam_SbrEncoderi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z17GetRam_SbrEncoderi.apply(null, arguments);
};

var real___Z17fdkCallocMatrix1Djj = asm["__Z17fdkCallocMatrix1Djj"]; asm["__Z17fdkCallocMatrix1Djj"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z17fdkCallocMatrix1Djj.apply(null, arguments);
};

var real___Z17fdkCallocMatrix2Djjj = asm["__Z17fdkCallocMatrix2Djjj"]; asm["__Z17fdkCallocMatrix2Djjj"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z17fdkCallocMatrix2Djjj.apply(null, arguments);
};

var real___Z17fdkCallocMatrix3Djjjj = asm["__Z17fdkCallocMatrix3Djjjj"]; asm["__Z17fdkCallocMatrix3Djjjj"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z17fdkCallocMatrix3Djjjj.apply(null, arguments);
};

var real___Z17getScalefactorPCMPKsii = asm["__Z17getScalefactorPCMPKsii"]; asm["__Z17getScalefactorPCMPKsii"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z17getScalefactorPCMPKsii.apply(null, arguments);
};

var real___Z17sumUpCplxPow2Dim2PKPK8FIXP_DPKiiPiiiii = asm["__Z17sumUpCplxPow2Dim2PKPK8FIXP_DPKiiPiiiii"]; asm["__Z17sumUpCplxPow2Dim2PKPK8FIXP_DPKiiPiiiii"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z17sumUpCplxPow2Dim2PKPK8FIXP_DPKiiPiiiii.apply(null, arguments);
};

var real___Z17transportEnc_InitP12TRANSPORTENCPhi14TRANSPORT_TYPEP12CODER_CONFIGj = asm["__Z17transportEnc_InitP12TRANSPORTENCPhi14TRANSPORT_TYPEP12CODER_CONFIGj"]; asm["__Z17transportEnc_InitP12TRANSPORTENCPhi14TRANSPORT_TYPEP12CODER_CONFIGj"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z17transportEnc_InitP12TRANSPORTENCPhi14TRANSPORT_TYPEP12CODER_CONFIGj.apply(null, arguments);
};

var real___Z17transportEnc_OpenPP12TRANSPORTENC = asm["__Z17transportEnc_OpenPP12TRANSPORTENC"]; asm["__Z17transportEnc_OpenPP12TRANSPORTENC"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z17transportEnc_OpenPP12TRANSPORTENC.apply(null, arguments);
};

var real___Z18FDK_MpegsEnc_ClosePP11MPS_ENCODER = asm["__Z18FDK_MpegsEnc_ClosePP11MPS_ENCODER"]; asm["__Z18FDK_MpegsEnc_ClosePP11MPS_ENCODER"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z18FDK_MpegsEnc_ClosePP11MPS_ENCODER.apply(null, arguments);
};

var real___Z18FDKaacEnc_PsyClosePP12PSY_INTERNALPP7PSY_OUT = asm["__Z18FDKaacEnc_PsyClosePP12PSY_INTERNALPP7PSY_OUT"]; asm["__Z18FDKaacEnc_PsyClosePP12PSY_INTERNALPP7PSY_OUT"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z18FDKaacEnc_PsyClosePP12PSY_INTERNALPP7PSY_OUT.apply(null, arguments);
};

var real___Z18FDKaacEnc_QCOutNewPP6QC_OUTiiiPh = asm["__Z18FDKaacEnc_QCOutNewPP6QC_OUTiiiPh"]; asm["__Z18FDKaacEnc_QCOutNewPP6QC_OUTiiiPh"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z18FDKaacEnc_QCOutNewPP6QC_OUTiiiPh.apply(null, arguments);
};

var real___Z18FDKaacEnc_bitCountPKsiiPi = asm["__Z18FDKaacEnc_bitCountPKsiiPi"]; asm["__Z18FDKaacEnc_bitCountPKsiiPi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z18FDKaacEnc_bitCountPKsiiPi.apply(null, arguments);
};

var real___Z18FDKsbrEnc_AddRightPiS_i = asm["__Z18FDKsbrEnc_AddRightPiS_i"]; asm["__Z18FDKsbrEnc_AddRightPiS_i"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z18FDKsbrEnc_AddRightPiS_i.apply(null, arguments);
};

var real___Z18FDKsbrEnc_PSEncodeP11T_PS_ENCODEP8T_PS_OUTPhjPA2_A2_Plii = asm["__Z18FDKsbrEnc_PSEncodeP11T_PS_ENCODEP8T_PS_OUTPhjPA2_A2_Plii"]; asm["__Z18FDKsbrEnc_PSEncodeP11T_PS_ENCODEP8T_PS_OUTPhjPA2_A2_Plii"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z18FDKsbrEnc_PSEncodeP11T_PS_ENCODEP8T_PS_OUTPhjPA2_A2_Plii.apply(null, arguments);
};

var real___Z18FreeAACdynamic_RAMPPl = asm["__Z18FreeAACdynamic_RAMPPl"]; asm["__Z18FreeAACdynamic_RAMPPl"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z18FreeAACdynamic_RAMPPl.apply(null, arguments);
};

var real___Z18FreeRam_SbrChannelPP11SBR_CHANNEL = asm["__Z18FreeRam_SbrChannelPP11SBR_CHANNEL"]; asm["__Z18FreeRam_SbrChannelPP11SBR_CHANNEL"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z18FreeRam_SbrChannelPP11SBR_CHANNEL.apply(null, arguments);
};

var real___Z18FreeRam_SbrElementPP11SBR_ELEMENT = asm["__Z18FreeRam_SbrElementPP11SBR_ELEMENT"]; asm["__Z18FreeRam_SbrElementPP11SBR_ELEMENT"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z18FreeRam_SbrElementPP11SBR_ELEMENT.apply(null, arguments);
};

var real___Z18FreeRam_SbrEncoderPP11SBR_ENCODER = asm["__Z18FreeRam_SbrEncoderPP11SBR_ENCODER"]; asm["__Z18FreeRam_SbrEncoderPP11SBR_ENCODER"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z18FreeRam_SbrEncoderPP11SBR_ENCODER.apply(null, arguments);
};

var real___Z18GetRam_ParamStereoi = asm["__Z18GetRam_ParamStereoi"]; asm["__Z18GetRam_ParamStereoi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z18GetRam_ParamStereoi.apply(null, arguments);
};

var real___Z18aacenc_SscCallbackPvP13FDK_BITSTREAM17AUDIO_OBJECT_TYPEiiiiihPh = asm["__Z18aacenc_SscCallbackPvP13FDK_BITSTREAM17AUDIO_OBJECT_TYPEiiiiihPh"]; asm["__Z18aacenc_SscCallbackPvP13FDK_BITSTREAM17AUDIO_OBJECT_TYPEiiiiihPh"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z18aacenc_SscCallbackPvP13FDK_BITSTREAM17AUDIO_OBJECT_TYPEiiiiihPh.apply(null, arguments);
};

var real___Z18transportEnc_ClosePP12TRANSPORTENC = asm["__Z18transportEnc_ClosePP12TRANSPORTENC"]; asm["__Z18transportEnc_ClosePP12TRANSPORTENC"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z18transportEnc_ClosePP12TRANSPORTENC.apply(null, arguments);
};

var real___Z19FDKaacEnc_AdjThrNewPP13ADJ_THR_STATEi = asm["__Z19FDKaacEnc_AdjThrNewPP13ADJ_THR_STATEi"]; asm["__Z19FDKaacEnc_AdjThrNewPP13ADJ_THR_STATEi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z19FDKaacEnc_AdjThrNewPP13ADJ_THR_STATEi.apply(null, arguments);
};

var real___Z19FDKaacEnc_PnsDetectP10PNS_CONFIGP8PNS_DATAiiiPlPKiS3_PiPsiiiS3_S6_ = asm["__Z19FDKaacEnc_PnsDetectP10PNS_CONFIGP8PNS_DATAiiiPlPKiS3_PiPsiiiS3_S6_"]; asm["__Z19FDKaacEnc_PnsDetectP10PNS_CONFIGP8PNS_DATAiiiPlPKiS3_PiPsiiiS3_S6_"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z19FDKaacEnc_PnsDetectP10PNS_CONFIGP8PNS_DATAiiiPlPKiS3_PiPsiiiS3_S6_.apply(null, arguments);
};

var real___Z19FDKaacEnc_PsyOutNewPP7PSY_OUTiiiPh = asm["__Z19FDKaacEnc_PsyOutNewPP7PSY_OUTiiiPh"]; asm["__Z19FDKaacEnc_PsyOutNewPP7PSY_OUTiiiPh"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z19FDKaacEnc_PsyOutNewPP7PSY_OUTiiiPh.apply(null, arguments);
};

var real___Z19FDKaacEnc_QCOutInitPP6QC_OUTiPK15CHANNEL_MAPPING = asm["__Z19FDKaacEnc_QCOutInitPP6QC_OUTiPK15CHANNEL_MAPPING"]; asm["__Z19FDKaacEnc_QCOutInitPP6QC_OUTiPK15CHANNEL_MAPPING"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z19FDKaacEnc_QCOutInitPP6QC_OUTiPK15CHANNEL_MAPPING.apply(null, arguments);
};

var real___Z19FDKaacEnc_TnsDetectP8TNS_DATAPK10TNS_CONFIGP8TNS_INFOiPKlii = asm["__Z19FDKaacEnc_TnsDetectP8TNS_DATAPK10TNS_CONFIGP8TNS_INFOiPKlii"]; asm["__Z19FDKaacEnc_TnsDetectP8TNS_DATAPK10TNS_CONFIGP8TNS_INFOiPKlii"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z19FDKaacEnc_TnsDetectP8TNS_DATAPK10TNS_CONFIGP8TNS_INFOiPKlii.apply(null, arguments);
};

var real___Z19FDKaacEnc_TnsEncodeP8TNS_INFOP8TNS_DATAiPK10TNS_CONFIGiPlii = asm["__Z19FDKaacEnc_TnsEncodeP8TNS_INFOP8TNS_DATAiPK10TNS_CONFIGiPlii"]; asm["__Z19FDKaacEnc_TnsEncodeP8TNS_INFOP8TNS_DATAiPK10TNS_CONFIGiPlii"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z19FDKaacEnc_TnsEncodeP8TNS_INFOP8TNS_DATAiPK10TNS_CONFIGiPlii.apply(null, arguments);
};

var real___Z19FDKaacEnc_calcSfbPeP15PE_CHANNEL_DATAPKlS2_iiiPKiS4_ = asm["__Z19FDKaacEnc_calcSfbPeP15PE_CHANNEL_DATAPKlS2_iiiPKiS4_"]; asm["__Z19FDKaacEnc_calcSfbPeP15PE_CHANNEL_DATAPKlS2_iiiPKiS4_"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z19FDKaacEnc_calcSfbPeP15PE_CHANNEL_DATAPKlS2_iiiPKiS4_.apply(null, arguments);
};

var real___Z19FreeRam_ParamStereoPP19T_PARAMETRIC_STEREO = asm["__Z19FreeRam_ParamStereoPP19T_PARAMETRIC_STEREO"]; asm["__Z19FreeRam_ParamStereoPP19T_PARAMETRIC_STEREO"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z19FreeRam_ParamStereoPP19T_PARAMETRIC_STEREO.apply(null, arguments);
};

var real___Z19GetRam_aacEnc_QCouti = asm["__Z19GetRam_aacEnc_QCouti"]; asm["__Z19GetRam_aacEnc_QCouti"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z19GetRam_aacEnc_QCouti.apply(null, arguments);
};

var real___Z19adtsWrite_CrcEndRegP11STRUCT_ADTSP13FDK_BITSTREAMi = asm["__Z19adtsWrite_CrcEndRegP11STRUCT_ADTSP13FDK_BITSTREAMi"]; asm["__Z19adtsWrite_CrcEndRegP11STRUCT_ADTSP13FDK_BITSTREAMi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z19adtsWrite_CrcEndRegP11STRUCT_ADTSP13FDK_BITSTREAMi.apply(null, arguments);
};

var real___Z19scaleValuesSaturatePlii = asm["__Z19scaleValuesSaturatePlii"]; asm["__Z19scaleValuesSaturatePlii"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z19scaleValuesSaturatePlii.apply(null, arguments);
};

var real___Z20FDK_MetadataEnc_InitP20FDK_METADATA_ENCODERiiijjj12CHANNEL_MODE13CHANNEL_ORDER = asm["__Z20FDK_MetadataEnc_InitP20FDK_METADATA_ENCODERiiijjj12CHANNEL_MODE13CHANNEL_ORDER"]; asm["__Z20FDK_MetadataEnc_InitP20FDK_METADATA_ENCODERiiijjj12CHANNEL_MODE13CHANNEL_ORDER"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z20FDK_MetadataEnc_InitP20FDK_METADATA_ENCODERiiijjj12CHANNEL_MODE13CHANNEL_ORDER.apply(null, arguments);
};

var real___Z20FDK_MetadataEnc_OpenPP20FDK_METADATA_ENCODERj = asm["__Z20FDK_MetadataEnc_OpenPP20FDK_METADATA_ENCODERj"]; asm["__Z20FDK_MetadataEnc_OpenPP20FDK_METADATA_ENCODERj"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z20FDK_MetadataEnc_OpenPP20FDK_METADATA_ENCODERj.apply(null, arguments);
};

var real___Z20FDK_MpegsEnc_ProcessP11MPS_ENCODERPsiP18AACENC_EXT_PAYLOAD = asm["__Z20FDK_MpegsEnc_ProcessP11MPS_ENCODERPsiP18AACENC_EXT_PAYLOAD"]; asm["__Z20FDK_MpegsEnc_ProcessP11MPS_ENCODERPsiP18AACENC_EXT_PAYLOAD"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z20FDK_MpegsEnc_ProcessP11MPS_ENCODERPsiP18AACENC_EXT_PAYLOAD.apply(null, arguments);
};

var real___Z20FDKaacEnc_AdjThrInitP13ADJ_THR_STATEiiPK15CHANNEL_MAPPINGiii18AACENC_BITRES_MODEiil = asm["__Z20FDKaacEnc_AdjThrInitP13ADJ_THR_STATEiiPK15CHANNEL_MAPPINGiii18AACENC_BITRES_MODEiil"]; asm["__Z20FDKaacEnc_AdjThrInitP13ADJ_THR_STATEiiPK15CHANNEL_MAPPINGiii18AACENC_BITRES_MODEiil"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z20FDKaacEnc_AdjThrInitP13ADJ_THR_STATEiiPK15CHANNEL_MAPPINGiii18AACENC_BITRES_MODEiil.apply(null, arguments);
};

var real___Z20FDKaacEnc_DownsampleP11DOWNSAMPLERPsiS1_Pi = asm["__Z20FDKaacEnc_DownsampleP11DOWNSAMPLERPsiS1_Pi"]; asm["__Z20FDKaacEnc_DownsampleP11DOWNSAMPLERPsiS1_Pi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z20FDKaacEnc_DownsampleP11DOWNSAMPLERPsiS1_Pi.apply(null, arguments);
};

var real___Z20FDKaacEnc_codeValuesPsiiP13FDK_BITSTREAM = asm["__Z20FDKaacEnc_codeValuesPsiiP13FDK_BITSTREAM"]; asm["__Z20FDKaacEnc_codeValuesPsiiP13FDK_BITSTREAM"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z20FDKaacEnc_codeValuesPsiiP13FDK_BITSTREAM.apply(null, arguments);
};

var real___Z20FDKcalcPbScaleFactorPKPK8FIXP_DPKPKhPiiii = asm["__Z20FDKcalcPbScaleFactorPKPK8FIXP_DPKPKhPiiii"]; asm["__Z20FDKcalcPbScaleFactorPKPK8FIXP_DPKPKhPiiii"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z20FDKcalcPbScaleFactorPKPK8FIXP_DPKPKhPiiii.apply(null, arguments);
};

var real___Z20FDKsbrEnc_AddVecLeftPiS_S_i = asm["__Z20FDKsbrEnc_AddVecLeftPiS_S_i"]; asm["__Z20FDKsbrEnc_AddVecLeftPiS_S_i"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z20FDKsbrEnc_AddVecLeftPiS_S_i.apply(null, arguments);
};

var real___Z20FDKsbrEnc_DownsampleP11SBR_ENCODERPsjjPjPhi = asm["__Z20FDKsbrEnc_DownsampleP11SBR_ENCODERPsjjPjPhi"]; asm["__Z20FDKsbrEnc_DownsampleP11SBR_ENCODERPsjjPjPhi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z20FDKsbrEnc_DownsampleP11SBR_ENCODERPsjjPjPhi.apply(null, arguments);
};

var real___Z20FreeRam_aacEnc_QCoutPP6QC_OUT = asm["__Z20FreeRam_aacEnc_QCoutPP6QC_OUT"]; asm["__Z20FreeRam_aacEnc_QCoutPP6QC_OUT"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z20FreeRam_aacEnc_QCoutPP6QC_OUT.apply(null, arguments);
};

var real___Z20GetRam_Sbr_guideScfbi = asm["__Z20GetRam_Sbr_guideScfbi"]; asm["__Z20GetRam_Sbr_guideScfbi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z20GetRam_Sbr_guideScfbi.apply(null, arguments);
};

var real___Z20GetRam_aacEnc_PsyOuti = asm["__Z20GetRam_aacEnc_PsyOuti"]; asm["__Z20GetRam_aacEnc_PsyOuti"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z20GetRam_aacEnc_PsyOuti.apply(null, arguments);
};

var real___Z20qmfAnalysisFilteringP15QMF_FILTER_BANKPPlS2_P16QMF_SCALE_FACTORPKsiiS1_ = asm["__Z20qmfAnalysisFilteringP15QMF_FILTER_BANKPPlS2_P16QMF_SCALE_FACTORPKsiiS1_"]; asm["__Z20qmfAnalysisFilteringP15QMF_FILTER_BANKPPlS2_P16QMF_SCALE_FACTORPKsiiS1_"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z20qmfAnalysisFilteringP15QMF_FILTER_BANKPPlS2_P16QMF_SCALE_FACTORPKsiiS1_.apply(null, arguments);
};

var real___Z20transportEnc_GetConfP12TRANSPORTENCP12CODER_CONFIGP13FDK_BITSTREAMPj = asm["__Z20transportEnc_GetConfP12TRANSPORTENCP12CODER_CONFIGP13FDK_BITSTREAMPj"]; asm["__Z20transportEnc_GetConfP12TRANSPORTENCP12CODER_CONFIGP13FDK_BITSTREAMPj"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z20transportEnc_GetConfP12TRANSPORTENCP12CODER_CONFIGP13FDK_BITSTREAMPj.apply(null, arguments);
};

var real___Z21CreateStreamMuxConfigP11LATM_STREAMP13FDK_BITSTREAMiP13CSTpCallBacks = asm["__Z21CreateStreamMuxConfigP11LATM_STREAMP13FDK_BITSTREAMiP13CSTpCallBacks"]; asm["__Z21CreateStreamMuxConfigP11LATM_STREAMP13FDK_BITSTREAMiP13CSTpCallBacks"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z21CreateStreamMuxConfigP11LATM_STREAMP13FDK_BITSTREAMiP13CSTpCallBacks.apply(null, arguments);
};

var real___Z21FDK_MetadataEnc_ClosePP20FDK_METADATA_ENCODER = asm["__Z21FDK_MetadataEnc_ClosePP20FDK_METADATA_ENCODER"]; asm["__Z21FDK_MetadataEnc_ClosePP20FDK_METADATA_ENCODER"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z21FDK_MetadataEnc_ClosePP20FDK_METADATA_ENCODER.apply(null, arguments);
};

var real___Z21FDK_MpegsEnc_GetDelayP11MPS_ENCODER = asm["__Z21FDK_MpegsEnc_GetDelayP11MPS_ENCODER"]; asm["__Z21FDK_MpegsEnc_GetDelayP11MPS_ENCODER"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z21FDK_MpegsEnc_GetDelayP11MPS_ENCODER.apply(null, arguments);
};

var real___Z21FDKaacEnc_AdjThrClosePP13ADJ_THR_STATE = asm["__Z21FDKaacEnc_AdjThrClosePP13ADJ_THR_STATE"]; asm["__Z21FDKaacEnc_AdjThrClosePP13ADJ_THR_STATE"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z21FDKaacEnc_AdjThrClosePP13ADJ_THR_STATE.apply(null, arguments);
};

var real___Z21FDKaacEnc_GetPnsParamP11NOISEPARAMSiiiPKiPiii = asm["__Z21FDKaacEnc_GetPnsParamP11NOISEPARAMSiiiPKiPiii"]; asm["__Z21FDKaacEnc_GetPnsParamP11NOISEPARAMSiiiPKiPiii"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z21FDKaacEnc_GetPnsParamP11NOISEPARAMSiiiPKiPiii.apply(null, arguments);
};

var real___Z21FDKaacEnc_calcSfbDistPKlPsiii = asm["__Z21FDKaacEnc_calcSfbDistPKlPsiii"]; asm["__Z21FDKaacEnc_calcSfbDistPKlPsiii"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z21FDKaacEnc_calcSfbDistPKlPsiii.apply(null, arguments);
};

var real___Z21FDKaacEnc_countValuesPsii = asm["__Z21FDKaacEnc_countValuesPsii"]; asm["__Z21FDKaacEnc_countValuesPsii"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z21FDKaacEnc_countValuesPsii.apply(null, arguments);
};

var real___Z21FDKaacEnc_dynBitCountP13BITCNTR_STATEPKsPKjPKiiiiiS6_P12SECTION_DATAS6_S6_S6_j = asm["__Z21FDKaacEnc_dynBitCountP13BITCNTR_STATEPKsPKjPKiiiiiS6_P12SECTION_DATAS6_S6_S6_j"]; asm["__Z21FDKaacEnc_dynBitCountP13BITCNTR_STATEPKsPKjPKiiiiiS6_P12SECTION_DATAS6_S6_S6_j"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z21FDKaacEnc_dynBitCountP13BITCNTR_STATEPKsPKjPKiiiiiS6_P12SECTION_DATAS6_S6_S6_j.apply(null, arguments);
};

var real___Z21FDKaacEnc_noiseDetectPlPiiPKiPsP11NOISEPARAMSS3_ = asm["__Z21FDKaacEnc_noiseDetectPlPiiPKiPsP11NOISEPARAMSS3_"]; asm["__Z21FDKaacEnc_noiseDetectPlPiiPKiPsP11NOISEPARAMSS3_"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z21FDKaacEnc_noiseDetectPlPiiPKiPsP11NOISEPARAMSS3_.apply(null, arguments);
};

var real___Z21FDKaacEnc_psyMainInitP12PSY_INTERNAL17AUDIO_OBJECT_TYPEP15CHANNEL_MAPPINGiiiiiiiijm = asm["__Z21FDKaacEnc_psyMainInitP12PSY_INTERNAL17AUDIO_OBJECT_TYPEP15CHANNEL_MAPPINGiiiiiiiijm"]; asm["__Z21FDKaacEnc_psyMainInitP12PSY_INTERNAL17AUDIO_OBJECT_TYPEP15CHANNEL_MAPPINGiiiiiiiijm"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z21FDKaacEnc_psyMainInitP12PSY_INTERNAL17AUDIO_OBJECT_TYPEP15CHANNEL_MAPPINGiiiiiiiijm.apply(null, arguments);
};

var real___Z21FDKcalcCorrelationVecPlPKlS1_S1_i = asm["__Z21FDKcalcCorrelationVecPlPKlS1_S1_i"]; asm["__Z21FDKcalcCorrelationVecPlPKlS1_S1_i"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z21FDKcalcCorrelationVecPlPKlS1_S1_i.apply(null, arguments);
};

var real___Z21FDKhybridAnalysisInitP18FDK_ANA_HYB_FILTER15FDK_HYBRID_MODEiii = asm["__Z21FDKhybridAnalysisInitP18FDK_ANA_HYB_FILTER15FDK_HYBRID_MODEiii"]; asm["__Z21FDKhybridAnalysisInitP18FDK_ANA_HYB_FILTER15FDK_HYBRID_MODEiii"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z21FDKhybridAnalysisInitP18FDK_ANA_HYB_FILTER15FDK_HYBRID_MODEiii.apply(null, arguments);
};

var real___Z21FDKhybridAnalysisOpenP18FDK_ANA_HYB_FILTERPljS1_j = asm["__Z21FDKhybridAnalysisOpenP18FDK_ANA_HYB_FILTERPljS1_j"]; asm["__Z21FDKhybridAnalysisOpenP18FDK_ANA_HYB_FILTERPljS1_j"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z21FDKhybridAnalysisOpenP18FDK_ANA_HYB_FILTERPljS1_j.apply(null, arguments);
};

var real___Z21FDKsbrEnc_UpdateHiResPhPiS_iS0_ = asm["__Z21FDKsbrEnc_UpdateHiResPhPiS_iS0_"]; asm["__Z21FDKsbrEnc_UpdateHiResPhPiS_iS0_"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z21FDKsbrEnc_UpdateHiResPhPiS_iS0_.apply(null, arguments);
};

var real___Z21FDKsbrEnc_UpdateLoResPhPiS_i = asm["__Z21FDKsbrEnc_UpdateLoResPhPiS_i"]; asm["__Z21FDKsbrEnc_UpdateLoResPhPiS_i"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z21FDKsbrEnc_UpdateLoResPhPiS_i.apply(null, arguments);
};

var real___Z21FreeRam_Sbr_guideScfbPPh = asm["__Z21FreeRam_Sbr_guideScfbPPh"]; asm["__Z21FreeRam_Sbr_guideScfbPPh"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z21FreeRam_Sbr_guideScfbPPh.apply(null, arguments);
};

var real___Z21FreeRam_aacEnc_PsyOutPP7PSY_OUT = asm["__Z21FreeRam_aacEnc_PsyOutPP7PSY_OUT"]; asm["__Z21FreeRam_aacEnc_PsyOutPP7PSY_OUT"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z21FreeRam_aacEnc_PsyOutPP7PSY_OUT.apply(null, arguments);
};

var real___Z21GetRam_SbrDynamic_RAMi = asm["__Z21GetRam_SbrDynamic_RAMi"]; asm["__Z21GetRam_SbrDynamic_RAMi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z21GetRam_SbrDynamic_RAMi.apply(null, arguments);
};

var real___Z21GetRam_Sbr_envIBufferiPh = asm["__Z21GetRam_Sbr_envIBufferiPh"]; asm["__Z21GetRam_Sbr_envIBufferiPh"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z21GetRam_Sbr_envIBufferiPh.apply(null, arguments);
};

var real___Z21GetRam_Sbr_envRBufferiPh = asm["__Z21GetRam_Sbr_envRBufferiPh"]; asm["__Z21GetRam_Sbr_envRBufferiPh"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z21GetRam_Sbr_envRBufferiPh.apply(null, arguments);
};

var real___Z21GetRam_Sbr_envYBufferi = asm["__Z21GetRam_Sbr_envYBufferi"]; asm["__Z21GetRam_Sbr_envYBufferi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z21GetRam_Sbr_envYBufferi.apply(null, arguments);
};

var real___Z21GetRam_Sbr_envYBufferiPh = asm["__Z21GetRam_Sbr_envYBufferiPh"]; asm["__Z21GetRam_Sbr_envYBufferiPh"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z21GetRam_Sbr_envYBufferiPh.apply(null, arguments);
};

var real___Z21GetRam_Sbr_signMatrixi = asm["__Z21GetRam_Sbr_signMatrixi"]; asm["__Z21GetRam_Sbr_signMatrixi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z21GetRam_Sbr_signMatrixi.apply(null, arguments);
};

var real___Z21GetRam_Sbr_v_k_masteri = asm["__Z21GetRam_Sbr_v_k_masteri"]; asm["__Z21GetRam_Sbr_v_k_masteri"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z21GetRam_Sbr_v_k_masteri.apply(null, arguments);
};

var real___Z21GetRam_aacEnc_QCstatei = asm["__Z21GetRam_aacEnc_QCstatei"]; asm["__Z21GetRam_aacEnc_QCstatei"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z21GetRam_aacEnc_QCstatei.apply(null, arguments);
};

var real___Z21adtsWrite_CrcStartRegP11STRUCT_ADTSP13FDK_BITSTREAMi = asm["__Z21adtsWrite_CrcStartRegP11STRUCT_ADTSP13FDK_BITSTREAMi"]; asm["__Z21adtsWrite_CrcStartRegP11STRUCT_ADTSP13FDK_BITSTREAMi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z21adtsWrite_CrcStartRegP11STRUCT_ADTSP13FDK_BITSTREAMi.apply(null, arguments);
};

var real___Z21fdkCallocMatrix1D_intjj14MEMORY_SECTION = asm["__Z21fdkCallocMatrix1D_intjj14MEMORY_SECTION"]; asm["__Z21fdkCallocMatrix1D_intjj14MEMORY_SECTION"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z21fdkCallocMatrix1D_intjj14MEMORY_SECTION.apply(null, arguments);
};

var real___Z21fdk_sacenc_delay_InitP5DELAYiiii = asm["__Z21fdk_sacenc_delay_InitP5DELAYiiii"]; asm["__Z21fdk_sacenc_delay_InitP5DELAYiiii"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z21fdk_sacenc_delay_InitP5DELAYiiii.apply(null, arguments);
};

var real___Z21fdk_sacenc_delay_OpenPP5DELAY = asm["__Z21fdk_sacenc_delay_OpenPP5DELAY"]; asm["__Z21fdk_sacenc_delay_OpenPP5DELAY"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z21fdk_sacenc_delay_OpenPP5DELAY.apply(null, arguments);
};

var real___Z21fdk_sacenc_initTtoBoxP9T_TTO_BOXPK16T_TTO_BOX_CONFIGPh = asm["__Z21fdk_sacenc_initTtoBoxP9T_TTO_BOXPK16T_TTO_BOX_CONFIGPh"]; asm["__Z21fdk_sacenc_initTtoBoxP9T_TTO_BOXPK16T_TTO_BOX_CONFIGPh"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z21fdk_sacenc_initTtoBoxP9T_TTO_BOXPK16T_TTO_BOX_CONFIGPh.apply(null, arguments);
};

var real___Z21transportEnc_GetFrameP12TRANSPORTENCPi = asm["__Z21transportEnc_GetFrameP12TRANSPORTENCPi"]; asm["__Z21transportEnc_GetFrameP12TRANSPORTENCPi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z21transportEnc_GetFrameP12TRANSPORTENCPi.apply(null, arguments);
};

var real___Z21transportEnc_writeASCP13FDK_BITSTREAMP12CODER_CONFIGP13CSTpCallBacks = asm["__Z21transportEnc_writeASCP13FDK_BITSTREAMP12CODER_CONFIGP13CSTpCallBacks"]; asm["__Z21transportEnc_writeASCP13FDK_BITSTREAMP12CODER_CONFIGP13CSTpCallBacks"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z21transportEnc_writeASCP13FDK_BITSTREAMP12CODER_CONFIGP13CSTpCallBacks.apply(null, arguments);
};

var real___Z21transportEnc_writePCEP13FDK_BITSTREAM12CHANNEL_MODEiiiiij = asm["__Z21transportEnc_writePCEP13FDK_BITSTREAM12CHANNEL_MODEiiiiij"]; asm["__Z21transportEnc_writePCEP13FDK_BITSTREAM12CHANNEL_MODEiiiiij"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z21transportEnc_writePCEP13FDK_BITSTREAM12CHANNEL_MODEiiiiij.apply(null, arguments);
};

var real___Z22FDK_DRC_Generator_CalcP8DRC_COMPPKsjiiillllliiPiS3_ = asm["__Z22FDK_DRC_Generator_CalcP8DRC_COMPPKsjiiillllliiPiS3_"]; asm["__Z22FDK_DRC_Generator_CalcP8DRC_COMPPKsjiiillllliiPiS3_"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z22FDK_DRC_Generator_CalcP8DRC_COMPPKsjiiillllliiPiS3_.apply(null, arguments);
};

var real___Z22FDK_DRC_Generator_OpenPP8DRC_COMP = asm["__Z22FDK_DRC_Generator_OpenPP8DRC_COMP"]; asm["__Z22FDK_DRC_Generator_OpenPP8DRC_COMP"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z22FDK_DRC_Generator_OpenPP8DRC_COMP.apply(null, arguments);
};

var real___Z22FDKaacEnc_SpreadingMaxiPKlS0_Pl = asm["__Z22FDKaacEnc_SpreadingMaxiPKlS0_Pl"]; asm["__Z22FDKaacEnc_SpreadingMaxiPKlS0_Pl"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z22FDKaacEnc_SpreadingMaxiPKlS0_Pl.apply(null, arguments);
};

var real___Z22FDKaacEnc_prepareSfbPeP15PE_CHANNEL_DATAPKlS2_S2_PKiiii = asm["__Z22FDKaacEnc_prepareSfbPeP15PE_CHANNEL_DATAPKlS2_S2_PKiiii"]; asm["__Z22FDKaacEnc_prepareSfbPeP15PE_CHANNEL_DATAPKlS2_S2_PKiiii"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z22FDKaacEnc_prepareSfbPeP15PE_CHANNEL_DATAPKlS2_S2_PKiiii.apply(null, arguments);
};

var real___Z22FDKaacEnc_updateBitresP15CHANNEL_MAPPINGP8QC_STATEPP6QC_OUT = asm["__Z22FDKaacEnc_updateBitresP15CHANNEL_MAPPINGP8QC_STATEPP6QC_OUT"]; asm["__Z22FDKaacEnc_updateBitresP15CHANNEL_MAPPINGP8QC_STATEPP6QC_OUT"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z22FDKaacEnc_updateBitresP15CHANNEL_MAPPINGP8QC_STATEPP6QC_OUT.apply(null, arguments);
};

var real___Z22FDKhybridAnalysisApplyP18FDK_ANA_HYB_FILTERPKlS2_PlS3_ = asm["__Z22FDKhybridAnalysisApplyP18FDK_ANA_HYB_FILTERPKlS2_PlS3_"]; asm["__Z22FDKhybridAnalysisApplyP18FDK_ANA_HYB_FILTERPKlS2_PlS3_"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z22FDKhybridAnalysisApplyP18FDK_ANA_HYB_FILTERPKlS2_PlS3_.apply(null, arguments);
};

var real___Z22FDKhybridSynthesisInitP18FDK_SYN_HYB_FILTER15FDK_HYBRID_MODEii = asm["__Z22FDKhybridSynthesisInitP18FDK_SYN_HYB_FILTER15FDK_HYBRID_MODEii"]; asm["__Z22FDKhybridSynthesisInitP18FDK_SYN_HYB_FILTER15FDK_HYBRID_MODEii"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z22FDKhybridSynthesisInitP18FDK_SYN_HYB_FILTER15FDK_HYBRID_MODEii.apply(null, arguments);
};

var real___Z22FDKsbrEnc_InitPSEncodeP11T_PS_ENCODE8PS_BANDSl = asm["__Z22FDKsbrEnc_InitPSEncodeP11T_PS_ENCODE8PS_BANDSl"]; asm["__Z22FDKsbrEnc_InitPSEncodeP11T_PS_ENCODE8PS_BANDSl"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z22FDKsbrEnc_InitPSEncodeP11T_PS_ENCODE8PS_BANDSl.apply(null, arguments);
};

var real___Z22FDKsbrEnc_codeEnvelopePaPK8FREQ_RESP17SBR_CODE_ENVELOPEPiiiii = asm["__Z22FDKsbrEnc_codeEnvelopePaPK8FREQ_RESP17SBR_CODE_ENVELOPEPiiiii"]; asm["__Z22FDKsbrEnc_codeEnvelopePaPK8FREQ_RESP17SBR_CODE_ENVELOPEPiiiii"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z22FDKsbrEnc_codeEnvelopePaPK8FREQ_RESP17SBR_CODE_ENVELOPEPiiiii.apply(null, arguments);
};

var real___Z22FreeRam_SbrDynamic_RAMPPl = asm["__Z22FreeRam_SbrDynamic_RAMPPl"]; asm["__Z22FreeRam_SbrDynamic_RAMPPl"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z22FreeRam_SbrDynamic_RAMPPl.apply(null, arguments);
};

var real___Z22FreeRam_Sbr_envYBufferPPl = asm["__Z22FreeRam_Sbr_envYBufferPPl"]; asm["__Z22FreeRam_Sbr_envYBufferPPl"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z22FreeRam_Sbr_envYBufferPPl.apply(null, arguments);
};

var real___Z22FreeRam_Sbr_signMatrixPPi = asm["__Z22FreeRam_Sbr_signMatrixPPi"]; asm["__Z22FreeRam_Sbr_signMatrixPPi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z22FreeRam_Sbr_signMatrixPPi.apply(null, arguments);
};

var real___Z22FreeRam_Sbr_v_k_masterPPh = asm["__Z22FreeRam_Sbr_v_k_masterPPh"]; asm["__Z22FreeRam_Sbr_v_k_masterPPh"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z22FreeRam_Sbr_v_k_masterPPh.apply(null, arguments);
};

var real___Z22FreeRam_aacEnc_QCstatePP8QC_STATE = asm["__Z22FreeRam_aacEnc_QCstatePP8QC_STATE"]; asm["__Z22FreeRam_aacEnc_QCstatePP8QC_STATE"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z22FreeRam_aacEnc_QCstatePP8QC_STATE.apply(null, arguments);
};

var real___Z22GetRam_Sbr_quotaMatrixi = asm["__Z22GetRam_Sbr_quotaMatrixi"]; asm["__Z22GetRam_Sbr_quotaMatrixi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z22GetRam_Sbr_quotaMatrixi.apply(null, arguments);
};

var real___Z22adifWrite_EncodeHeaderP9ADIF_INFOP13FDK_BITSTREAMi = asm["__Z22adifWrite_EncodeHeaderP9ADIF_INFOP13FDK_BITSTREAMi"]; asm["__Z22adifWrite_EncodeHeaderP9ADIF_INFOP13FDK_BITSTREAMi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z22adifWrite_EncodeHeaderP9ADIF_INFOP13FDK_BITSTREAMi.apply(null, arguments);
};

var real___Z22adtsWrite_EncodeHeaderP11STRUCT_ADTSP13FDK_BITSTREAMii = asm["__Z22adtsWrite_EncodeHeaderP11STRUCT_ADTSP13FDK_BITSTREAMii"]; asm["__Z22adtsWrite_EncodeHeaderP11STRUCT_ADTSP13FDK_BITSTREAMii"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z22adtsWrite_EncodeHeaderP11STRUCT_ADTSP13FDK_BITSTREAMii.apply(null, arguments);
};

var real___Z22cplx_cplxScalarProductP8FIXP_DPKPKPKS_S4_iiPiiiii = asm["__Z22cplx_cplxScalarProductP8FIXP_DPKPKPKS_S4_iiPiiiii"]; asm["__Z22cplx_cplxScalarProductP8FIXP_DPKPKPKS_S4_iiPiiiii"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z22cplx_cplxScalarProductP8FIXP_DPKPKPKS_S4_iiPiiiii.apply(null, arguments);
};

var real___Z22fdk_sacenc_applyTtoBoxP9T_TTO_BOXiiiPKPK8FIXP_DPKS5_PaPhS6_S7_iPiS8_ = asm["__Z22fdk_sacenc_applyTtoBoxP9T_TTO_BOXiiiPKPK8FIXP_DPKS5_PaPhS6_S7_iPiS8_"]; asm["__Z22fdk_sacenc_applyTtoBoxP9T_TTO_BOXiiiPKPK8FIXP_DPKS5_PaPhS6_S7_iPiS8_"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z22fdk_sacenc_applyTtoBoxP9T_TTO_BOXiiiPKPK8FIXP_DPKS5_PaPhS6_S7_iPiS8_.apply(null, arguments);
};

var real___Z22fdk_sacenc_delay_ClosePP5DELAY = asm["__Z22fdk_sacenc_delay_ClosePP5DELAY"]; asm["__Z22fdk_sacenc_delay_ClosePP5DELAY"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z22fdk_sacenc_delay_ClosePP5DELAY.apply(null, arguments);
};

var real___Z22qmfSynPrototypeFirSlotP15QMF_FILTER_BANKPlS1_Psi = asm["__Z22qmfSynPrototypeFirSlotP15QMF_FILTER_BANKPlS1_Psi"]; asm["__Z22qmfSynPrototypeFirSlotP15QMF_FILTER_BANKPlS1_Psi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z22qmfSynPrototypeFirSlotP15QMF_FILTER_BANKPlS1_Psi.apply(null, arguments);
};

var real___Z22transportEnc_CrcEndRegP12TRANSPORTENCi = asm["__Z22transportEnc_CrcEndRegP12TRANSPORTENCi"]; asm["__Z22transportEnc_CrcEndRegP12TRANSPORTENCi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z22transportEnc_CrcEndRegP12TRANSPORTENCi.apply(null, arguments);
};

var real___Z22transportEnc_LatmWriteP11LATM_STREAMP13FDK_BITSTREAMiiP13CSTpCallBacks = asm["__Z22transportEnc_LatmWriteP11LATM_STREAMP13FDK_BITSTREAMiiP13CSTpCallBacks"]; asm["__Z22transportEnc_LatmWriteP11LATM_STREAMP13FDK_BITSTREAMiiP13CSTpCallBacks"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z22transportEnc_LatmWriteP11LATM_STREAMP13FDK_BITSTREAMiiP13CSTpCallBacks.apply(null, arguments);
};

var real___Z22transportEnc_Latm_InitP11LATM_STREAMP13FDK_BITSTREAMP12CODER_CONFIGj14TRANSPORT_TYPEP13CSTpCallBacks = asm["__Z22transportEnc_Latm_InitP11LATM_STREAMP13FDK_BITSTREAMP12CODER_CONFIGj14TRANSPORT_TYPEP13CSTpCallBacks"]; asm["__Z22transportEnc_Latm_InitP11LATM_STREAMP13FDK_BITSTREAMP12CODER_CONFIGj14TRANSPORT_TYPEP13CSTpCallBacks"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z22transportEnc_Latm_InitP11LATM_STREAMP13FDK_BITSTREAMP12CODER_CONFIGj14TRANSPORT_TYPEP13CSTpCallBacks.apply(null, arguments);
};

var real___Z23FDK_DRC_Generator_ClosePP8DRC_COMP = asm["__Z23FDK_DRC_Generator_ClosePP8DRC_COMP"]; asm["__Z23FDK_DRC_Generator_ClosePP8DRC_COMP"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z23FDK_DRC_Generator_ClosePP8DRC_COMP.apply(null, arguments);
};

var real___Z23FDK_MetadataEnc_ProcessP20FDK_METADATA_ENCODERPsjiPK15AACENC_MetaDataPP18AACENC_EXT_PAYLOADPjPi = asm["__Z23FDK_MetadataEnc_ProcessP20FDK_METADATA_ENCODERPsjiPK15AACENC_MetaDataPP18AACENC_EXT_PAYLOADPjPi"]; asm["__Z23FDK_MetadataEnc_ProcessP20FDK_METADATA_ENCODERPsjiPK15AACENC_MetaDataPP18AACENC_EXT_PAYLOADPjPi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z23FDK_MetadataEnc_ProcessP20FDK_METADATA_ENCODERPsjiPK15AACENC_MetaDataPP18AACENC_EXT_PAYLOADPjPi.apply(null, arguments);
};

var real___Z23FDK_MpegsEnc_GetLibInfoP8LIB_INFO = asm["__Z23FDK_MpegsEnc_GetLibInfoP8LIB_INFO"]; asm["__Z23FDK_MpegsEnc_GetLibInfoP8LIB_INFO"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z23FDK_MpegsEnc_GetLibInfoP8LIB_INFO.apply(null, arguments);
};

var real___Z23FDKaacEnc_AdjustBitrateP8QC_STATEP15CHANNEL_MAPPINGPiiii = asm["__Z23FDKaacEnc_AdjustBitrateP8QC_STATEP15CHANNEL_MAPPINGPiiii"]; asm["__Z23FDKaacEnc_AdjustBitrateP8QC_STATEP15CHANNEL_MAPPINGPiiii"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z23FDKaacEnc_AdjustBitrateP8QC_STATEP15CHANNEL_MAPPINGPiiii.apply(null, arguments);
};

var real___Z23FDKaacEnc_QCMainPrepareP12ELEMENT_INFOP11ATS_ELEMENTP15PSY_OUT_ELEMENTP14QC_OUT_ELEMENT17AUDIO_OBJECT_TYPEja = asm["__Z23FDKaacEnc_QCMainPrepareP12ELEMENT_INFOP11ATS_ELEMENTP15PSY_OUT_ELEMENTP14QC_OUT_ELEMENT17AUDIO_OBJECT_TYPEja"]; asm["__Z23FDKaacEnc_QCMainPrepareP12ELEMENT_INFOP11ATS_ELEMENTP15PSY_OUT_ELEMENTP14QC_OUT_ELEMENT17AUDIO_OBJECT_TYPEja"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z23FDKaacEnc_QCMainPrepareP12ELEMENT_INFOP11ATS_ELEMENTP15PSY_OUT_ELEMENTP14QC_OUT_ELEMENT17AUDIO_OBJECT_TYPEja.apply(null, arguments);
};

var real___Z23FDKaacEnc_peCalculationP7PE_DATAPKPK15PSY_OUT_CHANNELPKP14QC_OUT_CHANNELPK9TOOLSINFOP11ATS_ELEMENTi = asm["__Z23FDKaacEnc_peCalculationP7PE_DATAPKPK15PSY_OUT_CHANNELPKP14QC_OUT_CHANNELPK9TOOLSINFOP11ATS_ELEMENTi"]; asm["__Z23FDKaacEnc_peCalculationP7PE_DATAPKPK15PSY_OUT_CHANNELPKP14QC_OUT_CHANNELPK9TOOLSINFOP11ATS_ELEMENTi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z23FDKaacEnc_peCalculationP7PE_DATAPKPK15PSY_OUT_CHANNELPKP14QC_OUT_CHANNELPK9TOOLSINFOP11ATS_ELEMENTi.apply(null, arguments);
};

var real___Z23FDKhybridSynthesisApplyP18FDK_SYN_HYB_FILTERPKlS2_PlS3_ = asm["__Z23FDKhybridSynthesisApplyP18FDK_SYN_HYB_FILTERPKlS2_PlS3_"]; asm["__Z23FDKhybridSynthesisApplyP18FDK_SYN_HYB_FILTERPKlS2_PlS3_"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z23FDKhybridSynthesisApplyP18FDK_SYN_HYB_FILTERPKlS2_PlS3_.apply(null, arguments);
};

var real___Z23FDKsbrEnc_Shellsort_intPii = asm["__Z23FDKsbrEnc_Shellsort_intPii"]; asm["__Z23FDKsbrEnc_Shellsort_intPii"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z23FDKsbrEnc_Shellsort_intPii.apply(null, arguments);
};

var real___Z23FDKsbrEnc_frameSplitterPPlPiP22SBR_TRANSIENT_DETECTORPhS4_iiiiiS_ = asm["__Z23FDKsbrEnc_frameSplitterPPlPiP22SBR_TRANSIENT_DETECTORPhS4_iiiiiS_"]; asm["__Z23FDKsbrEnc_frameSplitterPPlPiP22SBR_TRANSIENT_DETECTORPhS4_iiiiiS_"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z23FDKsbrEnc_frameSplitterPPlPiP22SBR_TRANSIENT_DETECTORPhS4_iiiiiS_.apply(null, arguments);
};

var real___Z23FreeRam_Sbr_quotaMatrixPPl = asm["__Z23FreeRam_Sbr_quotaMatrixPPl"]; asm["__Z23FreeRam_Sbr_quotaMatrixPPl"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z23FreeRam_Sbr_quotaMatrixPPl.apply(null, arguments);
};

var real___Z23GetRam_aacEnc_BitLookUpiPh = asm["__Z23GetRam_aacEnc_BitLookUpiPh"]; asm["__Z23GetRam_aacEnc_BitLookUpiPh"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z23GetRam_aacEnc_BitLookUpiPh.apply(null, arguments);
};

var real___Z23GetRam_aacEnc_PsyStatici = asm["__Z23GetRam_aacEnc_PsyStatici"]; asm["__Z23GetRam_aacEnc_PsyStatici"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z23GetRam_aacEnc_PsyStatici.apply(null, arguments);
};

var real___Z23GetRam_aacEnc_QCchanneliPh = asm["__Z23GetRam_aacEnc_QCchanneliPh"]; asm["__Z23GetRam_aacEnc_QCchanneliPh"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z23GetRam_aacEnc_QCchanneliPh.apply(null, arguments);
};

var real___Z23GetRam_aacEnc_QCelementi = asm["__Z23GetRam_aacEnc_QCelementi"]; asm["__Z23GetRam_aacEnc_QCelementi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z23GetRam_aacEnc_QCelementi.apply(null, arguments);
};

var real___Z23adifWrite_GetHeaderBitsP9ADIF_INFO = asm["__Z23adifWrite_GetHeaderBitsP9ADIF_INFO"]; asm["__Z23adifWrite_GetHeaderBitsP9ADIF_INFO"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z23adifWrite_GetHeaderBitsP9ADIF_INFO.apply(null, arguments);
};

var real___Z23adtsWrite_GetHeaderBitsP11STRUCT_ADTS = asm["__Z23adtsWrite_GetHeaderBitsP11STRUCT_ADTS"]; asm["__Z23adtsWrite_GetHeaderBitsP11STRUCT_ADTS"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z23adtsWrite_GetHeaderBitsP11STRUCT_ADTS.apply(null, arguments);
};

var real___Z23fdk_sacenc_createTtoBoxPP9T_TTO_BOX = asm["__Z23fdk_sacenc_createTtoBoxPP9T_TTO_BOX"]; asm["__Z23fdk_sacenc_createTtoBoxPP9T_TTO_BOX"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z23fdk_sacenc_createTtoBoxPP9T_TTO_BOX.apply(null, arguments);
};

var real___Z23fdk_sacenc_initDCFilterP11T_DC_FILTERj = asm["__Z23fdk_sacenc_initDCFilterP11T_DC_FILTERj"]; asm["__Z23fdk_sacenc_initDCFilterP11T_DC_FILTERj"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z23fdk_sacenc_initDCFilterP11T_DC_FILTERj.apply(null, arguments);
};

var real___Z23getBitstreamElementList17AUDIO_OBJECT_TYPEahhj = asm["__Z23getBitstreamElementList17AUDIO_OBJECT_TYPEahhj"]; asm["__Z23getBitstreamElementList17AUDIO_OBJECT_TYPEahhj"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z23getBitstreamElementList17AUDIO_OBJECT_TYPEahhj.apply(null, arguments);
};

var real___Z23transportEnc_GetLibInfoP8LIB_INFO = asm["__Z23transportEnc_GetLibInfoP8LIB_INFO"]; asm["__Z23transportEnc_GetLibInfoP8LIB_INFO"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z23transportEnc_GetLibInfoP8LIB_INFO.apply(null, arguments);
};

var real___Z23transportEnc_GetPCEBits12CHANNEL_MODEii = asm["__Z23transportEnc_GetPCEBits12CHANNEL_MODEii"]; asm["__Z23transportEnc_GetPCEBits12CHANNEL_MODEii"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z23transportEnc_GetPCEBits12CHANNEL_MODEii.apply(null, arguments);
};

var real___Z24FDK_MetadataEnc_GetDelayP20FDK_METADATA_ENCODER = asm["__Z24FDK_MetadataEnc_GetDelayP20FDK_METADATA_ENCODER"]; asm["__Z24FDK_MetadataEnc_GetDelayP20FDK_METADATA_ENCODER"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z24FDK_MetadataEnc_GetDelayP20FDK_METADATA_ENCODER.apply(null, arguments);
};

var real___Z24FDK_MpegsEnc_GetDecDelayP11MPS_ENCODER = asm["__Z24FDK_MpegsEnc_GetDecDelayP11MPS_ENCODER"]; asm["__Z24FDK_MpegsEnc_GetDecDelayP11MPS_ENCODER"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z24FDK_MpegsEnc_GetDecDelayP11MPS_ENCODER.apply(null, arguments);
};

var real___Z24FDKaacEnc_BlockSwitchingP23BLOCK_SWITCHING_CONTROLiiPKs = asm["__Z24FDKaacEnc_BlockSwitchingP23BLOCK_SWITCHING_CONTROLiiPKs"]; asm["__Z24FDKaacEnc_BlockSwitchingP23BLOCK_SWITCHING_CONTROLiiPKs"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z24FDKaacEnc_BlockSwitchingP23BLOCK_SWITCHING_CONTROLiiPKs.apply(null, arguments);
};

var real___Z24FDKaacEnc_CalcFormFactorPP14QC_OUT_CHANNELPP15PSY_OUT_CHANNELi = asm["__Z24FDKaacEnc_CalcFormFactorPP14QC_OUT_CHANNELPP15PSY_OUT_CHANNELi"]; asm["__Z24FDKaacEnc_CalcFormFactorPP14QC_OUT_CHANNELPP15PSY_OUT_CHANNELi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z24FDKaacEnc_CalcFormFactorPP14QC_OUT_CHANNELPP15PSY_OUT_CHANNELi.apply(null, arguments);
};

var real___Z24FDKaacEnc_CodePnsChanneliP10PNS_CONFIGPiPlS1_S2_ = asm["__Z24FDKaacEnc_CodePnsChanneliP10PNS_CONFIGPiPlS1_S2_"]; asm["__Z24FDKaacEnc_CodePnsChanneliP10PNS_CONFIGPiPlS1_S2_"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z24FDKaacEnc_CodePnsChanneliP10PNS_CONFIGPiPlS1_S2_.apply(null, arguments);
};

var real___Z24FDKaacEnc_DistributeBitsP13ADJ_THR_STATEP11ATS_ELEMENTPP15PSY_OUT_CHANNELP7PE_DATAPiS8_iiiiil18AACENC_BITRES_MODE = asm["__Z24FDKaacEnc_DistributeBitsP13ADJ_THR_STATEP11ATS_ELEMENTPP15PSY_OUT_CHANNELP7PE_DATAPiS8_iiiiil18AACENC_BITRES_MODE"]; asm["__Z24FDKaacEnc_DistributeBitsP13ADJ_THR_STATEP11ATS_ELEMENTPP15PSY_OUT_CHANNELP7PE_DATAPiS8_iiiiil18AACENC_BITRES_MODE"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z24FDKaacEnc_DistributeBitsP13ADJ_THR_STATEP11ATS_ELEMENTPP15PSY_OUT_CHANNELP7PE_DATAPiS8_iiiiil18AACENC_BITRES_MODE.apply(null, arguments);
};

var real___Z24FDKaacEnc_PreEchoControlPliiisS_iPi = asm["__Z24FDKaacEnc_PreEchoControlPliiisS_iPi"]; asm["__Z24FDKaacEnc_PreEchoControlPliiisS_iPi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z24FDKaacEnc_PreEchoControlPliiisS_iPi.apply(null, arguments);
};

var real___Z24FDKaacEnc_Transform_RealPKsPliiPiP6mdct_tiS2_i = asm["__Z24FDKaacEnc_Transform_RealPKsPliiPiP6mdct_tiS2_i"]; asm["__Z24FDKaacEnc_Transform_RealPKsPliiPiP6mdct_tiS2_i"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z24FDKaacEnc_Transform_RealPKsPliiPiP6mdct_tiS2_i.apply(null, arguments);
};

var real___Z24FDKaacEnc_WriteBitstreamP12TRANSPORTENCP15CHANNEL_MAPPINGP6QC_OUTP7PSY_OUTP8QC_STATE17AUDIO_OBJECT_TYPEja = asm["__Z24FDKaacEnc_WriteBitstreamP12TRANSPORTENCP15CHANNEL_MAPPINGP6QC_OUTP7PSY_OUTP8QC_STATE17AUDIO_OBJECT_TYPEja"]; asm["__Z24FDKaacEnc_WriteBitstreamP12TRANSPORTENCP15CHANNEL_MAPPINGP6QC_OUTP7PSY_OUTP8QC_STATE17AUDIO_OBJECT_TYPEja"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z24FDKaacEnc_WriteBitstreamP12TRANSPORTENCP15CHANNEL_MAPPINGP6QC_OUTP7PSY_OUTP8QC_STATE17AUDIO_OBJECT_TYPEja.apply(null, arguments);
};

var real___Z24FDKaacEnc_groupShortDataPlP13SFB_THRESHOLDP10SFB_ENERGYS3_S3_iiPKiPKlPiS8_S_iS5_i = asm["__Z24FDKaacEnc_groupShortDataPlP13SFB_THRESHOLDP10SFB_ENERGYS3_S3_iiPKiPKlPiS8_S_iS5_i"]; asm["__Z24FDKaacEnc_groupShortDataPlP13SFB_THRESHOLDP10SFB_ENERGYS3_S3_iiPKiPKlPiS8_S_iS5_i"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z24FDKaacEnc_groupShortDataPlP13SFB_THRESHOLDP10SFB_ENERGYS3_S3_iiPKiPKlPiS8_S_iS5_i.apply(null, arguments);
};

var real___Z24FDKaacEnc_updateFillBitsP15CHANNEL_MAPPINGP8QC_STATEPP12ELEMENT_BITSPP6QC_OUT = asm["__Z24FDKaacEnc_updateFillBitsP15CHANNEL_MAPPINGP8QC_STATEPP12ELEMENT_BITSPP6QC_OUT"]; asm["__Z24FDKaacEnc_updateFillBitsP15CHANNEL_MAPPINGP8QC_STATEPP12ELEMENT_BITSPP6QC_OUT"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z24FDKaacEnc_updateFillBitsP15CHANNEL_MAPPINGP8QC_STATEPP12ELEMENT_BITSPP6QC_OUT.apply(null, arguments);
};

var real___Z24FDKsbrEnc_CreatePSEncodePP11T_PS_ENCODE = asm["__Z24FDKsbrEnc_CreatePSEncodePP11T_PS_ENCODE"]; asm["__Z24FDKsbrEnc_CreatePSEncodePP11T_PS_ENCODE"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z24FDKsbrEnc_CreatePSEncodePP11T_PS_ENCODE.apply(null, arguments);
};

var real___Z24FDKsbrEnc_EnvEncodeFrameP11SBR_ENCODERiPsjPjPhi = asm["__Z24FDKsbrEnc_EnvEncodeFrameP11SBR_ENCODERiPsjPjPhi"]; asm["__Z24FDKsbrEnc_EnvEncodeFrameP11SBR_ENCODERiPsjPjPhi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z24FDKsbrEnc_EnvEncodeFrameP11SBR_ENCODERiPsjPjPhi.apply(null, arguments);
};

var real___Z24FDKsbrEnc_GetEnvEstDelayP20SBR_EXTRACT_ENVELOPE = asm["__Z24FDKsbrEnc_GetEnvEstDelayP20SBR_EXTRACT_ENVELOPE"]; asm["__Z24FDKsbrEnc_GetEnvEstDelayP20SBR_EXTRACT_ENVELOPE"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z24FDKsbrEnc_GetEnvEstDelayP20SBR_EXTRACT_ENVELOPE.apply(null, arguments);
};

var real___Z24FreeRam_aacEnc_PsyStaticPP10PSY_STATIC = asm["__Z24FreeRam_aacEnc_PsyStaticPP10PSY_STATIC"]; asm["__Z24FreeRam_aacEnc_PsyStaticPP10PSY_STATIC"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z24FreeRam_aacEnc_PsyStaticPP10PSY_STATIC.apply(null, arguments);
};

var real___Z24FreeRam_aacEnc_QCelementPP14QC_OUT_ELEMENT = asm["__Z24FreeRam_aacEnc_QCelementPP14QC_OUT_ELEMENT"]; asm["__Z24FreeRam_aacEnc_QCelementPP14QC_OUT_ELEMENT"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z24FreeRam_aacEnc_QCelementPP14QC_OUT_ELEMENT.apply(null, arguments);
};

var real___Z24GetRam_aacEnc_AacEncoderi = asm["__Z24GetRam_aacEnc_AacEncoderi"]; asm["__Z24GetRam_aacEnc_AacEncoderi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z24GetRam_aacEnc_AacEncoderi.apply(null, arguments);
};

var real___Z24GetRam_aacEnc_PsyDynamiciPh = asm["__Z24GetRam_aacEnc_PsyDynamiciPh"]; asm["__Z24GetRam_aacEnc_PsyDynamiciPh"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z24GetRam_aacEnc_PsyDynamiciPh.apply(null, arguments);
};

var real___Z24GetRam_aacEnc_PsyElementi = asm["__Z24GetRam_aacEnc_PsyElementi"]; asm["__Z24GetRam_aacEnc_PsyElementi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z24GetRam_aacEnc_PsyElementi.apply(null, arguments);
};

var real___Z24fdk_sacenc_applyDCFilterP11T_DC_FILTERPKsPsi = asm["__Z24fdk_sacenc_applyDCFilterP11T_DC_FILTERPKsPsi"]; asm["__Z24fdk_sacenc_applyDCFilterP11T_DC_FILTERPKsPsi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z24fdk_sacenc_applyDCFilterP11T_DC_FILTERPKsPsi.apply(null, arguments);
};

var real___Z24fdk_sacenc_destroyTtoBoxPP9T_TTO_BOX = asm["__Z24fdk_sacenc_destroyTtoBoxPP9T_TTO_BOX"]; asm["__Z24fdk_sacenc_destroyTtoBoxPP9T_TTO_BOX"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z24fdk_sacenc_destroyTtoBoxPP9T_TTO_BOX.apply(null, arguments);
};

var real___Z24fdk_sacenc_ecDataPairEncP13FDK_BITSTREAMPA23_sPs9DATA_TYPEiiiii = asm["__Z24fdk_sacenc_ecDataPairEncP13FDK_BITSTREAMPA23_sPs9DATA_TYPEiiiii"]; asm["__Z24fdk_sacenc_ecDataPairEncP13FDK_BITSTREAMPA23_sPs9DATA_TYPEiiiii"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z24fdk_sacenc_ecDataPairEncP13FDK_BITSTREAMPA23_sPs9DATA_TYPEiiiii.apply(null, arguments);
};

var real___Z24qmfAnalysisFilteringSlotP15QMF_FILTER_BANKPlS1_PKsiS1_ = asm["__Z24qmfAnalysisFilteringSlotP15QMF_FILTER_BANKPlS1_PKsiS1_"]; asm["__Z24qmfAnalysisFilteringSlotP15QMF_FILTER_BANKPlS1_PKsiS1_"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z24qmfAnalysisFilteringSlotP15QMF_FILTER_BANKPlS1_PKsiS1_.apply(null, arguments);
};

var real___Z24transportEnc_CrcStartRegP12TRANSPORTENCi = asm["__Z24transportEnc_CrcStartRegP12TRANSPORTENCi"]; asm["__Z24transportEnc_CrcStartRegP12TRANSPORTENCi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z24transportEnc_CrcStartRegP12TRANSPORTENCi.apply(null, arguments);
};

var real___Z25FDKaacEnc_InitDownsamplerP11DOWNSAMPLERii = asm["__Z25FDKaacEnc_InitDownsamplerP11DOWNSAMPLERii"]; asm["__Z25FDKaacEnc_InitDownsamplerP11DOWNSAMPLERii"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z25FDKaacEnc_InitDownsamplerP11DOWNSAMPLERii.apply(null, arguments);
};

var real___Z25FDKaacEnc_InitElementBitsP8QC_STATEP15CHANNEL_MAPPINGiii = asm["__Z25FDKaacEnc_InitElementBitsP8QC_STATEP15CHANNEL_MAPPINGiii"]; asm["__Z25FDKaacEnc_InitElementBitsP8QC_STATEP15CHANNEL_MAPPINGiii"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z25FDKaacEnc_InitElementBitsP8QC_STATEP15CHANNEL_MAPPINGiii.apply(null, arguments);
};

var real___Z25FDKsbrEnc_DestroyPSEncodePP11T_PS_ENCODE = asm["__Z25FDKsbrEnc_DestroyPSEncodePP11T_PS_ENCODE"]; asm["__Z25FDKsbrEnc_DestroyPSEncodePP11T_PS_ENCODE"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z25FDKsbrEnc_DestroyPSEncodePP11T_PS_ENCODE.apply(null, arguments);
};

var real___Z25FDKsbrEnc_Shellsort_fractPli = asm["__Z25FDKsbrEnc_Shellsort_fractPli"]; asm["__Z25FDKsbrEnc_Shellsort_fractPli"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z25FDKsbrEnc_Shellsort_fractPli.apply(null, arguments);
};

var real___Z25FDKsbrEnc_UpdateFreqScalePhPiiiii = asm["__Z25FDKsbrEnc_UpdateFreqScalePhPiiiii"]; asm["__Z25FDKsbrEnc_UpdateFreqScalePhPiiiii"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z25FDKsbrEnc_UpdateFreqScalePhPiiiii.apply(null, arguments);
};

var real___Z25FDKsbrEnc_transientDetectP22SBR_TRANSIENT_DETECTORPPlPiPhiiii = asm["__Z25FDKsbrEnc_transientDetectP22SBR_TRANSIENT_DETECTORPPlPiPhiiii"]; asm["__Z25FDKsbrEnc_transientDetectP22SBR_TRANSIENT_DETECTORPPlPiPhiiii"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z25FDKsbrEnc_transientDetectP22SBR_TRANSIENT_DETECTORPPlPiPhiiii.apply(null, arguments);
};

var real___Z25FreeRam_aacEnc_AacEncoderPP7AAC_ENC = asm["__Z25FreeRam_aacEnc_AacEncoderPP7AAC_ENC"]; asm["__Z25FreeRam_aacEnc_AacEncoderPP7AAC_ENC"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z25FreeRam_aacEnc_AacEncoderPP7AAC_ENC.apply(null, arguments);
};

var real___Z25FreeRam_aacEnc_PsyElementPP11PSY_ELEMENT = asm["__Z25FreeRam_aacEnc_PsyElementPP11PSY_ELEMENT"]; asm["__Z25FreeRam_aacEnc_PsyElementPP11PSY_ELEMENT"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z25FreeRam_aacEnc_PsyElementPP11PSY_ELEMENT.apply(null, arguments);
};

var real___Z25GetRam_aacEnc_ElementBitsi = asm["__Z25GetRam_aacEnc_ElementBitsi"]; asm["__Z25GetRam_aacEnc_ElementBitsi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z25GetRam_aacEnc_ElementBitsi.apply(null, arguments);
};

var real___Z25GetRam_aacEnc_PsyInternali = asm["__Z25GetRam_aacEnc_PsyInternali"]; asm["__Z25GetRam_aacEnc_PsyInternali"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z25GetRam_aacEnc_PsyInternali.apply(null, arguments);
};

var real___Z25adtsWrite_EndRawDataBlockP11STRUCT_ADTSP13FDK_BITSTREAMPi = asm["__Z25adtsWrite_EndRawDataBlockP11STRUCT_ADTSP13FDK_BITSTREAMPi"]; asm["__Z25adtsWrite_EndRawDataBlockP11STRUCT_ADTSP13FDK_BITSTREAMPi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z25adtsWrite_EndRawDataBlockP11STRUCT_ADTSP13FDK_BITSTREAMPi.apply(null, arguments);
};

var real___Z25fdk_sacenc_createDCFilterPP11T_DC_FILTER = asm["__Z25fdk_sacenc_createDCFilterPP11T_DC_FILTER"]; asm["__Z25fdk_sacenc_createDCFilterPP11T_DC_FILTER"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z25fdk_sacenc_createDCFilterPP11T_DC_FILTER.apply(null, arguments);
};

var real___Z25fdk_sacenc_getPostGainFDKP11STATIC_GAIN = asm["__Z25fdk_sacenc_getPostGainFDKP11STATIC_GAIN"]; asm["__Z25fdk_sacenc_getPostGainFDKP11STATIC_GAIN"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z25fdk_sacenc_getPostGainFDKP11STATIC_GAIN.apply(null, arguments);
};

var real___Z25fdk_sacenc_spaceTree_InitP10SPACE_TREEPK16SPACE_TREE_SETUPPhi = asm["__Z25fdk_sacenc_spaceTree_InitP10SPACE_TREEPK16SPACE_TREE_SETUPPhi"]; asm["__Z25fdk_sacenc_spaceTree_InitP10SPACE_TREEPK16SPACE_TREE_SETUPPhi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z25fdk_sacenc_spaceTree_InitP10SPACE_TREEPK16SPACE_TREE_SETUPPhi.apply(null, arguments);
};

var real___Z25fdk_sacenc_spaceTree_OpenPP10SPACE_TREE = asm["__Z25fdk_sacenc_spaceTree_OpenPP10SPACE_TREE"]; asm["__Z25fdk_sacenc_spaceTree_OpenPP10SPACE_TREE"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z25fdk_sacenc_spaceTree_OpenPP10SPACE_TREE.apply(null, arguments);
};

var real___Z25qmfInitAnalysisFilterBankP15QMF_FILTER_BANKPsiiiii = asm["__Z25qmfInitAnalysisFilterBankP15QMF_FILTER_BANKPsiiiii"]; asm["__Z25qmfInitAnalysisFilterBankP15QMF_FILTER_BANKPsiiiii"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z25qmfInitAnalysisFilterBankP15QMF_FILTER_BANKPsiiiii.apply(null, arguments);
};

var real___Z25qmfSynthesisFilteringSlotP15QMF_FILTER_BANKPKlS2_iiPsiPl = asm["__Z25qmfSynthesisFilteringSlotP15QMF_FILTER_BANKPKlS2_iiPsiPl"]; asm["__Z25qmfSynthesisFilteringSlotP15QMF_FILTER_BANKPKlS2_iiPsiPl"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z25qmfSynthesisFilteringSlotP15QMF_FILTER_BANKPKlS2_iiPsiPl.apply(null, arguments);
};

var real___Z25transportEnc_GetBitstreamP12TRANSPORTENC = asm["__Z25transportEnc_GetBitstreamP12TRANSPORTENC"]; asm["__Z25transportEnc_GetBitstreamP12TRANSPORTENC"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z25transportEnc_GetBitstreamP12TRANSPORTENC.apply(null, arguments);
};

var real___Z25transportEnc_LatmGetFrameP11LATM_STREAMP13FDK_BITSTREAMPi = asm["__Z25transportEnc_LatmGetFrameP11LATM_STREAMP13FDK_BITSTREAMPi"]; asm["__Z25transportEnc_LatmGetFrameP11LATM_STREAMP13FDK_BITSTREAMPi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z25transportEnc_LatmGetFrameP11LATM_STREAMP13FDK_BITSTREAMPi.apply(null, arguments);
};

var real___Z26FDKaacEnc_AdjustThresholdsP13ADJ_THR_STATEPKP14QC_OUT_ELEMENTP6QC_OUTPKPK15PSY_OUT_ELEMENTiPK15CHANNEL_MAPPING = asm["__Z26FDKaacEnc_AdjustThresholdsP13ADJ_THR_STATEPKP14QC_OUT_ELEMENTP6QC_OUTPKPK15PSY_OUT_ELEMENTiPK15CHANNEL_MAPPING"]; asm["__Z26FDKaacEnc_AdjustThresholdsP13ADJ_THR_STATEPKP14QC_OUT_ELEMENTP6QC_OUTPKPK15PSY_OUT_ELEMENTiPK15CHANNEL_MAPPING"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z26FDKaacEnc_AdjustThresholdsP13ADJ_THR_STATEPKP14QC_OUT_ELEMENTP6QC_OUTPKPK15PSY_OUT_ELEMENTiPK15CHANNEL_MAPPING.apply(null, arguments);
};

var real___Z26FDKaacEnc_CalcBandNrgMSOptPKlS0_PiS1_PKiiPlS4_iS4_S4_ = asm["__Z26FDKaacEnc_CalcBandNrgMSOptPKlS0_PiS1_PKiiPlS4_iS4_S4_"]; asm["__Z26FDKaacEnc_CalcBandNrgMSOptPKlS0_PiS1_PKiiPlS4_iS4_S4_"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z26FDKaacEnc_CalcBandNrgMSOptPKlS0_PiS1_PKiiPlS4_iS4_S4_.apply(null, arguments);
};

var real___Z26FDKaacEnc_QuantizeSpectrumiiiPKiPKliS0_Psi = asm["__Z26FDKaacEnc_QuantizeSpectrumiiiPKiPKliS0_Psi"]; asm["__Z26FDKaacEnc_QuantizeSpectrumiiiPKiPKliS0_Psi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z26FDKaacEnc_QuantizeSpectrumiiiPKiPKliS0_Psi.apply(null, arguments);
};

var real___Z26FDKaacEnc_bitresCalcBitFaciiiiilPK13ADJ_THR_STATEP11ATS_ELEMENTPlPi = asm["__Z26FDKaacEnc_bitresCalcBitFaciiiiilPK13ADJ_THR_STATEP11ATS_ELEMENTPlPi"]; asm["__Z26FDKaacEnc_bitresCalcBitFaciiiiilPK13ADJ_THR_STATEP11ATS_ELEMENTPlPi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z26FDKaacEnc_bitresCalcBitFaciiiiilPK13ADJ_THR_STATEP11ATS_ELEMENTPlPi.apply(null, arguments);
};

var real___Z26FDKsbrEnc_InitSbrBitstreamP11COMMON_DATAPhiP11FDK_CRCINFOj = asm["__Z26FDKsbrEnc_InitSbrBitstreamP11COMMON_DATAPhiP11FDK_CRCINFOj"]; asm["__Z26FDKsbrEnc_InitSbrBitstreamP11COMMON_DATAPhiP11FDK_CRCINFOj"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z26FDKsbrEnc_InitSbrBitstreamP11COMMON_DATAPhiP11FDK_CRCINFOj.apply(null, arguments);
};

var real___Z26FDKsbrEnc_TonCorrParamExtrP16SBR_TON_CORR_ESTP9INVF_MODEPlPiPhS5_PK14SBR_FRAME_INFOS5_S5_i9XPOS_MODEj = asm["__Z26FDKsbrEnc_TonCorrParamExtrP16SBR_TON_CORR_ESTP9INVF_MODEPlPiPhS5_PK14SBR_FRAME_INFOS5_S5_i9XPOS_MODEj"]; asm["__Z26FDKsbrEnc_TonCorrParamExtrP16SBR_TON_CORR_ESTP9INVF_MODEPlPiPhS5_PK14SBR_FRAME_INFOS5_S5_i9XPOS_MODEj"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z26FDKsbrEnc_TonCorrParamExtrP16SBR_TON_CORR_ESTP9INVF_MODEPlPiPhS5_PK14SBR_FRAME_INFOS5_S5_i9XPOS_MODEj.apply(null, arguments);
};

var real___Z26FreeRam_aacEnc_ElementBitsPP12ELEMENT_BITS = asm["__Z26FreeRam_aacEnc_ElementBitsPP12ELEMENT_BITS"]; asm["__Z26FreeRam_aacEnc_ElementBitsPP12ELEMENT_BITS"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z26FreeRam_aacEnc_ElementBitsPP12ELEMENT_BITS.apply(null, arguments);
};

var real___Z26FreeRam_aacEnc_PsyInternalPP12PSY_INTERNAL = asm["__Z26FreeRam_aacEnc_PsyInternalPP12PSY_INTERNAL"]; asm["__Z26FreeRam_aacEnc_PsyInternalPP12PSY_INTERNAL"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z26FreeRam_aacEnc_PsyInternalPP12PSY_INTERNAL.apply(null, arguments);
};

var real___Z26GetRam_Sbr_freqBandTableHIi = asm["__Z26GetRam_Sbr_freqBandTableHIi"]; asm["__Z26GetRam_Sbr_freqBandTableHIi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z26GetRam_Sbr_freqBandTableHIi.apply(null, arguments);
};

var real___Z26GetRam_Sbr_freqBandTableLOi = asm["__Z26GetRam_Sbr_freqBandTableLOi"]; asm["__Z26GetRam_Sbr_freqBandTableLOi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z26GetRam_Sbr_freqBandTableLOi.apply(null, arguments);
};

var real___Z26GetRam_Sbr_guideVectorDiffi = asm["__Z26GetRam_Sbr_guideVectorDiffi"]; asm["__Z26GetRam_Sbr_guideVectorDiffi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z26GetRam_Sbr_guideVectorDiffi.apply(null, arguments);
};

var real___Z26GetRam_Sbr_guideVectorOrigi = asm["__Z26GetRam_Sbr_guideVectorOrigi"]; asm["__Z26GetRam_Sbr_guideVectorOrigi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z26GetRam_Sbr_guideVectorOrigi.apply(null, arguments);
};

var real___Z26GetRam_aacEnc_BitCntrStatei = asm["__Z26GetRam_aacEnc_BitCntrStatei"]; asm["__Z26GetRam_aacEnc_BitCntrStatei"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z26GetRam_aacEnc_BitCntrStatei.apply(null, arguments);
};

var real___Z26fdk_sacenc_destroyDCFilterPP11T_DC_FILTER = asm["__Z26fdk_sacenc_destroyDCFilterPP11T_DC_FILTER"]; asm["__Z26fdk_sacenc_destroyDCFilterPP11T_DC_FILTER"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z26fdk_sacenc_destroyDCFilterPP11T_DC_FILTER.apply(null, arguments);
};

var real___Z26fdk_sacenc_ecDataSingleEncP13FDK_BITSTREAMPA23_sPs9DATA_TYPEiiiii = asm["__Z26fdk_sacenc_ecDataSingleEncP13FDK_BITSTREAMPA23_sPs9DATA_TYPEiiiii"]; asm["__Z26fdk_sacenc_ecDataSingleEncP13FDK_BITSTREAMPA23_sPs9DATA_TYPEiiiii"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z26fdk_sacenc_ecDataSingleEncP13FDK_BITSTREAMPA23_sPs9DATA_TYPEiiiii.apply(null, arguments);
};

var real___Z26fdk_sacenc_getSpatialFrameP12BSF_INSTANCE17SPATIALFRAME_TYPE = asm["__Z26fdk_sacenc_getSpatialFrameP12BSF_INSTANCE17SPATIALFRAME_TYPE"]; asm["__Z26fdk_sacenc_getSpatialFrameP12BSF_INSTANCE17SPATIALFRAME_TYPE"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z26fdk_sacenc_getSpatialFrameP12BSF_INSTANCE17SPATIALFRAME_TYPE.apply(null, arguments);
};

var real___Z26fdk_sacenc_spaceTree_ApplyP10SPACE_TREEiiiiiPlPKPKP8FIXP_DPKS7_P12SPATIALFRAMEiPi = asm["__Z26fdk_sacenc_spaceTree_ApplyP10SPACE_TREEiiiiiPlPKPKP8FIXP_DPKS7_P12SPATIALFRAMEiPi"]; asm["__Z26fdk_sacenc_spaceTree_ApplyP10SPACE_TREEiiiiiPlPKPKP8FIXP_DPKS7_P12SPATIALFRAMEiPi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z26fdk_sacenc_spaceTree_ApplyP10SPACE_TREEiiiiiPlPKPKP8FIXP_DPKS7_P12SPATIALFRAMEiPi.apply(null, arguments);
};

var real___Z26fdk_sacenc_spaceTree_ClosePP10SPACE_TREE = asm["__Z26fdk_sacenc_spaceTree_ClosePP10SPACE_TREE"]; asm["__Z26fdk_sacenc_spaceTree_ClosePP10SPACE_TREE"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z26fdk_sacenc_spaceTree_ClosePP10SPACE_TREE.apply(null, arguments);
};

var real___Z26fdk_sacenc_staticGain_InitP11STATIC_GAINP18STATIC_GAIN_CONFIGPi = asm["__Z26fdk_sacenc_staticGain_InitP11STATIC_GAINP18STATIC_GAIN_CONFIGPi"]; asm["__Z26fdk_sacenc_staticGain_InitP11STATIC_GAINP18STATIC_GAIN_CONFIGPi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z26fdk_sacenc_staticGain_InitP11STATIC_GAINP18STATIC_GAIN_CONFIGPi.apply(null, arguments);
};

var real___Z26fdk_sacenc_staticGain_OpenPP11STATIC_GAIN = asm["__Z26fdk_sacenc_staticGain_OpenPP11STATIC_GAIN"]; asm["__Z26fdk_sacenc_staticGain_OpenPP11STATIC_GAIN"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z26fdk_sacenc_staticGain_OpenPP11STATIC_GAIN.apply(null, arguments);
};

var real___Z26qmfInitSynthesisFilterBankP15QMF_FILTER_BANKPliiiii = asm["__Z26qmfInitSynthesisFilterBankP15QMF_FILTER_BANKPliiiii"]; asm["__Z26qmfInitSynthesisFilterBankP15QMF_FILTER_BANKPliiiii"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z26qmfInitSynthesisFilterBankP15QMF_FILTER_BANKPliiiii.apply(null, arguments);
};

var real___Z26transportEnc_EndAccessUnitP12TRANSPORTENCPi = asm["__Z26transportEnc_EndAccessUnitP12TRANSPORTENCPi"]; asm["__Z26transportEnc_EndAccessUnitP12TRANSPORTENCPi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z26transportEnc_EndAccessUnitP12TRANSPORTENCPi.apply(null, arguments);
};

var real___Z26transportEnc_GetStaticBitsP12TRANSPORTENCi = asm["__Z26transportEnc_GetStaticBitsP12TRANSPORTENCi"]; asm["__Z26transportEnc_GetStaticBitsP12TRANSPORTENCi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z26transportEnc_GetStaticBitsP12TRANSPORTENCi.apply(null, arguments);
};

var real___Z27FDKaacEnc_GetMonoStereoMode12CHANNEL_MODE = asm["__Z27FDKaacEnc_GetMonoStereoMode12CHANNEL_MODE"]; asm["__Z27FDKaacEnc_GetMonoStereoMode12CHANNEL_MODE"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z27FDKaacEnc_GetMonoStereoMode12CHANNEL_MODE.apply(null, arguments);
};

var real___Z27FDKsbrEnc_PSEnc_WritePSDataP19T_PARAMETRIC_STEREOP13FDK_BITSTREAM = asm["__Z27FDKsbrEnc_PSEnc_WritePSDataP19T_PARAMETRIC_STEREOP13FDK_BITSTREAM"]; asm["__Z27FDKsbrEnc_PSEnc_WritePSDataP19T_PARAMETRIC_STEREOP13FDK_BITSTREAM"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z27FDKsbrEnc_PSEnc_WritePSDataP19T_PARAMETRIC_STEREOP13FDK_BITSTREAM.apply(null, arguments);
};

var real___Z27FDKsbrEnc_getSbrStopFreqRAWii = asm["__Z27FDKsbrEnc_getSbrStopFreqRAWii"]; asm["__Z27FDKsbrEnc_getSbrStopFreqRAWii"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z27FDKsbrEnc_getSbrStopFreqRAWii.apply(null, arguments);
};

var real___Z27FreeRam_Sbr_freqBandTableHIPPh = asm["__Z27FreeRam_Sbr_freqBandTableHIPPh"]; asm["__Z27FreeRam_Sbr_freqBandTableHIPPh"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z27FreeRam_Sbr_freqBandTableHIPPh.apply(null, arguments);
};

var real___Z27FreeRam_Sbr_freqBandTableLOPPh = asm["__Z27FreeRam_Sbr_freqBandTableLOPPh"]; asm["__Z27FreeRam_Sbr_freqBandTableLOPPh"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z27FreeRam_Sbr_freqBandTableLOPPh.apply(null, arguments);
};

var real___Z27FreeRam_Sbr_guideVectorDiffPPl = asm["__Z27FreeRam_Sbr_guideVectorDiffPPl"]; asm["__Z27FreeRam_Sbr_guideVectorDiffPPl"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z27FreeRam_Sbr_guideVectorDiffPPl.apply(null, arguments);
};

var real___Z27FreeRam_Sbr_guideVectorOrigPPl = asm["__Z27FreeRam_Sbr_guideVectorOrigPPl"]; asm["__Z27FreeRam_Sbr_guideVectorOrigPPl"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z27FreeRam_Sbr_guideVectorOrigPPl.apply(null, arguments);
};

var real___Z27FreeRam_aacEnc_BitCntrStatePP13BITCNTR_STATE = asm["__Z27FreeRam_aacEnc_BitCntrStatePP13BITCNTR_STATE"]; asm["__Z27FreeRam_aacEnc_BitCntrStatePP13BITCNTR_STATE"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z27FreeRam_aacEnc_BitCntrStatePP13BITCNTR_STATE.apply(null, arguments);
};

var real___Z27GetRam_PsQmfStatesSynthesisi = asm["__Z27GetRam_PsQmfStatesSynthesisi"]; asm["__Z27GetRam_PsQmfStatesSynthesisi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z27GetRam_PsQmfStatesSynthesisi.apply(null, arguments);
};

var real___Z27GetRam_Sbr_detectionVectorsi = asm["__Z27GetRam_Sbr_detectionVectorsi"]; asm["__Z27GetRam_Sbr_detectionVectorsi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z27GetRam_Sbr_detectionVectorsi.apply(null, arguments);
};

var real___Z27GetRam_aacEnc_PsyOutChanneli = asm["__Z27GetRam_aacEnc_PsyOutChanneli"]; asm["__Z27GetRam_aacEnc_PsyOutChanneli"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z27GetRam_aacEnc_PsyOutChanneli.apply(null, arguments);
};

var real___Z27fdk_sacenc_frameWindow_InitP13T_FRAMEWINDOWPK20T_FRAMEWINDOW_CONFIG = asm["__Z27fdk_sacenc_frameWindow_InitP13T_FRAMEWINDOWPK20T_FRAMEWINDOW_CONFIG"]; asm["__Z27fdk_sacenc_frameWindow_InitP13T_FRAMEWINDOWPK20T_FRAMEWINDOW_CONFIG"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z27fdk_sacenc_frameWindow_InitP13T_FRAMEWINDOWPK20T_FRAMEWINDOW_CONFIG.apply(null, arguments);
};

var real___Z27fdk_sacenc_getPreGainPtrFDKP11STATIC_GAIN = asm["__Z27fdk_sacenc_getPreGainPtrFDKP11STATIC_GAIN"]; asm["__Z27fdk_sacenc_getPreGainPtrFDKP11STATIC_GAIN"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z27fdk_sacenc_getPreGainPtrFDKP11STATIC_GAIN.apply(null, arguments);
};

var real___Z27fdk_sacenc_onsetDetect_InitP12ONSET_DETECTPK21T_ONSET_DETECT_CONFIGj = asm["__Z27fdk_sacenc_onsetDetect_InitP12ONSET_DETECTPK21T_ONSET_DETECT_CONFIGj"]; asm["__Z27fdk_sacenc_onsetDetect_InitP12ONSET_DETECTPK21T_ONSET_DETECT_CONFIGj"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z27fdk_sacenc_onsetDetect_InitP12ONSET_DETECTPK21T_ONSET_DETECT_CONFIGj.apply(null, arguments);
};

var real___Z27fdk_sacenc_onsetDetect_OpenPP12ONSET_DETECTj = asm["__Z27fdk_sacenc_onsetDetect_OpenPP12ONSET_DETECTj"]; asm["__Z27fdk_sacenc_onsetDetect_OpenPP12ONSET_DETECTj"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z27fdk_sacenc_onsetDetect_OpenPP12ONSET_DETECTj.apply(null, arguments);
};

var real___Z27fdk_sacenc_staticGain_ClosePP11STATIC_GAIN = asm["__Z27fdk_sacenc_staticGain_ClosePP11STATIC_GAIN"]; asm["__Z27fdk_sacenc_staticGain_ClosePP11STATIC_GAIN"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z27fdk_sacenc_staticGain_ClosePP11STATIC_GAIN.apply(null, arguments);
};

var real___Z28FDK_DRC_Generator_InitializeP8DRC_COMP11DRC_PROFILES1_ij12CHANNEL_MODE13CHANNEL_ORDERh = asm["__Z28FDK_DRC_Generator_InitializeP8DRC_COMP11DRC_PROFILES1_ij12CHANNEL_MODE13CHANNEL_ORDERh"]; asm["__Z28FDK_DRC_Generator_InitializeP8DRC_COMP11DRC_PROFILES1_ij12CHANNEL_MODE13CHANNEL_ORDERh"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z28FDK_DRC_Generator_InitializeP8DRC_COMP11DRC_PROFILES1_ij12CHANNEL_MODE13CHANNEL_ORDERh.apply(null, arguments);
};

var real___Z28FDKaacEnc_DetermineBandWidthii19AACENC_BITRATE_MODEiiPK15CHANNEL_MAPPING12CHANNEL_MODEPi = asm["__Z28FDKaacEnc_DetermineBandWidthii19AACENC_BITRATE_MODEiiPK15CHANNEL_MAPPING12CHANNEL_MODEPi"]; asm["__Z28FDKaacEnc_DetermineBandWidthii19AACENC_BITRATE_MODEiiPK15CHANNEL_MAPPING12CHANNEL_MODEPi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z28FDKaacEnc_DetermineBandWidthii19AACENC_BITRATE_MODEiiPK15CHANNEL_MAPPING12CHANNEL_MODEPi.apply(null, arguments);
};

var real___Z28FDKaacEnc_InitBlockSwitchingP23BLOCK_SWITCHING_CONTROLi = asm["__Z28FDKaacEnc_InitBlockSwitchingP23BLOCK_SWITCHING_CONTROLi"]; asm["__Z28FDKaacEnc_InitBlockSwitchingP23BLOCK_SWITCHING_CONTROLi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z28FDKaacEnc_InitBlockSwitchingP23BLOCK_SWITCHING_CONTROLi.apply(null, arguments);
};

var real___Z28FDKaacEnc_InitChannelMapping12CHANNEL_MODE13CHANNEL_ORDERP15CHANNEL_MAPPING = asm["__Z28FDKaacEnc_InitChannelMapping12CHANNEL_MODE13CHANNEL_ORDERP15CHANNEL_MAPPING"]; asm["__Z28FDKaacEnc_InitChannelMapping12CHANNEL_MODE13CHANNEL_ORDERP15CHANNEL_MAPPING"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z28FDKaacEnc_InitChannelMapping12CHANNEL_MODE13CHANNEL_ORDERP15CHANNEL_MAPPING.apply(null, arguments);
};

var real___Z28FDKaacEnc_InitPreEchoControlPlPiiS_S0_ = asm["__Z28FDKaacEnc_InitPreEchoControlPlPiiS_S0_"]; asm["__Z28FDKaacEnc_InitPreEchoControlPlPiiS_S0_"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z28FDKaacEnc_InitPreEchoControlPlPiiS_S0_.apply(null, arguments);
};

var real___Z28FDKaacEnc_MsStereoProcessingPP8PSY_DATAPP15PSY_OUT_CHANNELPKiPiS7_iiiiS6_ = asm["__Z28FDKaacEnc_MsStereoProcessingPP8PSY_DATAPP15PSY_OUT_CHANNELPKiPiS7_iiiiS6_"]; asm["__Z28FDKaacEnc_MsStereoProcessingPP8PSY_DATAPP15PSY_OUT_CHANNELPKiPiS7_iiiiS6_"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z28FDKaacEnc_MsStereoProcessingPP8PSY_DATAPP15PSY_OUT_CHANNELPKiPiS7_iiiiS6_.apply(null, arguments);
};

var real___Z28FDKaacEnc_SyncBlockSwitchingP23BLOCK_SWITCHING_CONTROLS0_ii = asm["__Z28FDKaacEnc_SyncBlockSwitchingP23BLOCK_SWITCHING_CONTROLS0_ii"]; asm["__Z28FDKaacEnc_SyncBlockSwitchingP23BLOCK_SWITCHING_CONTROLS0_ii"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z28FDKaacEnc_SyncBlockSwitchingP23BLOCK_SWITCHING_CONTROLS0_ii.apply(null, arguments);
};

var real___Z28FDKaacEnc_Transform_Real_EldPKsPliiPiiS2_iS1_ = asm["__Z28FDKaacEnc_Transform_Real_EldPKsPliiPiiS2_iS1_"]; asm["__Z28FDKaacEnc_Transform_Real_EldPKsPliiPiiS2_iS1_"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z28FDKaacEnc_Transform_Real_EldPKsPliiPiiS2_iS1_.apply(null, arguments);
};

var real___Z28FDKaacEnc_writeExtensionDataP12TRANSPORTENCP16QC_OUT_EXTENSIONijj17AUDIO_OBJECT_TYPEa = asm["__Z28FDKaacEnc_writeExtensionDataP12TRANSPORTENCP16QC_OUT_EXTENSIONijj17AUDIO_OBJECT_TYPEa"]; asm["__Z28FDKaacEnc_writeExtensionDataP12TRANSPORTENCP16QC_OUT_EXTENSIONijj17AUDIO_OBJECT_TYPEa"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z28FDKaacEnc_writeExtensionDataP12TRANSPORTENCP16QC_OUT_EXTENSIONijj17AUDIO_OBJECT_TYPEa.apply(null, arguments);
};

var real___Z28FDKsbrEnc_frameInfoGeneratorP18SBR_ENVELOPE_FRAMEPhiS1_iPKi = asm["__Z28FDKsbrEnc_frameInfoGeneratorP18SBR_ENVELOPE_FRAMEPhiS1_iPKi"]; asm["__Z28FDKsbrEnc_frameInfoGeneratorP18SBR_ENVELOPE_FRAMEPhiS1_iPKi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z28FDKsbrEnc_frameInfoGeneratorP18SBR_ENVELOPE_FRAMEPhiS1_iPKi.apply(null, arguments);
};

var real___Z28FDKsbrEnc_getSbrStartFreqRAWii = asm["__Z28FDKsbrEnc_getSbrStartFreqRAWii"]; asm["__Z28FDKsbrEnc_getSbrStartFreqRAWii"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z28FDKsbrEnc_getSbrStartFreqRAWii.apply(null, arguments);
};

var real___Z28FreeRam_PsQmfStatesSynthesisPPl = asm["__Z28FreeRam_PsQmfStatesSynthesisPPl"]; asm["__Z28FreeRam_PsQmfStatesSynthesisPPl"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z28FreeRam_PsQmfStatesSynthesisPPl.apply(null, arguments);
};

var real___Z28FreeRam_Sbr_detectionVectorsPPh = asm["__Z28FreeRam_Sbr_detectionVectorsPPh"]; asm["__Z28FreeRam_Sbr_detectionVectorsPPh"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z28FreeRam_Sbr_detectionVectorsPPh.apply(null, arguments);
};

var real___Z28FreeRam_aacEnc_PsyOutChannelPP15PSY_OUT_CHANNEL = asm["__Z28FreeRam_aacEnc_PsyOutChannelPP15PSY_OUT_CHANNEL"]; asm["__Z28FreeRam_aacEnc_PsyOutChannelPP15PSY_OUT_CHANNEL"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z28FreeRam_aacEnc_PsyOutChannelPP15PSY_OUT_CHANNEL.apply(null, arguments);
};

var real___Z28GetRam_Sbr_QmfStatesAnalysisi = asm["__Z28GetRam_Sbr_QmfStatesAnalysisi"]; asm["__Z28GetRam_Sbr_QmfStatesAnalysisi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z28GetRam_Sbr_QmfStatesAnalysisi.apply(null, arguments);
};

var real___Z28GetRam_aacEnc_PsyInputBufferi = asm["__Z28GetRam_aacEnc_PsyInputBufferi"]; asm["__Z28GetRam_aacEnc_PsyInputBufferi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z28GetRam_aacEnc_PsyInputBufferi.apply(null, arguments);
};

var real___Z28GetRam_aacEnc_PsyOutElementsi = asm["__Z28GetRam_aacEnc_PsyOutElementsi"]; asm["__Z28GetRam_aacEnc_PsyOutElementsi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z28GetRam_aacEnc_PsyOutElementsi.apply(null, arguments);
};

var real___Z28fdk_sacenc_analysisWindowingiiPlPKPK8FIXP_DPKPKPS0_ii = asm["__Z28fdk_sacenc_analysisWindowingiiPlPKPK8FIXP_DPKPKPS0_ii"]; asm["__Z28fdk_sacenc_analysisWindowingiiPlPKPK8FIXP_DPKPKPS0_ii"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z28fdk_sacenc_analysisWindowingiiPlPKPK8FIXP_DPKPKPS0_ii.apply(null, arguments);
};

var real___Z28fdk_sacenc_delay_SetDmxAlignP5DELAYi = asm["__Z28fdk_sacenc_delay_SetDmxAlignP5DELAYi"]; asm["__Z28fdk_sacenc_delay_SetDmxAlignP5DELAYi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z28fdk_sacenc_delay_SetDmxAlignP5DELAYi.apply(null, arguments);
};

var real___Z28fdk_sacenc_onsetDetect_ApplyP12ONSET_DETECTiiPKP8FIXP_DPKiiPi = asm["__Z28fdk_sacenc_onsetDetect_ApplyP12ONSET_DETECTiiPKP8FIXP_DPKiiPi"]; asm["__Z28fdk_sacenc_onsetDetect_ApplyP12ONSET_DETECTiiPKP8FIXP_DPKiiPi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z28fdk_sacenc_onsetDetect_ApplyP12ONSET_DETECTiiPKP8FIXP_DPKiiPi.apply(null, arguments);
};

var real___Z28fdk_sacenc_onsetDetect_ClosePP12ONSET_DETECT = asm["__Z28fdk_sacenc_onsetDetect_ClosePP12ONSET_DETECT"]; asm["__Z28fdk_sacenc_onsetDetect_ClosePP12ONSET_DETECT"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z28fdk_sacenc_onsetDetect_ClosePP12ONSET_DETECT.apply(null, arguments);
};

var real___Z28fdk_sacenc_writeSpatialFramePhiPiP12BSF_INSTANCE = asm["__Z28fdk_sacenc_writeSpatialFramePhiPiP12BSF_INSTANCE"]; asm["__Z28fdk_sacenc_writeSpatialFramePhiPiP12BSF_INSTANCE"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z28fdk_sacenc_writeSpatialFramePhiPiP12BSF_INSTANCE.apply(null, arguments);
};

var real___Z28transportEnc_WriteAccessUnitP12TRANSPORTENCiii = asm["__Z28transportEnc_WriteAccessUnitP12TRANSPORTENCiii"]; asm["__Z28transportEnc_WriteAccessUnitP12TRANSPORTENCiii"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z28transportEnc_WriteAccessUnitP12TRANSPORTENCiii.apply(null, arguments);
};

var real___Z29FDKaacEnc_CalcSfbMaxScaleSpecPKlPKiPii = asm["__Z29FDKaacEnc_CalcSfbMaxScaleSpecPKlPKiPii"]; asm["__Z29FDKaacEnc_CalcSfbMaxScaleSpecPKlPKiPii"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z29FDKaacEnc_CalcSfbMaxScaleSpecPKlPKiPii.apply(null, arguments);
};

var real___Z29FDKaacEnc_ChannelElementWriteP12TRANSPORTENCP12ELEMENT_INFOPP14QC_OUT_CHANNELP15PSY_OUT_ELEMENTPP15PSY_OUT_CHANNELj17AUDIO_OBJECT_TYPEaPih = asm["__Z29FDKaacEnc_ChannelElementWriteP12TRANSPORTENCP12ELEMENT_INFOPP14QC_OUT_CHANNELP15PSY_OUT_ELEMENTPP15PSY_OUT_CHANNELj17AUDIO_OBJECT_TYPEaPih"]; asm["__Z29FDKaacEnc_ChannelElementWriteP12TRANSPORTENCP12ELEMENT_INFOPP14QC_OUT_CHANNELP15PSY_OUT_ELEMENTPP15PSY_OUT_CHANNELj17AUDIO_OBJECT_TYPEaPih"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z29FDKaacEnc_ChannelElementWriteP12TRANSPORTENCP12ELEMENT_INFOPP14QC_OUT_CHANNELP15PSY_OUT_ELEMENTPP15PSY_OUT_CHANNELj17AUDIO_OBJECT_TYPEaPih.apply(null, arguments);
};

var real___Z29FDKsbrEnc_InitSbrCodeEnvelopeP17SBR_CODE_ENVELOPEPiill = asm["__Z29FDKsbrEnc_InitSbrCodeEnvelopeP17SBR_CODE_ENVELOPEPiill"]; asm["__Z29FDKsbrEnc_InitSbrCodeEnvelopeP17SBR_CODE_ENVELOPEPiill"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z29FDKsbrEnc_InitSbrCodeEnvelopeP17SBR_CODE_ENVELOPEPiill.apply(null, arguments);
};

var real___Z29FDKsbrEnc_extractSbrEnvelope1P15SBR_CONFIG_DATAP15SBR_HEADER_DATAP18SBR_BITSTREAM_DATAP11ENV_CHANNELP11COMMON_DATAP17SBR_ENV_TEMP_DATAP19SBR_FRAME_TEMP_DATA = asm["__Z29FDKsbrEnc_extractSbrEnvelope1P15SBR_CONFIG_DATAP15SBR_HEADER_DATAP18SBR_BITSTREAM_DATAP11ENV_CHANNELP11COMMON_DATAP17SBR_ENV_TEMP_DATAP19SBR_FRAME_TEMP_DATA"]; asm["__Z29FDKsbrEnc_extractSbrEnvelope1P15SBR_CONFIG_DATAP15SBR_HEADER_DATAP18SBR_BITSTREAM_DATAP11ENV_CHANNELP11COMMON_DATAP17SBR_ENV_TEMP_DATAP19SBR_FRAME_TEMP_DATA"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z29FDKsbrEnc_extractSbrEnvelope1P15SBR_CONFIG_DATAP15SBR_HEADER_DATAP18SBR_BITSTREAM_DATAP11ENV_CHANNELP11COMMON_DATAP17SBR_ENV_TEMP_DATAP19SBR_FRAME_TEMP_DATA.apply(null, arguments);
};

var real___Z29FDKsbrEnc_extractSbrEnvelope2P15SBR_CONFIG_DATAP15SBR_HEADER_DATAP19T_PARAMETRIC_STEREOP18SBR_BITSTREAM_DATAP11ENV_CHANNELS8_P11COMMON_DATAP17SBR_ENV_TEMP_DATAP19SBR_FRAME_TEMP_DATAi = asm["__Z29FDKsbrEnc_extractSbrEnvelope2P15SBR_CONFIG_DATAP15SBR_HEADER_DATAP19T_PARAMETRIC_STEREOP18SBR_BITSTREAM_DATAP11ENV_CHANNELS8_P11COMMON_DATAP17SBR_ENV_TEMP_DATAP19SBR_FRAME_TEMP_DATAi"]; asm["__Z29FDKsbrEnc_extractSbrEnvelope2P15SBR_CONFIG_DATAP15SBR_HEADER_DATAP19T_PARAMETRIC_STEREOP18SBR_BITSTREAM_DATAP11ENV_CHANNELS8_P11COMMON_DATAP17SBR_ENV_TEMP_DATAP19SBR_FRAME_TEMP_DATAi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z29FDKsbrEnc_extractSbrEnvelope2P15SBR_CONFIG_DATAP15SBR_HEADER_DATAP19T_PARAMETRIC_STEREOP18SBR_BITSTREAM_DATAP11ENV_CHANNELS8_P11COMMON_DATAP17SBR_ENV_TEMP_DATAP19SBR_FRAME_TEMP_DATAi.apply(null, arguments);
};

var real___Z29FDKsbrEnc_fastTransientDetectP18FAST_TRAN_DETECTORPKPKlPKiiPh = asm["__Z29FDKsbrEnc_fastTransientDetectP18FAST_TRAN_DETECTORPKPKlPKiiPh"]; asm["__Z29FDKsbrEnc_fastTransientDetectP18FAST_TRAN_DETECTORPKPKlPKiiPh"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z29FDKsbrEnc_fastTransientDetectP18FAST_TRAN_DETECTORPKPKlPKiiPh.apply(null, arguments);
};

var real___Z29FDKsbrEnc_initInvFiltDetectorP16SBR_INV_FILT_ESTPiij = asm["__Z29FDKsbrEnc_initInvFiltDetectorP16SBR_INV_FILT_ESTPiij"]; asm["__Z29FDKsbrEnc_initInvFiltDetectorP16SBR_INV_FILT_ESTPiij"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z29FDKsbrEnc_initInvFiltDetectorP16SBR_INV_FILT_ESTPiij.apply(null, arguments);
};

var real___Z29FreeRam_Sbr_QmfStatesAnalysisPPs = asm["__Z29FreeRam_Sbr_QmfStatesAnalysisPPs"]; asm["__Z29FreeRam_Sbr_QmfStatesAnalysisPPs"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z29FreeRam_Sbr_QmfStatesAnalysisPPs.apply(null, arguments);
};

var real___Z29FreeRam_aacEnc_PsyInputBufferPPs = asm["__Z29FreeRam_aacEnc_PsyInputBufferPPs"]; asm["__Z29FreeRam_aacEnc_PsyInputBufferPPs"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z29FreeRam_aacEnc_PsyInputBufferPPs.apply(null, arguments);
};

var real___Z29FreeRam_aacEnc_PsyOutElementsPP15PSY_OUT_ELEMENT = asm["__Z29FreeRam_aacEnc_PsyOutElementsPP15PSY_OUT_ELEMENT"]; asm["__Z29FreeRam_aacEnc_PsyOutElementsPP15PSY_OUT_ELEMENT"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z29FreeRam_aacEnc_PsyOutElementsPP15PSY_OUT_ELEMENT.apply(null, arguments);
};

var real___Z29GetRam_aacEnc_AdjustThresholdi = asm["__Z29GetRam_aacEnc_AdjustThresholdi"]; asm["__Z29GetRam_aacEnc_AdjustThresholdi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z29GetRam_aacEnc_AdjustThresholdi.apply(null, arguments);
};

var real___Z29GetRam_aacEnc_MergeGainLookUpiPh = asm["__Z29GetRam_aacEnc_MergeGainLookUpiPh"]; asm["__Z29GetRam_aacEnc_MergeGainLookUpiPh"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z29GetRam_aacEnc_MergeGainLookUpiPh.apply(null, arguments);
};

var real___Z29fdk_sacenc_frameWindow_CreatePP13T_FRAMEWINDOW = asm["__Z29fdk_sacenc_frameWindow_CreatePP13T_FRAMEWINDOW"]; asm["__Z29fdk_sacenc_frameWindow_CreatePP13T_FRAMEWINDOW"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z29fdk_sacenc_frameWindow_CreatePP13T_FRAMEWINDOW.apply(null, arguments);
};

var real___Z29fdk_sacenc_onsetDetect_UpdateP12ONSET_DETECTi = asm["__Z29fdk_sacenc_onsetDetect_UpdateP12ONSET_DETECTi"]; asm["__Z29fdk_sacenc_onsetDetect_UpdateP12ONSET_DETECTi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z29fdk_sacenc_onsetDetect_UpdateP12ONSET_DETECTi.apply(null, arguments);
};

var real___Z30FDK_MpegsEnc_GetClosestBitRate17AUDIO_OBJECT_TYPE12CHANNEL_MODEjjj = asm["__Z30FDK_MpegsEnc_GetClosestBitRate17AUDIO_OBJECT_TYPE12CHANNEL_MODEjjj"]; asm["__Z30FDK_MpegsEnc_GetClosestBitRate17AUDIO_OBJECT_TYPE12CHANNEL_MODEjjj"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z30FDK_MpegsEnc_GetClosestBitRate17AUDIO_OBJECT_TYPE12CHANNEL_MODEjjj.apply(null, arguments);
};

var real___Z30FDKaacEnc_CheckBandEnergyOptimPKlPKiS2_iPlS3_i = asm["__Z30FDKaacEnc_CheckBandEnergyOptimPKlPKiS2_iPlS3_i"]; asm["__Z30FDKaacEnc_CheckBandEnergyOptimPKlPKiS2_iPlS3_i"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z30FDKaacEnc_CheckBandEnergyOptimPKlPKiS2_iPlS3_i.apply(null, arguments);
};

var real___Z30FDKaacEnc_DetermineEncoderModeP12CHANNEL_MODEi = asm["__Z30FDKaacEnc_DetermineEncoderModeP12CHANNEL_MODEi"]; asm["__Z30FDKaacEnc_DetermineEncoderModeP12CHANNEL_MODEi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z30FDKaacEnc_DetermineEncoderModeP12CHANNEL_MODEi.apply(null, arguments);
};

var real___Z30FDKaacEnc_EstimateScaleFactorsPP15PSY_OUT_CHANNELPP14QC_OUT_CHANNELiii = asm["__Z30FDKaacEnc_EstimateScaleFactorsPP15PSY_OUT_CHANNELPP14QC_OUT_CHANNELiii"]; asm["__Z30FDKaacEnc_EstimateScaleFactorsPP15PSY_OUT_CHANNELPP14QC_OUT_CHANNELiii"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z30FDKaacEnc_EstimateScaleFactorsPP15PSY_OUT_CHANNELPP14QC_OUT_CHANNELiii.apply(null, arguments);
};

var real___Z30FDKaacEnc_InitPnsConfigurationP10PNS_CONFIGiiiiPKiii = asm["__Z30FDKaacEnc_InitPnsConfigurationP10PNS_CONFIGiiiiPKiii"]; asm["__Z30FDKaacEnc_InitPnsConfigurationP10PNS_CONFIGiiiiPKiii"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z30FDKaacEnc_InitPnsConfigurationP10PNS_CONFIGiiiiPKiii.apply(null, arguments);
};

var real___Z30FDKaacEnc_InitPsyConfigurationiiiiiiiP17PSY_CONFIGURATION7FB_TYPE = asm["__Z30FDKaacEnc_InitPsyConfigurationiiiiiiiP17PSY_CONFIGURATION7FB_TYPE"]; asm["__Z30FDKaacEnc_InitPsyConfigurationiiiiiiiP17PSY_CONFIGURATION7FB_TYPE"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z30FDKaacEnc_InitPsyConfigurationiiiiiiiP17PSY_CONFIGURATION7FB_TYPE.apply(null, arguments);
};

var real___Z30FDKaacEnc_InitTnsConfigurationiiiiiiiP10TNS_CONFIGP17PSY_CONFIGURATIONii = asm["__Z30FDKaacEnc_InitTnsConfigurationiiiiiiiP10TNS_CONFIGP17PSY_CONFIGURATIONii"]; asm["__Z30FDKaacEnc_InitTnsConfigurationiiiiiiiP10TNS_CONFIGP17PSY_CONFIGURATIONii"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z30FDKaacEnc_InitTnsConfigurationiiiiiiiP10TNS_CONFIGP17PSY_CONFIGURATIONii.apply(null, arguments);
};

var real___Z30FDKaacEnc_codeScalefactorDeltaiP13FDK_BITSTREAM = asm["__Z30FDKaacEnc_codeScalefactorDeltaiP13FDK_BITSTREAM"]; asm["__Z30FDKaacEnc_codeScalefactorDeltaiP13FDK_BITSTREAM"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z30FDKaacEnc_codeScalefactorDeltaiP13FDK_BITSTREAM.apply(null, arguments);
};

var real___Z30FDKsbrEnc_AssembleSbrBitstreamP11COMMON_DATAP11FDK_CRCINFOij = asm["__Z30FDKsbrEnc_AssembleSbrBitstreamP11COMMON_DATAP11FDK_CRCINFOij"]; asm["__Z30FDKsbrEnc_AssembleSbrBitstreamP11COMMON_DATAP11FDK_CRCINFOij"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z30FDKsbrEnc_AssembleSbrBitstreamP11COMMON_DATAP11FDK_CRCINFOij.apply(null, arguments);
};

var real___Z30FDKsbrEnc_FindStartAndStopBandiiiiiPiS_ = asm["__Z30FDKsbrEnc_FindStartAndStopBandiiiiiPiS_"]; asm["__Z30FDKsbrEnc_FindStartAndStopBandiiiiiPiS_"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z30FDKsbrEnc_FindStartAndStopBandiiiiiPiS_.apply(null, arguments);
};

var real___Z30FDKsbrEnc_InitSbrHuffmanTablesP12SBR_ENV_DATAP17SBR_CODE_ENVELOPES2_7AMP_RES = asm["__Z30FDKsbrEnc_InitSbrHuffmanTablesP12SBR_ENV_DATAP17SBR_CODE_ENVELOPES2_7AMP_RES"]; asm["__Z30FDKsbrEnc_InitSbrHuffmanTablesP12SBR_ENV_DATAP17SBR_CODE_ENVELOPES2_7AMP_RES"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z30FDKsbrEnc_InitSbrHuffmanTablesP12SBR_ENV_DATAP17SBR_CODE_ENVELOPES2_7AMP_RES.apply(null, arguments);
};

var real___Z30FDKsbrEnc_InitTonCorrParamExtriP16SBR_TON_CORR_ESTP15SBR_CONFIG_DATAiiiiij = asm["__Z30FDKsbrEnc_InitTonCorrParamExtriP16SBR_TON_CORR_ESTP15SBR_CONFIG_DATAiiiiij"]; asm["__Z30FDKsbrEnc_InitTonCorrParamExtriP16SBR_TON_CORR_ESTP15SBR_CONFIG_DATAiiiiij"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z30FDKsbrEnc_InitTonCorrParamExtriP16SBR_TON_CORR_ESTP15SBR_CONFIG_DATAiiiiij.apply(null, arguments);
};

var real___Z30FDKsbrEnc_resetInvFiltDetectorP16SBR_INV_FILT_ESTPii = asm["__Z30FDKsbrEnc_resetInvFiltDetectorP16SBR_INV_FILT_ESTPii"]; asm["__Z30FDKsbrEnc_resetInvFiltDetectorP16SBR_INV_FILT_ESTPii"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z30FDKsbrEnc_resetInvFiltDetectorP16SBR_INV_FILT_ESTPii.apply(null, arguments);
};

var real___Z30FreeRam_aacEnc_AdjustThresholdPP13ADJ_THR_STATE = asm["__Z30FreeRam_aacEnc_AdjustThresholdPP13ADJ_THR_STATE"]; asm["__Z30FreeRam_aacEnc_AdjustThresholdPP13ADJ_THR_STATE"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z30FreeRam_aacEnc_AdjustThresholdPP13ADJ_THR_STATE.apply(null, arguments);
};

var real___Z30GetRam_Sbr_guideVectorDetectedi = asm["__Z30GetRam_Sbr_guideVectorDetectedi"]; asm["__Z30GetRam_Sbr_guideVectorDetectedi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z30GetRam_Sbr_guideVectorDetectedi.apply(null, arguments);
};

var real___Z30fdk_sacenc_delay_SetTimeDomDmxP5DELAYi = asm["__Z30fdk_sacenc_delay_SetTimeDomDmxP5DELAYi"]; asm["__Z30fdk_sacenc_delay_SetTimeDomDmxP5DELAYi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z30fdk_sacenc_delay_SetTimeDomDmxP5DELAYi.apply(null, arguments);
};

var real___Z30fdk_sacenc_frameWindow_DestroyPP13T_FRAMEWINDOW = asm["__Z30fdk_sacenc_frameWindow_DestroyPP13T_FRAMEWINDOW"]; asm["__Z30fdk_sacenc_frameWindow_DestroyPP13T_FRAMEWINDOW"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z30fdk_sacenc_frameWindow_DestroyPP13T_FRAMEWINDOW.apply(null, arguments);
};

var real___Z31FDK_DRC_Generator_getDrcProfileP8DRC_COMP = asm["__Z31FDK_DRC_Generator_getDrcProfileP8DRC_COMP"]; asm["__Z31FDK_DRC_Generator_getDrcProfileP8DRC_COMP"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z31FDK_DRC_Generator_getDrcProfileP8DRC_COMP.apply(null, arguments);
};

var real___Z31FDK_DRC_Generator_setDrcProfileP8DRC_COMP11DRC_PROFILES1_ = asm["__Z31FDK_DRC_Generator_setDrcProfileP8DRC_COMP11DRC_PROFILES1_"]; asm["__Z31FDK_DRC_Generator_setDrcProfileP8DRC_COMP11DRC_PROFILES1_"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z31FDK_DRC_Generator_setDrcProfileP8DRC_COMP11DRC_PROFILES1_.apply(null, arguments);
};

var real___Z31FDKaacEnc_CalculateChaosMeasurePliS_ = asm["__Z31FDKaacEnc_CalculateChaosMeasurePliS_"]; asm["__Z31FDKaacEnc_CalculateChaosMeasurePliS_"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z31FDKaacEnc_CalculateChaosMeasurePliS_.apply(null, arguments);
};

var real___Z31FDKaacEnc_CalculateFullTonalityPlPiS_PsiPKii = asm["__Z31FDKaacEnc_CalculateFullTonalityPlPiS_PsiPKii"]; asm["__Z31FDKaacEnc_CalculateFullTonalityPlPiS_PsiPKii"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z31FDKaacEnc_CalculateFullTonalityPlPiS_PsiPKii.apply(null, arguments);
};

var real___Z31FDKsbrEnc_ResetTonCorrParamExtrP16SBR_TON_CORR_ESTiiPhiiPS1_Pii = asm["__Z31FDKsbrEnc_ResetTonCorrParamExtrP16SBR_TON_CORR_ESTiiPhiiPS1_Pii"]; asm["__Z31FDKsbrEnc_ResetTonCorrParamExtrP16SBR_TON_CORR_ESTiiPhiiPS1_Pii"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z31FDKsbrEnc_ResetTonCorrParamExtrP16SBR_TON_CORR_ESTiiPhiiPS1_Pii.apply(null, arguments);
};

var real___Z31FreeRam_Sbr_guideVectorDetectedPPh = asm["__Z31FreeRam_Sbr_guideVectorDetectedPPh"]; asm["__Z31FreeRam_Sbr_guideVectorDetectedPPh"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z31FreeRam_Sbr_guideVectorDetectedPPh.apply(null, arguments);
};

var real___Z32FDK_DRC_Generator_getCompProfileP8DRC_COMP = asm["__Z32FDK_DRC_Generator_getCompProfileP8DRC_COMP"]; asm["__Z32FDK_DRC_Generator_getCompProfileP8DRC_COMP"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z32FDK_DRC_Generator_getCompProfileP8DRC_COMP.apply(null, arguments);
};

var real___Z32FDKaacEnc_FinalizeBitConsumptionP15CHANNEL_MAPPINGP8QC_STATEP6QC_OUTPP14QC_OUT_ELEMENTP12TRANSPORTENC17AUDIO_OBJECT_TYPEja = asm["__Z32FDKaacEnc_FinalizeBitConsumptionP15CHANNEL_MAPPINGP8QC_STATEP6QC_OUTPP14QC_OUT_ELEMENTP12TRANSPORTENC17AUDIO_OBJECT_TYPEja"]; asm["__Z32FDKaacEnc_FinalizeBitConsumptionP15CHANNEL_MAPPINGP8QC_STATEP6QC_OUTPP14QC_OUT_ELEMENTP12TRANSPORTENC17AUDIO_OBJECT_TYPEja"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z32FDKaacEnc_FinalizeBitConsumptionP15CHANNEL_MAPPINGP8QC_STATEP6QC_OUTPP14QC_OUT_ELEMENTP12TRANSPORTENC17AUDIO_OBJECT_TYPEja.apply(null, arguments);
};

var real___Z32FDKsbrEnc_CreateTonCorrParamExtrP16SBR_TON_CORR_ESTi = asm["__Z32FDKsbrEnc_CreateTonCorrParamExtrP16SBR_TON_CORR_ESTi"]; asm["__Z32FDKsbrEnc_CreateTonCorrParamExtrP16SBR_TON_CORR_ESTi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z32FDKsbrEnc_CreateTonCorrParamExtrP16SBR_TON_CORR_ESTi.apply(null, arguments);
};

var real___Z32FDKsbrEnc_DeleteTonCorrParamExtrP16SBR_TON_CORR_EST = asm["__Z32FDKsbrEnc_DeleteTonCorrParamExtrP16SBR_TON_CORR_EST"]; asm["__Z32FDKsbrEnc_DeleteTonCorrParamExtrP16SBR_TON_CORR_EST"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z32FDKsbrEnc_DeleteTonCorrParamExtrP16SBR_TON_CORR_EST.apply(null, arguments);
};

var real___Z32FDKsbrEnc_InitExtractSbrEnvelopeP20SBR_EXTRACT_ENVELOPEiiiiiimiPhj = asm["__Z32FDKsbrEnc_InitExtractSbrEnvelopeP20SBR_EXTRACT_ENVELOPEiiiiiimiPhj"]; asm["__Z32FDKsbrEnc_InitExtractSbrEnvelopeP20SBR_EXTRACT_ENVELOPEiiiiiimiPhj"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z32FDKsbrEnc_InitExtractSbrEnvelopeP20SBR_EXTRACT_ENVELOPEiiiiiimiPhj.apply(null, arguments);
};

var real___Z32FDKsbrEnc_LSI_divide_scale_fractlll = asm["__Z32FDKsbrEnc_LSI_divide_scale_fractlll"]; asm["__Z32FDKsbrEnc_LSI_divide_scale_fractlll"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z32FDKsbrEnc_LSI_divide_scale_fractlll.apply(null, arguments);
};

var real___Z32FDKsbrEnc_initFrameInfoGeneratorP18SBR_ENVELOPE_FRAMEiiiiPK8FREQ_REShi = asm["__Z32FDKsbrEnc_initFrameInfoGeneratorP18SBR_ENVELOPE_FRAMEiiiiPK8FREQ_REShi"]; asm["__Z32FDKsbrEnc_initFrameInfoGeneratorP18SBR_ENVELOPE_FRAMEiiiiPK8FREQ_REShi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z32FDKsbrEnc_initFrameInfoGeneratorP18SBR_ENVELOPE_FRAMEiiiiPK8FREQ_REShi.apply(null, arguments);
};

var real___Z32GetRam_aacEnc_AdjThrStateElementi = asm["__Z32GetRam_aacEnc_AdjThrStateElementi"]; asm["__Z32GetRam_aacEnc_AdjThrStateElementi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z32GetRam_aacEnc_AdjThrStateElementi.apply(null, arguments);
};

var real___Z32fdk_sacenc_delay_GetInfoDmxDelayP5DELAY = asm["__Z32fdk_sacenc_delay_GetInfoDmxDelayP5DELAY"]; asm["__Z32fdk_sacenc_delay_GetInfoDmxDelayP5DELAY"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z32fdk_sacenc_delay_GetInfoDmxDelayP5DELAY.apply(null, arguments);
};

var real___Z32fdk_sacenc_duplicateParameterSetPK12SPATIALFRAMEiPS_i = asm["__Z32fdk_sacenc_duplicateParameterSetPK12SPATIALFRAMEiPS_i"]; asm["__Z32fdk_sacenc_duplicateParameterSetPK12SPATIALFRAMEiPS_i"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z32fdk_sacenc_duplicateParameterSetPK12SPATIALFRAMEiPS_i.apply(null, arguments);
};

var real___Z32fdk_sacenc_frameWindow_GetWindowP13T_FRAMEWINDOWPiiP11FRAMINGINFOPPlP13FRAMEWIN_LISTi = asm["__Z32fdk_sacenc_frameWindow_GetWindowP13T_FRAMEWINDOWPiiP11FRAMINGINFOPPlP13FRAMEWIN_LISTi"]; asm["__Z32fdk_sacenc_frameWindow_GetWindowP13T_FRAMEWINDOWPiiP11FRAMINGINFOPPlP13FRAMEWIN_LISTi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z32fdk_sacenc_frameWindow_GetWindowP13T_FRAMEWINDOWPiiP11FRAMINGINFOPPlP13FRAMEWIN_LISTi.apply(null, arguments);
};

var real___Z32fdk_sacenc_staticGain_GetDmxGainP11STATIC_GAIN = asm["__Z32fdk_sacenc_staticGain_GetDmxGainP11STATIC_GAIN"]; asm["__Z32fdk_sacenc_staticGain_GetDmxGainP11STATIC_GAIN"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z32fdk_sacenc_staticGain_GetDmxGainP11STATIC_GAIN.apply(null, arguments);
};

var real___Z32fdk_sacenc_staticGain_OpenConfigPP18STATIC_GAIN_CONFIG = asm["__Z32fdk_sacenc_staticGain_OpenConfigPP18STATIC_GAIN_CONFIG"]; asm["__Z32fdk_sacenc_staticGain_OpenConfigPP18STATIC_GAIN_CONFIG"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z32fdk_sacenc_staticGain_OpenConfigPP18STATIC_GAIN_CONFIG.apply(null, arguments);
};

var real___Z32fdk_sacenc_staticGain_SetDmxGainP18STATIC_GAIN_CONFIG20MP4SPACEENC_DMX_GAIN = asm["__Z32fdk_sacenc_staticGain_SetDmxGainP18STATIC_GAIN_CONFIG20MP4SPACEENC_DMX_GAIN"]; asm["__Z32fdk_sacenc_staticGain_SetDmxGainP18STATIC_GAIN_CONFIG20MP4SPACEENC_DMX_GAIN"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z32fdk_sacenc_staticGain_SetDmxGainP18STATIC_GAIN_CONFIG20MP4SPACEENC_DMX_GAIN.apply(null, arguments);
};

var real___Z32fdk_sacenc_staticGain_SetEncModeP18STATIC_GAIN_CONFIG16MP4SPACEENC_MODE = asm["__Z32fdk_sacenc_staticGain_SetEncModeP18STATIC_GAIN_CONFIG16MP4SPACEENC_MODE"]; asm["__Z32fdk_sacenc_staticGain_SetEncModeP18STATIC_GAIN_CONFIG16MP4SPACEENC_MODE"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z32fdk_sacenc_staticGain_SetEncModeP18STATIC_GAIN_CONFIG16MP4SPACEENC_MODE.apply(null, arguments);
};

var real___Z32transportEnc_RegisterSbrCallbackP12TRANSPORTENCPFiPvP13FDK_BITSTREAMiii17AUDIO_OBJECT_TYPE14MP4_ELEMENT_IDihhhPhiES1_ = asm["__Z32transportEnc_RegisterSbrCallbackP12TRANSPORTENCPFiPvP13FDK_BITSTREAMiii17AUDIO_OBJECT_TYPE14MP4_ELEMENT_IDihhhPhiES1_"]; asm["__Z32transportEnc_RegisterSbrCallbackP12TRANSPORTENCPFiPvP13FDK_BITSTREAMiii17AUDIO_OBJECT_TYPE14MP4_ELEMENT_IDihhhPhiES1_"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z32transportEnc_RegisterSbrCallbackP12TRANSPORTENCPFiPvP13FDK_BITSTREAMiii17AUDIO_OBJECT_TYPE14MP4_ELEMENT_IDihhhPhiES1_.apply(null, arguments);
};

var real___Z32transportEnc_RegisterSscCallbackP12TRANSPORTENCPFiPvP13FDK_BITSTREAM17AUDIO_OBJECT_TYPEiiiiihPhES1_ = asm["__Z32transportEnc_RegisterSscCallbackP12TRANSPORTENCPFiPvP13FDK_BITSTREAM17AUDIO_OBJECT_TYPEiiiiihPhES1_"]; asm["__Z32transportEnc_RegisterSscCallbackP12TRANSPORTENCPFiPvP13FDK_BITSTREAM17AUDIO_OBJECT_TYPEiiiiihPhES1_"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z32transportEnc_RegisterSscCallbackP12TRANSPORTENCPFiPvP13FDK_BITSTREAM17AUDIO_OBJECT_TYPEiiiiihPhES1_.apply(null, arguments);
};

var real___Z33FDKaacEnc_CalcBandEnergyOptimLongPKlPiPKiiPlS4_ = asm["__Z33FDKaacEnc_CalcBandEnergyOptimLongPKlPiPKiiPlS4_"]; asm["__Z33FDKaacEnc_CalcBandEnergyOptimLongPKlPiPKiiPlS4_"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z33FDKaacEnc_CalcBandEnergyOptimLongPKlPiPKiiPlS4_.apply(null, arguments);
};

var real___Z33FDKaacEnc_FreqToBandWidthRoundingiiiPKi = asm["__Z33FDKaacEnc_FreqToBandWidthRoundingiiiPKi"]; asm["__Z33FDKaacEnc_FreqToBandWidthRoundingiiiPKi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z33FDKaacEnc_FreqToBandWidthRoundingiiiPKi.apply(null, arguments);
};

var real___Z33FDKsbrEnc_CalculateTonalityQuotasP16SBR_TON_CORR_ESTPPlS2_ii = asm["__Z33FDKsbrEnc_CalculateTonalityQuotasP16SBR_TON_CORR_ESTPPlS2_ii"]; asm["__Z33FDKsbrEnc_CalculateTonalityQuotasP16SBR_TON_CORR_ESTPPlS2_ii"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z33FDKsbrEnc_CalculateTonalityQuotasP16SBR_TON_CORR_ESTPPlS2_ii.apply(null, arguments);
};

var real___Z33FreeRam_aacEnc_AdjThrStateElementPP11ATS_ELEMENT = asm["__Z33FreeRam_aacEnc_AdjThrStateElementPP11ATS_ELEMENT"]; asm["__Z33FreeRam_aacEnc_AdjThrStateElementPP11ATS_ELEMENT"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z33FreeRam_aacEnc_AdjThrStateElementPP11ATS_ELEMENT.apply(null, arguments);
};

var real___Z33fdk_sacenc_delay_SetMinimizeDelayP5DELAYi = asm["__Z33fdk_sacenc_delay_SetMinimizeDelayP5DELAYi"]; asm["__Z33fdk_sacenc_delay_SetMinimizeDelayP5DELAYi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z33fdk_sacenc_delay_SetMinimizeDelayP5DELAYi.apply(null, arguments);
};

var real___Z33fdk_sacenc_staticGain_CloseConfigPP18STATIC_GAIN_CONFIG = asm["__Z33fdk_sacenc_staticGain_CloseConfigPP18STATIC_GAIN_CONFIG"]; asm["__Z33fdk_sacenc_staticGain_CloseConfigPP18STATIC_GAIN_CONFIG"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z33fdk_sacenc_staticGain_CloseConfigPP18STATIC_GAIN_CONFIG.apply(null, arguments);
};

var real___Z34FDKaacEnc_CalcBandEnergyOptimShortPKlPiPKiiPl = asm["__Z34FDKaacEnc_CalcBandEnergyOptimShortPKlPiPKiiPl"]; asm["__Z34FDKaacEnc_CalcBandEnergyOptimShortPKlPiPKiiPl"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z34FDKaacEnc_CalcBandEnergyOptimShortPKlPiPKiiPl.apply(null, arguments);
};

var real___Z34FDKaacEnc_PreProcessPnsChannelPairiPlS_S_S_S_P10PNS_CONFIGP8PNS_DATAS3_ = asm["__Z34FDKaacEnc_PreProcessPnsChannelPairiPlS_S_S_S_P10PNS_CONFIGP8PNS_DATAS3_"]; asm["__Z34FDKaacEnc_PreProcessPnsChannelPairiPlS_S_S_S_P10PNS_CONFIGP8PNS_DATAS3_"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z34FDKaacEnc_PreProcessPnsChannelPairiPlS_S_S_S_P10PNS_CONFIGP8PNS_DATAS3_.apply(null, arguments);
};

var real___Z34FDKsbrEnc_CreateExtractSbrEnvelopeP20SBR_EXTRACT_ENVELOPEiiPh = asm["__Z34FDKsbrEnc_CreateExtractSbrEnvelopeP20SBR_EXTRACT_ENVELOPEiiPh"]; asm["__Z34FDKsbrEnc_CreateExtractSbrEnvelopeP20SBR_EXTRACT_ENVELOPEiiPh"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z34FDKsbrEnc_CreateExtractSbrEnvelopeP20SBR_EXTRACT_ENVELOPEiiPh.apply(null, arguments);
};

var real___Z34FDKsbrEnc_InitSbrTransientDetectorP22SBR_TRANSIENT_DETECTORjiiP16sbrConfigurationiiiiiii = asm["__Z34FDKsbrEnc_InitSbrTransientDetectorP22SBR_TRANSIENT_DETECTORjiiP16sbrConfigurationiiiiiii"]; asm["__Z34FDKsbrEnc_InitSbrTransientDetectorP22SBR_TRANSIENT_DETECTORjiiP16sbrConfigurationiiiiiii"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z34FDKsbrEnc_InitSbrTransientDetectorP22SBR_TRANSIENT_DETECTORjiiP16sbrConfigurationiiiiiii.apply(null, arguments);
};

var real___Z34FDKsbrEnc_deleteExtractSbrEnvelopeP20SBR_EXTRACT_ENVELOPE = asm["__Z34FDKsbrEnc_deleteExtractSbrEnvelopeP20SBR_EXTRACT_ENVELOPE"]; asm["__Z34FDKsbrEnc_deleteExtractSbrEnvelopeP20SBR_EXTRACT_ENVELOPE"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z34FDKsbrEnc_deleteExtractSbrEnvelopeP20SBR_EXTRACT_ENVELOPE.apply(null, arguments);
};

var real___Z34FDKsbrEnc_sbrNoiseFloorEstimateQmfP24SBR_NOISE_FLOOR_ESTIMATEPK14SBR_FRAME_INFOPlPS4_PaiijiP9INVF_MODEj = asm["__Z34FDKsbrEnc_sbrNoiseFloorEstimateQmfP24SBR_NOISE_FLOOR_ESTIMATEPK14SBR_FRAME_INFOPlPS4_PaiijiP9INVF_MODEj"]; asm["__Z34FDKsbrEnc_sbrNoiseFloorEstimateQmfP24SBR_NOISE_FLOOR_ESTIMATEPK14SBR_FRAME_INFOPlPS4_PaiijiP9INVF_MODEj"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z34FDKsbrEnc_sbrNoiseFloorEstimateQmfP24SBR_NOISE_FLOOR_ESTIMATEPK14SBR_FRAME_INFOPlPS4_PaiijiP9INVF_MODEj.apply(null, arguments);
};

var real___Z34fdk_sacenc_delay_GetInfoCodecDelayP5DELAY = asm["__Z34fdk_sacenc_delay_GetInfoCodecDelayP5DELAY"]; asm["__Z34fdk_sacenc_delay_GetInfoCodecDelayP5DELAY"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z34fdk_sacenc_delay_GetInfoCodecDelayP5DELAY.apply(null, arguments);
};

var real___Z34fdk_sacenc_staticPostGain_ApplyFDKP11STATIC_GAINPsii = asm["__Z34fdk_sacenc_staticPostGain_ApplyFDKP11STATIC_GAINPsii"]; asm["__Z34fdk_sacenc_staticPostGain_ApplyFDKP11STATIC_GAINPsii"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z34fdk_sacenc_staticPostGain_ApplyFDKP11STATIC_GAINPsii.apply(null, arguments);
};

var real___Z35FDKaacEnc_IntensityStereoProcessingPlS_S_S_S_S_S_S_S_S_S_PiS0_iiiPKiiS0_S0_PP8PNS_DATA = asm["__Z35FDKaacEnc_IntensityStereoProcessingPlS_S_S_S_S_S_S_S_S_S_PiS0_iiiPKiiS0_S0_PP8PNS_DATA"]; asm["__Z35FDKaacEnc_IntensityStereoProcessingPlS_S_S_S_S_S_S_S_S_S_PiS0_iiiPKiiS0_S0_PP8PNS_DATA"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z35FDKaacEnc_IntensityStereoProcessingPlS_S_S_S_S_S_S_S_S_S_PiS0_iiiPKiiS0_S0_PP8PNS_DATA.apply(null, arguments);
};

var real___Z35FDKaacEnc_PostProcessPnsChannelPairiP10PNS_CONFIGP8PNS_DATAS2_PiS3_ = asm["__Z35FDKaacEnc_PostProcessPnsChannelPairiP10PNS_CONFIGP8PNS_DATAS2_PiS3_"]; asm["__Z35FDKaacEnc_PostProcessPnsChannelPairiP10PNS_CONFIGP8PNS_DATAS2_PiS3_"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z35FDKaacEnc_PostProcessPnsChannelPairiP10PNS_CONFIGP8PNS_DATAS2_PiS3_.apply(null, arguments);
};

var real___Z35FDKaacEnc_calcSfbQuantEnergyAndDistPlPsiiS_S_ = asm["__Z35FDKaacEnc_calcSfbQuantEnergyAndDistPlPsiiS_S_"]; asm["__Z35FDKaacEnc_calcSfbQuantEnergyAndDistPlPsiiS_S_"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z35FDKaacEnc_calcSfbQuantEnergyAndDistPlPsiiS_S_.apply(null, arguments);
};

var real___Z35FDKsbrEnc_InitSbrNoiseFloorEstimateP24SBR_NOISE_FLOOR_ESTIMATEiPKhiiiij = asm["__Z35FDKsbrEnc_InitSbrNoiseFloorEstimateP24SBR_NOISE_FLOOR_ESTIMATEiPKhiiiij"]; asm["__Z35FDKsbrEnc_InitSbrNoiseFloorEstimateP24SBR_NOISE_FLOOR_ESTIMATEiPKhiiiij"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z35FDKsbrEnc_InitSbrNoiseFloorEstimateP24SBR_NOISE_FLOOR_ESTIMATEiPKhiiiij.apply(null, arguments);
};

var real___Z35GetRam_Sbr_prevEnvelopeCompensationi = asm["__Z35GetRam_Sbr_prevEnvelopeCompensationi"]; asm["__Z35GetRam_Sbr_prevEnvelopeCompensationi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z35GetRam_Sbr_prevEnvelopeCompensationi.apply(null, arguments);
};

var real___Z35fdk_sacenc_getSpatialSpecificConfigP12BSF_INSTANCE = asm["__Z35fdk_sacenc_getSpatialSpecificConfigP12BSF_INSTANCE"]; asm["__Z35fdk_sacenc_getSpatialSpecificConfigP12BSF_INSTANCE"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z35fdk_sacenc_getSpatialSpecificConfigP12BSF_INSTANCE.apply(null, arguments);
};

var real___Z35fdk_sacenc_spaceTree_GetDescriptionP10SPACE_TREEP22SPACE_TREE_DESCRIPTION = asm["__Z35fdk_sacenc_spaceTree_GetDescriptionP10SPACE_TREEP22SPACE_TREE_DESCRIPTION"]; asm["__Z35fdk_sacenc_spaceTree_GetDescriptionP10SPACE_TREEP22SPACE_TREE_DESCRIPTION"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z35fdk_sacenc_spaceTree_GetDescriptionP10SPACE_TREEP22SPACE_TREE_DESCRIPTION.apply(null, arguments);
};

var real___Z35transportEnc_LatmAdjustSubframeBitsP11LATM_STREAMPi = asm["__Z35transportEnc_LatmAdjustSubframeBitsP11LATM_STREAMPi"]; asm["__Z35transportEnc_LatmAdjustSubframeBitsP11LATM_STREAMPi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z35transportEnc_LatmAdjustSubframeBitsP11LATM_STREAMPi.apply(null, arguments);
};

var real___Z36FDKsbrEnc_CountSbrChannelPairElementP15SBR_HEADER_DATAP19T_PARAMETRIC_STEREOP18SBR_BITSTREAM_DATAP12SBR_ENV_DATAS6_P11COMMON_DATAj = asm["__Z36FDKsbrEnc_CountSbrChannelPairElementP15SBR_HEADER_DATAP19T_PARAMETRIC_STEREOP18SBR_BITSTREAM_DATAP12SBR_ENV_DATAS6_P11COMMON_DATAj"]; asm["__Z36FDKsbrEnc_CountSbrChannelPairElementP15SBR_HEADER_DATAP19T_PARAMETRIC_STEREOP18SBR_BITSTREAM_DATAP12SBR_ENV_DATAS6_P11COMMON_DATAj"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z36FDKsbrEnc_CountSbrChannelPairElementP15SBR_HEADER_DATAP19T_PARAMETRIC_STEREOP18SBR_BITSTREAM_DATAP12SBR_ENV_DATAS6_P11COMMON_DATAj.apply(null, arguments);
};

var real___Z36FDKsbrEnc_WriteEnvChannelPairElementP15SBR_HEADER_DATAP19T_PARAMETRIC_STEREOP18SBR_BITSTREAM_DATAP12SBR_ENV_DATAS6_P11COMMON_DATAj = asm["__Z36FDKsbrEnc_WriteEnvChannelPairElementP15SBR_HEADER_DATAP19T_PARAMETRIC_STEREOP18SBR_BITSTREAM_DATAP12SBR_ENV_DATAS6_P11COMMON_DATAj"]; asm["__Z36FDKsbrEnc_WriteEnvChannelPairElementP15SBR_HEADER_DATAP19T_PARAMETRIC_STEREOP18SBR_BITSTREAM_DATAP12SBR_ENV_DATAS6_P11COMMON_DATAj"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z36FDKsbrEnc_WriteEnvChannelPairElementP15SBR_HEADER_DATAP19T_PARAMETRIC_STEREOP18SBR_BITSTREAM_DATAP12SBR_ENV_DATAS6_P11COMMON_DATAj.apply(null, arguments);
};

var real___Z36FDKsbrEnc_resetSbrNoiseFloorEstimateP24SBR_NOISE_FLOOR_ESTIMATEPKhi = asm["__Z36FDKsbrEnc_resetSbrNoiseFloorEstimateP24SBR_NOISE_FLOOR_ESTIMATEPKhi"]; asm["__Z36FDKsbrEnc_resetSbrNoiseFloorEstimateP24SBR_NOISE_FLOOR_ESTIMATEPKhi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z36FDKsbrEnc_resetSbrNoiseFloorEstimateP24SBR_NOISE_FLOOR_ESTIMATEPKhi.apply(null, arguments);
};

var real___Z36FreeRam_Sbr_prevEnvelopeCompensationPPh = asm["__Z36FreeRam_Sbr_prevEnvelopeCompensationPPh"]; asm["__Z36FreeRam_Sbr_prevEnvelopeCompensationPPh"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z36FreeRam_Sbr_prevEnvelopeCompensationPPh.apply(null, arguments);
};

var real___Z36fdk_sacenc_delay_GetDiscardOutFramesP5DELAY = asm["__Z36fdk_sacenc_delay_GetDiscardOutFramesP5DELAY"]; asm["__Z36fdk_sacenc_delay_GetDiscardOutFramesP5DELAY"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z36fdk_sacenc_delay_GetDiscardOutFramesP5DELAY.apply(null, arguments);
};

var real___Z36fdk_sacenc_delay_GetInfoDecoderDelayP5DELAY = asm["__Z36fdk_sacenc_delay_GetInfoDecoderDelayP5DELAY"]; asm["__Z36fdk_sacenc_delay_GetInfoDecoderDelayP5DELAY"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z36fdk_sacenc_delay_GetInfoDecoderDelayP5DELAY.apply(null, arguments);
};

var real___Z37FDKaacEnc_GetChannelModeConfiguration12CHANNEL_MODE = asm["__Z37FDKaacEnc_GetChannelModeConfiguration12CHANNEL_MODE"]; asm["__Z37FDKaacEnc_GetChannelModeConfiguration12CHANNEL_MODE"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z37FDKaacEnc_GetChannelModeConfiguration12CHANNEL_MODE.apply(null, arguments);
};

var real___Z37FDKsbrEnc_qmfInverseFilteringDetectorP16SBR_INV_FILT_ESTPPlS1_PaiiiP9INVF_MODE = asm["__Z37FDKsbrEnc_qmfInverseFilteringDetectorP16SBR_INV_FILT_ESTPPlS1_PaiiiP9INVF_MODE"]; asm["__Z37FDKsbrEnc_qmfInverseFilteringDetectorP16SBR_INV_FILT_ESTPPlS1_PaiiiP9INVF_MODE"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z37FDKsbrEnc_qmfInverseFilteringDetectorP16SBR_INV_FILT_ESTPPlS1_PaiiiP9INVF_MODE.apply(null, arguments);
};

var real___Z37fdk_sacenc_init_enhancedTimeDomainDmxP26T_ENHANCED_TIME_DOMAIN_DMXPKlilii = asm["__Z37fdk_sacenc_init_enhancedTimeDomainDmxP26T_ENHANCED_TIME_DOMAIN_DMXPKlilii"]; asm["__Z37fdk_sacenc_init_enhancedTimeDomainDmxP26T_ENHANCED_TIME_DOMAIN_DMXPKlilii"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z37fdk_sacenc_init_enhancedTimeDomainDmxP26T_ENHANCED_TIME_DOMAIN_DMXPKlilii.apply(null, arguments);
};

var real___Z37fdk_sacenc_open_enhancedTimeDomainDmxPP26T_ENHANCED_TIME_DOMAIN_DMXi = asm["__Z37fdk_sacenc_open_enhancedTimeDomainDmxPP26T_ENHANCED_TIME_DOMAIN_DMXi"]; asm["__Z37fdk_sacenc_open_enhancedTimeDomainDmxPP26T_ENHANCED_TIME_DOMAIN_DMXi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z37fdk_sacenc_open_enhancedTimeDomainDmxPP26T_ENHANCED_TIME_DOMAIN_DMXi.apply(null, arguments);
};

var real___Z37fdk_sacenc_writeSpatialSpecificConfigP21SPATIALSPECIFICCONFIGPhiPi = asm["__Z37fdk_sacenc_writeSpatialSpecificConfigP21SPATIALSPECIFICCONFIGPhiPi"]; asm["__Z37fdk_sacenc_writeSpatialSpecificConfigP21SPATIALSPECIFICCONFIGPhiPi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z37fdk_sacenc_writeSpatialSpecificConfigP21SPATIALSPECIFICCONFIGPhiPi.apply(null, arguments);
};

var real___Z38FDKsbrEnc_InitSbrFastTransientDetectorP18FAST_TRAN_DETECTORiiii = asm["__Z38FDKsbrEnc_InitSbrFastTransientDetectorP18FAST_TRAN_DETECTORiiii"]; asm["__Z38FDKsbrEnc_InitSbrFastTransientDetectorP18FAST_TRAN_DETECTORiiii"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z38FDKsbrEnc_InitSbrFastTransientDetectorP18FAST_TRAN_DETECTORiiii.apply(null, arguments);
};

var real___Z38FDKsbrEnc_WriteEnvSingleChannelElementP15SBR_HEADER_DATAP19T_PARAMETRIC_STEREOP18SBR_BITSTREAM_DATAP12SBR_ENV_DATAP11COMMON_DATAj = asm["__Z38FDKsbrEnc_WriteEnvSingleChannelElementP15SBR_HEADER_DATAP19T_PARAMETRIC_STEREOP18SBR_BITSTREAM_DATAP12SBR_ENV_DATAP11COMMON_DATAj"]; asm["__Z38FDKsbrEnc_WriteEnvSingleChannelElementP15SBR_HEADER_DATAP19T_PARAMETRIC_STEREOP18SBR_BITSTREAM_DATAP12SBR_ENV_DATAP11COMMON_DATAj"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z38FDKsbrEnc_WriteEnvSingleChannelElementP15SBR_HEADER_DATAP19T_PARAMETRIC_STEREOP18SBR_BITSTREAM_DATAP12SBR_ENV_DATAP11COMMON_DATAj.apply(null, arguments);
};

var real___Z38fdk_sacenc_apply_enhancedTimeDomainDmxP26T_ENHANCED_TIME_DOMAIN_DMXPKPKsPsi = asm["__Z38fdk_sacenc_apply_enhancedTimeDomainDmxP26T_ENHANCED_TIME_DOMAIN_DMXPKPKsPsi"]; asm["__Z38fdk_sacenc_apply_enhancedTimeDomainDmxP26T_ENHANCED_TIME_DOMAIN_DMXPKPKsPsi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z38fdk_sacenc_apply_enhancedTimeDomainDmxP26T_ENHANCED_TIME_DOMAIN_DMXPKPKsPsi.apply(null, arguments);
};

var real___Z38fdk_sacenc_close_enhancedTimeDomainDmxPP26T_ENHANCED_TIME_DOMAIN_DMX = asm["__Z38fdk_sacenc_close_enhancedTimeDomainDmxPP26T_ENHANCED_TIME_DOMAIN_DMX"]; asm["__Z38fdk_sacenc_close_enhancedTimeDomainDmxPP26T_ENHANCED_TIME_DOMAIN_DMX"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z38fdk_sacenc_close_enhancedTimeDomainDmxPP26T_ENHANCED_TIME_DOMAIN_DMX.apply(null, arguments);
};

var real___Z38fdk_sacenc_initSpatialBitstreamEncoderP12BSF_INSTANCE = asm["__Z38fdk_sacenc_initSpatialBitstreamEncoderP12BSF_INSTANCE"]; asm["__Z38fdk_sacenc_initSpatialBitstreamEncoderP12BSF_INSTANCE"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z38fdk_sacenc_initSpatialBitstreamEncoderP12BSF_INSTANCE.apply(null, arguments);
};

var real___Z39FDK_MpegsEnc_WriteSpatialSpecificConfigP11MPS_ENCODERP13FDK_BITSTREAM = asm["__Z39FDK_MpegsEnc_WriteSpatialSpecificConfigP11MPS_ENCODERP13FDK_BITSTREAM"]; asm["__Z39FDK_MpegsEnc_WriteSpatialSpecificConfigP11MPS_ENCODERP13FDK_BITSTREAM"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z39FDK_MpegsEnc_WriteSpatialSpecificConfigP11MPS_ENCODERP13FDK_BITSTREAM.apply(null, arguments);
};

var real___Z39fdk_sacenc_delay_GetDmxAlignBufferDelayP5DELAY = asm["__Z39fdk_sacenc_delay_GetDmxAlignBufferDelayP5DELAY"]; asm["__Z39fdk_sacenc_delay_GetDmxAlignBufferDelayP5DELAY"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z39fdk_sacenc_delay_GetDmxAlignBufferDelayP5DELAY.apply(null, arguments);
};

var real___Z39fdk_sacenc_staticGain_InitDefaultConfigP18STATIC_GAIN_CONFIG = asm["__Z39fdk_sacenc_staticGain_InitDefaultConfigP18STATIC_GAIN_CONFIG"]; asm["__Z39fdk_sacenc_staticGain_InitDefaultConfigP18STATIC_GAIN_CONFIG"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z39fdk_sacenc_staticGain_InitDefaultConfigP18STATIC_GAIN_CONFIG.apply(null, arguments);
};

var real___Z3fftiPlPi = asm["__Z3fftiPlPi"]; asm["__Z3fftiPlPi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z3fftiPlPi.apply(null, arguments);
};

var real___Z40FDKsbrEnc_SbrMissingHarmonicsDetectorQmfP30SBR_MISSING_HARMONICS_DETECTORPPlPPiPaPK14SBR_FRAME_INFOPKhS3_PhSA_iSB_S1_ = asm["__Z40FDKsbrEnc_SbrMissingHarmonicsDetectorQmfP30SBR_MISSING_HARMONICS_DETECTORPPlPPiPaPK14SBR_FRAME_INFOPKhS3_PhSA_iSB_S1_"]; asm["__Z40FDKsbrEnc_SbrMissingHarmonicsDetectorQmfP30SBR_MISSING_HARMONICS_DETECTORPPlPPiPaPK14SBR_FRAME_INFOPKhS3_PhSA_iSB_S1_"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z40FDKsbrEnc_SbrMissingHarmonicsDetectorQmfP30SBR_MISSING_HARMONICS_DETECTORPPlPPiPaPK14SBR_FRAME_INFOPKhS3_PhSA_iSB_S1_.apply(null, arguments);
};

var real___Z40fdk_sacenc_createSpatialBitstreamEncoderPP12BSF_INSTANCE = asm["__Z40fdk_sacenc_createSpatialBitstreamEncoderPP12BSF_INSTANCE"]; asm["__Z40fdk_sacenc_createSpatialBitstreamEncoderPP12BSF_INSTANCE"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z40fdk_sacenc_createSpatialBitstreamEncoderPP12BSF_INSTANCE.apply(null, arguments);
};

var real___Z40fdk_sacenc_delay_SubCalulateBufferDelaysP5DELAY = asm["__Z40fdk_sacenc_delay_SubCalulateBufferDelaysP5DELAY"]; asm["__Z40fdk_sacenc_delay_SubCalulateBufferDelaysP5DELAY"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z40fdk_sacenc_delay_SubCalulateBufferDelaysP5DELAY.apply(null, arguments);
};

var real___Z41FDKsbrEnc_InitSbrMissingHarmonicsDetectorP30SBR_MISSING_HARMONICS_DETECTORiiiiiiij = asm["__Z41FDKsbrEnc_InitSbrMissingHarmonicsDetectorP30SBR_MISSING_HARMONICS_DETECTORiiiiiiij"]; asm["__Z41FDKsbrEnc_InitSbrMissingHarmonicsDetectorP30SBR_MISSING_HARMONICS_DETECTORiiiiiiij"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z41FDKsbrEnc_InitSbrMissingHarmonicsDetectorP30SBR_MISSING_HARMONICS_DETECTORiiiiiiij.apply(null, arguments);
};

var real___Z41fdk_sacenc_destroySpatialBitstreamEncoderPP12BSF_INSTANCE = asm["__Z41fdk_sacenc_destroySpatialBitstreamEncoderPP12BSF_INSTANCE"]; asm["__Z41fdk_sacenc_destroySpatialBitstreamEncoderPP12BSF_INSTANCE"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z41fdk_sacenc_destroySpatialBitstreamEncoderPP12BSF_INSTANCE.apply(null, arguments);
};

var real___Z42FDKsbrEnc_PSEnc_ParametricStereoProcessingP19T_PARAMETRIC_STEREOPPsjPP15QMF_FILTER_BANKPPlS7_S1_S4_Pai = asm["__Z42FDKsbrEnc_PSEnc_ParametricStereoProcessingP19T_PARAMETRIC_STEREOPPsjPP15QMF_FILTER_BANKPPlS7_S1_S4_Pai"]; asm["__Z42FDKsbrEnc_PSEnc_ParametricStereoProcessingP19T_PARAMETRIC_STEREOPPsjPP15QMF_FILTER_BANKPPlS7_S1_S4_Pai"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z42FDKsbrEnc_PSEnc_ParametricStereoProcessingP19T_PARAMETRIC_STEREOPPsjPP15QMF_FILTER_BANKPPlS7_S1_S4_Pai.apply(null, arguments);
};

var real___Z42FDKsbrEnc_ResetSbrMissingHarmonicsDetectorP30SBR_MISSING_HARMONICS_DETECTORi = asm["__Z42FDKsbrEnc_ResetSbrMissingHarmonicsDetectorP30SBR_MISSING_HARMONICS_DETECTORi"]; asm["__Z42FDKsbrEnc_ResetSbrMissingHarmonicsDetectorP30SBR_MISSING_HARMONICS_DETECTORi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z42FDKsbrEnc_ResetSbrMissingHarmonicsDetectorP30SBR_MISSING_HARMONICS_DETECTORi.apply(null, arguments);
};

var real___Z42fdk_sacenc_delay_GetOutputAudioBufferDelayP5DELAY = asm["__Z42fdk_sacenc_delay_GetOutputAudioBufferDelayP5DELAY"]; asm["__Z42fdk_sacenc_delay_GetOutputAudioBufferDelayP5DELAY"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z42fdk_sacenc_delay_GetOutputAudioBufferDelayP5DELAY.apply(null, arguments);
};

var real___Z42transportEnc_LatmCountTotalBitDemandHeaderP11LATM_STREAMj = asm["__Z42transportEnc_LatmCountTotalBitDemandHeaderP11LATM_STREAMj"]; asm["__Z42transportEnc_LatmCountTotalBitDemandHeaderP11LATM_STREAMj"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z42transportEnc_LatmCountTotalBitDemandHeaderP11LATM_STREAMj.apply(null, arguments);
};

var real___Z43FDKsbrEnc_CreateSbrMissingHarmonicsDetectorP30SBR_MISSING_HARMONICS_DETECTORi = asm["__Z43FDKsbrEnc_CreateSbrMissingHarmonicsDetectorP30SBR_MISSING_HARMONICS_DETECTORi"]; asm["__Z43FDKsbrEnc_CreateSbrMissingHarmonicsDetectorP30SBR_MISSING_HARMONICS_DETECTORi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z43FDKsbrEnc_CreateSbrMissingHarmonicsDetectorP30SBR_MISSING_HARMONICS_DETECTORi.apply(null, arguments);
};

var real___Z43FDKsbrEnc_DeleteSbrMissingHarmonicsDetectorP30SBR_MISSING_HARMONICS_DETECTOR = asm["__Z43FDKsbrEnc_DeleteSbrMissingHarmonicsDetectorP30SBR_MISSING_HARMONICS_DETECTOR"]; asm["__Z43FDKsbrEnc_DeleteSbrMissingHarmonicsDetectorP30SBR_MISSING_HARMONICS_DETECTOR"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z43FDKsbrEnc_DeleteSbrMissingHarmonicsDetectorP30SBR_MISSING_HARMONICS_DETECTOR.apply(null, arguments);
};

var real___Z44fdk_sacenc_delay_GetBitstreamFrameBufferSizeP5DELAY = asm["__Z44fdk_sacenc_delay_GetBitstreamFrameBufferSizeP5DELAY"]; asm["__Z44fdk_sacenc_delay_GetBitstreamFrameBufferSizeP5DELAY"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z44fdk_sacenc_delay_GetBitstreamFrameBufferSizeP5DELAY.apply(null, arguments);
};

var real___Z45fdk_sacenc_calcParameterBand2HybridBandOffset18BOX_SUBBAND_CONFIGiPh = asm["__Z45fdk_sacenc_calcParameterBand2HybridBandOffset18BOX_SUBBAND_CONFIGiPh"]; asm["__Z45fdk_sacenc_calcParameterBand2HybridBandOffset18BOX_SUBBAND_CONFIGiPh"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z45fdk_sacenc_calcParameterBand2HybridBandOffset18BOX_SUBBAND_CONFIGiPh.apply(null, arguments);
};

var real___Z47fdk_sacenc_delay_GetSurroundAnalysisBufferDelayP5DELAY = asm["__Z47fdk_sacenc_delay_GetSurroundAnalysisBufferDelayP5DELAY"]; asm["__Z47fdk_sacenc_delay_GetSurroundAnalysisBufferDelayP5DELAY"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z47fdk_sacenc_delay_GetSurroundAnalysisBufferDelayP5DELAY.apply(null, arguments);
};

var real___Z4fPowliliPi = asm["__Z4fPowliliPi"]; asm["__Z4fPowliliPi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z4fPowliliPi.apply(null, arguments);
};

var real___Z5f2PowliPi = asm["__Z5f2PowliPi"]; asm["__Z5f2PowliPi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z5f2PowliPi.apply(null, arguments);
};

var real___Z6dct_IIPlS_iPi = asm["__Z6dct_IIPlS_iPi"]; asm["__Z6dct_IIPlS_iPi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z6dct_IIPlS_iPi.apply(null, arguments);
};

var real___Z6dct_IVPliPi = asm["__Z6dct_IVPliPi"]; asm["__Z6dct_IVPliPi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z6dct_IVPliPi.apply(null, arguments);
};

var real___Z6dst_IVPliPi = asm["__Z6dst_IVPliPi"]; asm["__Z6dst_IVPliPi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z6dst_IVPliPi.apply(null, arguments);
};

var real___Z6fft_16Pl = asm["__Z6fft_16Pl"]; asm["__Z6fft_16Pl"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z6fft_16Pl.apply(null, arguments);
};

var real___Z6fft_32Pl = asm["__Z6fft_32Pl"]; asm["__Z6fft_32Pl"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z6fft_32Pl.apply(null, arguments);
};

var real___Z7dct_IIIPlS_iPi = asm["__Z7dct_IIIPlS_iPi"]; asm["__Z7dct_IIIPlS_iPi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z7dct_IIIPlS_iPi.apply(null, arguments);
};

var real___Z7dit_fftPliPK8FIXP_DPKi = asm["__Z7dit_fftPliPK8FIXP_DPKi"]; asm["__Z7dit_fftPliPK8FIXP_DPKi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z7dit_fftPliPK8FIXP_DPKi.apply(null, arguments);
};

var real___Z8fDivNormll = asm["__Z8fDivNormll"]; asm["__Z8fDivNormll"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z8fDivNormll.apply(null, arguments);
};

var real___Z8fDivNormllPi = asm["__Z8fDivNormllPi"]; asm["__Z8fDivNormllPi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z8fDivNormllPi.apply(null, arguments);
};

var real___Z8fixp_sinli = asm["__Z8fixp_sinli"]; asm["__Z8fixp_sinli"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z8fixp_sinli.apply(null, arguments);
};

var real___Z9CalcLdInti = asm["__Z9CalcLdInti"]; asm["__Z9CalcLdInti"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z9CalcLdInti.apply(null, arguments);
};

var real___Z9fMultNormllPi = asm["__Z9fMultNormllPi"]; asm["__Z9fMultNormllPi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z9fMultNormllPi.apply(null, arguments);
};

var real___Z9fixp_atanl = asm["__Z9fixp_atanl"]; asm["__Z9fixp_atanl"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z9fixp_atanl.apply(null, arguments);
};

var real___Z9mdct_initP6mdct_tPli = asm["__Z9mdct_initP6mdct_tPli"]; asm["__Z9mdct_initP6mdct_tPli"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z9mdct_initP6mdct_tPli.apply(null, arguments);
};

var real___Z9schur_divlli = asm["__Z9schur_divlli"]; asm["__Z9schur_divlli"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___Z9schur_divlli.apply(null, arguments);
};

var real___ZL10fftN2_funcPliiiPFvS_ES1_PKlS3_S_S_ = asm["__ZL10fftN2_funcPliiiPFvS_ES1_PKlS3_S_S_"]; asm["__ZL10fftN2_funcPliiiPFvS_ES1_PKlS3_S_S_"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___ZL10fftN2_funcPliiiPFvS_ES1_PKlS3_S_S_.apply(null, arguments);
};

var real___ZL10resetPatchP16SBR_TON_CORR_ESTiiPhiii = asm["__ZL10resetPatchP16SBR_TON_CORR_ESTiiPhiii"]; asm["__ZL10resetPatchP16SBR_TON_CORR_ESTiiPhiii"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___ZL10resetPatchP16SBR_TON_CORR_ESTiiPhiii.apply(null, arguments);
};

var real___ZL11getStopFreqii = asm["__ZL11getStopFreqii"]; asm["__ZL11getStopFreqii"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___ZL11getStopFreqii.apply(null, arguments);
};

var real___ZL11huff_enc_1DP13FDK_BITSTREAM9DATA_TYPEiPsss = asm["__ZL11huff_enc_1DP13FDK_BITSTREAM9DATA_TYPEiPsss"]; asm["__ZL11huff_enc_1DP13FDK_BITSTREAM9DATA_TYPEiPsss"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___ZL11huff_enc_1DP13FDK_BITSTREAM9DATA_TYPEiPsss.apply(null, arguments);
};

var real___ZL11huff_enc_2DP13FDK_BITSTREAM9DATA_TYPEPssPA2_sssPS2_ = asm["__ZL11huff_enc_2DP13FDK_BITSTREAM9DATA_TYPEPssPA2_sssPS2_"]; asm["__ZL11huff_enc_2DP13FDK_BITSTREAM9DATA_TYPEPssPA2_sssPS2_"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___ZL11huff_enc_2DP13FDK_BITSTREAM9DATA_TYPEPssPA2_sssPS2_.apply(null, arguments);
};

var real___ZL12FDKwriteBitsP13FDK_BITSTREAMjj = asm["__ZL12FDKwriteBitsP13FDK_BITSTREAMjj"]; asm["__ZL12FDKwriteBitsP13FDK_BITSTREAMjj"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___ZL12FDKwriteBitsP13FDK_BITSTREAMjj.apply(null, arguments);
};

var real___ZL12calculateICCPA20_lS0_S0_S0_S0_ii = asm["__ZL12calculateICCPA20_lS0_S0_S0_S0_ii"]; asm["__ZL12calculateICCPA20_lS0_S0_S0_S0_ii"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___ZL12calculateICCPA20_lS0_S0_S0_S0_ii.apply(null, arguments);
};

var real___ZL12encodeIpdOpdP8T_PS_OUTP13FDK_BITSTREAM = asm["__ZL12encodeIpdOpdP8T_PS_OUTP13FDK_BITSTREAM"]; asm["__ZL12encodeIpdOpdP8T_PS_OUTP13FDK_BITSTREAM"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___ZL12encodeIpdOpdP8T_PS_OUTP13FDK_BITSTREAM.apply(null, arguments);
};

var real___ZL12invSqrtNorm2liPi = asm["__ZL12invSqrtNorm2liPi"]; asm["__ZL12invSqrtNorm2liPi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___ZL12invSqrtNorm2liPi.apply(null, arguments);
};

var real___ZL13calc_pcm_bitsss = asm["__ZL13calc_pcm_bitsss"]; asm["__ZL13calc_pcm_bitsss"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___ZL13calc_pcm_bitsss.apply(null, arguments);
};

var real___ZL13encodeSbrDataP12SBR_ENV_DATAS0_P19T_PARAMETRIC_STEREOP11COMMON_DATA16SBR_ELEMENT_TYPEij = asm["__ZL13encodeSbrDataP12SBR_ENV_DATAS0_P19T_PARAMETRIC_STEREOP11COMMON_DATA16SBR_ELEMENT_TYPEij"]; asm["__ZL13encodeSbrDataP12SBR_ENV_DATAS0_P19T_PARAMETRIC_STEREOP11COMMON_DATA16SBR_ELEMENT_TYPEij"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___ZL13encodeSbrDataP12SBR_ENV_DATAS0_P19T_PARAMETRIC_STEREOP11COMMON_DATA16SBR_ELEMENT_TYPEij.apply(null, arguments);
};

var real___ZL13encodeSbrGridP12SBR_ENV_DATAP13FDK_BITSTREAM = asm["__ZL13encodeSbrGridP12SBR_ENV_DATAP13FDK_BITSTREAM"]; asm["__ZL13encodeSbrGridP12SBR_ENV_DATAP13FDK_BITSTREAM"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___ZL13encodeSbrGridP12SBR_ENV_DATAP13FDK_BITSTREAM.apply(null, arguments);
};

var real___ZL14calcCtrlSignalP8SBR_GRID11FRAME_CLASSPiiS2_iiiii = asm["__ZL14calcCtrlSignalP8SBR_GRID11FRAME_CLASSPiiS2_iiiii"]; asm["__ZL14calcCtrlSignalP8SBR_GRID11FRAME_CLASSPiiS2_iiiii"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___ZL14calcCtrlSignalP8SBR_GRID11FRAME_CLASSPiiS2_iiiii.apply(null, arguments);
};

var real___ZL14calc_huff_bitsPsS_9DATA_TYPE9DIFF_TYPES1_sS_S_ = asm["__ZL14calc_huff_bitsPsS_9DATA_TYPE9DIFF_TYPES1_sS_S_"]; asm["__ZL14calc_huff_bitsPsS_9DATA_TYPE9DIFF_TYPES1_sS_S_"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___ZL14calc_huff_bitsPsS_9DATA_TYPE9DIFF_TYPES1_sS_S_.apply(null, arguments);
};

var real___ZL15QuantizeCoefFDKPKliS0_iiPa = asm["__ZL15QuantizeCoefFDKPKliS0_iiPa"]; asm["__ZL15QuantizeCoefFDKPKliS0_iiPa"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___ZL15QuantizeCoefFDKPKliS0_iiPa.apply(null, arguments);
};

var real___ZL15encodeDeltaFreqP13FDK_BITSTREAMPKiiPKjS4_iiPi = asm["__ZL15encodeDeltaFreqP13FDK_BITSTREAMPKiiPKjS4_iiPi"]; asm["__ZL15encodeDeltaFreqP13FDK_BITSTREAMPKiiPKjS4_iiPi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___ZL15encodeDeltaFreqP13FDK_BITSTREAMPKiiPKjS4_iiPi.apply(null, arguments);
};

var real___ZL15encodeDeltaTimeP13FDK_BITSTREAMPKiS2_iPKjS4_iiPi = asm["__ZL15encodeDeltaTimeP13FDK_BITSTREAMPKiS2_iPKjS4_iiPi"]; asm["__ZL15encodeDeltaTimeP13FDK_BITSTREAMPKiS2_iPKjS4_iiPi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___ZL15encodeDeltaTimeP13FDK_BITSTREAMPKiS2_iPKjS4_iiPi.apply(null, arguments);
};

var real___ZL15getEnvSfbEnergyiiiiiPPliii = asm["__ZL15getEnvSfbEnergyiiiiiPPliii"]; asm["__ZL15getEnvSfbEnergyiiiiiPPliii"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___ZL15getEnvSfbEnergyiiiiiPPliii.apply(null, arguments);
};

var real___ZL15writeSampleRateP13FDK_BITSTREAMii = asm["__ZL15writeSampleRateP13FDK_BITSTREAMii"]; asm["__ZL15writeSampleRateP13FDK_BITSTREAMii"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___ZL15writeSampleRateP13FDK_BITSTREAMii.apply(null, arguments);
};

var real___ZL16apply_pcm_codingP13FDK_BITSTREAMPKsS2_sss = asm["__ZL16apply_pcm_codingP13FDK_BITSTREAMPKsS2_sss"]; asm["__ZL16apply_pcm_codingP13FDK_BITSTREAMPKsS2_sss"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___ZL16apply_pcm_codingP13FDK_BITSTREAMPKsS2_sss.apply(null, arguments);
};

var real___ZL16coupleNoiseFloorPlS_ = asm["__ZL16coupleNoiseFloorPlS_"]; asm["__ZL16coupleNoiseFloorPlS_"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___ZL16coupleNoiseFloorPlS_.apply(null, arguments);
};

var real___ZL17FDKaacEnc_count11PKsiPi = asm["__ZL17FDKaacEnc_count11PKsiPi"]; asm["__ZL17FDKaacEnc_count11PKsiPi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___ZL17FDKaacEnc_count11PKsiPi.apply(null, arguments);
};

var real___ZL17GetBandwidthEntryiiii = asm["__ZL17GetBandwidthEntryiiii"]; asm["__ZL17GetBandwidthEntryiiii"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___ZL17GetBandwidthEntryiiii.apply(null, arguments);
};

var real___ZL17apply_huff_codingP13FDK_BITSTREAMPsS1_9DATA_TYPE9DIFF_TYPES3_sPKss = asm["__ZL17apply_huff_codingP13FDK_BITSTREAMPsS1_9DATA_TYPE9DIFF_TYPES3_sPKss"]; asm["__ZL17apply_huff_codingP13FDK_BITSTREAMPsS1_9DATA_TYPE9DIFF_TYPES3_sPKss"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___ZL17apply_huff_codingP13FDK_BITSTREAMPsS1_9DATA_TYPE9DIFF_TYPES3_sPKss.apply(null, arguments);
};

var real___ZL17qmfInitFilterBankP15QMF_FILTER_BANKPviiiiji = asm["__ZL17qmfInitFilterBankP15QMF_FILTER_BANKPviiiiji"]; asm["__ZL17qmfInitFilterBankP15QMF_FILTER_BANKPviiiiji"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___ZL17qmfInitFilterBankP15QMF_FILTER_BANKPviiiiji.apply(null, arguments);
};

var real___ZL17writeEnvelopeDataP12SBR_ENV_DATAP13FDK_BITSTREAMi = asm["__ZL17writeEnvelopeDataP12SBR_ENV_DATAP13FDK_BITSTREAMi"]; asm["__ZL17writeEnvelopeDataP12SBR_ENV_DATAP13FDK_BITSTREAMi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___ZL17writeEnvelopeDataP12SBR_ENV_DATAP13FDK_BITSTREAMi.apply(null, arguments);
};

var real___ZL18FDKaacEnc_countEscPKsiPi = asm["__ZL18FDKaacEnc_countEscPKsiPi"]; asm["__ZL18FDKaacEnc_countEscPKsiPi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___ZL18FDKaacEnc_countEscPKsiPi.apply(null, arguments);
};

var real___ZL18aacenc_SbrCallbackPvP13FDK_BITSTREAMiii17AUDIO_OBJECT_TYPE14MP4_ELEMENT_IDihhhPhi = asm["__ZL18aacenc_SbrCallbackPvP13FDK_BITSTREAMiii17AUDIO_OBJECT_TYPE14MP4_ELEMENT_IDihhhPhi"]; asm["__ZL18aacenc_SbrCallbackPvP13FDK_BITSTREAMiii17AUDIO_OBJECT_TYPE14MP4_ELEMENT_IDihhhPhi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___ZL18aacenc_SbrCallbackPvP13FDK_BITSTREAMiii17AUDIO_OBJECT_TYPE14MP4_ELEMENT_IDihhhPhi.apply(null, arguments);
};

var real___ZL18encodeExtendedDataP19T_PARAMETRIC_STEREOP13FDK_BITSTREAM = asm["__ZL18encodeExtendedDataP19T_PARAMETRIC_STEREOP13FDK_BITSTREAM"]; asm["__ZL18encodeExtendedDataP19T_PARAMETRIC_STEREOP13FDK_BITSTREAM"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___ZL18encodeExtendedDataP19T_PARAMETRIC_STEREOP13FDK_BITSTREAM.apply(null, arguments);
};

var real___ZL19encodeSbrHeaderDataP15SBR_HEADER_DATAP13FDK_BITSTREAM = asm["__ZL19encodeSbrHeaderDataP15SBR_HEADER_DATAP13FDK_BITSTREAM"]; asm["__ZL19encodeSbrHeaderDataP15SBR_HEADER_DATAP13FDK_BITSTREAM"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___ZL19encodeSbrHeaderDataP15SBR_HEADER_DATAP13FDK_BITSTREAM.apply(null, arguments);
};

var real___ZL19updateFreqBandTableP15SBR_CONFIG_DATAP15SBR_HEADER_DATAi = asm["__ZL19updateFreqBandTableP15SBR_CONFIG_DATAP15SBR_HEADER_DATAi"]; asm["__ZL19updateFreqBandTableP15SBR_CONFIG_DATAP15SBR_HEADER_DATAi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___ZL19updateFreqBandTableP15SBR_CONFIG_DATAP15SBR_HEADER_DATAi.apply(null, arguments);
};

var real___ZL19writeNoiseLevelDataP12SBR_ENV_DATAP13FDK_BITSTREAMi = asm["__ZL19writeNoiseLevelDataP12SBR_ENV_DATAP13FDK_BITSTREAMi"]; asm["__ZL19writeNoiseLevelDataP12SBR_ENV_DATAP13FDK_BITSTREAMi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___ZL19writeNoiseLevelDataP12SBR_ENV_DATAP13FDK_BITSTREAMi.apply(null, arguments);
};

var real___ZL20FDKpushBiDirectionalP13FDK_BITSTREAMi = asm["__ZL20FDKpushBiDirectionalP13FDK_BITSTREAMi"]; asm["__ZL20FDKpushBiDirectionalP13FDK_BITSTREAMi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___ZL20FDKpushBiDirectionalP13FDK_BITSTREAMi.apply(null, arguments);
};

var real___ZL20calculateSbrEnvelopePPlS0_PiS1_PK14SBR_FRAME_INFOPaS5_P15SBR_CONFIG_DATAP11ENV_CHANNEL15SBR_STEREO_MODES1_i = asm["__ZL20calculateSbrEnvelopePPlS0_PiS1_PK14SBR_FRAME_INFOPaS5_P15SBR_CONFIG_DATAP11ENV_CHANNEL15SBR_STEREO_MODES1_i"]; asm["__ZL20calculateSbrEnvelopePPlS0_PiS1_PK14SBR_FRAME_INFOPaS5_P15SBR_CONFIG_DATAP11ENV_CHANNEL15SBR_STEREO_MODES1_i"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___ZL20calculateSbrEnvelopePPlS0_PiS1_PK14SBR_FRAME_INFOPaS5_P15SBR_CONFIG_DATAP11ENV_CHANNEL15SBR_STEREO_MODES1_i.apply(null, arguments);
};

var real___ZL21FDKaacEnc_adaptMinSnrPKP14QC_OUT_CHANNELPKPK15PSY_OUT_CHANNELPK18MINSNR_ADAPT_PARAMi = asm["__ZL21FDKaacEnc_adaptMinSnrPKP14QC_OUT_CHANNELPKPK15PSY_OUT_CHANNELPK18MINSNR_ADAPT_PARAMi"]; asm["__ZL21FDKaacEnc_adaptMinSnrPKP14QC_OUT_CHANNELPKPK15PSY_OUT_CHANNELPK18MINSNR_ADAPT_PARAMi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___ZL21FDKaacEnc_adaptMinSnrPKP14QC_OUT_CHANNELPKPK15PSY_OUT_CHANNELPK18MINSNR_ADAPT_PARAMi.apply(null, arguments);
};

var real___ZL21LoadSubmittedMetadataPK15AACENC_MetaDataiiP12AAC_METADATA = asm["__ZL21LoadSubmittedMetadataPK15AACENC_MetaDataiiP12AAC_METADATA"]; asm["__ZL21LoadSubmittedMetadataPK15AACENC_MetaDataiiP12AAC_METADATA"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___ZL21LoadSubmittedMetadataPK15AACENC_MetaDataiiP12AAC_METADATA.apply(null, arguments);
};

var real___ZL21encodeLowDelaySbrGridP12SBR_ENV_DATAP13FDK_BITSTREAMij = asm["__ZL21encodeLowDelaySbrGridP12SBR_ENV_DATAP13FDK_BITSTREAMij"]; asm["__ZL21encodeLowDelaySbrGridP12SBR_ENV_DATAP13FDK_BITSTREAMij"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___ZL21encodeLowDelaySbrGridP12SBR_ENV_DATAP13FDK_BITSTREAMij.apply(null, arguments);
};

var real___ZL21getPsTuningTableIndexjPj = asm["__ZL21getPsTuningTableIndexjPj"]; asm["__ZL21getPsTuningTableIndexjPj"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___ZL21getPsTuningTableIndexjPj.apply(null, arguments);
};

var real___ZL22AdvanceAudioMuxElementP11LATM_STREAMP13FDK_BITSTREAMiiP13CSTpCallBacks = asm["__ZL22AdvanceAudioMuxElementP11LATM_STREAMP13FDK_BITSTREAMiiP13CSTpCallBacks"]; asm["__ZL22AdvanceAudioMuxElementP11LATM_STREAMP13FDK_BITSTREAMiiP13CSTpCallBacks"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___ZL22AdvanceAudioMuxElementP11LATM_STREAMP13FDK_BITSTREAMiiP13CSTpCallBacks.apply(null, arguments);
};

var real___ZL22FDKaacEnc_Parcor2IndexPKsPiii = asm["__ZL22FDKaacEnc_Parcor2IndexPKsPiii"]; asm["__ZL22FDKaacEnc_Parcor2IndexPKsPiii"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___ZL22FDKaacEnc_Parcor2IndexPKsPiii.apply(null, arguments);
};

var real___ZL22FDKaacEnc_count9_10_11PKsiPi = asm["__ZL22FDKaacEnc_count9_10_11PKsiPi"]; asm["__ZL22FDKaacEnc_count9_10_11PKsiPi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___ZL22FDKaacEnc_count9_10_11PKsiPi.apply(null, arguments);
};

var real___ZL22getSbrTuningTableIndexjjj17AUDIO_OBJECT_TYPEPj = asm["__ZL22getSbrTuningTableIndexjjj17AUDIO_OBJECT_TYPEPj"]; asm["__ZL22getSbrTuningTableIndexjjj17AUDIO_OBJECT_TYPEPj"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___ZL22getSbrTuningTableIndexjjj17AUDIO_OBJECT_TYPEPj.apply(null, arguments);
};

var real___ZL23FDKaacEnc_BarcLineValueiil = asm["__ZL23FDKaacEnc_BarcLineValueiil"]; asm["__ZL23FDKaacEnc_BarcLineValueiil"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___ZL23FDKaacEnc_BarcLineValueiil.apply(null, arguments);
};

var real___ZL23FDKaacEnc_CalcMergeGainPK12SECTION_INFOPA12_KiPKsiii = asm["__ZL23FDKaacEnc_CalcMergeGainPK12SECTION_INFOPA12_KiPKsiii"]; asm["__ZL23FDKaacEnc_CalcMergeGainPK12SECTION_INFOPA12_KiPKsiii"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___ZL23FDKaacEnc_CalcMergeGainPK12SECTION_INFOPA12_KiPKsiii.apply(null, arguments);
};

var real___ZL23FDKaacEnc_quantizeLinesiiPKlPsi = asm["__ZL23FDKaacEnc_quantizeLinesiiPKlPsi"]; asm["__ZL23FDKaacEnc_quantizeLinesiiPKlPsi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___ZL23FDKaacEnc_quantizeLinesiiPKlPsi.apply(null, arguments);
};

var real___ZL24FDKaacEnc_calcSpecPeDiffP15PSY_OUT_CHANNELP14QC_OUT_CHANNELPiS3_PlS4_S4_ii = asm["__ZL24FDKaacEnc_calcSpecPeDiffP15PSY_OUT_CHANNELP14QC_OUT_CHANNELPiS3_PlS4_S4_ii"]; asm["__ZL24FDKaacEnc_calcSpecPeDiffP15PSY_OUT_CHANNELP14QC_OUT_CHANNELPiS3_PlS4_S4_ii"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___ZL24FDKaacEnc_calcSpecPeDiffP15PSY_OUT_CHANNELP14QC_OUT_CHANNELPiS3_PlS4_S4_ii.apply(null, arguments);
};

var real___ZL25FDKaacEnc_AutoCorrNormFacliPi = asm["__ZL25FDKaacEnc_AutoCorrNormFacliPi"]; asm["__ZL25FDKaacEnc_AutoCorrNormFacliPi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___ZL25FDKaacEnc_AutoCorrNormFacliPi.apply(null, arguments);
};

var real___ZL25FDKaacEnc_CalcGaussWindowPliiili = asm["__ZL25FDKaacEnc_CalcGaussWindowPliiili"]; asm["__ZL25FDKaacEnc_CalcGaussWindowPliiili"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___ZL25FDKaacEnc_CalcGaussWindowPliiili.apply(null, arguments);
};

var real___ZL26FDKaacEnc_count7_8_9_10_11PKsiPi = asm["__ZL26FDKaacEnc_count7_8_9_10_11PKsiPi"]; asm["__ZL26FDKaacEnc_count7_8_9_10_11PKsiPi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___ZL26FDKaacEnc_count7_8_9_10_11PKsiPi.apply(null, arguments);
};

var real___ZL26FDKaacEnc_countScfBitsDiffPiS_iii = asm["__ZL26FDKaacEnc_countScfBitsDiffPiS_iii"]; asm["__ZL26FDKaacEnc_countScfBitsDiffPiS_iii"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___ZL26FDKaacEnc_countScfBitsDiffPiS_iii.apply(null, arguments);
};

var real___ZL26FDKaacEnc_invQuantizeLinesiiPsPl = asm["__ZL26FDKaacEnc_invQuantizeLinesiiPsPl"]; asm["__ZL26FDKaacEnc_invQuantizeLinesiiPsPl"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___ZL26FDKaacEnc_invQuantizeLinesiiPsPl.apply(null, arguments);
};

var real___ZL26FDKlibInfo_getCapabilitiesPK8LIB_INFO13FDK_MODULE_ID = asm["__ZL26FDKlibInfo_getCapabilitiesPK8LIB_INFO13FDK_MODULE_ID"]; asm["__ZL26FDKlibInfo_getCapabilitiesPK8LIB_INFO13FDK_MODULE_ID"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___ZL26FDKlibInfo_getCapabilitiesPK8LIB_INFO13FDK_MODULE_ID.apply(null, arguments);
};

var real___ZL27FDKaacEnc_initAvoidHoleFlagPKP14QC_OUT_CHANNELPKPK15PSY_OUT_CHANNELPA60_hPK9TOOLSINFOiPK8AH_PARAM = asm["__ZL27FDKaacEnc_initAvoidHoleFlagPKP14QC_OUT_CHANNELPKPK15PSY_OUT_CHANNELPA60_hPK9TOOLSINFOiPK8AH_PARAM"]; asm["__ZL27FDKaacEnc_initAvoidHoleFlagPKP14QC_OUT_CHANNELPKPK15PSY_OUT_CHANNELPA60_hPK9TOOLSINFOiPK8AH_PARAM"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___ZL27FDKaacEnc_initAvoidHoleFlagPKP14QC_OUT_CHANNELPKPK15PSY_OUT_CHANNELPA60_hPK9TOOLSINFOiPK8AH_PARAM.apply(null, arguments);
};

var real___ZL27transportEnc_LatmWriteValueP13FDK_BITSTREAMi = asm["__ZL27transportEnc_LatmWriteValueP13FDK_BITSTREAMi"]; asm["__ZL27transportEnc_LatmWriteValueP13FDK_BITSTREAMi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___ZL27transportEnc_LatmWriteValueP13FDK_BITSTREAMi.apply(null, arguments);
};

var real___ZL29FDKaacEnc_adaptThresholdsToPePK15CHANNEL_MAPPINGPKP11ATS_ELEMENTPKP14QC_OUT_ELEMENTPKPK15PSY_OUT_ELEMENTiiii = asm["__ZL29FDKaacEnc_adaptThresholdsToPePK15CHANNEL_MAPPINGPKP11ATS_ELEMENTPKP14QC_OUT_ELEMENTPKPK15PSY_OUT_ELEMENTiiii"]; asm["__ZL29FDKaacEnc_adaptThresholdsToPePK15CHANNEL_MAPPINGPKP11ATS_ELEMENTPKP14QC_OUT_ELEMENTPKPK15PSY_OUT_ELEMENTiiii"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___ZL29FDKaacEnc_adaptThresholdsToPePK15CHANNEL_MAPPINGPKP11ATS_ELEMENTPKP14QC_OUT_ELEMENTPKPK15PSY_OUT_ELEMENTiiii.apply(null, arguments);
};

var real___ZL29FDKaacEnc_reduceThresholdsCBRPKP14QC_OUT_CHANNELPKPK15PSY_OUT_CHANNELPA60_hPA60_Klila = asm["__ZL29FDKaacEnc_reduceThresholdsCBRPKP14QC_OUT_CHANNELPKPK15PSY_OUT_CHANNELPA60_hPA60_Klila"]; asm["__ZL29FDKaacEnc_reduceThresholdsCBRPKP14QC_OUT_CHANNELPKPK15PSY_OUT_CHANNELPA60_hPA60_Klila"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___ZL29FDKaacEnc_reduceThresholdsCBRPKP14QC_OUT_CHANNELPKPK15PSY_OUT_CHANNELPA60_hPA60_Klila.apply(null, arguments);
};

var real___ZL30FDKaacEnc_count5_6_7_8_9_10_11PKsiPi = asm["__ZL30FDKaacEnc_count5_6_7_8_9_10_11PKsiPi"]; asm["__ZL30FDKaacEnc_count5_6_7_8_9_10_11PKsiPi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___ZL30FDKaacEnc_count5_6_7_8_9_10_11PKsiPi.apply(null, arguments);
};

var real___ZL31FDKaacEnc_writeExtensionPayloadP13FDK_BITSTREAM16EXT_PAYLOAD_TYPEPKhi = asm["__ZL31FDKaacEnc_writeExtensionPayloadP13FDK_BITSTREAM16EXT_PAYLOAD_TYPEPKhi"]; asm["__ZL31FDKaacEnc_writeExtensionPayloadP13FDK_BITSTREAM16EXT_PAYLOAD_TYPEPKhi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___ZL31FDKaacEnc_writeExtensionPayloadP13FDK_BITSTREAM16EXT_PAYLOAD_TYPEPKhi.apply(null, arguments);
};

var real___ZL31sbrNoiseFloorLevelsQuantisationPaPli = asm["__ZL31sbrNoiseFloorLevelsQuantisationPaPli"]; asm["__ZL31sbrNoiseFloorLevelsQuantisationPaPli"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___ZL31sbrNoiseFloorLevelsQuantisationPaPli.apply(null, arguments);
};

var real___ZL34FDKaacEnc_count3_4_5_6_7_8_9_10_11PKsiPi = asm["__ZL34FDKaacEnc_count3_4_5_6_7_8_9_10_11PKsiPi"]; asm["__ZL34FDKaacEnc_count3_4_5_6_7_8_9_10_11PKsiPi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___ZL34FDKaacEnc_count3_4_5_6_7_8_9_10_11PKsiPi.apply(null, arguments);
};

var real___ZL38FDKaacEnc_count1_2_3_4_5_6_7_8_9_10_11PKsiPi = asm["__ZL38FDKaacEnc_count1_2_3_4_5_6_7_8_9_10_11PKsiPi"]; asm["__ZL38FDKaacEnc_count1_2_3_4_5_6_7_8_9_10_11PKsiPi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___ZL38FDKaacEnc_count1_2_3_4_5_6_7_8_9_10_11PKsiPi.apply(null, arguments);
};

var real___ZL4fft2Pl = asm["__ZL4fft2Pl"]; asm["__ZL4fft2Pl"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___ZL4fft2Pl.apply(null, arguments);
};

var real___ZL4fft3Pl = asm["__ZL4fft3Pl"]; asm["__ZL4fft3Pl"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___ZL4fft3Pl.apply(null, arguments);
};

var real___ZL4fft5Pl = asm["__ZL4fft5Pl"]; asm["__ZL4fft5Pl"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___ZL4fft5Pl.apply(null, arguments);
};

var real___ZL5fLog2li = asm["__ZL5fLog2li"]; asm["__ZL5fLog2li"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___ZL5fLog2li.apply(null, arguments);
};

var real___ZL5fLog2liPi = asm["__ZL5fLog2liPi"]; asm["__ZL5fLog2liPi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___ZL5fLog2liPi.apply(null, arguments);
};

var real___ZL5fLog2liPi_647 = asm["__ZL5fLog2liPi_647"]; asm["__ZL5fLog2liPi_647"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___ZL5fLog2liPi_647.apply(null, arguments);
};

var real___ZL5fLog2li_269 = asm["__ZL5fLog2li_269"]; asm["__ZL5fLog2li_269"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___ZL5fLog2li_269.apply(null, arguments);
};

var real___ZL5fLog2li_433 = asm["__ZL5fLog2li_433"]; asm["__ZL5fLog2li_433"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___ZL5fLog2li_433.apply(null, arguments);
};

var real___ZL5fLog2li_474 = asm["__ZL5fLog2li_474"]; asm["__ZL5fLog2li_474"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___ZL5fLog2li_474.apply(null, arguments);
};

var real___ZL5fLog2li_477 = asm["__ZL5fLog2li_477"]; asm["__ZL5fLog2li_477"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___ZL5fLog2li_477.apply(null, arguments);
};

var real___ZL5fLog2li_614 = asm["__ZL5fLog2li_614"]; asm["__ZL5fLog2li_614"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___ZL5fLog2li_614.apply(null, arguments);
};

var real___ZL5fLog2li_629 = asm["__ZL5fLog2li_629"]; asm["__ZL5fLog2li_629"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___ZL5fLog2li_629.apply(null, arguments);
};

var real___ZL5fLog2li_636 = asm["__ZL5fLog2li_636"]; asm["__ZL5fLog2li_636"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___ZL5fLog2li_636.apply(null, arguments);
};

var real___ZL5fLog2li_812 = asm["__ZL5fLog2li_812"]; asm["__ZL5fLog2li_812"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___ZL5fLog2li_812.apply(null, arguments);
};

var real___ZL5fft12Pl = asm["__ZL5fft12Pl"]; asm["__ZL5fft12Pl"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___ZL5fft12Pl.apply(null, arguments);
};

var real___ZL5fft15Pl = asm["__ZL5fft15Pl"]; asm["__ZL5fft15Pl"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___ZL5fft15Pl.apply(null, arguments);
};

var real___ZL5fft_4Pl = asm["__ZL5fft_4Pl"]; asm["__ZL5fft_4Pl"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___ZL5fft_4Pl.apply(null, arguments);
};

var real___ZL5fft_8Pl = asm["__ZL5fft_8Pl"]; asm["__ZL5fft_8Pl"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___ZL5fft_8Pl.apply(null, arguments);
};

var real___ZL6ecDataP13FDK_BITSTREAMPA23_aPaPhP12LOSSLESSDATA9DATA_TYPEiiiiii = asm["__ZL6ecDataP13FDK_BITSTREAMPA23_aPaPhP12LOSSLESSDATA9DATA_TYPEiiiiii"]; asm["__ZL6ecDataP13FDK_BITSTREAMPA23_aPaPhP12LOSSLESSDATA9DATA_TYPEiiiiii"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___ZL6ecDataP13FDK_BITSTREAMPA23_aPaPhP12LOSSLESSDATA9DATA_TYPEiiiiii.apply(null, arguments);
};

var real___ZL8sqrtFixpliPi = asm["__ZL8sqrtFixpliPi"]; asm["__ZL8sqrtFixpliPi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___ZL8sqrtFixpliPi.apply(null, arguments);
};

var real___ZL9detectionPlS_iPhPKhS_S_13GUIDE_VECTORSS3_11THRES_HOLDS = asm["__ZL9detectionPlS_iPhPKhS_S_13GUIDE_VECTORSS3_11THRES_HOLDS"]; asm["__ZL9detectionPlS_iPhPKhS_S_13GUIDE_VECTORSS3_11THRES_HOLDS"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real___ZL9detectionPlS_iPhPKhS_S_13GUIDE_VECTORSS3_11THRES_HOLDS.apply(null, arguments);
};

var real____DOUBLE_BITS_662 = asm["___DOUBLE_BITS_662"]; asm["___DOUBLE_BITS_662"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real____DOUBLE_BITS_662.apply(null, arguments);
};

var real____errno_location = asm["___errno_location"]; asm["___errno_location"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real____errno_location.apply(null, arguments);
};

var real____fdopen = asm["___fdopen"]; asm["___fdopen"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real____fdopen.apply(null, arguments);
};

var real____fflush_unlocked = asm["___fflush_unlocked"]; asm["___fflush_unlocked"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real____fflush_unlocked.apply(null, arguments);
};

var real____fmodeflags = asm["___fmodeflags"]; asm["___fmodeflags"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real____fmodeflags.apply(null, arguments);
};

var real____fseeko = asm["___fseeko"]; asm["___fseeko"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real____fseeko.apply(null, arguments);
};

var real____fseeko_unlocked = asm["___fseeko_unlocked"]; asm["___fseeko_unlocked"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real____fseeko_unlocked.apply(null, arguments);
};

var real____ftello = asm["___ftello"]; asm["___ftello"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real____ftello.apply(null, arguments);
};

var real____ftello_unlocked = asm["___ftello_unlocked"]; asm["___ftello_unlocked"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real____ftello_unlocked.apply(null, arguments);
};

var real____fwritex = asm["___fwritex"]; asm["___fwritex"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real____fwritex.apply(null, arguments);
};

var real____getopt_msg = asm["___getopt_msg"]; asm["___getopt_msg"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real____getopt_msg.apply(null, arguments);
};

var real____lctrans = asm["___lctrans"]; asm["___lctrans"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real____lctrans.apply(null, arguments);
};

var real____lctrans_cur = asm["___lctrans_cur"]; asm["___lctrans_cur"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real____lctrans_cur.apply(null, arguments);
};

var real____lctrans_impl = asm["___lctrans_impl"]; asm["___lctrans_impl"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real____lctrans_impl.apply(null, arguments);
};

var real____lockfile = asm["___lockfile"]; asm["___lockfile"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real____lockfile.apply(null, arguments);
};

var real____mo_lookup = asm["___mo_lookup"]; asm["___mo_lookup"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real____mo_lookup.apply(null, arguments);
};

var real____ofl_add = asm["___ofl_add"]; asm["___ofl_add"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real____ofl_add.apply(null, arguments);
};

var real____ofl_lock = asm["___ofl_lock"]; asm["___ofl_lock"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real____ofl_lock.apply(null, arguments);
};

var real____ofl_unlock = asm["___ofl_unlock"]; asm["___ofl_unlock"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real____ofl_unlock.apply(null, arguments);
};

var real____overflow = asm["___overflow"]; asm["___overflow"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real____overflow.apply(null, arguments);
};

var real____pthread_self_159 = asm["___pthread_self_159"]; asm["___pthread_self_159"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real____pthread_self_159.apply(null, arguments);
};

var real____pthread_self_684 = asm["___pthread_self_684"]; asm["___pthread_self_684"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real____pthread_self_684.apply(null, arguments);
};

var real____pthread_self_78 = asm["___pthread_self_78"]; asm["___pthread_self_78"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real____pthread_self_78.apply(null, arguments);
};

var real____pthread_self_885 = asm["___pthread_self_885"]; asm["___pthread_self_885"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real____pthread_self_885.apply(null, arguments);
};

var real____pthread_self_888 = asm["___pthread_self_888"]; asm["___pthread_self_888"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real____pthread_self_888.apply(null, arguments);
};

var real____stdio_close = asm["___stdio_close"]; asm["___stdio_close"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real____stdio_close.apply(null, arguments);
};

var real____stdio_read = asm["___stdio_read"]; asm["___stdio_read"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real____stdio_read.apply(null, arguments);
};

var real____stdio_seek = asm["___stdio_seek"]; asm["___stdio_seek"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real____stdio_seek.apply(null, arguments);
};

var real____stdio_write = asm["___stdio_write"]; asm["___stdio_write"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real____stdio_write.apply(null, arguments);
};

var real____stdout_write = asm["___stdout_write"]; asm["___stdout_write"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real____stdout_write.apply(null, arguments);
};

var real____strchrnul = asm["___strchrnul"]; asm["___strchrnul"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real____strchrnul.apply(null, arguments);
};

var real____strerror_l = asm["___strerror_l"]; asm["___strerror_l"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real____strerror_l.apply(null, arguments);
};

var real____syscall_ret = asm["___syscall_ret"]; asm["___syscall_ret"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real____syscall_ret.apply(null, arguments);
};

var real____toread = asm["___toread"]; asm["___toread"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real____toread.apply(null, arguments);
};

var real____towrite = asm["___towrite"]; asm["___towrite"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real____towrite.apply(null, arguments);
};

var real____uflow = asm["___uflow"]; asm["___uflow"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real____uflow.apply(null, arguments);
};

var real____unlist_locked_file = asm["___unlist_locked_file"]; asm["___unlist_locked_file"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real____unlist_locked_file.apply(null, arguments);
};

var real____unlockfile = asm["___unlockfile"]; asm["___unlockfile"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real____unlockfile.apply(null, arguments);
};

var real__a_cas = asm["_a_cas"]; asm["_a_cas"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__a_cas.apply(null, arguments);
};

var real__aacEncClose = asm["_aacEncClose"]; asm["_aacEncClose"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__aacEncClose.apply(null, arguments);
};

var real__aacEncEncode = asm["_aacEncEncode"]; asm["_aacEncEncode"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__aacEncEncode.apply(null, arguments);
};

var real__aacEncGetLibInfo = asm["_aacEncGetLibInfo"]; asm["_aacEncGetLibInfo"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__aacEncGetLibInfo.apply(null, arguments);
};

var real__aacEncInfo = asm["_aacEncInfo"]; asm["_aacEncInfo"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__aacEncInfo.apply(null, arguments);
};

var real__aacEncOpen = asm["_aacEncOpen"]; asm["_aacEncOpen"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__aacEncOpen.apply(null, arguments);
};

var real__aacEncoder_SetParam = asm["_aacEncoder_SetParam"]; asm["_aacEncoder_SetParam"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__aacEncoder_SetParam.apply(null, arguments);
};

var real__atoi = asm["_atoi"]; asm["_atoi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__atoi.apply(null, arguments);
};

var real__calloc = asm["_calloc"]; asm["_calloc"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__calloc.apply(null, arguments);
};

var real__dummy = asm["_dummy"]; asm["_dummy"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__dummy.apply(null, arguments);
};

var real__fclose = asm["_fclose"]; asm["_fclose"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__fclose.apply(null, arguments);
};

var real__feof = asm["_feof"]; asm["_feof"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__feof.apply(null, arguments);
};

var real__fflush = asm["_fflush"]; asm["_fflush"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__fflush.apply(null, arguments);
};

var real__fgetc = asm["_fgetc"]; asm["_fgetc"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__fgetc.apply(null, arguments);
};

var real__flockfile = asm["_flockfile"]; asm["_flockfile"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__flockfile.apply(null, arguments);
};

var real__fmt_fp = asm["_fmt_fp"]; asm["_fmt_fp"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__fmt_fp.apply(null, arguments);
};

var real__fmt_o = asm["_fmt_o"]; asm["_fmt_o"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__fmt_o.apply(null, arguments);
};

var real__fmt_u = asm["_fmt_u"]; asm["_fmt_u"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__fmt_u.apply(null, arguments);
};

var real__fmt_x = asm["_fmt_x"]; asm["_fmt_x"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__fmt_x.apply(null, arguments);
};

var real__fopen = asm["_fopen"]; asm["_fopen"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__fopen.apply(null, arguments);
};

var real__fprintf = asm["_fprintf"]; asm["_fprintf"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__fprintf.apply(null, arguments);
};

var real__fputc = asm["_fputc"]; asm["_fputc"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__fputc.apply(null, arguments);
};

var real__fputs = asm["_fputs"]; asm["_fputs"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__fputs.apply(null, arguments);
};

var real__fread = asm["_fread"]; asm["_fread"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__fread.apply(null, arguments);
};

var real__free = asm["_free"]; asm["_free"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__free.apply(null, arguments);
};

var real__frexp = asm["_frexp"]; asm["_frexp"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__frexp.apply(null, arguments);
};

var real__frexpl = asm["_frexpl"]; asm["_frexpl"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__frexpl.apply(null, arguments);
};

var real__fseek = asm["_fseek"]; asm["_fseek"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__fseek.apply(null, arguments);
};

var real__ftell = asm["_ftell"]; asm["_ftell"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__ftell.apply(null, arguments);
};

var real__ftrylockfile = asm["_ftrylockfile"]; asm["_ftrylockfile"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__ftrylockfile.apply(null, arguments);
};

var real__funlockfile = asm["_funlockfile"]; asm["_funlockfile"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__funlockfile.apply(null, arguments);
};

var real__fwrite = asm["_fwrite"]; asm["_fwrite"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__fwrite.apply(null, arguments);
};

var real__getint_656 = asm["_getint_656"]; asm["_getint_656"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__getint_656.apply(null, arguments);
};

var real__getopt = asm["_getopt"]; asm["_getopt"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__getopt.apply(null, arguments);
};

var real__isdigit = asm["_isdigit"]; asm["_isdigit"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__isdigit.apply(null, arguments);
};

var real__isspace = asm["_isspace"]; asm["_isspace"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__isspace.apply(null, arguments);
};

var real__llvm_bswap_i32 = asm["_llvm_bswap_i32"]; asm["_llvm_bswap_i32"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__llvm_bswap_i32.apply(null, arguments);
};

var real__main = asm["_main"]; asm["_main"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__main.apply(null, arguments);
};

var real__malloc = asm["_malloc"]; asm["_malloc"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__malloc.apply(null, arguments);
};

var real__mbtowc = asm["_mbtowc"]; asm["_mbtowc"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__mbtowc.apply(null, arguments);
};

var real__memchr = asm["_memchr"]; asm["_memchr"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__memchr.apply(null, arguments);
};

var real__memmove = asm["_memmove"]; asm["_memmove"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__memmove.apply(null, arguments);
};

var real__out_655 = asm["_out_655"]; asm["_out_655"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__out_655.apply(null, arguments);
};

var real__pad_661 = asm["_pad_661"]; asm["_pad_661"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__pad_661.apply(null, arguments);
};

var real__perror = asm["_perror"]; asm["_perror"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__perror.apply(null, arguments);
};

var real__pop_arg_658 = asm["_pop_arg_658"]; asm["_pop_arg_658"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__pop_arg_658.apply(null, arguments);
};

var real__printf_core = asm["_printf_core"]; asm["_printf_core"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__printf_core.apply(null, arguments);
};

var real__pthread_self = asm["_pthread_self"]; asm["_pthread_self"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__pthread_self.apply(null, arguments);
};

var real__putc = asm["_putc"]; asm["_putc"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__putc.apply(null, arguments);
};

var real__read_int16 = asm["_read_int16"]; asm["_read_int16"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__read_int16.apply(null, arguments);
};

var real__read_int32 = asm["_read_int32"]; asm["_read_int32"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__read_int32.apply(null, arguments);
};

var real__read_tag = asm["_read_tag"]; asm["_read_tag"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__read_tag.apply(null, arguments);
};

var real__sbrEncoder_Close = asm["_sbrEncoder_Close"]; asm["_sbrEncoder_Close"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__sbrEncoder_Close.apply(null, arguments);
};

var real__sbrEncoder_EncodeFrame = asm["_sbrEncoder_EncodeFrame"]; asm["_sbrEncoder_EncodeFrame"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__sbrEncoder_EncodeFrame.apply(null, arguments);
};

var real__sbrEncoder_GetEstimateBitrate = asm["_sbrEncoder_GetEstimateBitrate"]; asm["_sbrEncoder_GetEstimateBitrate"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__sbrEncoder_GetEstimateBitrate.apply(null, arguments);
};

var real__sbrEncoder_GetHeader = asm["_sbrEncoder_GetHeader"]; asm["_sbrEncoder_GetHeader"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__sbrEncoder_GetHeader.apply(null, arguments);
};

var real__sbrEncoder_GetInputDataDelay = asm["_sbrEncoder_GetInputDataDelay"]; asm["_sbrEncoder_GetInputDataDelay"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__sbrEncoder_GetInputDataDelay.apply(null, arguments);
};

var real__sbrEncoder_GetLibInfo = asm["_sbrEncoder_GetLibInfo"]; asm["_sbrEncoder_GetLibInfo"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__sbrEncoder_GetLibInfo.apply(null, arguments);
};

var real__sbrEncoder_GetSbrDecDelay = asm["_sbrEncoder_GetSbrDecDelay"]; asm["_sbrEncoder_GetSbrDecDelay"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__sbrEncoder_GetSbrDecDelay.apply(null, arguments);
};

var real__sbrEncoder_Init = asm["_sbrEncoder_Init"]; asm["_sbrEncoder_Init"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__sbrEncoder_Init.apply(null, arguments);
};

var real__sbrEncoder_IsSingleRatePossible = asm["_sbrEncoder_IsSingleRatePossible"]; asm["_sbrEncoder_IsSingleRatePossible"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__sbrEncoder_IsSingleRatePossible.apply(null, arguments);
};

var real__sbrEncoder_LimitBitRate = asm["_sbrEncoder_LimitBitRate"]; asm["_sbrEncoder_LimitBitRate"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__sbrEncoder_LimitBitRate.apply(null, arguments);
};

var real__sbrEncoder_Open = asm["_sbrEncoder_Open"]; asm["_sbrEncoder_Open"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__sbrEncoder_Open.apply(null, arguments);
};

var real__sbrEncoder_UpdateBuffers = asm["_sbrEncoder_UpdateBuffers"]; asm["_sbrEncoder_UpdateBuffers"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__sbrEncoder_UpdateBuffers.apply(null, arguments);
};

var real__sbrk = asm["_sbrk"]; asm["_sbrk"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__sbrk.apply(null, arguments);
};

var real__skip = asm["_skip"]; asm["_skip"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__skip.apply(null, arguments);
};

var real__sn_write = asm["_sn_write"]; asm["_sn_write"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__sn_write.apply(null, arguments);
};

var real__strchr = asm["_strchr"]; asm["_strchr"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__strchr.apply(null, arguments);
};

var real__strcmp = asm["_strcmp"]; asm["_strcmp"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__strcmp.apply(null, arguments);
};

var real__strerror = asm["_strerror"]; asm["_strerror"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__strerror.apply(null, arguments);
};

var real__strlen = asm["_strlen"]; asm["_strlen"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__strlen.apply(null, arguments);
};

var real__swapc = asm["_swapc"]; asm["_swapc"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__swapc.apply(null, arguments);
};

var real__usage = asm["_usage"]; asm["_usage"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__usage.apply(null, arguments);
};

var real__vfprintf = asm["_vfprintf"]; asm["_vfprintf"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__vfprintf.apply(null, arguments);
};

var real__vsnprintf = asm["_vsnprintf"]; asm["_vsnprintf"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__vsnprintf.apply(null, arguments);
};

var real__vsprintf = asm["_vsprintf"]; asm["_vsprintf"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__vsprintf.apply(null, arguments);
};

var real__wav_get_header = asm["_wav_get_header"]; asm["_wav_get_header"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__wav_get_header.apply(null, arguments);
};

var real__wav_read_close = asm["_wav_read_close"]; asm["_wav_read_close"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__wav_read_close.apply(null, arguments);
};

var real__wav_read_data = asm["_wav_read_data"]; asm["_wav_read_data"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__wav_read_data.apply(null, arguments);
};

var real__wav_read_open = asm["_wav_read_open"]; asm["_wav_read_open"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__wav_read_open.apply(null, arguments);
};

var real__wcrtomb = asm["_wcrtomb"]; asm["_wcrtomb"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__wcrtomb.apply(null, arguments);
};

var real__wctomb = asm["_wctomb"]; asm["_wctomb"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__wctomb.apply(null, arguments);
};

var real_establishStackSpace = asm["establishStackSpace"]; asm["establishStackSpace"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real_establishStackSpace.apply(null, arguments);
};

var real_stackAlloc = asm["stackAlloc"]; asm["stackAlloc"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real_stackAlloc.apply(null, arguments);
};

var real_stackRestore = asm["stackRestore"]; asm["stackRestore"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real_stackRestore.apply(null, arguments);
};

var real_stackSave = asm["stackSave"]; asm["stackSave"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real_stackSave.apply(null, arguments);
};
Module["asm"] = asm;
var _FDK_Fetch = Module["_FDK_Fetch"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["_FDK_Fetch"].apply(null, arguments) };
var _FDK_InitBitBuffer = Module["_FDK_InitBitBuffer"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["_FDK_InitBitBuffer"].apply(null, arguments) };
var _FDK_ResetBitBuffer = Module["_FDK_ResetBitBuffer"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["_FDK_ResetBitBuffer"].apply(null, arguments) };
var _FDK_chMapDescr_getMapValue = Module["_FDK_chMapDescr_getMapValue"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["_FDK_chMapDescr_getMapValue"].apply(null, arguments) };
var _FDK_chMapDescr_init = Module["_FDK_chMapDescr_init"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["_FDK_chMapDescr_init"].apply(null, arguments) };
var _FDK_get32 = Module["_FDK_get32"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["_FDK_get32"].apply(null, arguments) };
var _FDK_getValidBits = Module["_FDK_getValidBits"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["_FDK_getValidBits"].apply(null, arguments) };
var _FDK_pushBack = Module["_FDK_pushBack"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["_FDK_pushBack"].apply(null, arguments) };
var _FDK_pushForward = Module["_FDK_pushForward"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["_FDK_pushForward"].apply(null, arguments) };
var _FDK_put = Module["_FDK_put"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["_FDK_put"].apply(null, arguments) };
var _FDK_sacenc_close = Module["_FDK_sacenc_close"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["_FDK_sacenc_close"].apply(null, arguments) };
var _FDK_sacenc_encode = Module["_FDK_sacenc_encode"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["_FDK_sacenc_encode"].apply(null, arguments) };
var _FDK_sacenc_getInfo = Module["_FDK_sacenc_getInfo"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["_FDK_sacenc_getInfo"].apply(null, arguments) };
var _FDK_sacenc_getLibInfo = Module["_FDK_sacenc_getLibInfo"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["_FDK_sacenc_getLibInfo"].apply(null, arguments) };
var _FDK_sacenc_init = Module["_FDK_sacenc_init"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["_FDK_sacenc_init"].apply(null, arguments) };
var _FDK_sacenc_open = Module["_FDK_sacenc_open"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["_FDK_sacenc_open"].apply(null, arguments) };
var _FDK_sacenc_setParam = Module["_FDK_sacenc_setParam"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["_FDK_sacenc_setParam"].apply(null, arguments) };
var _FDK_toolsGetLibInfo = Module["_FDK_toolsGetLibInfo"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["_FDK_toolsGetLibInfo"].apply(null, arguments) };
var _FDKaacEnc_AacInitDefaultConfig = Module["_FDKaacEnc_AacInitDefaultConfig"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["_FDKaacEnc_AacInitDefaultConfig"].apply(null, arguments) };
var _FDKaacEnc_CalcBitsPerFrame = Module["_FDKaacEnc_CalcBitsPerFrame"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["_FDKaacEnc_CalcBitsPerFrame"].apply(null, arguments) };
var _FDKaacEnc_Close = Module["_FDKaacEnc_Close"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["_FDKaacEnc_Close"].apply(null, arguments) };
var _FDKaacEnc_EncodeFrame = Module["_FDKaacEnc_EncodeFrame"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["_FDKaacEnc_EncodeFrame"].apply(null, arguments) };
var _FDKaacEnc_GetBitReservoirState = Module["_FDKaacEnc_GetBitReservoirState"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["_FDKaacEnc_GetBitReservoirState"].apply(null, arguments) };
var _FDKaacEnc_GetVBRBitrate = Module["_FDKaacEnc_GetVBRBitrate"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["_FDKaacEnc_GetVBRBitrate"].apply(null, arguments) };
var _FDKaacEnc_Initialize = Module["_FDKaacEnc_Initialize"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["_FDKaacEnc_Initialize"].apply(null, arguments) };
var _FDKaacEnc_LimitBitrate = Module["_FDKaacEnc_LimitBitrate"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["_FDKaacEnc_LimitBitrate"].apply(null, arguments) };
var _FDKaacEnc_Open = Module["_FDKaacEnc_Open"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["_FDKaacEnc_Open"].apply(null, arguments) };
var _FDKaalloc = Module["_FDKaalloc"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["_FDKaalloc"].apply(null, arguments) };
var _FDKaalloc_L = Module["_FDKaalloc_L"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["_FDKaalloc_L"].apply(null, arguments) };
var _FDKafree = Module["_FDKafree"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["_FDKafree"].apply(null, arguments) };
var _FDKafree_L = Module["_FDKafree_L"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["_FDKafree_L"].apply(null, arguments) };
var _FDKcalloc = Module["_FDKcalloc"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["_FDKcalloc"].apply(null, arguments) };
var _FDKcalloc_L = Module["_FDKcalloc_L"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["_FDKcalloc_L"].apply(null, arguments) };
var _FDKfree = Module["_FDKfree"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["_FDKfree"].apply(null, arguments) };
var _FDKfree_L = Module["_FDKfree_L"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["_FDKfree_L"].apply(null, arguments) };
var _FDKmemclear = Module["_FDKmemclear"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["_FDKmemclear"].apply(null, arguments) };
var _FDKmemcpy = Module["_FDKmemcpy"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["_FDKmemcpy"].apply(null, arguments) };
var _FDKmemmove = Module["_FDKmemmove"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["_FDKmemmove"].apply(null, arguments) };
var _FDKsbrEnc_EncodeIcc = Module["_FDKsbrEnc_EncodeIcc"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["_FDKsbrEnc_EncodeIcc"].apply(null, arguments) };
var _FDKsbrEnc_EncodeIid = Module["_FDKsbrEnc_EncodeIid"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["_FDKsbrEnc_EncodeIid"].apply(null, arguments) };
var _FDKsbrEnc_WritePSBitstream = Module["_FDKsbrEnc_WritePSBitstream"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["_FDKsbrEnc_WritePSBitstream"].apply(null, arguments) };
var _FDKsprintf = Module["_FDKsprintf"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["_FDKsprintf"].apply(null, arguments) };
var __Z10FDKcrcInitP11FDK_CRCINFOjjj = Module["__Z10FDKcrcInitP11FDK_CRCINFOjjj"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z10FDKcrcInitP11FDK_CRCINFOjjj"].apply(null, arguments) };
var __Z10PSEnc_InitP19T_PARAMETRIC_STEREOP14T_PSENC_CONFIGiiPh = Module["__Z10PSEnc_InitP19T_PARAMETRIC_STEREOP14T_PSENC_CONFIGiiPh"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z10PSEnc_InitP19T_PARAMETRIC_STEREOP14T_PSENC_CONFIGiiPh"].apply(null, arguments) };
var __Z10mdct_blockP6mdct_tPKsiPliiPK8FIXP_DPKiPs = Module["__Z10mdct_blockP6mdct_tPKsiPliiPK8FIXP_DPKiPs"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z10mdct_blockP6mdct_tPKsiPliiPK8FIXP_DPKiPs"].apply(null, arguments) };
var __Z10setCplxVecP8FIXP_DPKli = Module["__Z10setCplxVecP8FIXP_DPKli"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z10setCplxVecP8FIXP_DPKli"].apply(null, arguments) };
var __Z11FDKcrcResetP11FDK_CRCINFO = Module["__Z11FDKcrcResetP11FDK_CRCINFO"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z11FDKcrcResetP11FDK_CRCINFO"].apply(null, arguments) };
var __Z11copyCplxVecP8FIXP_DPKPKS_i = Module["__Z11copyCplxVecP8FIXP_DPKPKS_i"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z11copyCplxVecP8FIXP_DPKPKS_i"].apply(null, arguments) };
var __Z11scaleValuesPlPKlii = Module["__Z11scaleValuesPlPKlii"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z11scaleValuesPlPKlii"].apply(null, arguments) };
var __Z11scaleValuesPlii = Module["__Z11scaleValuesPlii"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z11scaleValuesPlii"].apply(null, arguments) };
var __Z12FDKcrcEndRegP11FDK_CRCINFOP13FDK_BITSTREAMi = Module["__Z12FDKcrcEndRegP11FDK_CRCINFOP13FDK_BITSTREAMi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z12FDKcrcEndRegP11FDK_CRCINFOP13FDK_BITSTREAMi"].apply(null, arguments) };
var __Z12FDKcrcGetCRCP11FDK_CRCINFO = Module["__Z12FDKcrcGetCRCP11FDK_CRCINFO"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z12FDKcrcGetCRCP11FDK_CRCINFO"].apply(null, arguments) };
var __Z12LdDataVectorPlS_i = Module["__Z12LdDataVectorPlS_i"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z12LdDataVectorPlS_i"].apply(null, arguments) };
var __Z12PSEnc_CreatePP19T_PARAMETRIC_STEREO = Module["__Z12PSEnc_CreatePP19T_PARAMETRIC_STEREO"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z12PSEnc_CreatePP19T_PARAMETRIC_STEREO"].apply(null, arguments) };
var __Z13CLpc_AnalysisPliPKsiiS_Pi = Module["__Z13CLpc_AnalysisPliPKsiiS_Pi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z13CLpc_AnalysisPliPKsiiS_Pi"].apply(null, arguments) };
var __Z13PSEnc_DestroyPP19T_PARAMETRIC_STEREO = Module["__Z13PSEnc_DestroyPP19T_PARAMETRIC_STEREO"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z13PSEnc_DestroyPP19T_PARAMETRIC_STEREO"].apply(null, arguments) };
var __Z13sumUpCplxPow2PK8FIXP_DPKiiPii = Module["__Z13sumUpCplxPow2PK8FIXP_DPKiiPii"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z13sumUpCplxPow2PK8FIXP_DPKiiPii"].apply(null, arguments) };
var __Z14FDKcrcStartRegP11FDK_CRCINFOP13FDK_BITSTREAMi = Module["__Z14FDKcrcStartRegP11FDK_CRCINFOP13FDK_BITSTREAMi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z14FDKcrcStartRegP11FDK_CRCINFOP13FDK_BITSTREAMi"].apply(null, arguments) };
var __Z14adtsWrite_InitP11STRUCT_ADTSP12CODER_CONFIG = Module["__Z14adtsWrite_InitP11STRUCT_ADTSP12CODER_CONFIG"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z14adtsWrite_InitP11STRUCT_ADTSP12CODER_CONFIG"].apply(null, arguments) };
var __Z14fDivNormSignedllPi = Module["__Z14fDivNormSignedllPi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z14fDivNormSignedllPi"].apply(null, arguments) };
var __Z14getScalefactorPKli = Module["__Z14getScalefactorPKli"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z14getScalefactorPKli"].apply(null, arguments) };
var __Z15FDKaacEnc_BCNewPP13BITCNTR_STATEPh = Module["__Z15FDKaacEnc_BCNewPP13BITCNTR_STATEPh"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z15FDKaacEnc_BCNewPP13BITCNTR_STATEPh"].apply(null, arguments) };
var __Z15FDKaacEnc_QCNewPP8QC_STATEiPh = Module["__Z15FDKaacEnc_QCNewPP8QC_STATEiPh"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z15FDKaacEnc_QCNewPP8QC_STATEiPh"].apply(null, arguments) };
var __Z15GetRam_PsEncodei = Module["__Z15GetRam_PsEncodei"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z15GetRam_PsEncodei"].apply(null, arguments) };
var __Z15fdkFreeMatrix1DPv = Module["__Z15fdkFreeMatrix1DPv"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z15fdkFreeMatrix1DPv"].apply(null, arguments) };
var __Z15fdkFreeMatrix2DPPv = Module["__Z15fdkFreeMatrix2DPPv"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z15fdkFreeMatrix2DPPv"].apply(null, arguments) };
var __Z15fdkFreeMatrix3DPPPv = Module["__Z15fdkFreeMatrix3DPPPv"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z15fdkFreeMatrix3DPPPv"].apply(null, arguments) };
var __Z16CLpc_ParcorToLpcPKsPsiPl = Module["__Z16CLpc_ParcorToLpcPKsPsiPl"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z16CLpc_ParcorToLpcPKsPsiPl"].apply(null, arguments) };
var __Z16FDK_deinterleavePKlPsjjj = Module["__Z16FDK_deinterleavePKlPsjjj"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z16FDK_deinterleavePKlPsjjj"].apply(null, arguments) };
var __Z16FDK_deinterleavePKsPsjjj = Module["__Z16FDK_deinterleavePKsPsjjj"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z16FDK_deinterleavePKsPsjjj"].apply(null, arguments) };
var __Z16FDKaacEnc_PsyNewPP12PSY_INTERNALiiPh = Module["__Z16FDKaacEnc_PsyNewPP12PSY_INTERNALiiPh"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z16FDKaacEnc_PsyNewPP12PSY_INTERNALiiPh"].apply(null, arguments) };
var __Z16FDKaacEnc_QCInitP8QC_STATEP7QC_INITm = Module["__Z16FDKaacEnc_QCInitP8QC_STATEP7QC_INITm"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z16FDKaacEnc_QCInitP8QC_STATEP7QC_INITm"].apply(null, arguments) };
var __Z16FDKaacEnc_QCMainP8QC_STATEPP7PSY_OUTPP6QC_OUTiP15CHANNEL_MAPPING17AUDIO_OBJECT_TYPEja = Module["__Z16FDKaacEnc_QCMainP8QC_STATEPP7PSY_OUTPP6QC_OUTiP15CHANNEL_MAPPING17AUDIO_OBJECT_TYPEja"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z16FDKaacEnc_QCMainP8QC_STATEPP7PSY_OUTPP6QC_OUTiP15CHANNEL_MAPPING17AUDIO_OBJECT_TYPEja"].apply(null, arguments) };
var __Z16FreeRam_PsEncodePP11T_PS_ENCODE = Module["__Z16FreeRam_PsEncodePP11T_PS_ENCODE"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z16FreeRam_PsEncodePP11T_PS_ENCODE"].apply(null, arguments) };
var __Z16autoCorr2nd_cplxP11ACORR_COEFSPKlS2_i = Module["__Z16autoCorr2nd_cplxP11ACORR_COEFSPKlS2_i"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z16autoCorr2nd_cplxP11ACORR_COEFSPKlS2_i"].apply(null, arguments) };
var __Z16calcCoherenceVecPlPKlS1_S1_S1_iii = Module["__Z16calcCoherenceVecPlPKlS1_S1_S1_iii"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z16calcCoherenceVecPlPKlS1_S1_S1_iii"].apply(null, arguments) };
var __Z16fDivNormHighPrecllPi = Module["__Z16fDivNormHighPrecllPi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z16fDivNormHighPrecllPi"].apply(null, arguments) };
var __Z16getChannelConfig12CHANNEL_MODEh = Module["__Z16getChannelConfig12CHANNEL_MODEh"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z16getChannelConfig12CHANNEL_MODEh"].apply(null, arguments) };
var __Z17CLpc_AutoToParcorPliPsiS_Pi = Module["__Z17CLpc_AutoToParcorPliPsiS_Pi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z17CLpc_AutoToParcorPliPsiS_Pi"].apply(null, arguments) };
var __Z17FDK_MpegsEnc_InitP11MPS_ENCODER17AUDIO_OBJECT_TYPEjjjjjj = Module["__Z17FDK_MpegsEnc_InitP11MPS_ENCODER17AUDIO_OBJECT_TYPEjjjjjj"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z17FDK_MpegsEnc_InitP11MPS_ENCODER17AUDIO_OBJECT_TYPEjjjjjj"].apply(null, arguments) };
var __Z17FDK_MpegsEnc_OpenPP11MPS_ENCODER = Module["__Z17FDK_MpegsEnc_OpenPP11MPS_ENCODER"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z17FDK_MpegsEnc_OpenPP11MPS_ENCODER"].apply(null, arguments) };
var __Z17FDKaacEnc_BCClosePP13BITCNTR_STATE = Module["__Z17FDKaacEnc_BCClosePP13BITCNTR_STATE"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z17FDKaacEnc_BCClosePP13BITCNTR_STATE"].apply(null, arguments) };
var __Z17FDKaacEnc_QCClosePP8QC_STATEPP6QC_OUT = Module["__Z17FDKaacEnc_QCClosePP8QC_STATEPP6QC_OUT"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z17FDKaacEnc_QCClosePP8QC_STATEPP6QC_OUT"].apply(null, arguments) };
var __Z17FDKaacEnc_TnsSyncP8TNS_DATAPKS_P8TNS_INFOS4_iiPK10TNS_CONFIG = Module["__Z17FDKaacEnc_TnsSyncP8TNS_DATAPKS_P8TNS_INFOS4_iiPK10TNS_CONFIG"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z17FDKaacEnc_TnsSyncP8TNS_DATAPKS_P8TNS_INFOS4_iiPK10TNS_CONFIG"].apply(null, arguments) };
var __Z17FDKaacEnc_psyInitP12PSY_INTERNALPP7PSY_OUTii17AUDIO_OBJECT_TYPEP15CHANNEL_MAPPING = Module["__Z17FDKaacEnc_psyInitP12PSY_INTERNALPP7PSY_OUTii17AUDIO_OBJECT_TYPEP15CHANNEL_MAPPING"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z17FDKaacEnc_psyInitP12PSY_INTERNALPP7PSY_OUTii17AUDIO_OBJECT_TYPEP15CHANNEL_MAPPING"].apply(null, arguments) };
var __Z17FDKaacEnc_psyMainiP11PSY_ELEMENTP11PSY_DYNAMICP17PSY_CONFIGURATIONP15PSY_OUT_ELEMENTPsjPii = Module["__Z17FDKaacEnc_psyMainiP11PSY_ELEMENTP11PSY_DYNAMICP17PSY_CONFIGURATIONP15PSY_OUT_ELEMENTPsjPii"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z17FDKaacEnc_psyMainiP11PSY_ELEMENTP11PSY_DYNAMICP17PSY_CONFIGURATIONP15PSY_OUT_ELEMENTPsjPii"].apply(null, arguments) };
var __Z17FDKgetWindowSlopeii = Module["__Z17FDKgetWindowSlopeii"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z17FDKgetWindowSlopeii"].apply(null, arguments) };
var __Z17FDKsbrEnc_AddLeftPiS_i = Module["__Z17FDKsbrEnc_AddLeftPiS_i"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z17FDKsbrEnc_AddLeftPiS_i"].apply(null, arguments) };
var __Z17GetAACdynamic_RAMi = Module["__Z17GetAACdynamic_RAMi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z17GetAACdynamic_RAMi"].apply(null, arguments) };
var __Z17GetRam_SbrChanneli = Module["__Z17GetRam_SbrChanneli"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z17GetRam_SbrChanneli"].apply(null, arguments) };
var __Z17GetRam_SbrElementi = Module["__Z17GetRam_SbrElementi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z17GetRam_SbrElementi"].apply(null, arguments) };
var __Z17GetRam_SbrEncoderi = Module["__Z17GetRam_SbrEncoderi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z17GetRam_SbrEncoderi"].apply(null, arguments) };
var __Z17fdkCallocMatrix1Djj = Module["__Z17fdkCallocMatrix1Djj"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z17fdkCallocMatrix1Djj"].apply(null, arguments) };
var __Z17fdkCallocMatrix2Djjj = Module["__Z17fdkCallocMatrix2Djjj"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z17fdkCallocMatrix2Djjj"].apply(null, arguments) };
var __Z17fdkCallocMatrix3Djjjj = Module["__Z17fdkCallocMatrix3Djjjj"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z17fdkCallocMatrix3Djjjj"].apply(null, arguments) };
var __Z17getScalefactorPCMPKsii = Module["__Z17getScalefactorPCMPKsii"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z17getScalefactorPCMPKsii"].apply(null, arguments) };
var __Z17sumUpCplxPow2Dim2PKPK8FIXP_DPKiiPiiiii = Module["__Z17sumUpCplxPow2Dim2PKPK8FIXP_DPKiiPiiiii"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z17sumUpCplxPow2Dim2PKPK8FIXP_DPKiiPiiiii"].apply(null, arguments) };
var __Z17transportEnc_InitP12TRANSPORTENCPhi14TRANSPORT_TYPEP12CODER_CONFIGj = Module["__Z17transportEnc_InitP12TRANSPORTENCPhi14TRANSPORT_TYPEP12CODER_CONFIGj"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z17transportEnc_InitP12TRANSPORTENCPhi14TRANSPORT_TYPEP12CODER_CONFIGj"].apply(null, arguments) };
var __Z17transportEnc_OpenPP12TRANSPORTENC = Module["__Z17transportEnc_OpenPP12TRANSPORTENC"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z17transportEnc_OpenPP12TRANSPORTENC"].apply(null, arguments) };
var __Z18FDK_MpegsEnc_ClosePP11MPS_ENCODER = Module["__Z18FDK_MpegsEnc_ClosePP11MPS_ENCODER"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z18FDK_MpegsEnc_ClosePP11MPS_ENCODER"].apply(null, arguments) };
var __Z18FDKaacEnc_PsyClosePP12PSY_INTERNALPP7PSY_OUT = Module["__Z18FDKaacEnc_PsyClosePP12PSY_INTERNALPP7PSY_OUT"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z18FDKaacEnc_PsyClosePP12PSY_INTERNALPP7PSY_OUT"].apply(null, arguments) };
var __Z18FDKaacEnc_QCOutNewPP6QC_OUTiiiPh = Module["__Z18FDKaacEnc_QCOutNewPP6QC_OUTiiiPh"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z18FDKaacEnc_QCOutNewPP6QC_OUTiiiPh"].apply(null, arguments) };
var __Z18FDKaacEnc_bitCountPKsiiPi = Module["__Z18FDKaacEnc_bitCountPKsiiPi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z18FDKaacEnc_bitCountPKsiiPi"].apply(null, arguments) };
var __Z18FDKsbrEnc_AddRightPiS_i = Module["__Z18FDKsbrEnc_AddRightPiS_i"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z18FDKsbrEnc_AddRightPiS_i"].apply(null, arguments) };
var __Z18FDKsbrEnc_PSEncodeP11T_PS_ENCODEP8T_PS_OUTPhjPA2_A2_Plii = Module["__Z18FDKsbrEnc_PSEncodeP11T_PS_ENCODEP8T_PS_OUTPhjPA2_A2_Plii"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z18FDKsbrEnc_PSEncodeP11T_PS_ENCODEP8T_PS_OUTPhjPA2_A2_Plii"].apply(null, arguments) };
var __Z18FreeAACdynamic_RAMPPl = Module["__Z18FreeAACdynamic_RAMPPl"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z18FreeAACdynamic_RAMPPl"].apply(null, arguments) };
var __Z18FreeRam_SbrChannelPP11SBR_CHANNEL = Module["__Z18FreeRam_SbrChannelPP11SBR_CHANNEL"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z18FreeRam_SbrChannelPP11SBR_CHANNEL"].apply(null, arguments) };
var __Z18FreeRam_SbrElementPP11SBR_ELEMENT = Module["__Z18FreeRam_SbrElementPP11SBR_ELEMENT"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z18FreeRam_SbrElementPP11SBR_ELEMENT"].apply(null, arguments) };
var __Z18FreeRam_SbrEncoderPP11SBR_ENCODER = Module["__Z18FreeRam_SbrEncoderPP11SBR_ENCODER"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z18FreeRam_SbrEncoderPP11SBR_ENCODER"].apply(null, arguments) };
var __Z18GetRam_ParamStereoi = Module["__Z18GetRam_ParamStereoi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z18GetRam_ParamStereoi"].apply(null, arguments) };
var __Z18aacenc_SscCallbackPvP13FDK_BITSTREAM17AUDIO_OBJECT_TYPEiiiiihPh = Module["__Z18aacenc_SscCallbackPvP13FDK_BITSTREAM17AUDIO_OBJECT_TYPEiiiiihPh"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z18aacenc_SscCallbackPvP13FDK_BITSTREAM17AUDIO_OBJECT_TYPEiiiiihPh"].apply(null, arguments) };
var __Z18transportEnc_ClosePP12TRANSPORTENC = Module["__Z18transportEnc_ClosePP12TRANSPORTENC"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z18transportEnc_ClosePP12TRANSPORTENC"].apply(null, arguments) };
var __Z19FDKaacEnc_AdjThrNewPP13ADJ_THR_STATEi = Module["__Z19FDKaacEnc_AdjThrNewPP13ADJ_THR_STATEi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z19FDKaacEnc_AdjThrNewPP13ADJ_THR_STATEi"].apply(null, arguments) };
var __Z19FDKaacEnc_PnsDetectP10PNS_CONFIGP8PNS_DATAiiiPlPKiS3_PiPsiiiS3_S6_ = Module["__Z19FDKaacEnc_PnsDetectP10PNS_CONFIGP8PNS_DATAiiiPlPKiS3_PiPsiiiS3_S6_"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z19FDKaacEnc_PnsDetectP10PNS_CONFIGP8PNS_DATAiiiPlPKiS3_PiPsiiiS3_S6_"].apply(null, arguments) };
var __Z19FDKaacEnc_PsyOutNewPP7PSY_OUTiiiPh = Module["__Z19FDKaacEnc_PsyOutNewPP7PSY_OUTiiiPh"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z19FDKaacEnc_PsyOutNewPP7PSY_OUTiiiPh"].apply(null, arguments) };
var __Z19FDKaacEnc_QCOutInitPP6QC_OUTiPK15CHANNEL_MAPPING = Module["__Z19FDKaacEnc_QCOutInitPP6QC_OUTiPK15CHANNEL_MAPPING"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z19FDKaacEnc_QCOutInitPP6QC_OUTiPK15CHANNEL_MAPPING"].apply(null, arguments) };
var __Z19FDKaacEnc_TnsDetectP8TNS_DATAPK10TNS_CONFIGP8TNS_INFOiPKlii = Module["__Z19FDKaacEnc_TnsDetectP8TNS_DATAPK10TNS_CONFIGP8TNS_INFOiPKlii"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z19FDKaacEnc_TnsDetectP8TNS_DATAPK10TNS_CONFIGP8TNS_INFOiPKlii"].apply(null, arguments) };
var __Z19FDKaacEnc_TnsEncodeP8TNS_INFOP8TNS_DATAiPK10TNS_CONFIGiPlii = Module["__Z19FDKaacEnc_TnsEncodeP8TNS_INFOP8TNS_DATAiPK10TNS_CONFIGiPlii"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z19FDKaacEnc_TnsEncodeP8TNS_INFOP8TNS_DATAiPK10TNS_CONFIGiPlii"].apply(null, arguments) };
var __Z19FDKaacEnc_calcSfbPeP15PE_CHANNEL_DATAPKlS2_iiiPKiS4_ = Module["__Z19FDKaacEnc_calcSfbPeP15PE_CHANNEL_DATAPKlS2_iiiPKiS4_"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z19FDKaacEnc_calcSfbPeP15PE_CHANNEL_DATAPKlS2_iiiPKiS4_"].apply(null, arguments) };
var __Z19FreeRam_ParamStereoPP19T_PARAMETRIC_STEREO = Module["__Z19FreeRam_ParamStereoPP19T_PARAMETRIC_STEREO"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z19FreeRam_ParamStereoPP19T_PARAMETRIC_STEREO"].apply(null, arguments) };
var __Z19GetRam_aacEnc_QCouti = Module["__Z19GetRam_aacEnc_QCouti"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z19GetRam_aacEnc_QCouti"].apply(null, arguments) };
var __Z19adtsWrite_CrcEndRegP11STRUCT_ADTSP13FDK_BITSTREAMi = Module["__Z19adtsWrite_CrcEndRegP11STRUCT_ADTSP13FDK_BITSTREAMi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z19adtsWrite_CrcEndRegP11STRUCT_ADTSP13FDK_BITSTREAMi"].apply(null, arguments) };
var __Z19scaleValuesSaturatePlii = Module["__Z19scaleValuesSaturatePlii"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z19scaleValuesSaturatePlii"].apply(null, arguments) };
var __Z20FDK_MetadataEnc_InitP20FDK_METADATA_ENCODERiiijjj12CHANNEL_MODE13CHANNEL_ORDER = Module["__Z20FDK_MetadataEnc_InitP20FDK_METADATA_ENCODERiiijjj12CHANNEL_MODE13CHANNEL_ORDER"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z20FDK_MetadataEnc_InitP20FDK_METADATA_ENCODERiiijjj12CHANNEL_MODE13CHANNEL_ORDER"].apply(null, arguments) };
var __Z20FDK_MetadataEnc_OpenPP20FDK_METADATA_ENCODERj = Module["__Z20FDK_MetadataEnc_OpenPP20FDK_METADATA_ENCODERj"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z20FDK_MetadataEnc_OpenPP20FDK_METADATA_ENCODERj"].apply(null, arguments) };
var __Z20FDK_MpegsEnc_ProcessP11MPS_ENCODERPsiP18AACENC_EXT_PAYLOAD = Module["__Z20FDK_MpegsEnc_ProcessP11MPS_ENCODERPsiP18AACENC_EXT_PAYLOAD"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z20FDK_MpegsEnc_ProcessP11MPS_ENCODERPsiP18AACENC_EXT_PAYLOAD"].apply(null, arguments) };
var __Z20FDKaacEnc_AdjThrInitP13ADJ_THR_STATEiiPK15CHANNEL_MAPPINGiii18AACENC_BITRES_MODEiil = Module["__Z20FDKaacEnc_AdjThrInitP13ADJ_THR_STATEiiPK15CHANNEL_MAPPINGiii18AACENC_BITRES_MODEiil"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z20FDKaacEnc_AdjThrInitP13ADJ_THR_STATEiiPK15CHANNEL_MAPPINGiii18AACENC_BITRES_MODEiil"].apply(null, arguments) };
var __Z20FDKaacEnc_DownsampleP11DOWNSAMPLERPsiS1_Pi = Module["__Z20FDKaacEnc_DownsampleP11DOWNSAMPLERPsiS1_Pi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z20FDKaacEnc_DownsampleP11DOWNSAMPLERPsiS1_Pi"].apply(null, arguments) };
var __Z20FDKaacEnc_codeValuesPsiiP13FDK_BITSTREAM = Module["__Z20FDKaacEnc_codeValuesPsiiP13FDK_BITSTREAM"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z20FDKaacEnc_codeValuesPsiiP13FDK_BITSTREAM"].apply(null, arguments) };
var __Z20FDKcalcPbScaleFactorPKPK8FIXP_DPKPKhPiiii = Module["__Z20FDKcalcPbScaleFactorPKPK8FIXP_DPKPKhPiiii"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z20FDKcalcPbScaleFactorPKPK8FIXP_DPKPKhPiiii"].apply(null, arguments) };
var __Z20FDKsbrEnc_AddVecLeftPiS_S_i = Module["__Z20FDKsbrEnc_AddVecLeftPiS_S_i"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z20FDKsbrEnc_AddVecLeftPiS_S_i"].apply(null, arguments) };
var __Z20FDKsbrEnc_DownsampleP11SBR_ENCODERPsjjPjPhi = Module["__Z20FDKsbrEnc_DownsampleP11SBR_ENCODERPsjjPjPhi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z20FDKsbrEnc_DownsampleP11SBR_ENCODERPsjjPjPhi"].apply(null, arguments) };
var __Z20FreeRam_aacEnc_QCoutPP6QC_OUT = Module["__Z20FreeRam_aacEnc_QCoutPP6QC_OUT"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z20FreeRam_aacEnc_QCoutPP6QC_OUT"].apply(null, arguments) };
var __Z20GetRam_Sbr_guideScfbi = Module["__Z20GetRam_Sbr_guideScfbi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z20GetRam_Sbr_guideScfbi"].apply(null, arguments) };
var __Z20GetRam_aacEnc_PsyOuti = Module["__Z20GetRam_aacEnc_PsyOuti"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z20GetRam_aacEnc_PsyOuti"].apply(null, arguments) };
var __Z20qmfAnalysisFilteringP15QMF_FILTER_BANKPPlS2_P16QMF_SCALE_FACTORPKsiiS1_ = Module["__Z20qmfAnalysisFilteringP15QMF_FILTER_BANKPPlS2_P16QMF_SCALE_FACTORPKsiiS1_"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z20qmfAnalysisFilteringP15QMF_FILTER_BANKPPlS2_P16QMF_SCALE_FACTORPKsiiS1_"].apply(null, arguments) };
var __Z20transportEnc_GetConfP12TRANSPORTENCP12CODER_CONFIGP13FDK_BITSTREAMPj = Module["__Z20transportEnc_GetConfP12TRANSPORTENCP12CODER_CONFIGP13FDK_BITSTREAMPj"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z20transportEnc_GetConfP12TRANSPORTENCP12CODER_CONFIGP13FDK_BITSTREAMPj"].apply(null, arguments) };
var __Z21CreateStreamMuxConfigP11LATM_STREAMP13FDK_BITSTREAMiP13CSTpCallBacks = Module["__Z21CreateStreamMuxConfigP11LATM_STREAMP13FDK_BITSTREAMiP13CSTpCallBacks"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z21CreateStreamMuxConfigP11LATM_STREAMP13FDK_BITSTREAMiP13CSTpCallBacks"].apply(null, arguments) };
var __Z21FDK_MetadataEnc_ClosePP20FDK_METADATA_ENCODER = Module["__Z21FDK_MetadataEnc_ClosePP20FDK_METADATA_ENCODER"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z21FDK_MetadataEnc_ClosePP20FDK_METADATA_ENCODER"].apply(null, arguments) };
var __Z21FDK_MpegsEnc_GetDelayP11MPS_ENCODER = Module["__Z21FDK_MpegsEnc_GetDelayP11MPS_ENCODER"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z21FDK_MpegsEnc_GetDelayP11MPS_ENCODER"].apply(null, arguments) };
var __Z21FDKaacEnc_AdjThrClosePP13ADJ_THR_STATE = Module["__Z21FDKaacEnc_AdjThrClosePP13ADJ_THR_STATE"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z21FDKaacEnc_AdjThrClosePP13ADJ_THR_STATE"].apply(null, arguments) };
var __Z21FDKaacEnc_GetPnsParamP11NOISEPARAMSiiiPKiPiii = Module["__Z21FDKaacEnc_GetPnsParamP11NOISEPARAMSiiiPKiPiii"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z21FDKaacEnc_GetPnsParamP11NOISEPARAMSiiiPKiPiii"].apply(null, arguments) };
var __Z21FDKaacEnc_calcSfbDistPKlPsiii = Module["__Z21FDKaacEnc_calcSfbDistPKlPsiii"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z21FDKaacEnc_calcSfbDistPKlPsiii"].apply(null, arguments) };
var __Z21FDKaacEnc_countValuesPsii = Module["__Z21FDKaacEnc_countValuesPsii"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z21FDKaacEnc_countValuesPsii"].apply(null, arguments) };
var __Z21FDKaacEnc_dynBitCountP13BITCNTR_STATEPKsPKjPKiiiiiS6_P12SECTION_DATAS6_S6_S6_j = Module["__Z21FDKaacEnc_dynBitCountP13BITCNTR_STATEPKsPKjPKiiiiiS6_P12SECTION_DATAS6_S6_S6_j"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z21FDKaacEnc_dynBitCountP13BITCNTR_STATEPKsPKjPKiiiiiS6_P12SECTION_DATAS6_S6_S6_j"].apply(null, arguments) };
var __Z21FDKaacEnc_noiseDetectPlPiiPKiPsP11NOISEPARAMSS3_ = Module["__Z21FDKaacEnc_noiseDetectPlPiiPKiPsP11NOISEPARAMSS3_"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z21FDKaacEnc_noiseDetectPlPiiPKiPsP11NOISEPARAMSS3_"].apply(null, arguments) };
var __Z21FDKaacEnc_psyMainInitP12PSY_INTERNAL17AUDIO_OBJECT_TYPEP15CHANNEL_MAPPINGiiiiiiiijm = Module["__Z21FDKaacEnc_psyMainInitP12PSY_INTERNAL17AUDIO_OBJECT_TYPEP15CHANNEL_MAPPINGiiiiiiiijm"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z21FDKaacEnc_psyMainInitP12PSY_INTERNAL17AUDIO_OBJECT_TYPEP15CHANNEL_MAPPINGiiiiiiiijm"].apply(null, arguments) };
var __Z21FDKcalcCorrelationVecPlPKlS1_S1_i = Module["__Z21FDKcalcCorrelationVecPlPKlS1_S1_i"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z21FDKcalcCorrelationVecPlPKlS1_S1_i"].apply(null, arguments) };
var __Z21FDKhybridAnalysisInitP18FDK_ANA_HYB_FILTER15FDK_HYBRID_MODEiii = Module["__Z21FDKhybridAnalysisInitP18FDK_ANA_HYB_FILTER15FDK_HYBRID_MODEiii"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z21FDKhybridAnalysisInitP18FDK_ANA_HYB_FILTER15FDK_HYBRID_MODEiii"].apply(null, arguments) };
var __Z21FDKhybridAnalysisOpenP18FDK_ANA_HYB_FILTERPljS1_j = Module["__Z21FDKhybridAnalysisOpenP18FDK_ANA_HYB_FILTERPljS1_j"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z21FDKhybridAnalysisOpenP18FDK_ANA_HYB_FILTERPljS1_j"].apply(null, arguments) };
var __Z21FDKsbrEnc_UpdateHiResPhPiS_iS0_ = Module["__Z21FDKsbrEnc_UpdateHiResPhPiS_iS0_"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z21FDKsbrEnc_UpdateHiResPhPiS_iS0_"].apply(null, arguments) };
var __Z21FDKsbrEnc_UpdateLoResPhPiS_i = Module["__Z21FDKsbrEnc_UpdateLoResPhPiS_i"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z21FDKsbrEnc_UpdateLoResPhPiS_i"].apply(null, arguments) };
var __Z21FreeRam_Sbr_guideScfbPPh = Module["__Z21FreeRam_Sbr_guideScfbPPh"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z21FreeRam_Sbr_guideScfbPPh"].apply(null, arguments) };
var __Z21FreeRam_aacEnc_PsyOutPP7PSY_OUT = Module["__Z21FreeRam_aacEnc_PsyOutPP7PSY_OUT"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z21FreeRam_aacEnc_PsyOutPP7PSY_OUT"].apply(null, arguments) };
var __Z21GetRam_SbrDynamic_RAMi = Module["__Z21GetRam_SbrDynamic_RAMi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z21GetRam_SbrDynamic_RAMi"].apply(null, arguments) };
var __Z21GetRam_Sbr_envIBufferiPh = Module["__Z21GetRam_Sbr_envIBufferiPh"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z21GetRam_Sbr_envIBufferiPh"].apply(null, arguments) };
var __Z21GetRam_Sbr_envRBufferiPh = Module["__Z21GetRam_Sbr_envRBufferiPh"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z21GetRam_Sbr_envRBufferiPh"].apply(null, arguments) };
var __Z21GetRam_Sbr_envYBufferi = Module["__Z21GetRam_Sbr_envYBufferi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z21GetRam_Sbr_envYBufferi"].apply(null, arguments) };
var __Z21GetRam_Sbr_envYBufferiPh = Module["__Z21GetRam_Sbr_envYBufferiPh"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z21GetRam_Sbr_envYBufferiPh"].apply(null, arguments) };
var __Z21GetRam_Sbr_signMatrixi = Module["__Z21GetRam_Sbr_signMatrixi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z21GetRam_Sbr_signMatrixi"].apply(null, arguments) };
var __Z21GetRam_Sbr_v_k_masteri = Module["__Z21GetRam_Sbr_v_k_masteri"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z21GetRam_Sbr_v_k_masteri"].apply(null, arguments) };
var __Z21GetRam_aacEnc_QCstatei = Module["__Z21GetRam_aacEnc_QCstatei"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z21GetRam_aacEnc_QCstatei"].apply(null, arguments) };
var __Z21adtsWrite_CrcStartRegP11STRUCT_ADTSP13FDK_BITSTREAMi = Module["__Z21adtsWrite_CrcStartRegP11STRUCT_ADTSP13FDK_BITSTREAMi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z21adtsWrite_CrcStartRegP11STRUCT_ADTSP13FDK_BITSTREAMi"].apply(null, arguments) };
var __Z21fdkCallocMatrix1D_intjj14MEMORY_SECTION = Module["__Z21fdkCallocMatrix1D_intjj14MEMORY_SECTION"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z21fdkCallocMatrix1D_intjj14MEMORY_SECTION"].apply(null, arguments) };
var __Z21fdk_sacenc_delay_InitP5DELAYiiii = Module["__Z21fdk_sacenc_delay_InitP5DELAYiiii"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z21fdk_sacenc_delay_InitP5DELAYiiii"].apply(null, arguments) };
var __Z21fdk_sacenc_delay_OpenPP5DELAY = Module["__Z21fdk_sacenc_delay_OpenPP5DELAY"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z21fdk_sacenc_delay_OpenPP5DELAY"].apply(null, arguments) };
var __Z21fdk_sacenc_initTtoBoxP9T_TTO_BOXPK16T_TTO_BOX_CONFIGPh = Module["__Z21fdk_sacenc_initTtoBoxP9T_TTO_BOXPK16T_TTO_BOX_CONFIGPh"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z21fdk_sacenc_initTtoBoxP9T_TTO_BOXPK16T_TTO_BOX_CONFIGPh"].apply(null, arguments) };
var __Z21transportEnc_GetFrameP12TRANSPORTENCPi = Module["__Z21transportEnc_GetFrameP12TRANSPORTENCPi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z21transportEnc_GetFrameP12TRANSPORTENCPi"].apply(null, arguments) };
var __Z21transportEnc_writeASCP13FDK_BITSTREAMP12CODER_CONFIGP13CSTpCallBacks = Module["__Z21transportEnc_writeASCP13FDK_BITSTREAMP12CODER_CONFIGP13CSTpCallBacks"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z21transportEnc_writeASCP13FDK_BITSTREAMP12CODER_CONFIGP13CSTpCallBacks"].apply(null, arguments) };
var __Z21transportEnc_writePCEP13FDK_BITSTREAM12CHANNEL_MODEiiiiij = Module["__Z21transportEnc_writePCEP13FDK_BITSTREAM12CHANNEL_MODEiiiiij"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z21transportEnc_writePCEP13FDK_BITSTREAM12CHANNEL_MODEiiiiij"].apply(null, arguments) };
var __Z22FDK_DRC_Generator_CalcP8DRC_COMPPKsjiiillllliiPiS3_ = Module["__Z22FDK_DRC_Generator_CalcP8DRC_COMPPKsjiiillllliiPiS3_"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z22FDK_DRC_Generator_CalcP8DRC_COMPPKsjiiillllliiPiS3_"].apply(null, arguments) };
var __Z22FDK_DRC_Generator_OpenPP8DRC_COMP = Module["__Z22FDK_DRC_Generator_OpenPP8DRC_COMP"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z22FDK_DRC_Generator_OpenPP8DRC_COMP"].apply(null, arguments) };
var __Z22FDKaacEnc_SpreadingMaxiPKlS0_Pl = Module["__Z22FDKaacEnc_SpreadingMaxiPKlS0_Pl"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z22FDKaacEnc_SpreadingMaxiPKlS0_Pl"].apply(null, arguments) };
var __Z22FDKaacEnc_prepareSfbPeP15PE_CHANNEL_DATAPKlS2_S2_PKiiii = Module["__Z22FDKaacEnc_prepareSfbPeP15PE_CHANNEL_DATAPKlS2_S2_PKiiii"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z22FDKaacEnc_prepareSfbPeP15PE_CHANNEL_DATAPKlS2_S2_PKiiii"].apply(null, arguments) };
var __Z22FDKaacEnc_updateBitresP15CHANNEL_MAPPINGP8QC_STATEPP6QC_OUT = Module["__Z22FDKaacEnc_updateBitresP15CHANNEL_MAPPINGP8QC_STATEPP6QC_OUT"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z22FDKaacEnc_updateBitresP15CHANNEL_MAPPINGP8QC_STATEPP6QC_OUT"].apply(null, arguments) };
var __Z22FDKhybridAnalysisApplyP18FDK_ANA_HYB_FILTERPKlS2_PlS3_ = Module["__Z22FDKhybridAnalysisApplyP18FDK_ANA_HYB_FILTERPKlS2_PlS3_"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z22FDKhybridAnalysisApplyP18FDK_ANA_HYB_FILTERPKlS2_PlS3_"].apply(null, arguments) };
var __Z22FDKhybridSynthesisInitP18FDK_SYN_HYB_FILTER15FDK_HYBRID_MODEii = Module["__Z22FDKhybridSynthesisInitP18FDK_SYN_HYB_FILTER15FDK_HYBRID_MODEii"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z22FDKhybridSynthesisInitP18FDK_SYN_HYB_FILTER15FDK_HYBRID_MODEii"].apply(null, arguments) };
var __Z22FDKsbrEnc_InitPSEncodeP11T_PS_ENCODE8PS_BANDSl = Module["__Z22FDKsbrEnc_InitPSEncodeP11T_PS_ENCODE8PS_BANDSl"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z22FDKsbrEnc_InitPSEncodeP11T_PS_ENCODE8PS_BANDSl"].apply(null, arguments) };
var __Z22FDKsbrEnc_codeEnvelopePaPK8FREQ_RESP17SBR_CODE_ENVELOPEPiiiii = Module["__Z22FDKsbrEnc_codeEnvelopePaPK8FREQ_RESP17SBR_CODE_ENVELOPEPiiiii"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z22FDKsbrEnc_codeEnvelopePaPK8FREQ_RESP17SBR_CODE_ENVELOPEPiiiii"].apply(null, arguments) };
var __Z22FreeRam_SbrDynamic_RAMPPl = Module["__Z22FreeRam_SbrDynamic_RAMPPl"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z22FreeRam_SbrDynamic_RAMPPl"].apply(null, arguments) };
var __Z22FreeRam_Sbr_envYBufferPPl = Module["__Z22FreeRam_Sbr_envYBufferPPl"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z22FreeRam_Sbr_envYBufferPPl"].apply(null, arguments) };
var __Z22FreeRam_Sbr_signMatrixPPi = Module["__Z22FreeRam_Sbr_signMatrixPPi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z22FreeRam_Sbr_signMatrixPPi"].apply(null, arguments) };
var __Z22FreeRam_Sbr_v_k_masterPPh = Module["__Z22FreeRam_Sbr_v_k_masterPPh"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z22FreeRam_Sbr_v_k_masterPPh"].apply(null, arguments) };
var __Z22FreeRam_aacEnc_QCstatePP8QC_STATE = Module["__Z22FreeRam_aacEnc_QCstatePP8QC_STATE"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z22FreeRam_aacEnc_QCstatePP8QC_STATE"].apply(null, arguments) };
var __Z22GetRam_Sbr_quotaMatrixi = Module["__Z22GetRam_Sbr_quotaMatrixi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z22GetRam_Sbr_quotaMatrixi"].apply(null, arguments) };
var __Z22adifWrite_EncodeHeaderP9ADIF_INFOP13FDK_BITSTREAMi = Module["__Z22adifWrite_EncodeHeaderP9ADIF_INFOP13FDK_BITSTREAMi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z22adifWrite_EncodeHeaderP9ADIF_INFOP13FDK_BITSTREAMi"].apply(null, arguments) };
var __Z22adtsWrite_EncodeHeaderP11STRUCT_ADTSP13FDK_BITSTREAMii = Module["__Z22adtsWrite_EncodeHeaderP11STRUCT_ADTSP13FDK_BITSTREAMii"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z22adtsWrite_EncodeHeaderP11STRUCT_ADTSP13FDK_BITSTREAMii"].apply(null, arguments) };
var __Z22cplx_cplxScalarProductP8FIXP_DPKPKPKS_S4_iiPiiiii = Module["__Z22cplx_cplxScalarProductP8FIXP_DPKPKPKS_S4_iiPiiiii"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z22cplx_cplxScalarProductP8FIXP_DPKPKPKS_S4_iiPiiiii"].apply(null, arguments) };
var __Z22fdk_sacenc_applyTtoBoxP9T_TTO_BOXiiiPKPK8FIXP_DPKS5_PaPhS6_S7_iPiS8_ = Module["__Z22fdk_sacenc_applyTtoBoxP9T_TTO_BOXiiiPKPK8FIXP_DPKS5_PaPhS6_S7_iPiS8_"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z22fdk_sacenc_applyTtoBoxP9T_TTO_BOXiiiPKPK8FIXP_DPKS5_PaPhS6_S7_iPiS8_"].apply(null, arguments) };
var __Z22fdk_sacenc_delay_ClosePP5DELAY = Module["__Z22fdk_sacenc_delay_ClosePP5DELAY"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z22fdk_sacenc_delay_ClosePP5DELAY"].apply(null, arguments) };
var __Z22qmfSynPrototypeFirSlotP15QMF_FILTER_BANKPlS1_Psi = Module["__Z22qmfSynPrototypeFirSlotP15QMF_FILTER_BANKPlS1_Psi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z22qmfSynPrototypeFirSlotP15QMF_FILTER_BANKPlS1_Psi"].apply(null, arguments) };
var __Z22transportEnc_CrcEndRegP12TRANSPORTENCi = Module["__Z22transportEnc_CrcEndRegP12TRANSPORTENCi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z22transportEnc_CrcEndRegP12TRANSPORTENCi"].apply(null, arguments) };
var __Z22transportEnc_LatmWriteP11LATM_STREAMP13FDK_BITSTREAMiiP13CSTpCallBacks = Module["__Z22transportEnc_LatmWriteP11LATM_STREAMP13FDK_BITSTREAMiiP13CSTpCallBacks"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z22transportEnc_LatmWriteP11LATM_STREAMP13FDK_BITSTREAMiiP13CSTpCallBacks"].apply(null, arguments) };
var __Z22transportEnc_Latm_InitP11LATM_STREAMP13FDK_BITSTREAMP12CODER_CONFIGj14TRANSPORT_TYPEP13CSTpCallBacks = Module["__Z22transportEnc_Latm_InitP11LATM_STREAMP13FDK_BITSTREAMP12CODER_CONFIGj14TRANSPORT_TYPEP13CSTpCallBacks"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z22transportEnc_Latm_InitP11LATM_STREAMP13FDK_BITSTREAMP12CODER_CONFIGj14TRANSPORT_TYPEP13CSTpCallBacks"].apply(null, arguments) };
var __Z23FDK_DRC_Generator_ClosePP8DRC_COMP = Module["__Z23FDK_DRC_Generator_ClosePP8DRC_COMP"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z23FDK_DRC_Generator_ClosePP8DRC_COMP"].apply(null, arguments) };
var __Z23FDK_MetadataEnc_ProcessP20FDK_METADATA_ENCODERPsjiPK15AACENC_MetaDataPP18AACENC_EXT_PAYLOADPjPi = Module["__Z23FDK_MetadataEnc_ProcessP20FDK_METADATA_ENCODERPsjiPK15AACENC_MetaDataPP18AACENC_EXT_PAYLOADPjPi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z23FDK_MetadataEnc_ProcessP20FDK_METADATA_ENCODERPsjiPK15AACENC_MetaDataPP18AACENC_EXT_PAYLOADPjPi"].apply(null, arguments) };
var __Z23FDK_MpegsEnc_GetLibInfoP8LIB_INFO = Module["__Z23FDK_MpegsEnc_GetLibInfoP8LIB_INFO"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z23FDK_MpegsEnc_GetLibInfoP8LIB_INFO"].apply(null, arguments) };
var __Z23FDKaacEnc_AdjustBitrateP8QC_STATEP15CHANNEL_MAPPINGPiiii = Module["__Z23FDKaacEnc_AdjustBitrateP8QC_STATEP15CHANNEL_MAPPINGPiiii"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z23FDKaacEnc_AdjustBitrateP8QC_STATEP15CHANNEL_MAPPINGPiiii"].apply(null, arguments) };
var __Z23FDKaacEnc_QCMainPrepareP12ELEMENT_INFOP11ATS_ELEMENTP15PSY_OUT_ELEMENTP14QC_OUT_ELEMENT17AUDIO_OBJECT_TYPEja = Module["__Z23FDKaacEnc_QCMainPrepareP12ELEMENT_INFOP11ATS_ELEMENTP15PSY_OUT_ELEMENTP14QC_OUT_ELEMENT17AUDIO_OBJECT_TYPEja"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z23FDKaacEnc_QCMainPrepareP12ELEMENT_INFOP11ATS_ELEMENTP15PSY_OUT_ELEMENTP14QC_OUT_ELEMENT17AUDIO_OBJECT_TYPEja"].apply(null, arguments) };
var __Z23FDKaacEnc_peCalculationP7PE_DATAPKPK15PSY_OUT_CHANNELPKP14QC_OUT_CHANNELPK9TOOLSINFOP11ATS_ELEMENTi = Module["__Z23FDKaacEnc_peCalculationP7PE_DATAPKPK15PSY_OUT_CHANNELPKP14QC_OUT_CHANNELPK9TOOLSINFOP11ATS_ELEMENTi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z23FDKaacEnc_peCalculationP7PE_DATAPKPK15PSY_OUT_CHANNELPKP14QC_OUT_CHANNELPK9TOOLSINFOP11ATS_ELEMENTi"].apply(null, arguments) };
var __Z23FDKhybridSynthesisApplyP18FDK_SYN_HYB_FILTERPKlS2_PlS3_ = Module["__Z23FDKhybridSynthesisApplyP18FDK_SYN_HYB_FILTERPKlS2_PlS3_"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z23FDKhybridSynthesisApplyP18FDK_SYN_HYB_FILTERPKlS2_PlS3_"].apply(null, arguments) };
var __Z23FDKsbrEnc_Shellsort_intPii = Module["__Z23FDKsbrEnc_Shellsort_intPii"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z23FDKsbrEnc_Shellsort_intPii"].apply(null, arguments) };
var __Z23FDKsbrEnc_frameSplitterPPlPiP22SBR_TRANSIENT_DETECTORPhS4_iiiiiS_ = Module["__Z23FDKsbrEnc_frameSplitterPPlPiP22SBR_TRANSIENT_DETECTORPhS4_iiiiiS_"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z23FDKsbrEnc_frameSplitterPPlPiP22SBR_TRANSIENT_DETECTORPhS4_iiiiiS_"].apply(null, arguments) };
var __Z23FreeRam_Sbr_quotaMatrixPPl = Module["__Z23FreeRam_Sbr_quotaMatrixPPl"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z23FreeRam_Sbr_quotaMatrixPPl"].apply(null, arguments) };
var __Z23GetRam_aacEnc_BitLookUpiPh = Module["__Z23GetRam_aacEnc_BitLookUpiPh"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z23GetRam_aacEnc_BitLookUpiPh"].apply(null, arguments) };
var __Z23GetRam_aacEnc_PsyStatici = Module["__Z23GetRam_aacEnc_PsyStatici"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z23GetRam_aacEnc_PsyStatici"].apply(null, arguments) };
var __Z23GetRam_aacEnc_QCchanneliPh = Module["__Z23GetRam_aacEnc_QCchanneliPh"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z23GetRam_aacEnc_QCchanneliPh"].apply(null, arguments) };
var __Z23GetRam_aacEnc_QCelementi = Module["__Z23GetRam_aacEnc_QCelementi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z23GetRam_aacEnc_QCelementi"].apply(null, arguments) };
var __Z23adifWrite_GetHeaderBitsP9ADIF_INFO = Module["__Z23adifWrite_GetHeaderBitsP9ADIF_INFO"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z23adifWrite_GetHeaderBitsP9ADIF_INFO"].apply(null, arguments) };
var __Z23adtsWrite_GetHeaderBitsP11STRUCT_ADTS = Module["__Z23adtsWrite_GetHeaderBitsP11STRUCT_ADTS"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z23adtsWrite_GetHeaderBitsP11STRUCT_ADTS"].apply(null, arguments) };
var __Z23fdk_sacenc_createTtoBoxPP9T_TTO_BOX = Module["__Z23fdk_sacenc_createTtoBoxPP9T_TTO_BOX"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z23fdk_sacenc_createTtoBoxPP9T_TTO_BOX"].apply(null, arguments) };
var __Z23fdk_sacenc_initDCFilterP11T_DC_FILTERj = Module["__Z23fdk_sacenc_initDCFilterP11T_DC_FILTERj"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z23fdk_sacenc_initDCFilterP11T_DC_FILTERj"].apply(null, arguments) };
var __Z23getBitstreamElementList17AUDIO_OBJECT_TYPEahhj = Module["__Z23getBitstreamElementList17AUDIO_OBJECT_TYPEahhj"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z23getBitstreamElementList17AUDIO_OBJECT_TYPEahhj"].apply(null, arguments) };
var __Z23transportEnc_GetLibInfoP8LIB_INFO = Module["__Z23transportEnc_GetLibInfoP8LIB_INFO"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z23transportEnc_GetLibInfoP8LIB_INFO"].apply(null, arguments) };
var __Z23transportEnc_GetPCEBits12CHANNEL_MODEii = Module["__Z23transportEnc_GetPCEBits12CHANNEL_MODEii"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z23transportEnc_GetPCEBits12CHANNEL_MODEii"].apply(null, arguments) };
var __Z24FDK_MetadataEnc_GetDelayP20FDK_METADATA_ENCODER = Module["__Z24FDK_MetadataEnc_GetDelayP20FDK_METADATA_ENCODER"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z24FDK_MetadataEnc_GetDelayP20FDK_METADATA_ENCODER"].apply(null, arguments) };
var __Z24FDK_MpegsEnc_GetDecDelayP11MPS_ENCODER = Module["__Z24FDK_MpegsEnc_GetDecDelayP11MPS_ENCODER"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z24FDK_MpegsEnc_GetDecDelayP11MPS_ENCODER"].apply(null, arguments) };
var __Z24FDKaacEnc_BlockSwitchingP23BLOCK_SWITCHING_CONTROLiiPKs = Module["__Z24FDKaacEnc_BlockSwitchingP23BLOCK_SWITCHING_CONTROLiiPKs"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z24FDKaacEnc_BlockSwitchingP23BLOCK_SWITCHING_CONTROLiiPKs"].apply(null, arguments) };
var __Z24FDKaacEnc_CalcFormFactorPP14QC_OUT_CHANNELPP15PSY_OUT_CHANNELi = Module["__Z24FDKaacEnc_CalcFormFactorPP14QC_OUT_CHANNELPP15PSY_OUT_CHANNELi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z24FDKaacEnc_CalcFormFactorPP14QC_OUT_CHANNELPP15PSY_OUT_CHANNELi"].apply(null, arguments) };
var __Z24FDKaacEnc_CodePnsChanneliP10PNS_CONFIGPiPlS1_S2_ = Module["__Z24FDKaacEnc_CodePnsChanneliP10PNS_CONFIGPiPlS1_S2_"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z24FDKaacEnc_CodePnsChanneliP10PNS_CONFIGPiPlS1_S2_"].apply(null, arguments) };
var __Z24FDKaacEnc_DistributeBitsP13ADJ_THR_STATEP11ATS_ELEMENTPP15PSY_OUT_CHANNELP7PE_DATAPiS8_iiiiil18AACENC_BITRES_MODE = Module["__Z24FDKaacEnc_DistributeBitsP13ADJ_THR_STATEP11ATS_ELEMENTPP15PSY_OUT_CHANNELP7PE_DATAPiS8_iiiiil18AACENC_BITRES_MODE"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z24FDKaacEnc_DistributeBitsP13ADJ_THR_STATEP11ATS_ELEMENTPP15PSY_OUT_CHANNELP7PE_DATAPiS8_iiiiil18AACENC_BITRES_MODE"].apply(null, arguments) };
var __Z24FDKaacEnc_PreEchoControlPliiisS_iPi = Module["__Z24FDKaacEnc_PreEchoControlPliiisS_iPi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z24FDKaacEnc_PreEchoControlPliiisS_iPi"].apply(null, arguments) };
var __Z24FDKaacEnc_Transform_RealPKsPliiPiP6mdct_tiS2_i = Module["__Z24FDKaacEnc_Transform_RealPKsPliiPiP6mdct_tiS2_i"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z24FDKaacEnc_Transform_RealPKsPliiPiP6mdct_tiS2_i"].apply(null, arguments) };
var __Z24FDKaacEnc_WriteBitstreamP12TRANSPORTENCP15CHANNEL_MAPPINGP6QC_OUTP7PSY_OUTP8QC_STATE17AUDIO_OBJECT_TYPEja = Module["__Z24FDKaacEnc_WriteBitstreamP12TRANSPORTENCP15CHANNEL_MAPPINGP6QC_OUTP7PSY_OUTP8QC_STATE17AUDIO_OBJECT_TYPEja"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z24FDKaacEnc_WriteBitstreamP12TRANSPORTENCP15CHANNEL_MAPPINGP6QC_OUTP7PSY_OUTP8QC_STATE17AUDIO_OBJECT_TYPEja"].apply(null, arguments) };
var __Z24FDKaacEnc_groupShortDataPlP13SFB_THRESHOLDP10SFB_ENERGYS3_S3_iiPKiPKlPiS8_S_iS5_i = Module["__Z24FDKaacEnc_groupShortDataPlP13SFB_THRESHOLDP10SFB_ENERGYS3_S3_iiPKiPKlPiS8_S_iS5_i"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z24FDKaacEnc_groupShortDataPlP13SFB_THRESHOLDP10SFB_ENERGYS3_S3_iiPKiPKlPiS8_S_iS5_i"].apply(null, arguments) };
var __Z24FDKaacEnc_updateFillBitsP15CHANNEL_MAPPINGP8QC_STATEPP12ELEMENT_BITSPP6QC_OUT = Module["__Z24FDKaacEnc_updateFillBitsP15CHANNEL_MAPPINGP8QC_STATEPP12ELEMENT_BITSPP6QC_OUT"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z24FDKaacEnc_updateFillBitsP15CHANNEL_MAPPINGP8QC_STATEPP12ELEMENT_BITSPP6QC_OUT"].apply(null, arguments) };
var __Z24FDKsbrEnc_CreatePSEncodePP11T_PS_ENCODE = Module["__Z24FDKsbrEnc_CreatePSEncodePP11T_PS_ENCODE"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z24FDKsbrEnc_CreatePSEncodePP11T_PS_ENCODE"].apply(null, arguments) };
var __Z24FDKsbrEnc_EnvEncodeFrameP11SBR_ENCODERiPsjPjPhi = Module["__Z24FDKsbrEnc_EnvEncodeFrameP11SBR_ENCODERiPsjPjPhi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z24FDKsbrEnc_EnvEncodeFrameP11SBR_ENCODERiPsjPjPhi"].apply(null, arguments) };
var __Z24FDKsbrEnc_GetEnvEstDelayP20SBR_EXTRACT_ENVELOPE = Module["__Z24FDKsbrEnc_GetEnvEstDelayP20SBR_EXTRACT_ENVELOPE"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z24FDKsbrEnc_GetEnvEstDelayP20SBR_EXTRACT_ENVELOPE"].apply(null, arguments) };
var __Z24FreeRam_aacEnc_PsyStaticPP10PSY_STATIC = Module["__Z24FreeRam_aacEnc_PsyStaticPP10PSY_STATIC"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z24FreeRam_aacEnc_PsyStaticPP10PSY_STATIC"].apply(null, arguments) };
var __Z24FreeRam_aacEnc_QCelementPP14QC_OUT_ELEMENT = Module["__Z24FreeRam_aacEnc_QCelementPP14QC_OUT_ELEMENT"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z24FreeRam_aacEnc_QCelementPP14QC_OUT_ELEMENT"].apply(null, arguments) };
var __Z24GetRam_aacEnc_AacEncoderi = Module["__Z24GetRam_aacEnc_AacEncoderi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z24GetRam_aacEnc_AacEncoderi"].apply(null, arguments) };
var __Z24GetRam_aacEnc_PsyDynamiciPh = Module["__Z24GetRam_aacEnc_PsyDynamiciPh"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z24GetRam_aacEnc_PsyDynamiciPh"].apply(null, arguments) };
var __Z24GetRam_aacEnc_PsyElementi = Module["__Z24GetRam_aacEnc_PsyElementi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z24GetRam_aacEnc_PsyElementi"].apply(null, arguments) };
var __Z24fdk_sacenc_applyDCFilterP11T_DC_FILTERPKsPsi = Module["__Z24fdk_sacenc_applyDCFilterP11T_DC_FILTERPKsPsi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z24fdk_sacenc_applyDCFilterP11T_DC_FILTERPKsPsi"].apply(null, arguments) };
var __Z24fdk_sacenc_destroyTtoBoxPP9T_TTO_BOX = Module["__Z24fdk_sacenc_destroyTtoBoxPP9T_TTO_BOX"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z24fdk_sacenc_destroyTtoBoxPP9T_TTO_BOX"].apply(null, arguments) };
var __Z24fdk_sacenc_ecDataPairEncP13FDK_BITSTREAMPA23_sPs9DATA_TYPEiiiii = Module["__Z24fdk_sacenc_ecDataPairEncP13FDK_BITSTREAMPA23_sPs9DATA_TYPEiiiii"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z24fdk_sacenc_ecDataPairEncP13FDK_BITSTREAMPA23_sPs9DATA_TYPEiiiii"].apply(null, arguments) };
var __Z24qmfAnalysisFilteringSlotP15QMF_FILTER_BANKPlS1_PKsiS1_ = Module["__Z24qmfAnalysisFilteringSlotP15QMF_FILTER_BANKPlS1_PKsiS1_"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z24qmfAnalysisFilteringSlotP15QMF_FILTER_BANKPlS1_PKsiS1_"].apply(null, arguments) };
var __Z24transportEnc_CrcStartRegP12TRANSPORTENCi = Module["__Z24transportEnc_CrcStartRegP12TRANSPORTENCi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z24transportEnc_CrcStartRegP12TRANSPORTENCi"].apply(null, arguments) };
var __Z25FDKaacEnc_InitDownsamplerP11DOWNSAMPLERii = Module["__Z25FDKaacEnc_InitDownsamplerP11DOWNSAMPLERii"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z25FDKaacEnc_InitDownsamplerP11DOWNSAMPLERii"].apply(null, arguments) };
var __Z25FDKaacEnc_InitElementBitsP8QC_STATEP15CHANNEL_MAPPINGiii = Module["__Z25FDKaacEnc_InitElementBitsP8QC_STATEP15CHANNEL_MAPPINGiii"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z25FDKaacEnc_InitElementBitsP8QC_STATEP15CHANNEL_MAPPINGiii"].apply(null, arguments) };
var __Z25FDKsbrEnc_DestroyPSEncodePP11T_PS_ENCODE = Module["__Z25FDKsbrEnc_DestroyPSEncodePP11T_PS_ENCODE"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z25FDKsbrEnc_DestroyPSEncodePP11T_PS_ENCODE"].apply(null, arguments) };
var __Z25FDKsbrEnc_Shellsort_fractPli = Module["__Z25FDKsbrEnc_Shellsort_fractPli"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z25FDKsbrEnc_Shellsort_fractPli"].apply(null, arguments) };
var __Z25FDKsbrEnc_UpdateFreqScalePhPiiiii = Module["__Z25FDKsbrEnc_UpdateFreqScalePhPiiiii"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z25FDKsbrEnc_UpdateFreqScalePhPiiiii"].apply(null, arguments) };
var __Z25FDKsbrEnc_transientDetectP22SBR_TRANSIENT_DETECTORPPlPiPhiiii = Module["__Z25FDKsbrEnc_transientDetectP22SBR_TRANSIENT_DETECTORPPlPiPhiiii"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z25FDKsbrEnc_transientDetectP22SBR_TRANSIENT_DETECTORPPlPiPhiiii"].apply(null, arguments) };
var __Z25FreeRam_aacEnc_AacEncoderPP7AAC_ENC = Module["__Z25FreeRam_aacEnc_AacEncoderPP7AAC_ENC"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z25FreeRam_aacEnc_AacEncoderPP7AAC_ENC"].apply(null, arguments) };
var __Z25FreeRam_aacEnc_PsyElementPP11PSY_ELEMENT = Module["__Z25FreeRam_aacEnc_PsyElementPP11PSY_ELEMENT"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z25FreeRam_aacEnc_PsyElementPP11PSY_ELEMENT"].apply(null, arguments) };
var __Z25GetRam_aacEnc_ElementBitsi = Module["__Z25GetRam_aacEnc_ElementBitsi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z25GetRam_aacEnc_ElementBitsi"].apply(null, arguments) };
var __Z25GetRam_aacEnc_PsyInternali = Module["__Z25GetRam_aacEnc_PsyInternali"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z25GetRam_aacEnc_PsyInternali"].apply(null, arguments) };
var __Z25adtsWrite_EndRawDataBlockP11STRUCT_ADTSP13FDK_BITSTREAMPi = Module["__Z25adtsWrite_EndRawDataBlockP11STRUCT_ADTSP13FDK_BITSTREAMPi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z25adtsWrite_EndRawDataBlockP11STRUCT_ADTSP13FDK_BITSTREAMPi"].apply(null, arguments) };
var __Z25fdk_sacenc_createDCFilterPP11T_DC_FILTER = Module["__Z25fdk_sacenc_createDCFilterPP11T_DC_FILTER"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z25fdk_sacenc_createDCFilterPP11T_DC_FILTER"].apply(null, arguments) };
var __Z25fdk_sacenc_getPostGainFDKP11STATIC_GAIN = Module["__Z25fdk_sacenc_getPostGainFDKP11STATIC_GAIN"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z25fdk_sacenc_getPostGainFDKP11STATIC_GAIN"].apply(null, arguments) };
var __Z25fdk_sacenc_spaceTree_InitP10SPACE_TREEPK16SPACE_TREE_SETUPPhi = Module["__Z25fdk_sacenc_spaceTree_InitP10SPACE_TREEPK16SPACE_TREE_SETUPPhi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z25fdk_sacenc_spaceTree_InitP10SPACE_TREEPK16SPACE_TREE_SETUPPhi"].apply(null, arguments) };
var __Z25fdk_sacenc_spaceTree_OpenPP10SPACE_TREE = Module["__Z25fdk_sacenc_spaceTree_OpenPP10SPACE_TREE"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z25fdk_sacenc_spaceTree_OpenPP10SPACE_TREE"].apply(null, arguments) };
var __Z25qmfInitAnalysisFilterBankP15QMF_FILTER_BANKPsiiiii = Module["__Z25qmfInitAnalysisFilterBankP15QMF_FILTER_BANKPsiiiii"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z25qmfInitAnalysisFilterBankP15QMF_FILTER_BANKPsiiiii"].apply(null, arguments) };
var __Z25qmfSynthesisFilteringSlotP15QMF_FILTER_BANKPKlS2_iiPsiPl = Module["__Z25qmfSynthesisFilteringSlotP15QMF_FILTER_BANKPKlS2_iiPsiPl"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z25qmfSynthesisFilteringSlotP15QMF_FILTER_BANKPKlS2_iiPsiPl"].apply(null, arguments) };
var __Z25transportEnc_GetBitstreamP12TRANSPORTENC = Module["__Z25transportEnc_GetBitstreamP12TRANSPORTENC"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z25transportEnc_GetBitstreamP12TRANSPORTENC"].apply(null, arguments) };
var __Z25transportEnc_LatmGetFrameP11LATM_STREAMP13FDK_BITSTREAMPi = Module["__Z25transportEnc_LatmGetFrameP11LATM_STREAMP13FDK_BITSTREAMPi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z25transportEnc_LatmGetFrameP11LATM_STREAMP13FDK_BITSTREAMPi"].apply(null, arguments) };
var __Z26FDKaacEnc_AdjustThresholdsP13ADJ_THR_STATEPKP14QC_OUT_ELEMENTP6QC_OUTPKPK15PSY_OUT_ELEMENTiPK15CHANNEL_MAPPING = Module["__Z26FDKaacEnc_AdjustThresholdsP13ADJ_THR_STATEPKP14QC_OUT_ELEMENTP6QC_OUTPKPK15PSY_OUT_ELEMENTiPK15CHANNEL_MAPPING"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z26FDKaacEnc_AdjustThresholdsP13ADJ_THR_STATEPKP14QC_OUT_ELEMENTP6QC_OUTPKPK15PSY_OUT_ELEMENTiPK15CHANNEL_MAPPING"].apply(null, arguments) };
var __Z26FDKaacEnc_CalcBandNrgMSOptPKlS0_PiS1_PKiiPlS4_iS4_S4_ = Module["__Z26FDKaacEnc_CalcBandNrgMSOptPKlS0_PiS1_PKiiPlS4_iS4_S4_"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z26FDKaacEnc_CalcBandNrgMSOptPKlS0_PiS1_PKiiPlS4_iS4_S4_"].apply(null, arguments) };
var __Z26FDKaacEnc_QuantizeSpectrumiiiPKiPKliS0_Psi = Module["__Z26FDKaacEnc_QuantizeSpectrumiiiPKiPKliS0_Psi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z26FDKaacEnc_QuantizeSpectrumiiiPKiPKliS0_Psi"].apply(null, arguments) };
var __Z26FDKaacEnc_bitresCalcBitFaciiiiilPK13ADJ_THR_STATEP11ATS_ELEMENTPlPi = Module["__Z26FDKaacEnc_bitresCalcBitFaciiiiilPK13ADJ_THR_STATEP11ATS_ELEMENTPlPi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z26FDKaacEnc_bitresCalcBitFaciiiiilPK13ADJ_THR_STATEP11ATS_ELEMENTPlPi"].apply(null, arguments) };
var __Z26FDKsbrEnc_InitSbrBitstreamP11COMMON_DATAPhiP11FDK_CRCINFOj = Module["__Z26FDKsbrEnc_InitSbrBitstreamP11COMMON_DATAPhiP11FDK_CRCINFOj"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z26FDKsbrEnc_InitSbrBitstreamP11COMMON_DATAPhiP11FDK_CRCINFOj"].apply(null, arguments) };
var __Z26FDKsbrEnc_TonCorrParamExtrP16SBR_TON_CORR_ESTP9INVF_MODEPlPiPhS5_PK14SBR_FRAME_INFOS5_S5_i9XPOS_MODEj = Module["__Z26FDKsbrEnc_TonCorrParamExtrP16SBR_TON_CORR_ESTP9INVF_MODEPlPiPhS5_PK14SBR_FRAME_INFOS5_S5_i9XPOS_MODEj"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z26FDKsbrEnc_TonCorrParamExtrP16SBR_TON_CORR_ESTP9INVF_MODEPlPiPhS5_PK14SBR_FRAME_INFOS5_S5_i9XPOS_MODEj"].apply(null, arguments) };
var __Z26FreeRam_aacEnc_ElementBitsPP12ELEMENT_BITS = Module["__Z26FreeRam_aacEnc_ElementBitsPP12ELEMENT_BITS"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z26FreeRam_aacEnc_ElementBitsPP12ELEMENT_BITS"].apply(null, arguments) };
var __Z26FreeRam_aacEnc_PsyInternalPP12PSY_INTERNAL = Module["__Z26FreeRam_aacEnc_PsyInternalPP12PSY_INTERNAL"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z26FreeRam_aacEnc_PsyInternalPP12PSY_INTERNAL"].apply(null, arguments) };
var __Z26GetRam_Sbr_freqBandTableHIi = Module["__Z26GetRam_Sbr_freqBandTableHIi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z26GetRam_Sbr_freqBandTableHIi"].apply(null, arguments) };
var __Z26GetRam_Sbr_freqBandTableLOi = Module["__Z26GetRam_Sbr_freqBandTableLOi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z26GetRam_Sbr_freqBandTableLOi"].apply(null, arguments) };
var __Z26GetRam_Sbr_guideVectorDiffi = Module["__Z26GetRam_Sbr_guideVectorDiffi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z26GetRam_Sbr_guideVectorDiffi"].apply(null, arguments) };
var __Z26GetRam_Sbr_guideVectorOrigi = Module["__Z26GetRam_Sbr_guideVectorOrigi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z26GetRam_Sbr_guideVectorOrigi"].apply(null, arguments) };
var __Z26GetRam_aacEnc_BitCntrStatei = Module["__Z26GetRam_aacEnc_BitCntrStatei"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z26GetRam_aacEnc_BitCntrStatei"].apply(null, arguments) };
var __Z26fdk_sacenc_destroyDCFilterPP11T_DC_FILTER = Module["__Z26fdk_sacenc_destroyDCFilterPP11T_DC_FILTER"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z26fdk_sacenc_destroyDCFilterPP11T_DC_FILTER"].apply(null, arguments) };
var __Z26fdk_sacenc_ecDataSingleEncP13FDK_BITSTREAMPA23_sPs9DATA_TYPEiiiii = Module["__Z26fdk_sacenc_ecDataSingleEncP13FDK_BITSTREAMPA23_sPs9DATA_TYPEiiiii"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z26fdk_sacenc_ecDataSingleEncP13FDK_BITSTREAMPA23_sPs9DATA_TYPEiiiii"].apply(null, arguments) };
var __Z26fdk_sacenc_getSpatialFrameP12BSF_INSTANCE17SPATIALFRAME_TYPE = Module["__Z26fdk_sacenc_getSpatialFrameP12BSF_INSTANCE17SPATIALFRAME_TYPE"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z26fdk_sacenc_getSpatialFrameP12BSF_INSTANCE17SPATIALFRAME_TYPE"].apply(null, arguments) };
var __Z26fdk_sacenc_spaceTree_ApplyP10SPACE_TREEiiiiiPlPKPKP8FIXP_DPKS7_P12SPATIALFRAMEiPi = Module["__Z26fdk_sacenc_spaceTree_ApplyP10SPACE_TREEiiiiiPlPKPKP8FIXP_DPKS7_P12SPATIALFRAMEiPi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z26fdk_sacenc_spaceTree_ApplyP10SPACE_TREEiiiiiPlPKPKP8FIXP_DPKS7_P12SPATIALFRAMEiPi"].apply(null, arguments) };
var __Z26fdk_sacenc_spaceTree_ClosePP10SPACE_TREE = Module["__Z26fdk_sacenc_spaceTree_ClosePP10SPACE_TREE"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z26fdk_sacenc_spaceTree_ClosePP10SPACE_TREE"].apply(null, arguments) };
var __Z26fdk_sacenc_staticGain_InitP11STATIC_GAINP18STATIC_GAIN_CONFIGPi = Module["__Z26fdk_sacenc_staticGain_InitP11STATIC_GAINP18STATIC_GAIN_CONFIGPi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z26fdk_sacenc_staticGain_InitP11STATIC_GAINP18STATIC_GAIN_CONFIGPi"].apply(null, arguments) };
var __Z26fdk_sacenc_staticGain_OpenPP11STATIC_GAIN = Module["__Z26fdk_sacenc_staticGain_OpenPP11STATIC_GAIN"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z26fdk_sacenc_staticGain_OpenPP11STATIC_GAIN"].apply(null, arguments) };
var __Z26qmfInitSynthesisFilterBankP15QMF_FILTER_BANKPliiiii = Module["__Z26qmfInitSynthesisFilterBankP15QMF_FILTER_BANKPliiiii"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z26qmfInitSynthesisFilterBankP15QMF_FILTER_BANKPliiiii"].apply(null, arguments) };
var __Z26transportEnc_EndAccessUnitP12TRANSPORTENCPi = Module["__Z26transportEnc_EndAccessUnitP12TRANSPORTENCPi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z26transportEnc_EndAccessUnitP12TRANSPORTENCPi"].apply(null, arguments) };
var __Z26transportEnc_GetStaticBitsP12TRANSPORTENCi = Module["__Z26transportEnc_GetStaticBitsP12TRANSPORTENCi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z26transportEnc_GetStaticBitsP12TRANSPORTENCi"].apply(null, arguments) };
var __Z27FDKaacEnc_GetMonoStereoMode12CHANNEL_MODE = Module["__Z27FDKaacEnc_GetMonoStereoMode12CHANNEL_MODE"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z27FDKaacEnc_GetMonoStereoMode12CHANNEL_MODE"].apply(null, arguments) };
var __Z27FDKsbrEnc_PSEnc_WritePSDataP19T_PARAMETRIC_STEREOP13FDK_BITSTREAM = Module["__Z27FDKsbrEnc_PSEnc_WritePSDataP19T_PARAMETRIC_STEREOP13FDK_BITSTREAM"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z27FDKsbrEnc_PSEnc_WritePSDataP19T_PARAMETRIC_STEREOP13FDK_BITSTREAM"].apply(null, arguments) };
var __Z27FDKsbrEnc_getSbrStopFreqRAWii = Module["__Z27FDKsbrEnc_getSbrStopFreqRAWii"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z27FDKsbrEnc_getSbrStopFreqRAWii"].apply(null, arguments) };
var __Z27FreeRam_Sbr_freqBandTableHIPPh = Module["__Z27FreeRam_Sbr_freqBandTableHIPPh"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z27FreeRam_Sbr_freqBandTableHIPPh"].apply(null, arguments) };
var __Z27FreeRam_Sbr_freqBandTableLOPPh = Module["__Z27FreeRam_Sbr_freqBandTableLOPPh"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z27FreeRam_Sbr_freqBandTableLOPPh"].apply(null, arguments) };
var __Z27FreeRam_Sbr_guideVectorDiffPPl = Module["__Z27FreeRam_Sbr_guideVectorDiffPPl"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z27FreeRam_Sbr_guideVectorDiffPPl"].apply(null, arguments) };
var __Z27FreeRam_Sbr_guideVectorOrigPPl = Module["__Z27FreeRam_Sbr_guideVectorOrigPPl"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z27FreeRam_Sbr_guideVectorOrigPPl"].apply(null, arguments) };
var __Z27FreeRam_aacEnc_BitCntrStatePP13BITCNTR_STATE = Module["__Z27FreeRam_aacEnc_BitCntrStatePP13BITCNTR_STATE"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z27FreeRam_aacEnc_BitCntrStatePP13BITCNTR_STATE"].apply(null, arguments) };
var __Z27GetRam_PsQmfStatesSynthesisi = Module["__Z27GetRam_PsQmfStatesSynthesisi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z27GetRam_PsQmfStatesSynthesisi"].apply(null, arguments) };
var __Z27GetRam_Sbr_detectionVectorsi = Module["__Z27GetRam_Sbr_detectionVectorsi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z27GetRam_Sbr_detectionVectorsi"].apply(null, arguments) };
var __Z27GetRam_aacEnc_PsyOutChanneli = Module["__Z27GetRam_aacEnc_PsyOutChanneli"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z27GetRam_aacEnc_PsyOutChanneli"].apply(null, arguments) };
var __Z27fdk_sacenc_frameWindow_InitP13T_FRAMEWINDOWPK20T_FRAMEWINDOW_CONFIG = Module["__Z27fdk_sacenc_frameWindow_InitP13T_FRAMEWINDOWPK20T_FRAMEWINDOW_CONFIG"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z27fdk_sacenc_frameWindow_InitP13T_FRAMEWINDOWPK20T_FRAMEWINDOW_CONFIG"].apply(null, arguments) };
var __Z27fdk_sacenc_getPreGainPtrFDKP11STATIC_GAIN = Module["__Z27fdk_sacenc_getPreGainPtrFDKP11STATIC_GAIN"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z27fdk_sacenc_getPreGainPtrFDKP11STATIC_GAIN"].apply(null, arguments) };
var __Z27fdk_sacenc_onsetDetect_InitP12ONSET_DETECTPK21T_ONSET_DETECT_CONFIGj = Module["__Z27fdk_sacenc_onsetDetect_InitP12ONSET_DETECTPK21T_ONSET_DETECT_CONFIGj"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z27fdk_sacenc_onsetDetect_InitP12ONSET_DETECTPK21T_ONSET_DETECT_CONFIGj"].apply(null, arguments) };
var __Z27fdk_sacenc_onsetDetect_OpenPP12ONSET_DETECTj = Module["__Z27fdk_sacenc_onsetDetect_OpenPP12ONSET_DETECTj"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z27fdk_sacenc_onsetDetect_OpenPP12ONSET_DETECTj"].apply(null, arguments) };
var __Z27fdk_sacenc_staticGain_ClosePP11STATIC_GAIN = Module["__Z27fdk_sacenc_staticGain_ClosePP11STATIC_GAIN"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z27fdk_sacenc_staticGain_ClosePP11STATIC_GAIN"].apply(null, arguments) };
var __Z28FDK_DRC_Generator_InitializeP8DRC_COMP11DRC_PROFILES1_ij12CHANNEL_MODE13CHANNEL_ORDERh = Module["__Z28FDK_DRC_Generator_InitializeP8DRC_COMP11DRC_PROFILES1_ij12CHANNEL_MODE13CHANNEL_ORDERh"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z28FDK_DRC_Generator_InitializeP8DRC_COMP11DRC_PROFILES1_ij12CHANNEL_MODE13CHANNEL_ORDERh"].apply(null, arguments) };
var __Z28FDKaacEnc_DetermineBandWidthii19AACENC_BITRATE_MODEiiPK15CHANNEL_MAPPING12CHANNEL_MODEPi = Module["__Z28FDKaacEnc_DetermineBandWidthii19AACENC_BITRATE_MODEiiPK15CHANNEL_MAPPING12CHANNEL_MODEPi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z28FDKaacEnc_DetermineBandWidthii19AACENC_BITRATE_MODEiiPK15CHANNEL_MAPPING12CHANNEL_MODEPi"].apply(null, arguments) };
var __Z28FDKaacEnc_InitBlockSwitchingP23BLOCK_SWITCHING_CONTROLi = Module["__Z28FDKaacEnc_InitBlockSwitchingP23BLOCK_SWITCHING_CONTROLi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z28FDKaacEnc_InitBlockSwitchingP23BLOCK_SWITCHING_CONTROLi"].apply(null, arguments) };
var __Z28FDKaacEnc_InitChannelMapping12CHANNEL_MODE13CHANNEL_ORDERP15CHANNEL_MAPPING = Module["__Z28FDKaacEnc_InitChannelMapping12CHANNEL_MODE13CHANNEL_ORDERP15CHANNEL_MAPPING"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z28FDKaacEnc_InitChannelMapping12CHANNEL_MODE13CHANNEL_ORDERP15CHANNEL_MAPPING"].apply(null, arguments) };
var __Z28FDKaacEnc_InitPreEchoControlPlPiiS_S0_ = Module["__Z28FDKaacEnc_InitPreEchoControlPlPiiS_S0_"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z28FDKaacEnc_InitPreEchoControlPlPiiS_S0_"].apply(null, arguments) };
var __Z28FDKaacEnc_MsStereoProcessingPP8PSY_DATAPP15PSY_OUT_CHANNELPKiPiS7_iiiiS6_ = Module["__Z28FDKaacEnc_MsStereoProcessingPP8PSY_DATAPP15PSY_OUT_CHANNELPKiPiS7_iiiiS6_"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z28FDKaacEnc_MsStereoProcessingPP8PSY_DATAPP15PSY_OUT_CHANNELPKiPiS7_iiiiS6_"].apply(null, arguments) };
var __Z28FDKaacEnc_SyncBlockSwitchingP23BLOCK_SWITCHING_CONTROLS0_ii = Module["__Z28FDKaacEnc_SyncBlockSwitchingP23BLOCK_SWITCHING_CONTROLS0_ii"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z28FDKaacEnc_SyncBlockSwitchingP23BLOCK_SWITCHING_CONTROLS0_ii"].apply(null, arguments) };
var __Z28FDKaacEnc_Transform_Real_EldPKsPliiPiiS2_iS1_ = Module["__Z28FDKaacEnc_Transform_Real_EldPKsPliiPiiS2_iS1_"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z28FDKaacEnc_Transform_Real_EldPKsPliiPiiS2_iS1_"].apply(null, arguments) };
var __Z28FDKaacEnc_writeExtensionDataP12TRANSPORTENCP16QC_OUT_EXTENSIONijj17AUDIO_OBJECT_TYPEa = Module["__Z28FDKaacEnc_writeExtensionDataP12TRANSPORTENCP16QC_OUT_EXTENSIONijj17AUDIO_OBJECT_TYPEa"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z28FDKaacEnc_writeExtensionDataP12TRANSPORTENCP16QC_OUT_EXTENSIONijj17AUDIO_OBJECT_TYPEa"].apply(null, arguments) };
var __Z28FDKsbrEnc_frameInfoGeneratorP18SBR_ENVELOPE_FRAMEPhiS1_iPKi = Module["__Z28FDKsbrEnc_frameInfoGeneratorP18SBR_ENVELOPE_FRAMEPhiS1_iPKi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z28FDKsbrEnc_frameInfoGeneratorP18SBR_ENVELOPE_FRAMEPhiS1_iPKi"].apply(null, arguments) };
var __Z28FDKsbrEnc_getSbrStartFreqRAWii = Module["__Z28FDKsbrEnc_getSbrStartFreqRAWii"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z28FDKsbrEnc_getSbrStartFreqRAWii"].apply(null, arguments) };
var __Z28FreeRam_PsQmfStatesSynthesisPPl = Module["__Z28FreeRam_PsQmfStatesSynthesisPPl"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z28FreeRam_PsQmfStatesSynthesisPPl"].apply(null, arguments) };
var __Z28FreeRam_Sbr_detectionVectorsPPh = Module["__Z28FreeRam_Sbr_detectionVectorsPPh"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z28FreeRam_Sbr_detectionVectorsPPh"].apply(null, arguments) };
var __Z28FreeRam_aacEnc_PsyOutChannelPP15PSY_OUT_CHANNEL = Module["__Z28FreeRam_aacEnc_PsyOutChannelPP15PSY_OUT_CHANNEL"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z28FreeRam_aacEnc_PsyOutChannelPP15PSY_OUT_CHANNEL"].apply(null, arguments) };
var __Z28GetRam_Sbr_QmfStatesAnalysisi = Module["__Z28GetRam_Sbr_QmfStatesAnalysisi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z28GetRam_Sbr_QmfStatesAnalysisi"].apply(null, arguments) };
var __Z28GetRam_aacEnc_PsyInputBufferi = Module["__Z28GetRam_aacEnc_PsyInputBufferi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z28GetRam_aacEnc_PsyInputBufferi"].apply(null, arguments) };
var __Z28GetRam_aacEnc_PsyOutElementsi = Module["__Z28GetRam_aacEnc_PsyOutElementsi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z28GetRam_aacEnc_PsyOutElementsi"].apply(null, arguments) };
var __Z28fdk_sacenc_analysisWindowingiiPlPKPK8FIXP_DPKPKPS0_ii = Module["__Z28fdk_sacenc_analysisWindowingiiPlPKPK8FIXP_DPKPKPS0_ii"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z28fdk_sacenc_analysisWindowingiiPlPKPK8FIXP_DPKPKPS0_ii"].apply(null, arguments) };
var __Z28fdk_sacenc_delay_SetDmxAlignP5DELAYi = Module["__Z28fdk_sacenc_delay_SetDmxAlignP5DELAYi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z28fdk_sacenc_delay_SetDmxAlignP5DELAYi"].apply(null, arguments) };
var __Z28fdk_sacenc_onsetDetect_ApplyP12ONSET_DETECTiiPKP8FIXP_DPKiiPi = Module["__Z28fdk_sacenc_onsetDetect_ApplyP12ONSET_DETECTiiPKP8FIXP_DPKiiPi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z28fdk_sacenc_onsetDetect_ApplyP12ONSET_DETECTiiPKP8FIXP_DPKiiPi"].apply(null, arguments) };
var __Z28fdk_sacenc_onsetDetect_ClosePP12ONSET_DETECT = Module["__Z28fdk_sacenc_onsetDetect_ClosePP12ONSET_DETECT"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z28fdk_sacenc_onsetDetect_ClosePP12ONSET_DETECT"].apply(null, arguments) };
var __Z28fdk_sacenc_writeSpatialFramePhiPiP12BSF_INSTANCE = Module["__Z28fdk_sacenc_writeSpatialFramePhiPiP12BSF_INSTANCE"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z28fdk_sacenc_writeSpatialFramePhiPiP12BSF_INSTANCE"].apply(null, arguments) };
var __Z28transportEnc_WriteAccessUnitP12TRANSPORTENCiii = Module["__Z28transportEnc_WriteAccessUnitP12TRANSPORTENCiii"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z28transportEnc_WriteAccessUnitP12TRANSPORTENCiii"].apply(null, arguments) };
var __Z29FDKaacEnc_CalcSfbMaxScaleSpecPKlPKiPii = Module["__Z29FDKaacEnc_CalcSfbMaxScaleSpecPKlPKiPii"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z29FDKaacEnc_CalcSfbMaxScaleSpecPKlPKiPii"].apply(null, arguments) };
var __Z29FDKaacEnc_ChannelElementWriteP12TRANSPORTENCP12ELEMENT_INFOPP14QC_OUT_CHANNELP15PSY_OUT_ELEMENTPP15PSY_OUT_CHANNELj17AUDIO_OBJECT_TYPEaPih = Module["__Z29FDKaacEnc_ChannelElementWriteP12TRANSPORTENCP12ELEMENT_INFOPP14QC_OUT_CHANNELP15PSY_OUT_ELEMENTPP15PSY_OUT_CHANNELj17AUDIO_OBJECT_TYPEaPih"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z29FDKaacEnc_ChannelElementWriteP12TRANSPORTENCP12ELEMENT_INFOPP14QC_OUT_CHANNELP15PSY_OUT_ELEMENTPP15PSY_OUT_CHANNELj17AUDIO_OBJECT_TYPEaPih"].apply(null, arguments) };
var __Z29FDKsbrEnc_InitSbrCodeEnvelopeP17SBR_CODE_ENVELOPEPiill = Module["__Z29FDKsbrEnc_InitSbrCodeEnvelopeP17SBR_CODE_ENVELOPEPiill"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z29FDKsbrEnc_InitSbrCodeEnvelopeP17SBR_CODE_ENVELOPEPiill"].apply(null, arguments) };
var __Z29FDKsbrEnc_extractSbrEnvelope1P15SBR_CONFIG_DATAP15SBR_HEADER_DATAP18SBR_BITSTREAM_DATAP11ENV_CHANNELP11COMMON_DATAP17SBR_ENV_TEMP_DATAP19SBR_FRAME_TEMP_DATA = Module["__Z29FDKsbrEnc_extractSbrEnvelope1P15SBR_CONFIG_DATAP15SBR_HEADER_DATAP18SBR_BITSTREAM_DATAP11ENV_CHANNELP11COMMON_DATAP17SBR_ENV_TEMP_DATAP19SBR_FRAME_TEMP_DATA"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z29FDKsbrEnc_extractSbrEnvelope1P15SBR_CONFIG_DATAP15SBR_HEADER_DATAP18SBR_BITSTREAM_DATAP11ENV_CHANNELP11COMMON_DATAP17SBR_ENV_TEMP_DATAP19SBR_FRAME_TEMP_DATA"].apply(null, arguments) };
var __Z29FDKsbrEnc_extractSbrEnvelope2P15SBR_CONFIG_DATAP15SBR_HEADER_DATAP19T_PARAMETRIC_STEREOP18SBR_BITSTREAM_DATAP11ENV_CHANNELS8_P11COMMON_DATAP17SBR_ENV_TEMP_DATAP19SBR_FRAME_TEMP_DATAi = Module["__Z29FDKsbrEnc_extractSbrEnvelope2P15SBR_CONFIG_DATAP15SBR_HEADER_DATAP19T_PARAMETRIC_STEREOP18SBR_BITSTREAM_DATAP11ENV_CHANNELS8_P11COMMON_DATAP17SBR_ENV_TEMP_DATAP19SBR_FRAME_TEMP_DATAi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z29FDKsbrEnc_extractSbrEnvelope2P15SBR_CONFIG_DATAP15SBR_HEADER_DATAP19T_PARAMETRIC_STEREOP18SBR_BITSTREAM_DATAP11ENV_CHANNELS8_P11COMMON_DATAP17SBR_ENV_TEMP_DATAP19SBR_FRAME_TEMP_DATAi"].apply(null, arguments) };
var __Z29FDKsbrEnc_fastTransientDetectP18FAST_TRAN_DETECTORPKPKlPKiiPh = Module["__Z29FDKsbrEnc_fastTransientDetectP18FAST_TRAN_DETECTORPKPKlPKiiPh"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z29FDKsbrEnc_fastTransientDetectP18FAST_TRAN_DETECTORPKPKlPKiiPh"].apply(null, arguments) };
var __Z29FDKsbrEnc_initInvFiltDetectorP16SBR_INV_FILT_ESTPiij = Module["__Z29FDKsbrEnc_initInvFiltDetectorP16SBR_INV_FILT_ESTPiij"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z29FDKsbrEnc_initInvFiltDetectorP16SBR_INV_FILT_ESTPiij"].apply(null, arguments) };
var __Z29FreeRam_Sbr_QmfStatesAnalysisPPs = Module["__Z29FreeRam_Sbr_QmfStatesAnalysisPPs"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z29FreeRam_Sbr_QmfStatesAnalysisPPs"].apply(null, arguments) };
var __Z29FreeRam_aacEnc_PsyInputBufferPPs = Module["__Z29FreeRam_aacEnc_PsyInputBufferPPs"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z29FreeRam_aacEnc_PsyInputBufferPPs"].apply(null, arguments) };
var __Z29FreeRam_aacEnc_PsyOutElementsPP15PSY_OUT_ELEMENT = Module["__Z29FreeRam_aacEnc_PsyOutElementsPP15PSY_OUT_ELEMENT"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z29FreeRam_aacEnc_PsyOutElementsPP15PSY_OUT_ELEMENT"].apply(null, arguments) };
var __Z29GetRam_aacEnc_AdjustThresholdi = Module["__Z29GetRam_aacEnc_AdjustThresholdi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z29GetRam_aacEnc_AdjustThresholdi"].apply(null, arguments) };
var __Z29GetRam_aacEnc_MergeGainLookUpiPh = Module["__Z29GetRam_aacEnc_MergeGainLookUpiPh"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z29GetRam_aacEnc_MergeGainLookUpiPh"].apply(null, arguments) };
var __Z29fdk_sacenc_frameWindow_CreatePP13T_FRAMEWINDOW = Module["__Z29fdk_sacenc_frameWindow_CreatePP13T_FRAMEWINDOW"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z29fdk_sacenc_frameWindow_CreatePP13T_FRAMEWINDOW"].apply(null, arguments) };
var __Z29fdk_sacenc_onsetDetect_UpdateP12ONSET_DETECTi = Module["__Z29fdk_sacenc_onsetDetect_UpdateP12ONSET_DETECTi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z29fdk_sacenc_onsetDetect_UpdateP12ONSET_DETECTi"].apply(null, arguments) };
var __Z30FDK_MpegsEnc_GetClosestBitRate17AUDIO_OBJECT_TYPE12CHANNEL_MODEjjj = Module["__Z30FDK_MpegsEnc_GetClosestBitRate17AUDIO_OBJECT_TYPE12CHANNEL_MODEjjj"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z30FDK_MpegsEnc_GetClosestBitRate17AUDIO_OBJECT_TYPE12CHANNEL_MODEjjj"].apply(null, arguments) };
var __Z30FDKaacEnc_CheckBandEnergyOptimPKlPKiS2_iPlS3_i = Module["__Z30FDKaacEnc_CheckBandEnergyOptimPKlPKiS2_iPlS3_i"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z30FDKaacEnc_CheckBandEnergyOptimPKlPKiS2_iPlS3_i"].apply(null, arguments) };
var __Z30FDKaacEnc_DetermineEncoderModeP12CHANNEL_MODEi = Module["__Z30FDKaacEnc_DetermineEncoderModeP12CHANNEL_MODEi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z30FDKaacEnc_DetermineEncoderModeP12CHANNEL_MODEi"].apply(null, arguments) };
var __Z30FDKaacEnc_EstimateScaleFactorsPP15PSY_OUT_CHANNELPP14QC_OUT_CHANNELiii = Module["__Z30FDKaacEnc_EstimateScaleFactorsPP15PSY_OUT_CHANNELPP14QC_OUT_CHANNELiii"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z30FDKaacEnc_EstimateScaleFactorsPP15PSY_OUT_CHANNELPP14QC_OUT_CHANNELiii"].apply(null, arguments) };
var __Z30FDKaacEnc_InitPnsConfigurationP10PNS_CONFIGiiiiPKiii = Module["__Z30FDKaacEnc_InitPnsConfigurationP10PNS_CONFIGiiiiPKiii"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z30FDKaacEnc_InitPnsConfigurationP10PNS_CONFIGiiiiPKiii"].apply(null, arguments) };
var __Z30FDKaacEnc_InitPsyConfigurationiiiiiiiP17PSY_CONFIGURATION7FB_TYPE = Module["__Z30FDKaacEnc_InitPsyConfigurationiiiiiiiP17PSY_CONFIGURATION7FB_TYPE"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z30FDKaacEnc_InitPsyConfigurationiiiiiiiP17PSY_CONFIGURATION7FB_TYPE"].apply(null, arguments) };
var __Z30FDKaacEnc_InitTnsConfigurationiiiiiiiP10TNS_CONFIGP17PSY_CONFIGURATIONii = Module["__Z30FDKaacEnc_InitTnsConfigurationiiiiiiiP10TNS_CONFIGP17PSY_CONFIGURATIONii"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z30FDKaacEnc_InitTnsConfigurationiiiiiiiP10TNS_CONFIGP17PSY_CONFIGURATIONii"].apply(null, arguments) };
var __Z30FDKaacEnc_codeScalefactorDeltaiP13FDK_BITSTREAM = Module["__Z30FDKaacEnc_codeScalefactorDeltaiP13FDK_BITSTREAM"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z30FDKaacEnc_codeScalefactorDeltaiP13FDK_BITSTREAM"].apply(null, arguments) };
var __Z30FDKsbrEnc_AssembleSbrBitstreamP11COMMON_DATAP11FDK_CRCINFOij = Module["__Z30FDKsbrEnc_AssembleSbrBitstreamP11COMMON_DATAP11FDK_CRCINFOij"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z30FDKsbrEnc_AssembleSbrBitstreamP11COMMON_DATAP11FDK_CRCINFOij"].apply(null, arguments) };
var __Z30FDKsbrEnc_FindStartAndStopBandiiiiiPiS_ = Module["__Z30FDKsbrEnc_FindStartAndStopBandiiiiiPiS_"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z30FDKsbrEnc_FindStartAndStopBandiiiiiPiS_"].apply(null, arguments) };
var __Z30FDKsbrEnc_InitSbrHuffmanTablesP12SBR_ENV_DATAP17SBR_CODE_ENVELOPES2_7AMP_RES = Module["__Z30FDKsbrEnc_InitSbrHuffmanTablesP12SBR_ENV_DATAP17SBR_CODE_ENVELOPES2_7AMP_RES"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z30FDKsbrEnc_InitSbrHuffmanTablesP12SBR_ENV_DATAP17SBR_CODE_ENVELOPES2_7AMP_RES"].apply(null, arguments) };
var __Z30FDKsbrEnc_InitTonCorrParamExtriP16SBR_TON_CORR_ESTP15SBR_CONFIG_DATAiiiiij = Module["__Z30FDKsbrEnc_InitTonCorrParamExtriP16SBR_TON_CORR_ESTP15SBR_CONFIG_DATAiiiiij"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z30FDKsbrEnc_InitTonCorrParamExtriP16SBR_TON_CORR_ESTP15SBR_CONFIG_DATAiiiiij"].apply(null, arguments) };
var __Z30FDKsbrEnc_resetInvFiltDetectorP16SBR_INV_FILT_ESTPii = Module["__Z30FDKsbrEnc_resetInvFiltDetectorP16SBR_INV_FILT_ESTPii"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z30FDKsbrEnc_resetInvFiltDetectorP16SBR_INV_FILT_ESTPii"].apply(null, arguments) };
var __Z30FreeRam_aacEnc_AdjustThresholdPP13ADJ_THR_STATE = Module["__Z30FreeRam_aacEnc_AdjustThresholdPP13ADJ_THR_STATE"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z30FreeRam_aacEnc_AdjustThresholdPP13ADJ_THR_STATE"].apply(null, arguments) };
var __Z30GetRam_Sbr_guideVectorDetectedi = Module["__Z30GetRam_Sbr_guideVectorDetectedi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z30GetRam_Sbr_guideVectorDetectedi"].apply(null, arguments) };
var __Z30fdk_sacenc_delay_SetTimeDomDmxP5DELAYi = Module["__Z30fdk_sacenc_delay_SetTimeDomDmxP5DELAYi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z30fdk_sacenc_delay_SetTimeDomDmxP5DELAYi"].apply(null, arguments) };
var __Z30fdk_sacenc_frameWindow_DestroyPP13T_FRAMEWINDOW = Module["__Z30fdk_sacenc_frameWindow_DestroyPP13T_FRAMEWINDOW"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z30fdk_sacenc_frameWindow_DestroyPP13T_FRAMEWINDOW"].apply(null, arguments) };
var __Z31FDK_DRC_Generator_getDrcProfileP8DRC_COMP = Module["__Z31FDK_DRC_Generator_getDrcProfileP8DRC_COMP"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z31FDK_DRC_Generator_getDrcProfileP8DRC_COMP"].apply(null, arguments) };
var __Z31FDK_DRC_Generator_setDrcProfileP8DRC_COMP11DRC_PROFILES1_ = Module["__Z31FDK_DRC_Generator_setDrcProfileP8DRC_COMP11DRC_PROFILES1_"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z31FDK_DRC_Generator_setDrcProfileP8DRC_COMP11DRC_PROFILES1_"].apply(null, arguments) };
var __Z31FDKaacEnc_CalculateChaosMeasurePliS_ = Module["__Z31FDKaacEnc_CalculateChaosMeasurePliS_"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z31FDKaacEnc_CalculateChaosMeasurePliS_"].apply(null, arguments) };
var __Z31FDKaacEnc_CalculateFullTonalityPlPiS_PsiPKii = Module["__Z31FDKaacEnc_CalculateFullTonalityPlPiS_PsiPKii"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z31FDKaacEnc_CalculateFullTonalityPlPiS_PsiPKii"].apply(null, arguments) };
var __Z31FDKsbrEnc_ResetTonCorrParamExtrP16SBR_TON_CORR_ESTiiPhiiPS1_Pii = Module["__Z31FDKsbrEnc_ResetTonCorrParamExtrP16SBR_TON_CORR_ESTiiPhiiPS1_Pii"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z31FDKsbrEnc_ResetTonCorrParamExtrP16SBR_TON_CORR_ESTiiPhiiPS1_Pii"].apply(null, arguments) };
var __Z31FreeRam_Sbr_guideVectorDetectedPPh = Module["__Z31FreeRam_Sbr_guideVectorDetectedPPh"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z31FreeRam_Sbr_guideVectorDetectedPPh"].apply(null, arguments) };
var __Z32FDK_DRC_Generator_getCompProfileP8DRC_COMP = Module["__Z32FDK_DRC_Generator_getCompProfileP8DRC_COMP"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z32FDK_DRC_Generator_getCompProfileP8DRC_COMP"].apply(null, arguments) };
var __Z32FDKaacEnc_FinalizeBitConsumptionP15CHANNEL_MAPPINGP8QC_STATEP6QC_OUTPP14QC_OUT_ELEMENTP12TRANSPORTENC17AUDIO_OBJECT_TYPEja = Module["__Z32FDKaacEnc_FinalizeBitConsumptionP15CHANNEL_MAPPINGP8QC_STATEP6QC_OUTPP14QC_OUT_ELEMENTP12TRANSPORTENC17AUDIO_OBJECT_TYPEja"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z32FDKaacEnc_FinalizeBitConsumptionP15CHANNEL_MAPPINGP8QC_STATEP6QC_OUTPP14QC_OUT_ELEMENTP12TRANSPORTENC17AUDIO_OBJECT_TYPEja"].apply(null, arguments) };
var __Z32FDKsbrEnc_CreateTonCorrParamExtrP16SBR_TON_CORR_ESTi = Module["__Z32FDKsbrEnc_CreateTonCorrParamExtrP16SBR_TON_CORR_ESTi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z32FDKsbrEnc_CreateTonCorrParamExtrP16SBR_TON_CORR_ESTi"].apply(null, arguments) };
var __Z32FDKsbrEnc_DeleteTonCorrParamExtrP16SBR_TON_CORR_EST = Module["__Z32FDKsbrEnc_DeleteTonCorrParamExtrP16SBR_TON_CORR_EST"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z32FDKsbrEnc_DeleteTonCorrParamExtrP16SBR_TON_CORR_EST"].apply(null, arguments) };
var __Z32FDKsbrEnc_InitExtractSbrEnvelopeP20SBR_EXTRACT_ENVELOPEiiiiiimiPhj = Module["__Z32FDKsbrEnc_InitExtractSbrEnvelopeP20SBR_EXTRACT_ENVELOPEiiiiiimiPhj"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z32FDKsbrEnc_InitExtractSbrEnvelopeP20SBR_EXTRACT_ENVELOPEiiiiiimiPhj"].apply(null, arguments) };
var __Z32FDKsbrEnc_LSI_divide_scale_fractlll = Module["__Z32FDKsbrEnc_LSI_divide_scale_fractlll"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z32FDKsbrEnc_LSI_divide_scale_fractlll"].apply(null, arguments) };
var __Z32FDKsbrEnc_initFrameInfoGeneratorP18SBR_ENVELOPE_FRAMEiiiiPK8FREQ_REShi = Module["__Z32FDKsbrEnc_initFrameInfoGeneratorP18SBR_ENVELOPE_FRAMEiiiiPK8FREQ_REShi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z32FDKsbrEnc_initFrameInfoGeneratorP18SBR_ENVELOPE_FRAMEiiiiPK8FREQ_REShi"].apply(null, arguments) };
var __Z32GetRam_aacEnc_AdjThrStateElementi = Module["__Z32GetRam_aacEnc_AdjThrStateElementi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z32GetRam_aacEnc_AdjThrStateElementi"].apply(null, arguments) };
var __Z32fdk_sacenc_delay_GetInfoDmxDelayP5DELAY = Module["__Z32fdk_sacenc_delay_GetInfoDmxDelayP5DELAY"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z32fdk_sacenc_delay_GetInfoDmxDelayP5DELAY"].apply(null, arguments) };
var __Z32fdk_sacenc_duplicateParameterSetPK12SPATIALFRAMEiPS_i = Module["__Z32fdk_sacenc_duplicateParameterSetPK12SPATIALFRAMEiPS_i"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z32fdk_sacenc_duplicateParameterSetPK12SPATIALFRAMEiPS_i"].apply(null, arguments) };
var __Z32fdk_sacenc_frameWindow_GetWindowP13T_FRAMEWINDOWPiiP11FRAMINGINFOPPlP13FRAMEWIN_LISTi = Module["__Z32fdk_sacenc_frameWindow_GetWindowP13T_FRAMEWINDOWPiiP11FRAMINGINFOPPlP13FRAMEWIN_LISTi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z32fdk_sacenc_frameWindow_GetWindowP13T_FRAMEWINDOWPiiP11FRAMINGINFOPPlP13FRAMEWIN_LISTi"].apply(null, arguments) };
var __Z32fdk_sacenc_staticGain_GetDmxGainP11STATIC_GAIN = Module["__Z32fdk_sacenc_staticGain_GetDmxGainP11STATIC_GAIN"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z32fdk_sacenc_staticGain_GetDmxGainP11STATIC_GAIN"].apply(null, arguments) };
var __Z32fdk_sacenc_staticGain_OpenConfigPP18STATIC_GAIN_CONFIG = Module["__Z32fdk_sacenc_staticGain_OpenConfigPP18STATIC_GAIN_CONFIG"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z32fdk_sacenc_staticGain_OpenConfigPP18STATIC_GAIN_CONFIG"].apply(null, arguments) };
var __Z32fdk_sacenc_staticGain_SetDmxGainP18STATIC_GAIN_CONFIG20MP4SPACEENC_DMX_GAIN = Module["__Z32fdk_sacenc_staticGain_SetDmxGainP18STATIC_GAIN_CONFIG20MP4SPACEENC_DMX_GAIN"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z32fdk_sacenc_staticGain_SetDmxGainP18STATIC_GAIN_CONFIG20MP4SPACEENC_DMX_GAIN"].apply(null, arguments) };
var __Z32fdk_sacenc_staticGain_SetEncModeP18STATIC_GAIN_CONFIG16MP4SPACEENC_MODE = Module["__Z32fdk_sacenc_staticGain_SetEncModeP18STATIC_GAIN_CONFIG16MP4SPACEENC_MODE"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z32fdk_sacenc_staticGain_SetEncModeP18STATIC_GAIN_CONFIG16MP4SPACEENC_MODE"].apply(null, arguments) };
var __Z32transportEnc_RegisterSbrCallbackP12TRANSPORTENCPFiPvP13FDK_BITSTREAMiii17AUDIO_OBJECT_TYPE14MP4_ELEMENT_IDihhhPhiES1_ = Module["__Z32transportEnc_RegisterSbrCallbackP12TRANSPORTENCPFiPvP13FDK_BITSTREAMiii17AUDIO_OBJECT_TYPE14MP4_ELEMENT_IDihhhPhiES1_"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z32transportEnc_RegisterSbrCallbackP12TRANSPORTENCPFiPvP13FDK_BITSTREAMiii17AUDIO_OBJECT_TYPE14MP4_ELEMENT_IDihhhPhiES1_"].apply(null, arguments) };
var __Z32transportEnc_RegisterSscCallbackP12TRANSPORTENCPFiPvP13FDK_BITSTREAM17AUDIO_OBJECT_TYPEiiiiihPhES1_ = Module["__Z32transportEnc_RegisterSscCallbackP12TRANSPORTENCPFiPvP13FDK_BITSTREAM17AUDIO_OBJECT_TYPEiiiiihPhES1_"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z32transportEnc_RegisterSscCallbackP12TRANSPORTENCPFiPvP13FDK_BITSTREAM17AUDIO_OBJECT_TYPEiiiiihPhES1_"].apply(null, arguments) };
var __Z33FDKaacEnc_CalcBandEnergyOptimLongPKlPiPKiiPlS4_ = Module["__Z33FDKaacEnc_CalcBandEnergyOptimLongPKlPiPKiiPlS4_"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z33FDKaacEnc_CalcBandEnergyOptimLongPKlPiPKiiPlS4_"].apply(null, arguments) };
var __Z33FDKaacEnc_FreqToBandWidthRoundingiiiPKi = Module["__Z33FDKaacEnc_FreqToBandWidthRoundingiiiPKi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z33FDKaacEnc_FreqToBandWidthRoundingiiiPKi"].apply(null, arguments) };
var __Z33FDKsbrEnc_CalculateTonalityQuotasP16SBR_TON_CORR_ESTPPlS2_ii = Module["__Z33FDKsbrEnc_CalculateTonalityQuotasP16SBR_TON_CORR_ESTPPlS2_ii"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z33FDKsbrEnc_CalculateTonalityQuotasP16SBR_TON_CORR_ESTPPlS2_ii"].apply(null, arguments) };
var __Z33FreeRam_aacEnc_AdjThrStateElementPP11ATS_ELEMENT = Module["__Z33FreeRam_aacEnc_AdjThrStateElementPP11ATS_ELEMENT"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z33FreeRam_aacEnc_AdjThrStateElementPP11ATS_ELEMENT"].apply(null, arguments) };
var __Z33fdk_sacenc_delay_SetMinimizeDelayP5DELAYi = Module["__Z33fdk_sacenc_delay_SetMinimizeDelayP5DELAYi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z33fdk_sacenc_delay_SetMinimizeDelayP5DELAYi"].apply(null, arguments) };
var __Z33fdk_sacenc_staticGain_CloseConfigPP18STATIC_GAIN_CONFIG = Module["__Z33fdk_sacenc_staticGain_CloseConfigPP18STATIC_GAIN_CONFIG"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z33fdk_sacenc_staticGain_CloseConfigPP18STATIC_GAIN_CONFIG"].apply(null, arguments) };
var __Z34FDKaacEnc_CalcBandEnergyOptimShortPKlPiPKiiPl = Module["__Z34FDKaacEnc_CalcBandEnergyOptimShortPKlPiPKiiPl"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z34FDKaacEnc_CalcBandEnergyOptimShortPKlPiPKiiPl"].apply(null, arguments) };
var __Z34FDKaacEnc_PreProcessPnsChannelPairiPlS_S_S_S_P10PNS_CONFIGP8PNS_DATAS3_ = Module["__Z34FDKaacEnc_PreProcessPnsChannelPairiPlS_S_S_S_P10PNS_CONFIGP8PNS_DATAS3_"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z34FDKaacEnc_PreProcessPnsChannelPairiPlS_S_S_S_P10PNS_CONFIGP8PNS_DATAS3_"].apply(null, arguments) };
var __Z34FDKsbrEnc_CreateExtractSbrEnvelopeP20SBR_EXTRACT_ENVELOPEiiPh = Module["__Z34FDKsbrEnc_CreateExtractSbrEnvelopeP20SBR_EXTRACT_ENVELOPEiiPh"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z34FDKsbrEnc_CreateExtractSbrEnvelopeP20SBR_EXTRACT_ENVELOPEiiPh"].apply(null, arguments) };
var __Z34FDKsbrEnc_InitSbrTransientDetectorP22SBR_TRANSIENT_DETECTORjiiP16sbrConfigurationiiiiiii = Module["__Z34FDKsbrEnc_InitSbrTransientDetectorP22SBR_TRANSIENT_DETECTORjiiP16sbrConfigurationiiiiiii"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z34FDKsbrEnc_InitSbrTransientDetectorP22SBR_TRANSIENT_DETECTORjiiP16sbrConfigurationiiiiiii"].apply(null, arguments) };
var __Z34FDKsbrEnc_deleteExtractSbrEnvelopeP20SBR_EXTRACT_ENVELOPE = Module["__Z34FDKsbrEnc_deleteExtractSbrEnvelopeP20SBR_EXTRACT_ENVELOPE"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z34FDKsbrEnc_deleteExtractSbrEnvelopeP20SBR_EXTRACT_ENVELOPE"].apply(null, arguments) };
var __Z34FDKsbrEnc_sbrNoiseFloorEstimateQmfP24SBR_NOISE_FLOOR_ESTIMATEPK14SBR_FRAME_INFOPlPS4_PaiijiP9INVF_MODEj = Module["__Z34FDKsbrEnc_sbrNoiseFloorEstimateQmfP24SBR_NOISE_FLOOR_ESTIMATEPK14SBR_FRAME_INFOPlPS4_PaiijiP9INVF_MODEj"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z34FDKsbrEnc_sbrNoiseFloorEstimateQmfP24SBR_NOISE_FLOOR_ESTIMATEPK14SBR_FRAME_INFOPlPS4_PaiijiP9INVF_MODEj"].apply(null, arguments) };
var __Z34fdk_sacenc_delay_GetInfoCodecDelayP5DELAY = Module["__Z34fdk_sacenc_delay_GetInfoCodecDelayP5DELAY"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z34fdk_sacenc_delay_GetInfoCodecDelayP5DELAY"].apply(null, arguments) };
var __Z34fdk_sacenc_staticPostGain_ApplyFDKP11STATIC_GAINPsii = Module["__Z34fdk_sacenc_staticPostGain_ApplyFDKP11STATIC_GAINPsii"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z34fdk_sacenc_staticPostGain_ApplyFDKP11STATIC_GAINPsii"].apply(null, arguments) };
var __Z35FDKaacEnc_IntensityStereoProcessingPlS_S_S_S_S_S_S_S_S_S_PiS0_iiiPKiiS0_S0_PP8PNS_DATA = Module["__Z35FDKaacEnc_IntensityStereoProcessingPlS_S_S_S_S_S_S_S_S_S_PiS0_iiiPKiiS0_S0_PP8PNS_DATA"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z35FDKaacEnc_IntensityStereoProcessingPlS_S_S_S_S_S_S_S_S_S_PiS0_iiiPKiiS0_S0_PP8PNS_DATA"].apply(null, arguments) };
var __Z35FDKaacEnc_PostProcessPnsChannelPairiP10PNS_CONFIGP8PNS_DATAS2_PiS3_ = Module["__Z35FDKaacEnc_PostProcessPnsChannelPairiP10PNS_CONFIGP8PNS_DATAS2_PiS3_"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z35FDKaacEnc_PostProcessPnsChannelPairiP10PNS_CONFIGP8PNS_DATAS2_PiS3_"].apply(null, arguments) };
var __Z35FDKaacEnc_calcSfbQuantEnergyAndDistPlPsiiS_S_ = Module["__Z35FDKaacEnc_calcSfbQuantEnergyAndDistPlPsiiS_S_"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z35FDKaacEnc_calcSfbQuantEnergyAndDistPlPsiiS_S_"].apply(null, arguments) };
var __Z35FDKsbrEnc_InitSbrNoiseFloorEstimateP24SBR_NOISE_FLOOR_ESTIMATEiPKhiiiij = Module["__Z35FDKsbrEnc_InitSbrNoiseFloorEstimateP24SBR_NOISE_FLOOR_ESTIMATEiPKhiiiij"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z35FDKsbrEnc_InitSbrNoiseFloorEstimateP24SBR_NOISE_FLOOR_ESTIMATEiPKhiiiij"].apply(null, arguments) };
var __Z35GetRam_Sbr_prevEnvelopeCompensationi = Module["__Z35GetRam_Sbr_prevEnvelopeCompensationi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z35GetRam_Sbr_prevEnvelopeCompensationi"].apply(null, arguments) };
var __Z35fdk_sacenc_getSpatialSpecificConfigP12BSF_INSTANCE = Module["__Z35fdk_sacenc_getSpatialSpecificConfigP12BSF_INSTANCE"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z35fdk_sacenc_getSpatialSpecificConfigP12BSF_INSTANCE"].apply(null, arguments) };
var __Z35fdk_sacenc_spaceTree_GetDescriptionP10SPACE_TREEP22SPACE_TREE_DESCRIPTION = Module["__Z35fdk_sacenc_spaceTree_GetDescriptionP10SPACE_TREEP22SPACE_TREE_DESCRIPTION"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z35fdk_sacenc_spaceTree_GetDescriptionP10SPACE_TREEP22SPACE_TREE_DESCRIPTION"].apply(null, arguments) };
var __Z35transportEnc_LatmAdjustSubframeBitsP11LATM_STREAMPi = Module["__Z35transportEnc_LatmAdjustSubframeBitsP11LATM_STREAMPi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z35transportEnc_LatmAdjustSubframeBitsP11LATM_STREAMPi"].apply(null, arguments) };
var __Z36FDKsbrEnc_CountSbrChannelPairElementP15SBR_HEADER_DATAP19T_PARAMETRIC_STEREOP18SBR_BITSTREAM_DATAP12SBR_ENV_DATAS6_P11COMMON_DATAj = Module["__Z36FDKsbrEnc_CountSbrChannelPairElementP15SBR_HEADER_DATAP19T_PARAMETRIC_STEREOP18SBR_BITSTREAM_DATAP12SBR_ENV_DATAS6_P11COMMON_DATAj"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z36FDKsbrEnc_CountSbrChannelPairElementP15SBR_HEADER_DATAP19T_PARAMETRIC_STEREOP18SBR_BITSTREAM_DATAP12SBR_ENV_DATAS6_P11COMMON_DATAj"].apply(null, arguments) };
var __Z36FDKsbrEnc_WriteEnvChannelPairElementP15SBR_HEADER_DATAP19T_PARAMETRIC_STEREOP18SBR_BITSTREAM_DATAP12SBR_ENV_DATAS6_P11COMMON_DATAj = Module["__Z36FDKsbrEnc_WriteEnvChannelPairElementP15SBR_HEADER_DATAP19T_PARAMETRIC_STEREOP18SBR_BITSTREAM_DATAP12SBR_ENV_DATAS6_P11COMMON_DATAj"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z36FDKsbrEnc_WriteEnvChannelPairElementP15SBR_HEADER_DATAP19T_PARAMETRIC_STEREOP18SBR_BITSTREAM_DATAP12SBR_ENV_DATAS6_P11COMMON_DATAj"].apply(null, arguments) };
var __Z36FDKsbrEnc_resetSbrNoiseFloorEstimateP24SBR_NOISE_FLOOR_ESTIMATEPKhi = Module["__Z36FDKsbrEnc_resetSbrNoiseFloorEstimateP24SBR_NOISE_FLOOR_ESTIMATEPKhi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z36FDKsbrEnc_resetSbrNoiseFloorEstimateP24SBR_NOISE_FLOOR_ESTIMATEPKhi"].apply(null, arguments) };
var __Z36FreeRam_Sbr_prevEnvelopeCompensationPPh = Module["__Z36FreeRam_Sbr_prevEnvelopeCompensationPPh"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z36FreeRam_Sbr_prevEnvelopeCompensationPPh"].apply(null, arguments) };
var __Z36fdk_sacenc_delay_GetDiscardOutFramesP5DELAY = Module["__Z36fdk_sacenc_delay_GetDiscardOutFramesP5DELAY"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z36fdk_sacenc_delay_GetDiscardOutFramesP5DELAY"].apply(null, arguments) };
var __Z36fdk_sacenc_delay_GetInfoDecoderDelayP5DELAY = Module["__Z36fdk_sacenc_delay_GetInfoDecoderDelayP5DELAY"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z36fdk_sacenc_delay_GetInfoDecoderDelayP5DELAY"].apply(null, arguments) };
var __Z37FDKaacEnc_GetChannelModeConfiguration12CHANNEL_MODE = Module["__Z37FDKaacEnc_GetChannelModeConfiguration12CHANNEL_MODE"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z37FDKaacEnc_GetChannelModeConfiguration12CHANNEL_MODE"].apply(null, arguments) };
var __Z37FDKsbrEnc_qmfInverseFilteringDetectorP16SBR_INV_FILT_ESTPPlS1_PaiiiP9INVF_MODE = Module["__Z37FDKsbrEnc_qmfInverseFilteringDetectorP16SBR_INV_FILT_ESTPPlS1_PaiiiP9INVF_MODE"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z37FDKsbrEnc_qmfInverseFilteringDetectorP16SBR_INV_FILT_ESTPPlS1_PaiiiP9INVF_MODE"].apply(null, arguments) };
var __Z37fdk_sacenc_init_enhancedTimeDomainDmxP26T_ENHANCED_TIME_DOMAIN_DMXPKlilii = Module["__Z37fdk_sacenc_init_enhancedTimeDomainDmxP26T_ENHANCED_TIME_DOMAIN_DMXPKlilii"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z37fdk_sacenc_init_enhancedTimeDomainDmxP26T_ENHANCED_TIME_DOMAIN_DMXPKlilii"].apply(null, arguments) };
var __Z37fdk_sacenc_open_enhancedTimeDomainDmxPP26T_ENHANCED_TIME_DOMAIN_DMXi = Module["__Z37fdk_sacenc_open_enhancedTimeDomainDmxPP26T_ENHANCED_TIME_DOMAIN_DMXi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z37fdk_sacenc_open_enhancedTimeDomainDmxPP26T_ENHANCED_TIME_DOMAIN_DMXi"].apply(null, arguments) };
var __Z37fdk_sacenc_writeSpatialSpecificConfigP21SPATIALSPECIFICCONFIGPhiPi = Module["__Z37fdk_sacenc_writeSpatialSpecificConfigP21SPATIALSPECIFICCONFIGPhiPi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z37fdk_sacenc_writeSpatialSpecificConfigP21SPATIALSPECIFICCONFIGPhiPi"].apply(null, arguments) };
var __Z38FDKsbrEnc_InitSbrFastTransientDetectorP18FAST_TRAN_DETECTORiiii = Module["__Z38FDKsbrEnc_InitSbrFastTransientDetectorP18FAST_TRAN_DETECTORiiii"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z38FDKsbrEnc_InitSbrFastTransientDetectorP18FAST_TRAN_DETECTORiiii"].apply(null, arguments) };
var __Z38FDKsbrEnc_WriteEnvSingleChannelElementP15SBR_HEADER_DATAP19T_PARAMETRIC_STEREOP18SBR_BITSTREAM_DATAP12SBR_ENV_DATAP11COMMON_DATAj = Module["__Z38FDKsbrEnc_WriteEnvSingleChannelElementP15SBR_HEADER_DATAP19T_PARAMETRIC_STEREOP18SBR_BITSTREAM_DATAP12SBR_ENV_DATAP11COMMON_DATAj"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z38FDKsbrEnc_WriteEnvSingleChannelElementP15SBR_HEADER_DATAP19T_PARAMETRIC_STEREOP18SBR_BITSTREAM_DATAP12SBR_ENV_DATAP11COMMON_DATAj"].apply(null, arguments) };
var __Z38fdk_sacenc_apply_enhancedTimeDomainDmxP26T_ENHANCED_TIME_DOMAIN_DMXPKPKsPsi = Module["__Z38fdk_sacenc_apply_enhancedTimeDomainDmxP26T_ENHANCED_TIME_DOMAIN_DMXPKPKsPsi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z38fdk_sacenc_apply_enhancedTimeDomainDmxP26T_ENHANCED_TIME_DOMAIN_DMXPKPKsPsi"].apply(null, arguments) };
var __Z38fdk_sacenc_close_enhancedTimeDomainDmxPP26T_ENHANCED_TIME_DOMAIN_DMX = Module["__Z38fdk_sacenc_close_enhancedTimeDomainDmxPP26T_ENHANCED_TIME_DOMAIN_DMX"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z38fdk_sacenc_close_enhancedTimeDomainDmxPP26T_ENHANCED_TIME_DOMAIN_DMX"].apply(null, arguments) };
var __Z38fdk_sacenc_initSpatialBitstreamEncoderP12BSF_INSTANCE = Module["__Z38fdk_sacenc_initSpatialBitstreamEncoderP12BSF_INSTANCE"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z38fdk_sacenc_initSpatialBitstreamEncoderP12BSF_INSTANCE"].apply(null, arguments) };
var __Z39FDK_MpegsEnc_WriteSpatialSpecificConfigP11MPS_ENCODERP13FDK_BITSTREAM = Module["__Z39FDK_MpegsEnc_WriteSpatialSpecificConfigP11MPS_ENCODERP13FDK_BITSTREAM"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z39FDK_MpegsEnc_WriteSpatialSpecificConfigP11MPS_ENCODERP13FDK_BITSTREAM"].apply(null, arguments) };
var __Z39fdk_sacenc_delay_GetDmxAlignBufferDelayP5DELAY = Module["__Z39fdk_sacenc_delay_GetDmxAlignBufferDelayP5DELAY"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z39fdk_sacenc_delay_GetDmxAlignBufferDelayP5DELAY"].apply(null, arguments) };
var __Z39fdk_sacenc_staticGain_InitDefaultConfigP18STATIC_GAIN_CONFIG = Module["__Z39fdk_sacenc_staticGain_InitDefaultConfigP18STATIC_GAIN_CONFIG"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z39fdk_sacenc_staticGain_InitDefaultConfigP18STATIC_GAIN_CONFIG"].apply(null, arguments) };
var __Z3fftiPlPi = Module["__Z3fftiPlPi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z3fftiPlPi"].apply(null, arguments) };
var __Z40FDKsbrEnc_SbrMissingHarmonicsDetectorQmfP30SBR_MISSING_HARMONICS_DETECTORPPlPPiPaPK14SBR_FRAME_INFOPKhS3_PhSA_iSB_S1_ = Module["__Z40FDKsbrEnc_SbrMissingHarmonicsDetectorQmfP30SBR_MISSING_HARMONICS_DETECTORPPlPPiPaPK14SBR_FRAME_INFOPKhS3_PhSA_iSB_S1_"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z40FDKsbrEnc_SbrMissingHarmonicsDetectorQmfP30SBR_MISSING_HARMONICS_DETECTORPPlPPiPaPK14SBR_FRAME_INFOPKhS3_PhSA_iSB_S1_"].apply(null, arguments) };
var __Z40fdk_sacenc_createSpatialBitstreamEncoderPP12BSF_INSTANCE = Module["__Z40fdk_sacenc_createSpatialBitstreamEncoderPP12BSF_INSTANCE"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z40fdk_sacenc_createSpatialBitstreamEncoderPP12BSF_INSTANCE"].apply(null, arguments) };
var __Z40fdk_sacenc_delay_SubCalulateBufferDelaysP5DELAY = Module["__Z40fdk_sacenc_delay_SubCalulateBufferDelaysP5DELAY"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z40fdk_sacenc_delay_SubCalulateBufferDelaysP5DELAY"].apply(null, arguments) };
var __Z41FDKsbrEnc_InitSbrMissingHarmonicsDetectorP30SBR_MISSING_HARMONICS_DETECTORiiiiiiij = Module["__Z41FDKsbrEnc_InitSbrMissingHarmonicsDetectorP30SBR_MISSING_HARMONICS_DETECTORiiiiiiij"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z41FDKsbrEnc_InitSbrMissingHarmonicsDetectorP30SBR_MISSING_HARMONICS_DETECTORiiiiiiij"].apply(null, arguments) };
var __Z41fdk_sacenc_destroySpatialBitstreamEncoderPP12BSF_INSTANCE = Module["__Z41fdk_sacenc_destroySpatialBitstreamEncoderPP12BSF_INSTANCE"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z41fdk_sacenc_destroySpatialBitstreamEncoderPP12BSF_INSTANCE"].apply(null, arguments) };
var __Z42FDKsbrEnc_PSEnc_ParametricStereoProcessingP19T_PARAMETRIC_STEREOPPsjPP15QMF_FILTER_BANKPPlS7_S1_S4_Pai = Module["__Z42FDKsbrEnc_PSEnc_ParametricStereoProcessingP19T_PARAMETRIC_STEREOPPsjPP15QMF_FILTER_BANKPPlS7_S1_S4_Pai"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z42FDKsbrEnc_PSEnc_ParametricStereoProcessingP19T_PARAMETRIC_STEREOPPsjPP15QMF_FILTER_BANKPPlS7_S1_S4_Pai"].apply(null, arguments) };
var __Z42FDKsbrEnc_ResetSbrMissingHarmonicsDetectorP30SBR_MISSING_HARMONICS_DETECTORi = Module["__Z42FDKsbrEnc_ResetSbrMissingHarmonicsDetectorP30SBR_MISSING_HARMONICS_DETECTORi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z42FDKsbrEnc_ResetSbrMissingHarmonicsDetectorP30SBR_MISSING_HARMONICS_DETECTORi"].apply(null, arguments) };
var __Z42fdk_sacenc_delay_GetOutputAudioBufferDelayP5DELAY = Module["__Z42fdk_sacenc_delay_GetOutputAudioBufferDelayP5DELAY"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z42fdk_sacenc_delay_GetOutputAudioBufferDelayP5DELAY"].apply(null, arguments) };
var __Z42transportEnc_LatmCountTotalBitDemandHeaderP11LATM_STREAMj = Module["__Z42transportEnc_LatmCountTotalBitDemandHeaderP11LATM_STREAMj"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z42transportEnc_LatmCountTotalBitDemandHeaderP11LATM_STREAMj"].apply(null, arguments) };
var __Z43FDKsbrEnc_CreateSbrMissingHarmonicsDetectorP30SBR_MISSING_HARMONICS_DETECTORi = Module["__Z43FDKsbrEnc_CreateSbrMissingHarmonicsDetectorP30SBR_MISSING_HARMONICS_DETECTORi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z43FDKsbrEnc_CreateSbrMissingHarmonicsDetectorP30SBR_MISSING_HARMONICS_DETECTORi"].apply(null, arguments) };
var __Z43FDKsbrEnc_DeleteSbrMissingHarmonicsDetectorP30SBR_MISSING_HARMONICS_DETECTOR = Module["__Z43FDKsbrEnc_DeleteSbrMissingHarmonicsDetectorP30SBR_MISSING_HARMONICS_DETECTOR"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z43FDKsbrEnc_DeleteSbrMissingHarmonicsDetectorP30SBR_MISSING_HARMONICS_DETECTOR"].apply(null, arguments) };
var __Z44fdk_sacenc_delay_GetBitstreamFrameBufferSizeP5DELAY = Module["__Z44fdk_sacenc_delay_GetBitstreamFrameBufferSizeP5DELAY"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z44fdk_sacenc_delay_GetBitstreamFrameBufferSizeP5DELAY"].apply(null, arguments) };
var __Z45fdk_sacenc_calcParameterBand2HybridBandOffset18BOX_SUBBAND_CONFIGiPh = Module["__Z45fdk_sacenc_calcParameterBand2HybridBandOffset18BOX_SUBBAND_CONFIGiPh"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z45fdk_sacenc_calcParameterBand2HybridBandOffset18BOX_SUBBAND_CONFIGiPh"].apply(null, arguments) };
var __Z47fdk_sacenc_delay_GetSurroundAnalysisBufferDelayP5DELAY = Module["__Z47fdk_sacenc_delay_GetSurroundAnalysisBufferDelayP5DELAY"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z47fdk_sacenc_delay_GetSurroundAnalysisBufferDelayP5DELAY"].apply(null, arguments) };
var __Z4fPowliliPi = Module["__Z4fPowliliPi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z4fPowliliPi"].apply(null, arguments) };
var __Z5f2PowliPi = Module["__Z5f2PowliPi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z5f2PowliPi"].apply(null, arguments) };
var __Z6dct_IIPlS_iPi = Module["__Z6dct_IIPlS_iPi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z6dct_IIPlS_iPi"].apply(null, arguments) };
var __Z6dct_IVPliPi = Module["__Z6dct_IVPliPi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z6dct_IVPliPi"].apply(null, arguments) };
var __Z6dst_IVPliPi = Module["__Z6dst_IVPliPi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z6dst_IVPliPi"].apply(null, arguments) };
var __Z6fft_16Pl = Module["__Z6fft_16Pl"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z6fft_16Pl"].apply(null, arguments) };
var __Z6fft_32Pl = Module["__Z6fft_32Pl"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z6fft_32Pl"].apply(null, arguments) };
var __Z7dct_IIIPlS_iPi = Module["__Z7dct_IIIPlS_iPi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z7dct_IIIPlS_iPi"].apply(null, arguments) };
var __Z7dit_fftPliPK8FIXP_DPKi = Module["__Z7dit_fftPliPK8FIXP_DPKi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z7dit_fftPliPK8FIXP_DPKi"].apply(null, arguments) };
var __Z8fDivNormll = Module["__Z8fDivNormll"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z8fDivNormll"].apply(null, arguments) };
var __Z8fDivNormllPi = Module["__Z8fDivNormllPi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z8fDivNormllPi"].apply(null, arguments) };
var __Z8fixp_sinli = Module["__Z8fixp_sinli"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z8fixp_sinli"].apply(null, arguments) };
var __Z9CalcLdInti = Module["__Z9CalcLdInti"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z9CalcLdInti"].apply(null, arguments) };
var __Z9fMultNormllPi = Module["__Z9fMultNormllPi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z9fMultNormllPi"].apply(null, arguments) };
var __Z9fixp_atanl = Module["__Z9fixp_atanl"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z9fixp_atanl"].apply(null, arguments) };
var __Z9mdct_initP6mdct_tPli = Module["__Z9mdct_initP6mdct_tPli"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z9mdct_initP6mdct_tPli"].apply(null, arguments) };
var __Z9schur_divlli = Module["__Z9schur_divlli"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__Z9schur_divlli"].apply(null, arguments) };
var __ZL10fftN2_funcPliiiPFvS_ES1_PKlS3_S_S_ = Module["__ZL10fftN2_funcPliiiPFvS_ES1_PKlS3_S_S_"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__ZL10fftN2_funcPliiiPFvS_ES1_PKlS3_S_S_"].apply(null, arguments) };
var __ZL10resetPatchP16SBR_TON_CORR_ESTiiPhiii = Module["__ZL10resetPatchP16SBR_TON_CORR_ESTiiPhiii"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__ZL10resetPatchP16SBR_TON_CORR_ESTiiPhiii"].apply(null, arguments) };
var __ZL11getStopFreqii = Module["__ZL11getStopFreqii"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__ZL11getStopFreqii"].apply(null, arguments) };
var __ZL11huff_enc_1DP13FDK_BITSTREAM9DATA_TYPEiPsss = Module["__ZL11huff_enc_1DP13FDK_BITSTREAM9DATA_TYPEiPsss"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__ZL11huff_enc_1DP13FDK_BITSTREAM9DATA_TYPEiPsss"].apply(null, arguments) };
var __ZL11huff_enc_2DP13FDK_BITSTREAM9DATA_TYPEPssPA2_sssPS2_ = Module["__ZL11huff_enc_2DP13FDK_BITSTREAM9DATA_TYPEPssPA2_sssPS2_"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__ZL11huff_enc_2DP13FDK_BITSTREAM9DATA_TYPEPssPA2_sssPS2_"].apply(null, arguments) };
var __ZL12FDKwriteBitsP13FDK_BITSTREAMjj = Module["__ZL12FDKwriteBitsP13FDK_BITSTREAMjj"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__ZL12FDKwriteBitsP13FDK_BITSTREAMjj"].apply(null, arguments) };
var __ZL12calculateICCPA20_lS0_S0_S0_S0_ii = Module["__ZL12calculateICCPA20_lS0_S0_S0_S0_ii"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__ZL12calculateICCPA20_lS0_S0_S0_S0_ii"].apply(null, arguments) };
var __ZL12encodeIpdOpdP8T_PS_OUTP13FDK_BITSTREAM = Module["__ZL12encodeIpdOpdP8T_PS_OUTP13FDK_BITSTREAM"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__ZL12encodeIpdOpdP8T_PS_OUTP13FDK_BITSTREAM"].apply(null, arguments) };
var __ZL12invSqrtNorm2liPi = Module["__ZL12invSqrtNorm2liPi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__ZL12invSqrtNorm2liPi"].apply(null, arguments) };
var __ZL13calc_pcm_bitsss = Module["__ZL13calc_pcm_bitsss"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__ZL13calc_pcm_bitsss"].apply(null, arguments) };
var __ZL13encodeSbrDataP12SBR_ENV_DATAS0_P19T_PARAMETRIC_STEREOP11COMMON_DATA16SBR_ELEMENT_TYPEij = Module["__ZL13encodeSbrDataP12SBR_ENV_DATAS0_P19T_PARAMETRIC_STEREOP11COMMON_DATA16SBR_ELEMENT_TYPEij"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__ZL13encodeSbrDataP12SBR_ENV_DATAS0_P19T_PARAMETRIC_STEREOP11COMMON_DATA16SBR_ELEMENT_TYPEij"].apply(null, arguments) };
var __ZL13encodeSbrGridP12SBR_ENV_DATAP13FDK_BITSTREAM = Module["__ZL13encodeSbrGridP12SBR_ENV_DATAP13FDK_BITSTREAM"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__ZL13encodeSbrGridP12SBR_ENV_DATAP13FDK_BITSTREAM"].apply(null, arguments) };
var __ZL14calcCtrlSignalP8SBR_GRID11FRAME_CLASSPiiS2_iiiii = Module["__ZL14calcCtrlSignalP8SBR_GRID11FRAME_CLASSPiiS2_iiiii"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__ZL14calcCtrlSignalP8SBR_GRID11FRAME_CLASSPiiS2_iiiii"].apply(null, arguments) };
var __ZL14calc_huff_bitsPsS_9DATA_TYPE9DIFF_TYPES1_sS_S_ = Module["__ZL14calc_huff_bitsPsS_9DATA_TYPE9DIFF_TYPES1_sS_S_"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__ZL14calc_huff_bitsPsS_9DATA_TYPE9DIFF_TYPES1_sS_S_"].apply(null, arguments) };
var __ZL15QuantizeCoefFDKPKliS0_iiPa = Module["__ZL15QuantizeCoefFDKPKliS0_iiPa"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__ZL15QuantizeCoefFDKPKliS0_iiPa"].apply(null, arguments) };
var __ZL15encodeDeltaFreqP13FDK_BITSTREAMPKiiPKjS4_iiPi = Module["__ZL15encodeDeltaFreqP13FDK_BITSTREAMPKiiPKjS4_iiPi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__ZL15encodeDeltaFreqP13FDK_BITSTREAMPKiiPKjS4_iiPi"].apply(null, arguments) };
var __ZL15encodeDeltaTimeP13FDK_BITSTREAMPKiS2_iPKjS4_iiPi = Module["__ZL15encodeDeltaTimeP13FDK_BITSTREAMPKiS2_iPKjS4_iiPi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__ZL15encodeDeltaTimeP13FDK_BITSTREAMPKiS2_iPKjS4_iiPi"].apply(null, arguments) };
var __ZL15getEnvSfbEnergyiiiiiPPliii = Module["__ZL15getEnvSfbEnergyiiiiiPPliii"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__ZL15getEnvSfbEnergyiiiiiPPliii"].apply(null, arguments) };
var __ZL15writeSampleRateP13FDK_BITSTREAMii = Module["__ZL15writeSampleRateP13FDK_BITSTREAMii"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__ZL15writeSampleRateP13FDK_BITSTREAMii"].apply(null, arguments) };
var __ZL16apply_pcm_codingP13FDK_BITSTREAMPKsS2_sss = Module["__ZL16apply_pcm_codingP13FDK_BITSTREAMPKsS2_sss"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__ZL16apply_pcm_codingP13FDK_BITSTREAMPKsS2_sss"].apply(null, arguments) };
var __ZL16coupleNoiseFloorPlS_ = Module["__ZL16coupleNoiseFloorPlS_"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__ZL16coupleNoiseFloorPlS_"].apply(null, arguments) };
var __ZL17FDKaacEnc_count11PKsiPi = Module["__ZL17FDKaacEnc_count11PKsiPi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__ZL17FDKaacEnc_count11PKsiPi"].apply(null, arguments) };
var __ZL17GetBandwidthEntryiiii = Module["__ZL17GetBandwidthEntryiiii"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__ZL17GetBandwidthEntryiiii"].apply(null, arguments) };
var __ZL17apply_huff_codingP13FDK_BITSTREAMPsS1_9DATA_TYPE9DIFF_TYPES3_sPKss = Module["__ZL17apply_huff_codingP13FDK_BITSTREAMPsS1_9DATA_TYPE9DIFF_TYPES3_sPKss"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__ZL17apply_huff_codingP13FDK_BITSTREAMPsS1_9DATA_TYPE9DIFF_TYPES3_sPKss"].apply(null, arguments) };
var __ZL17qmfInitFilterBankP15QMF_FILTER_BANKPviiiiji = Module["__ZL17qmfInitFilterBankP15QMF_FILTER_BANKPviiiiji"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__ZL17qmfInitFilterBankP15QMF_FILTER_BANKPviiiiji"].apply(null, arguments) };
var __ZL17writeEnvelopeDataP12SBR_ENV_DATAP13FDK_BITSTREAMi = Module["__ZL17writeEnvelopeDataP12SBR_ENV_DATAP13FDK_BITSTREAMi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__ZL17writeEnvelopeDataP12SBR_ENV_DATAP13FDK_BITSTREAMi"].apply(null, arguments) };
var __ZL18FDKaacEnc_countEscPKsiPi = Module["__ZL18FDKaacEnc_countEscPKsiPi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__ZL18FDKaacEnc_countEscPKsiPi"].apply(null, arguments) };
var __ZL18aacenc_SbrCallbackPvP13FDK_BITSTREAMiii17AUDIO_OBJECT_TYPE14MP4_ELEMENT_IDihhhPhi = Module["__ZL18aacenc_SbrCallbackPvP13FDK_BITSTREAMiii17AUDIO_OBJECT_TYPE14MP4_ELEMENT_IDihhhPhi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__ZL18aacenc_SbrCallbackPvP13FDK_BITSTREAMiii17AUDIO_OBJECT_TYPE14MP4_ELEMENT_IDihhhPhi"].apply(null, arguments) };
var __ZL18encodeExtendedDataP19T_PARAMETRIC_STEREOP13FDK_BITSTREAM = Module["__ZL18encodeExtendedDataP19T_PARAMETRIC_STEREOP13FDK_BITSTREAM"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__ZL18encodeExtendedDataP19T_PARAMETRIC_STEREOP13FDK_BITSTREAM"].apply(null, arguments) };
var __ZL19encodeSbrHeaderDataP15SBR_HEADER_DATAP13FDK_BITSTREAM = Module["__ZL19encodeSbrHeaderDataP15SBR_HEADER_DATAP13FDK_BITSTREAM"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__ZL19encodeSbrHeaderDataP15SBR_HEADER_DATAP13FDK_BITSTREAM"].apply(null, arguments) };
var __ZL19updateFreqBandTableP15SBR_CONFIG_DATAP15SBR_HEADER_DATAi = Module["__ZL19updateFreqBandTableP15SBR_CONFIG_DATAP15SBR_HEADER_DATAi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__ZL19updateFreqBandTableP15SBR_CONFIG_DATAP15SBR_HEADER_DATAi"].apply(null, arguments) };
var __ZL19writeNoiseLevelDataP12SBR_ENV_DATAP13FDK_BITSTREAMi = Module["__ZL19writeNoiseLevelDataP12SBR_ENV_DATAP13FDK_BITSTREAMi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__ZL19writeNoiseLevelDataP12SBR_ENV_DATAP13FDK_BITSTREAMi"].apply(null, arguments) };
var __ZL20FDKpushBiDirectionalP13FDK_BITSTREAMi = Module["__ZL20FDKpushBiDirectionalP13FDK_BITSTREAMi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__ZL20FDKpushBiDirectionalP13FDK_BITSTREAMi"].apply(null, arguments) };
var __ZL20calculateSbrEnvelopePPlS0_PiS1_PK14SBR_FRAME_INFOPaS5_P15SBR_CONFIG_DATAP11ENV_CHANNEL15SBR_STEREO_MODES1_i = Module["__ZL20calculateSbrEnvelopePPlS0_PiS1_PK14SBR_FRAME_INFOPaS5_P15SBR_CONFIG_DATAP11ENV_CHANNEL15SBR_STEREO_MODES1_i"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__ZL20calculateSbrEnvelopePPlS0_PiS1_PK14SBR_FRAME_INFOPaS5_P15SBR_CONFIG_DATAP11ENV_CHANNEL15SBR_STEREO_MODES1_i"].apply(null, arguments) };
var __ZL21FDKaacEnc_adaptMinSnrPKP14QC_OUT_CHANNELPKPK15PSY_OUT_CHANNELPK18MINSNR_ADAPT_PARAMi = Module["__ZL21FDKaacEnc_adaptMinSnrPKP14QC_OUT_CHANNELPKPK15PSY_OUT_CHANNELPK18MINSNR_ADAPT_PARAMi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__ZL21FDKaacEnc_adaptMinSnrPKP14QC_OUT_CHANNELPKPK15PSY_OUT_CHANNELPK18MINSNR_ADAPT_PARAMi"].apply(null, arguments) };
var __ZL21LoadSubmittedMetadataPK15AACENC_MetaDataiiP12AAC_METADATA = Module["__ZL21LoadSubmittedMetadataPK15AACENC_MetaDataiiP12AAC_METADATA"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__ZL21LoadSubmittedMetadataPK15AACENC_MetaDataiiP12AAC_METADATA"].apply(null, arguments) };
var __ZL21encodeLowDelaySbrGridP12SBR_ENV_DATAP13FDK_BITSTREAMij = Module["__ZL21encodeLowDelaySbrGridP12SBR_ENV_DATAP13FDK_BITSTREAMij"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__ZL21encodeLowDelaySbrGridP12SBR_ENV_DATAP13FDK_BITSTREAMij"].apply(null, arguments) };
var __ZL21getPsTuningTableIndexjPj = Module["__ZL21getPsTuningTableIndexjPj"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__ZL21getPsTuningTableIndexjPj"].apply(null, arguments) };
var __ZL22AdvanceAudioMuxElementP11LATM_STREAMP13FDK_BITSTREAMiiP13CSTpCallBacks = Module["__ZL22AdvanceAudioMuxElementP11LATM_STREAMP13FDK_BITSTREAMiiP13CSTpCallBacks"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__ZL22AdvanceAudioMuxElementP11LATM_STREAMP13FDK_BITSTREAMiiP13CSTpCallBacks"].apply(null, arguments) };
var __ZL22FDKaacEnc_Parcor2IndexPKsPiii = Module["__ZL22FDKaacEnc_Parcor2IndexPKsPiii"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__ZL22FDKaacEnc_Parcor2IndexPKsPiii"].apply(null, arguments) };
var __ZL22FDKaacEnc_count9_10_11PKsiPi = Module["__ZL22FDKaacEnc_count9_10_11PKsiPi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__ZL22FDKaacEnc_count9_10_11PKsiPi"].apply(null, arguments) };
var __ZL22getSbrTuningTableIndexjjj17AUDIO_OBJECT_TYPEPj = Module["__ZL22getSbrTuningTableIndexjjj17AUDIO_OBJECT_TYPEPj"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__ZL22getSbrTuningTableIndexjjj17AUDIO_OBJECT_TYPEPj"].apply(null, arguments) };
var __ZL23FDKaacEnc_BarcLineValueiil = Module["__ZL23FDKaacEnc_BarcLineValueiil"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__ZL23FDKaacEnc_BarcLineValueiil"].apply(null, arguments) };
var __ZL23FDKaacEnc_CalcMergeGainPK12SECTION_INFOPA12_KiPKsiii = Module["__ZL23FDKaacEnc_CalcMergeGainPK12SECTION_INFOPA12_KiPKsiii"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__ZL23FDKaacEnc_CalcMergeGainPK12SECTION_INFOPA12_KiPKsiii"].apply(null, arguments) };
var __ZL23FDKaacEnc_quantizeLinesiiPKlPsi = Module["__ZL23FDKaacEnc_quantizeLinesiiPKlPsi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__ZL23FDKaacEnc_quantizeLinesiiPKlPsi"].apply(null, arguments) };
var __ZL24FDKaacEnc_calcSpecPeDiffP15PSY_OUT_CHANNELP14QC_OUT_CHANNELPiS3_PlS4_S4_ii = Module["__ZL24FDKaacEnc_calcSpecPeDiffP15PSY_OUT_CHANNELP14QC_OUT_CHANNELPiS3_PlS4_S4_ii"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__ZL24FDKaacEnc_calcSpecPeDiffP15PSY_OUT_CHANNELP14QC_OUT_CHANNELPiS3_PlS4_S4_ii"].apply(null, arguments) };
var __ZL25FDKaacEnc_AutoCorrNormFacliPi = Module["__ZL25FDKaacEnc_AutoCorrNormFacliPi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__ZL25FDKaacEnc_AutoCorrNormFacliPi"].apply(null, arguments) };
var __ZL25FDKaacEnc_CalcGaussWindowPliiili = Module["__ZL25FDKaacEnc_CalcGaussWindowPliiili"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__ZL25FDKaacEnc_CalcGaussWindowPliiili"].apply(null, arguments) };
var __ZL26FDKaacEnc_count7_8_9_10_11PKsiPi = Module["__ZL26FDKaacEnc_count7_8_9_10_11PKsiPi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__ZL26FDKaacEnc_count7_8_9_10_11PKsiPi"].apply(null, arguments) };
var __ZL26FDKaacEnc_countScfBitsDiffPiS_iii = Module["__ZL26FDKaacEnc_countScfBitsDiffPiS_iii"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__ZL26FDKaacEnc_countScfBitsDiffPiS_iii"].apply(null, arguments) };
var __ZL26FDKaacEnc_invQuantizeLinesiiPsPl = Module["__ZL26FDKaacEnc_invQuantizeLinesiiPsPl"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__ZL26FDKaacEnc_invQuantizeLinesiiPsPl"].apply(null, arguments) };
var __ZL26FDKlibInfo_getCapabilitiesPK8LIB_INFO13FDK_MODULE_ID = Module["__ZL26FDKlibInfo_getCapabilitiesPK8LIB_INFO13FDK_MODULE_ID"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__ZL26FDKlibInfo_getCapabilitiesPK8LIB_INFO13FDK_MODULE_ID"].apply(null, arguments) };
var __ZL27FDKaacEnc_initAvoidHoleFlagPKP14QC_OUT_CHANNELPKPK15PSY_OUT_CHANNELPA60_hPK9TOOLSINFOiPK8AH_PARAM = Module["__ZL27FDKaacEnc_initAvoidHoleFlagPKP14QC_OUT_CHANNELPKPK15PSY_OUT_CHANNELPA60_hPK9TOOLSINFOiPK8AH_PARAM"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__ZL27FDKaacEnc_initAvoidHoleFlagPKP14QC_OUT_CHANNELPKPK15PSY_OUT_CHANNELPA60_hPK9TOOLSINFOiPK8AH_PARAM"].apply(null, arguments) };
var __ZL27transportEnc_LatmWriteValueP13FDK_BITSTREAMi = Module["__ZL27transportEnc_LatmWriteValueP13FDK_BITSTREAMi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__ZL27transportEnc_LatmWriteValueP13FDK_BITSTREAMi"].apply(null, arguments) };
var __ZL29FDKaacEnc_adaptThresholdsToPePK15CHANNEL_MAPPINGPKP11ATS_ELEMENTPKP14QC_OUT_ELEMENTPKPK15PSY_OUT_ELEMENTiiii = Module["__ZL29FDKaacEnc_adaptThresholdsToPePK15CHANNEL_MAPPINGPKP11ATS_ELEMENTPKP14QC_OUT_ELEMENTPKPK15PSY_OUT_ELEMENTiiii"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__ZL29FDKaacEnc_adaptThresholdsToPePK15CHANNEL_MAPPINGPKP11ATS_ELEMENTPKP14QC_OUT_ELEMENTPKPK15PSY_OUT_ELEMENTiiii"].apply(null, arguments) };
var __ZL29FDKaacEnc_reduceThresholdsCBRPKP14QC_OUT_CHANNELPKPK15PSY_OUT_CHANNELPA60_hPA60_Klila = Module["__ZL29FDKaacEnc_reduceThresholdsCBRPKP14QC_OUT_CHANNELPKPK15PSY_OUT_CHANNELPA60_hPA60_Klila"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__ZL29FDKaacEnc_reduceThresholdsCBRPKP14QC_OUT_CHANNELPKPK15PSY_OUT_CHANNELPA60_hPA60_Klila"].apply(null, arguments) };
var __ZL30FDKaacEnc_count5_6_7_8_9_10_11PKsiPi = Module["__ZL30FDKaacEnc_count5_6_7_8_9_10_11PKsiPi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__ZL30FDKaacEnc_count5_6_7_8_9_10_11PKsiPi"].apply(null, arguments) };
var __ZL31FDKaacEnc_writeExtensionPayloadP13FDK_BITSTREAM16EXT_PAYLOAD_TYPEPKhi = Module["__ZL31FDKaacEnc_writeExtensionPayloadP13FDK_BITSTREAM16EXT_PAYLOAD_TYPEPKhi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__ZL31FDKaacEnc_writeExtensionPayloadP13FDK_BITSTREAM16EXT_PAYLOAD_TYPEPKhi"].apply(null, arguments) };
var __ZL31sbrNoiseFloorLevelsQuantisationPaPli = Module["__ZL31sbrNoiseFloorLevelsQuantisationPaPli"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__ZL31sbrNoiseFloorLevelsQuantisationPaPli"].apply(null, arguments) };
var __ZL34FDKaacEnc_count3_4_5_6_7_8_9_10_11PKsiPi = Module["__ZL34FDKaacEnc_count3_4_5_6_7_8_9_10_11PKsiPi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__ZL34FDKaacEnc_count3_4_5_6_7_8_9_10_11PKsiPi"].apply(null, arguments) };
var __ZL38FDKaacEnc_count1_2_3_4_5_6_7_8_9_10_11PKsiPi = Module["__ZL38FDKaacEnc_count1_2_3_4_5_6_7_8_9_10_11PKsiPi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__ZL38FDKaacEnc_count1_2_3_4_5_6_7_8_9_10_11PKsiPi"].apply(null, arguments) };
var __ZL4fft2Pl = Module["__ZL4fft2Pl"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__ZL4fft2Pl"].apply(null, arguments) };
var __ZL4fft3Pl = Module["__ZL4fft3Pl"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__ZL4fft3Pl"].apply(null, arguments) };
var __ZL4fft5Pl = Module["__ZL4fft5Pl"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__ZL4fft5Pl"].apply(null, arguments) };
var __ZL5fLog2li = Module["__ZL5fLog2li"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__ZL5fLog2li"].apply(null, arguments) };
var __ZL5fLog2liPi = Module["__ZL5fLog2liPi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__ZL5fLog2liPi"].apply(null, arguments) };
var __ZL5fLog2liPi_647 = Module["__ZL5fLog2liPi_647"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__ZL5fLog2liPi_647"].apply(null, arguments) };
var __ZL5fLog2li_269 = Module["__ZL5fLog2li_269"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__ZL5fLog2li_269"].apply(null, arguments) };
var __ZL5fLog2li_433 = Module["__ZL5fLog2li_433"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__ZL5fLog2li_433"].apply(null, arguments) };
var __ZL5fLog2li_474 = Module["__ZL5fLog2li_474"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__ZL5fLog2li_474"].apply(null, arguments) };
var __ZL5fLog2li_477 = Module["__ZL5fLog2li_477"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__ZL5fLog2li_477"].apply(null, arguments) };
var __ZL5fLog2li_614 = Module["__ZL5fLog2li_614"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__ZL5fLog2li_614"].apply(null, arguments) };
var __ZL5fLog2li_629 = Module["__ZL5fLog2li_629"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__ZL5fLog2li_629"].apply(null, arguments) };
var __ZL5fLog2li_636 = Module["__ZL5fLog2li_636"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__ZL5fLog2li_636"].apply(null, arguments) };
var __ZL5fLog2li_812 = Module["__ZL5fLog2li_812"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__ZL5fLog2li_812"].apply(null, arguments) };
var __ZL5fft12Pl = Module["__ZL5fft12Pl"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__ZL5fft12Pl"].apply(null, arguments) };
var __ZL5fft15Pl = Module["__ZL5fft15Pl"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__ZL5fft15Pl"].apply(null, arguments) };
var __ZL5fft_4Pl = Module["__ZL5fft_4Pl"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__ZL5fft_4Pl"].apply(null, arguments) };
var __ZL5fft_8Pl = Module["__ZL5fft_8Pl"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__ZL5fft_8Pl"].apply(null, arguments) };
var __ZL6ecDataP13FDK_BITSTREAMPA23_aPaPhP12LOSSLESSDATA9DATA_TYPEiiiiii = Module["__ZL6ecDataP13FDK_BITSTREAMPA23_aPaPhP12LOSSLESSDATA9DATA_TYPEiiiiii"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__ZL6ecDataP13FDK_BITSTREAMPA23_aPaPhP12LOSSLESSDATA9DATA_TYPEiiiiii"].apply(null, arguments) };
var __ZL8sqrtFixpliPi = Module["__ZL8sqrtFixpliPi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__ZL8sqrtFixpliPi"].apply(null, arguments) };
var __ZL9detectionPlS_iPhPKhS_S_13GUIDE_VECTORSS3_11THRES_HOLDS = Module["__ZL9detectionPlS_iPhPKhS_S_13GUIDE_VECTORSS3_11THRES_HOLDS"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__ZL9detectionPlS_iPhPKhS_S_13GUIDE_VECTORSS3_11THRES_HOLDS"].apply(null, arguments) };
var ___DOUBLE_BITS_662 = Module["___DOUBLE_BITS_662"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["___DOUBLE_BITS_662"].apply(null, arguments) };
var ___errno_location = Module["___errno_location"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["___errno_location"].apply(null, arguments) };
var ___fdopen = Module["___fdopen"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["___fdopen"].apply(null, arguments) };
var ___fflush_unlocked = Module["___fflush_unlocked"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["___fflush_unlocked"].apply(null, arguments) };
var ___fmodeflags = Module["___fmodeflags"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["___fmodeflags"].apply(null, arguments) };
var ___fseeko = Module["___fseeko"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["___fseeko"].apply(null, arguments) };
var ___fseeko_unlocked = Module["___fseeko_unlocked"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["___fseeko_unlocked"].apply(null, arguments) };
var ___ftello = Module["___ftello"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["___ftello"].apply(null, arguments) };
var ___ftello_unlocked = Module["___ftello_unlocked"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["___ftello_unlocked"].apply(null, arguments) };
var ___fwritex = Module["___fwritex"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["___fwritex"].apply(null, arguments) };
var ___getopt_msg = Module["___getopt_msg"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["___getopt_msg"].apply(null, arguments) };
var ___lctrans = Module["___lctrans"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["___lctrans"].apply(null, arguments) };
var ___lctrans_cur = Module["___lctrans_cur"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["___lctrans_cur"].apply(null, arguments) };
var ___lctrans_impl = Module["___lctrans_impl"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["___lctrans_impl"].apply(null, arguments) };
var ___lockfile = Module["___lockfile"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["___lockfile"].apply(null, arguments) };
var ___mo_lookup = Module["___mo_lookup"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["___mo_lookup"].apply(null, arguments) };
var ___ofl_add = Module["___ofl_add"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["___ofl_add"].apply(null, arguments) };
var ___ofl_lock = Module["___ofl_lock"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["___ofl_lock"].apply(null, arguments) };
var ___ofl_unlock = Module["___ofl_unlock"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["___ofl_unlock"].apply(null, arguments) };
var ___overflow = Module["___overflow"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["___overflow"].apply(null, arguments) };
var ___pthread_self_159 = Module["___pthread_self_159"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["___pthread_self_159"].apply(null, arguments) };
var ___pthread_self_684 = Module["___pthread_self_684"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["___pthread_self_684"].apply(null, arguments) };
var ___pthread_self_78 = Module["___pthread_self_78"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["___pthread_self_78"].apply(null, arguments) };
var ___pthread_self_885 = Module["___pthread_self_885"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["___pthread_self_885"].apply(null, arguments) };
var ___pthread_self_888 = Module["___pthread_self_888"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["___pthread_self_888"].apply(null, arguments) };
var ___stdio_close = Module["___stdio_close"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["___stdio_close"].apply(null, arguments) };
var ___stdio_read = Module["___stdio_read"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["___stdio_read"].apply(null, arguments) };
var ___stdio_seek = Module["___stdio_seek"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["___stdio_seek"].apply(null, arguments) };
var ___stdio_write = Module["___stdio_write"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["___stdio_write"].apply(null, arguments) };
var ___stdout_write = Module["___stdout_write"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["___stdout_write"].apply(null, arguments) };
var ___strchrnul = Module["___strchrnul"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["___strchrnul"].apply(null, arguments) };
var ___strerror_l = Module["___strerror_l"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["___strerror_l"].apply(null, arguments) };
var ___syscall_ret = Module["___syscall_ret"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["___syscall_ret"].apply(null, arguments) };
var ___toread = Module["___toread"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["___toread"].apply(null, arguments) };
var ___towrite = Module["___towrite"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["___towrite"].apply(null, arguments) };
var ___uflow = Module["___uflow"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["___uflow"].apply(null, arguments) };
var ___unlist_locked_file = Module["___unlist_locked_file"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["___unlist_locked_file"].apply(null, arguments) };
var ___unlockfile = Module["___unlockfile"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["___unlockfile"].apply(null, arguments) };
var _a_cas = Module["_a_cas"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["_a_cas"].apply(null, arguments) };
var _aacEncClose = Module["_aacEncClose"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["_aacEncClose"].apply(null, arguments) };
var _aacEncEncode = Module["_aacEncEncode"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["_aacEncEncode"].apply(null, arguments) };
var _aacEncGetLibInfo = Module["_aacEncGetLibInfo"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["_aacEncGetLibInfo"].apply(null, arguments) };
var _aacEncInfo = Module["_aacEncInfo"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["_aacEncInfo"].apply(null, arguments) };
var _aacEncOpen = Module["_aacEncOpen"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["_aacEncOpen"].apply(null, arguments) };
var _aacEncoder_SetParam = Module["_aacEncoder_SetParam"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["_aacEncoder_SetParam"].apply(null, arguments) };
var _atoi = Module["_atoi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["_atoi"].apply(null, arguments) };
var _calloc = Module["_calloc"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["_calloc"].apply(null, arguments) };
var _dummy = Module["_dummy"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["_dummy"].apply(null, arguments) };
var _fclose = Module["_fclose"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["_fclose"].apply(null, arguments) };
var _feof = Module["_feof"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["_feof"].apply(null, arguments) };
var _fflush = Module["_fflush"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["_fflush"].apply(null, arguments) };
var _fgetc = Module["_fgetc"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["_fgetc"].apply(null, arguments) };
var _flockfile = Module["_flockfile"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["_flockfile"].apply(null, arguments) };
var _fmt_fp = Module["_fmt_fp"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["_fmt_fp"].apply(null, arguments) };
var _fmt_o = Module["_fmt_o"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["_fmt_o"].apply(null, arguments) };
var _fmt_u = Module["_fmt_u"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["_fmt_u"].apply(null, arguments) };
var _fmt_x = Module["_fmt_x"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["_fmt_x"].apply(null, arguments) };
var _fopen = Module["_fopen"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["_fopen"].apply(null, arguments) };
var _fprintf = Module["_fprintf"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["_fprintf"].apply(null, arguments) };
var _fputc = Module["_fputc"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["_fputc"].apply(null, arguments) };
var _fputs = Module["_fputs"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["_fputs"].apply(null, arguments) };
var _fread = Module["_fread"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["_fread"].apply(null, arguments) };
var _free = Module["_free"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["_free"].apply(null, arguments) };
var _frexp = Module["_frexp"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["_frexp"].apply(null, arguments) };
var _frexpl = Module["_frexpl"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["_frexpl"].apply(null, arguments) };
var _fseek = Module["_fseek"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["_fseek"].apply(null, arguments) };
var _ftell = Module["_ftell"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["_ftell"].apply(null, arguments) };
var _ftrylockfile = Module["_ftrylockfile"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["_ftrylockfile"].apply(null, arguments) };
var _funlockfile = Module["_funlockfile"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["_funlockfile"].apply(null, arguments) };
var _fwrite = Module["_fwrite"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["_fwrite"].apply(null, arguments) };
var _getint_656 = Module["_getint_656"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["_getint_656"].apply(null, arguments) };
var _getopt = Module["_getopt"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["_getopt"].apply(null, arguments) };
var _isdigit = Module["_isdigit"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["_isdigit"].apply(null, arguments) };
var _isspace = Module["_isspace"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["_isspace"].apply(null, arguments) };
var _llvm_bswap_i32 = Module["_llvm_bswap_i32"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["_llvm_bswap_i32"].apply(null, arguments) };
var _main = Module["_main"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["_main"].apply(null, arguments) };
var _malloc = Module["_malloc"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["_malloc"].apply(null, arguments) };
var _mbtowc = Module["_mbtowc"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["_mbtowc"].apply(null, arguments) };
var _memchr = Module["_memchr"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["_memchr"].apply(null, arguments) };
var _memcpy = Module["_memcpy"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["_memcpy"].apply(null, arguments) };
var _memmove = Module["_memmove"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["_memmove"].apply(null, arguments) };
var _memset = Module["_memset"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["_memset"].apply(null, arguments) };
var _out_655 = Module["_out_655"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["_out_655"].apply(null, arguments) };
var _pad_661 = Module["_pad_661"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["_pad_661"].apply(null, arguments) };
var _perror = Module["_perror"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["_perror"].apply(null, arguments) };
var _pop_arg_658 = Module["_pop_arg_658"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["_pop_arg_658"].apply(null, arguments) };
var _printf_core = Module["_printf_core"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["_printf_core"].apply(null, arguments) };
var _pthread_self = Module["_pthread_self"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["_pthread_self"].apply(null, arguments) };
var _putc = Module["_putc"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["_putc"].apply(null, arguments) };
var _read_int16 = Module["_read_int16"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["_read_int16"].apply(null, arguments) };
var _read_int32 = Module["_read_int32"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["_read_int32"].apply(null, arguments) };
var _read_tag = Module["_read_tag"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["_read_tag"].apply(null, arguments) };
var _sbrEncoder_Close = Module["_sbrEncoder_Close"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["_sbrEncoder_Close"].apply(null, arguments) };
var _sbrEncoder_EncodeFrame = Module["_sbrEncoder_EncodeFrame"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["_sbrEncoder_EncodeFrame"].apply(null, arguments) };
var _sbrEncoder_GetEstimateBitrate = Module["_sbrEncoder_GetEstimateBitrate"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["_sbrEncoder_GetEstimateBitrate"].apply(null, arguments) };
var _sbrEncoder_GetHeader = Module["_sbrEncoder_GetHeader"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["_sbrEncoder_GetHeader"].apply(null, arguments) };
var _sbrEncoder_GetInputDataDelay = Module["_sbrEncoder_GetInputDataDelay"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["_sbrEncoder_GetInputDataDelay"].apply(null, arguments) };
var _sbrEncoder_GetLibInfo = Module["_sbrEncoder_GetLibInfo"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["_sbrEncoder_GetLibInfo"].apply(null, arguments) };
var _sbrEncoder_GetSbrDecDelay = Module["_sbrEncoder_GetSbrDecDelay"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["_sbrEncoder_GetSbrDecDelay"].apply(null, arguments) };
var _sbrEncoder_Init = Module["_sbrEncoder_Init"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["_sbrEncoder_Init"].apply(null, arguments) };
var _sbrEncoder_IsSingleRatePossible = Module["_sbrEncoder_IsSingleRatePossible"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["_sbrEncoder_IsSingleRatePossible"].apply(null, arguments) };
var _sbrEncoder_LimitBitRate = Module["_sbrEncoder_LimitBitRate"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["_sbrEncoder_LimitBitRate"].apply(null, arguments) };
var _sbrEncoder_Open = Module["_sbrEncoder_Open"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["_sbrEncoder_Open"].apply(null, arguments) };
var _sbrEncoder_UpdateBuffers = Module["_sbrEncoder_UpdateBuffers"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["_sbrEncoder_UpdateBuffers"].apply(null, arguments) };
var _sbrk = Module["_sbrk"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["_sbrk"].apply(null, arguments) };
var _skip = Module["_skip"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["_skip"].apply(null, arguments) };
var _sn_write = Module["_sn_write"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["_sn_write"].apply(null, arguments) };
var _strchr = Module["_strchr"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["_strchr"].apply(null, arguments) };
var _strcmp = Module["_strcmp"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["_strcmp"].apply(null, arguments) };
var _strerror = Module["_strerror"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["_strerror"].apply(null, arguments) };
var _strlen = Module["_strlen"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["_strlen"].apply(null, arguments) };
var _swapc = Module["_swapc"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["_swapc"].apply(null, arguments) };
var _usage = Module["_usage"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["_usage"].apply(null, arguments) };
var _vfprintf = Module["_vfprintf"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["_vfprintf"].apply(null, arguments) };
var _vsnprintf = Module["_vsnprintf"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["_vsnprintf"].apply(null, arguments) };
var _vsprintf = Module["_vsprintf"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["_vsprintf"].apply(null, arguments) };
var _wav_get_header = Module["_wav_get_header"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["_wav_get_header"].apply(null, arguments) };
var _wav_read_close = Module["_wav_read_close"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["_wav_read_close"].apply(null, arguments) };
var _wav_read_data = Module["_wav_read_data"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["_wav_read_data"].apply(null, arguments) };
var _wav_read_open = Module["_wav_read_open"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["_wav_read_open"].apply(null, arguments) };
var _wcrtomb = Module["_wcrtomb"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["_wcrtomb"].apply(null, arguments) };
var _wctomb = Module["_wctomb"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["_wctomb"].apply(null, arguments) };
var establishStackSpace = Module["establishStackSpace"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["establishStackSpace"].apply(null, arguments) };
var stackAlloc = Module["stackAlloc"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["stackAlloc"].apply(null, arguments) };
var stackRestore = Module["stackRestore"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["stackRestore"].apply(null, arguments) };
var stackSave = Module["stackSave"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["stackSave"].apply(null, arguments) };
var dynCall_ii = Module["dynCall_ii"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["dynCall_ii"].apply(null, arguments) };
var dynCall_iiii = Module["dynCall_iiii"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["dynCall_iiii"].apply(null, arguments) };
var dynCall_iiiiiiiiiii = Module["dynCall_iiiiiiiiiii"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["dynCall_iiiiiiiiiii"].apply(null, arguments) };
var dynCall_iiiiiiiiiiiiii = Module["dynCall_iiiiiiiiiiiiii"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["dynCall_iiiiiiiiiiiiii"].apply(null, arguments) };
var dynCall_vi = Module["dynCall_vi"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["dynCall_vi"].apply(null, arguments) };
var dynCall_viii = Module["dynCall_viii"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["dynCall_viii"].apply(null, arguments) };
;



// === Auto-generated postamble setup entry stuff ===

Module['asm'] = asm;

if (!Module["intArrayFromString"]) Module["intArrayFromString"] = function() { abort("'intArrayFromString' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["intArrayToString"]) Module["intArrayToString"] = function() { abort("'intArrayToString' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["ccall"]) Module["ccall"] = function() { abort("'ccall' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["cwrap"]) Module["cwrap"] = function() { abort("'cwrap' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["setValue"]) Module["setValue"] = function() { abort("'setValue' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["getValue"]) Module["getValue"] = function() { abort("'getValue' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["allocate"]) Module["allocate"] = function() { abort("'allocate' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["getMemory"]) Module["getMemory"] = function() { abort("'getMemory' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you") };
if (!Module["AsciiToString"]) Module["AsciiToString"] = function() { abort("'AsciiToString' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["stringToAscii"]) Module["stringToAscii"] = function() { abort("'stringToAscii' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["UTF8ArrayToString"]) Module["UTF8ArrayToString"] = function() { abort("'UTF8ArrayToString' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["UTF8ToString"]) Module["UTF8ToString"] = function() { abort("'UTF8ToString' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["stringToUTF8Array"]) Module["stringToUTF8Array"] = function() { abort("'stringToUTF8Array' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["stringToUTF8"]) Module["stringToUTF8"] = function() { abort("'stringToUTF8' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["lengthBytesUTF8"]) Module["lengthBytesUTF8"] = function() { abort("'lengthBytesUTF8' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["UTF16ToString"]) Module["UTF16ToString"] = function() { abort("'UTF16ToString' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["stringToUTF16"]) Module["stringToUTF16"] = function() { abort("'stringToUTF16' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["lengthBytesUTF16"]) Module["lengthBytesUTF16"] = function() { abort("'lengthBytesUTF16' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["UTF32ToString"]) Module["UTF32ToString"] = function() { abort("'UTF32ToString' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["stringToUTF32"]) Module["stringToUTF32"] = function() { abort("'stringToUTF32' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["lengthBytesUTF32"]) Module["lengthBytesUTF32"] = function() { abort("'lengthBytesUTF32' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["allocateUTF8"]) Module["allocateUTF8"] = function() { abort("'allocateUTF8' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["stackTrace"]) Module["stackTrace"] = function() { abort("'stackTrace' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["addOnPreRun"]) Module["addOnPreRun"] = function() { abort("'addOnPreRun' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["addOnInit"]) Module["addOnInit"] = function() { abort("'addOnInit' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["addOnPreMain"]) Module["addOnPreMain"] = function() { abort("'addOnPreMain' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["addOnExit"]) Module["addOnExit"] = function() { abort("'addOnExit' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["addOnPostRun"]) Module["addOnPostRun"] = function() { abort("'addOnPostRun' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["writeStringToMemory"]) Module["writeStringToMemory"] = function() { abort("'writeStringToMemory' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["writeArrayToMemory"]) Module["writeArrayToMemory"] = function() { abort("'writeArrayToMemory' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["writeAsciiToMemory"]) Module["writeAsciiToMemory"] = function() { abort("'writeAsciiToMemory' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["addRunDependency"]) Module["addRunDependency"] = function() { abort("'addRunDependency' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you") };
if (!Module["removeRunDependency"]) Module["removeRunDependency"] = function() { abort("'removeRunDependency' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you") };
if (!Module["ENV"]) Module["ENV"] = function() { abort("'ENV' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["FS"]) Module["FS"] = function() { abort("'FS' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["FS_createFolder"]) Module["FS_createFolder"] = function() { abort("'FS_createFolder' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you") };
if (!Module["FS_createPath"]) Module["FS_createPath"] = function() { abort("'FS_createPath' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you") };
if (!Module["FS_createDataFile"]) Module["FS_createDataFile"] = function() { abort("'FS_createDataFile' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you") };
if (!Module["FS_createPreloadedFile"]) Module["FS_createPreloadedFile"] = function() { abort("'FS_createPreloadedFile' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you") };
if (!Module["FS_createLazyFile"]) Module["FS_createLazyFile"] = function() { abort("'FS_createLazyFile' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you") };
if (!Module["FS_createLink"]) Module["FS_createLink"] = function() { abort("'FS_createLink' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you") };
if (!Module["FS_createDevice"]) Module["FS_createDevice"] = function() { abort("'FS_createDevice' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you") };
if (!Module["FS_unlink"]) Module["FS_unlink"] = function() { abort("'FS_unlink' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you") };
if (!Module["GL"]) Module["GL"] = function() { abort("'GL' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["dynamicAlloc"]) Module["dynamicAlloc"] = function() { abort("'dynamicAlloc' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["warnOnce"]) Module["warnOnce"] = function() { abort("'warnOnce' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["loadDynamicLibrary"]) Module["loadDynamicLibrary"] = function() { abort("'loadDynamicLibrary' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["loadWebAssemblyModule"]) Module["loadWebAssemblyModule"] = function() { abort("'loadWebAssemblyModule' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["getLEB"]) Module["getLEB"] = function() { abort("'getLEB' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["getFunctionTables"]) Module["getFunctionTables"] = function() { abort("'getFunctionTables' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["alignFunctionTables"]) Module["alignFunctionTables"] = function() { abort("'alignFunctionTables' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["registerFunctions"]) Module["registerFunctions"] = function() { abort("'registerFunctions' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["addFunction"]) Module["addFunction"] = function() { abort("'addFunction' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["removeFunction"]) Module["removeFunction"] = function() { abort("'removeFunction' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["getFuncWrapper"]) Module["getFuncWrapper"] = function() { abort("'getFuncWrapper' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["prettyPrint"]) Module["prettyPrint"] = function() { abort("'prettyPrint' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["makeBigInt"]) Module["makeBigInt"] = function() { abort("'makeBigInt' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["dynCall"]) Module["dynCall"] = function() { abort("'dynCall' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["getCompilerSetting"]) Module["getCompilerSetting"] = function() { abort("'getCompilerSetting' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["stackSave"]) Module["stackSave"] = function() { abort("'stackSave' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["stackRestore"]) Module["stackRestore"] = function() { abort("'stackRestore' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["stackAlloc"]) Module["stackAlloc"] = function() { abort("'stackAlloc' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["establishStackSpace"]) Module["establishStackSpace"] = function() { abort("'establishStackSpace' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["print"]) Module["print"] = function() { abort("'print' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["printErr"]) Module["printErr"] = function() { abort("'printErr' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["getTempRet0"]) Module["getTempRet0"] = function() { abort("'getTempRet0' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["setTempRet0"]) Module["setTempRet0"] = function() { abort("'setTempRet0' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["Pointer_stringify"]) Module["Pointer_stringify"] = function() { abort("'Pointer_stringify' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["writeStackCookie"]) Module["writeStackCookie"] = function() { abort("'writeStackCookie' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["checkStackCookie"]) Module["checkStackCookie"] = function() { abort("'checkStackCookie' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["abortStackOverflow"]) Module["abortStackOverflow"] = function() { abort("'abortStackOverflow' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };if (!Module["ALLOC_NORMAL"]) Object.defineProperty(Module, "ALLOC_NORMAL", { get: function() { abort("'ALLOC_NORMAL' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") } });
if (!Module["ALLOC_STACK"]) Object.defineProperty(Module, "ALLOC_STACK", { get: function() { abort("'ALLOC_STACK' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") } });
if (!Module["ALLOC_DYNAMIC"]) Object.defineProperty(Module, "ALLOC_DYNAMIC", { get: function() { abort("'ALLOC_DYNAMIC' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") } });
if (!Module["ALLOC_NONE"]) Object.defineProperty(Module, "ALLOC_NONE", { get: function() { abort("'ALLOC_NONE' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") } });



// Modularize mode returns a function, which can be called to
// create instances. The instances provide a then() method,
// must like a Promise, that receives a callback. The callback
// is called when the module is ready to run, with the module
// as a parameter. (Like a Promise, it also returns the module
// so you can use the output of .then(..)).
Module['then'] = function(func) {
  // We may already be ready to run code at this time. if
  // so, just queue a call to the callback.
  if (Module['calledRun']) {
    func(Module);
  } else {
    // we are not ready to call then() yet. we must call it
    // at the same time we would call onRuntimeInitialized.
    var old = Module['onRuntimeInitialized'];
    Module['onRuntimeInitialized'] = function() {
      if (old) old();
      func(Module);
    };
  }
  return Module;
};

/**
 * @constructor
 * @extends {Error}
 * @this {ExitStatus}
 */
function ExitStatus(status) {
  this.name = "ExitStatus";
  this.message = "Program terminated with exit(" + status + ")";
  this.status = status;
};
ExitStatus.prototype = new Error();
ExitStatus.prototype.constructor = ExitStatus;

var calledMain = false;

dependenciesFulfilled = function runCaller() {
  // If run has never been called, and we should call run (INVOKE_RUN is true, and Module.noInitialRun is not false)
  if (!Module['calledRun']) run();
  if (!Module['calledRun']) dependenciesFulfilled = runCaller; // try this again later, after new deps are fulfilled
}

Module['callMain'] = function callMain(args) {
  assert(runDependencies == 0, 'cannot call main when async dependencies remain! (listen on Module["onRuntimeInitialized"])');
  assert(__ATPRERUN__.length == 0, 'cannot call main when preRun functions remain to be called');

  args = args || [];

  ensureInitRuntime();

  var argc = args.length+1;
  var argv = stackAlloc((argc + 1) * 4);
  HEAP32[argv >> 2] = allocateUTF8OnStack(Module['thisProgram']);
  for (var i = 1; i < argc; i++) {
    HEAP32[(argv >> 2) + i] = allocateUTF8OnStack(args[i - 1]);
  }
  HEAP32[(argv >> 2) + argc] = 0;


  try {

    var ret = Module['_main'](argc, argv, 0);


    // if we're not running an evented main loop, it's time to exit
      exit(ret, /* implicit = */ true);
  }
  catch(e) {
    if (e instanceof ExitStatus) {
      // exit() throws this once it's done to make sure execution
      // has been stopped completely
      return;
    } else if (e == 'SimulateInfiniteLoop') {
      // running an evented main loop, don't immediately exit
      Module['noExitRuntime'] = true;
      return;
    } else {
      var toLog = e;
      if (e && typeof e === 'object' && e.stack) {
        toLog = [e, e.stack];
      }
      err('exception thrown: ' + toLog);
      Module['quit'](1, e);
    }
  } finally {
    calledMain = true;
  }
}




/** @type {function(Array=)} */
function run(args) {
  args = args || Module['arguments'];

  if (runDependencies > 0) {
    return;
  }

  writeStackCookie();

  preRun();

  if (runDependencies > 0) return; // a preRun added a dependency, run will be called later
  if (Module['calledRun']) return; // run may have just been called through dependencies being fulfilled just in this very frame

  function doRun() {
    if (Module['calledRun']) return; // run may have just been called while the async setStatus time below was happening
    Module['calledRun'] = true;

    if (ABORT) return;

    ensureInitRuntime();

    preMain();

    if (Module['onRuntimeInitialized']) Module['onRuntimeInitialized']();

    if (Module['_main'] && shouldRunNow) Module['callMain'](args);

    postRun();
  }

  if (Module['setStatus']) {
    Module['setStatus']('Running...');
    setTimeout(function() {
      setTimeout(function() {
        Module['setStatus']('');
      }, 1);
      doRun();
    }, 1);
  } else {
    doRun();
  }
  checkStackCookie();
}
Module['run'] = run;

function checkUnflushedContent() {
  // Compiler settings do not allow exiting the runtime, so flushing
  // the streams is not possible. but in ASSERTIONS mode we check
  // if there was something to flush, and if so tell the user they
  // should request that the runtime be exitable.
  // Normally we would not even include flush() at all, but in ASSERTIONS
  // builds we do so just for this check, and here we see if there is any
  // content to flush, that is, we check if there would have been
  // something a non-ASSERTIONS build would have not seen.
  // How we flush the streams depends on whether we are in FILESYSTEM=0
  // mode (which has its own special function for this; otherwise, all
  // the code is inside libc)
  var print = out;
  var printErr = err;
  var has = false;
  out = err = function(x) {
    has = true;
  }
  try { // it doesn't matter if it fails
    var flush = Module['_fflush'];
    if (flush) flush(0);
    // also flush in the JS FS layer
    var hasFS = true;
    if (hasFS) {
      ['stdout', 'stderr'].forEach(function(name) {
        var info = FS.analyzePath('/dev/' + name);
        if (!info) return;
        var stream = info.object;
        var rdev = stream.rdev;
        var tty = TTY.ttys[rdev];
        if (tty && tty.output && tty.output.length) {
          has = true;
        }
      });
    }
  } catch(e) {}
  out = print;
  err = printErr;
  if (has) {
    warnOnce('stdio streams had content in them that was not flushed. you should set EXIT_RUNTIME to 1 (see the FAQ), or make sure to emit a newline when you printf etc.');
  }
}

function exit(status, implicit) {
  checkUnflushedContent();

  // if this is just main exit-ing implicitly, and the status is 0, then we
  // don't need to do anything here and can just leave. if the status is
  // non-zero, though, then we need to report it.
  // (we may have warned about this earlier, if a situation justifies doing so)
  if (implicit && Module['noExitRuntime'] && status === 0) {
    return;
  }

  if (Module['noExitRuntime']) {
    // if exit() was called, we may warn the user if the runtime isn't actually being shut down
    if (!implicit) {
      err('exit(' + status + ') called, but EXIT_RUNTIME is not set, so halting execution but not exiting the runtime or preventing further async execution (build with EXIT_RUNTIME=1, if you want a true shutdown)');
    }
  } else {

    ABORT = true;
    EXITSTATUS = status;

    exitRuntime();

    if (Module['onExit']) Module['onExit'](status);
  }

  Module['quit'](status, new ExitStatus(status));
}

var abortDecorators = [];

function abort(what) {
  if (Module['onAbort']) {
    Module['onAbort'](what);
  }

  if (what !== undefined) {
    out(what);
    err(what);
    what = JSON.stringify(what)
  } else {
    what = '';
  }

  ABORT = true;
  EXITSTATUS = 1;

  var extra = '';
  var output = 'abort(' + what + ') at ' + stackTrace() + extra;
  if (abortDecorators) {
    abortDecorators.forEach(function(decorator) {
      output = decorator(output, what);
    });
  }
  throw output;
}
Module['abort'] = abort;

if (Module['preInit']) {
  if (typeof Module['preInit'] == 'function') Module['preInit'] = [Module['preInit']];
  while (Module['preInit'].length > 0) {
    Module['preInit'].pop()();
  }
}

// shouldRunNow refers to calling main(), not run().
var shouldRunNow = false;
if (Module['noInitialRun']) {
  shouldRunNow = false;
}

  Module["noExitRuntime"] = true;

run();





// {{MODULE_ADDITIONS}}





  return Module
}
);
})();
if (typeof exports === 'object' && typeof module === 'object')
      module.exports = Module;
    else if (typeof define === 'function' && define['amd'])
      define([], function() { return Module; });
    else if (typeof exports === 'object')
      exports["Module"] = Module;
    
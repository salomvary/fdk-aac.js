
var c;c||(c=typeof Module !== 'undefined' ? Module : {});"undefined"!==typeof fdkAacWasm&&(c.locateFile=function(a,b){return"aac-enc.wasm"===a?fdkAacWasm:b+a});var aa=Object.assign({},c),ba=[],ca="./this.program",h=(a,b)=>{throw b;},da="object"==typeof window,q="function"==typeof importScripts,ea="object"==typeof process&&"object"==typeof process.versions&&"string"==typeof process.versions.node,x="",y,z,A,fs,B,fa;
if(ea)x=q?require("path").dirname(x)+"/":__dirname+"/",fa=()=>{B||(fs=require("fs"),B=require("path"))},y=function(a,b){fa();a=B.normalize(a);return fs.readFileSync(a,b?void 0:"utf8")},A=a=>{a=y(a,!0);a.buffer||(a=new Uint8Array(a));return a},z=(a,b,d)=>{fa();a=B.normalize(a);fs.readFile(a,function(e,f){e?d(e):b(f.buffer)})},1<process.argv.length&&(ca=process.argv[1].replace(/\\/g,"/")),ba=process.argv.slice(2),"undefined"!=typeof module&&(module.exports=c),process.on("uncaughtException",function(a){if(!(a instanceof
C))throw a;}),process.on("unhandledRejection",function(a){throw a;}),h=(a,b)=>{if(noExitRuntime)throw process.exitCode=a,b;b instanceof C||D("exiting due to exception: "+b);process.exit(a)},c.inspect=function(){return"[Emscripten Module object]"};else if(da||q)q?x=self.location.href:"undefined"!=typeof document&&document.currentScript&&(x=document.currentScript.src),x=0!==x.indexOf("blob:")?x.substr(0,x.replace(/[?#].*/,"").lastIndexOf("/")+1):"",y=a=>{var b=new XMLHttpRequest;b.open("GET",a,!1);
b.send(null);return b.responseText},q&&(A=a=>{var b=new XMLHttpRequest;b.open("GET",a,!1);b.responseType="arraybuffer";b.send(null);return new Uint8Array(b.response)}),z=(a,b,d)=>{var e=new XMLHttpRequest;e.open("GET",a,!0);e.responseType="arraybuffer";e.onload=()=>{200==e.status||0==e.status&&e.response?b(e.response):d()};e.onerror=d;e.send(null)};var E=c.print||console.log.bind(console),D=c.printErr||console.warn.bind(console);Object.assign(c,aa);aa=null;c.arguments&&(ba=c.arguments);
c.thisProgram&&(ca=c.thisProgram);c.quit&&(h=c.quit);var F;c.wasmBinary&&(F=c.wasmBinary);var noExitRuntime=c.noExitRuntime||!0;"object"!=typeof WebAssembly&&G("no native wasm support detected");var ha,ia=!1,ja,ka="undefined"!=typeof TextDecoder?new TextDecoder("utf8"):void 0;
function H(a,b){for(var d=b+NaN,e=b;a[e]&&!(e>=d);)++e;if(16<e-b&&a.buffer&&ka)return ka.decode(a.subarray(b,e));for(d="";b<e;){var f=a[b++];if(f&128){var g=a[b++]&63;if(192==(f&224))d+=String.fromCharCode((f&31)<<6|g);else{var k=a[b++]&63;f=224==(f&240)?(f&15)<<12|g<<6|k:(f&7)<<18|g<<12|k<<6|a[b++]&63;65536>f?d+=String.fromCharCode(f):(f-=65536,d+=String.fromCharCode(55296|f>>10,56320|f&1023))}}else d+=String.fromCharCode(f)}return d}
function la(a,b,d,e){if(!(0<e))return 0;var f=d;e=d+e-1;for(var g=0;g<a.length;++g){var k=a.charCodeAt(g);if(55296<=k&&57343>=k){var m=a.charCodeAt(++g);k=65536+((k&1023)<<10)|m&1023}if(127>=k){if(d>=e)break;b[d++]=k}else{if(2047>=k){if(d+1>=e)break;b[d++]=192|k>>6}else{if(65535>=k){if(d+2>=e)break;b[d++]=224|k>>12}else{if(d+3>=e)break;b[d++]=240|k>>18;b[d++]=128|k>>12&63}b[d++]=128|k>>6&63}b[d++]=128|k&63}}b[d]=0;return d-f}
function ma(a){for(var b=0,d=0;d<a.length;++d){var e=a.charCodeAt(d);55296<=e&&57343>=e&&(e=65536+((e&1023)<<10)|a.charCodeAt(++d)&1023);127>=e?++b:b=2047>=e?b+2:65535>=e?b+3:b+4}return b}function na(a){var b=ma(a)+1,d=oa(b);la(a,I,d,b);return d}var pa,I,qa,ra,L,M,sa,ta=[],ua=[],va=[],wa=[];function xa(){var a=c.preRun.shift();ta.unshift(a)}var N=0,ya=null,O=null;function za(){N++;c.monitorRunDependencies&&c.monitorRunDependencies(N)}
function Aa(){N--;c.monitorRunDependencies&&c.monitorRunDependencies(N);if(0==N&&(null!==ya&&(clearInterval(ya),ya=null),O)){var a=O;O=null;a()}}function G(a){if(c.onAbort)c.onAbort(a);a="Aborted("+a+")";D(a);ia=!0;ja=1;throw new WebAssembly.RuntimeError(a+". Build with -sASSERTIONS for more info.");}function Ba(){return P.startsWith("data:application/octet-stream;base64,")}var P;P="aac-enc.wasm";if(!Ba()){var Ca=P;P=c.locateFile?c.locateFile(Ca,x):x+Ca}
function Da(){var a=P;try{if(a==P&&F)return new Uint8Array(F);if(A)return A(a);throw"both async and sync fetching of the wasm failed";}catch(b){G(b)}}
function Ea(){if(!F&&(da||q)){if("function"==typeof fetch&&!P.startsWith("file://"))return fetch(P,{credentials:"same-origin"}).then(function(a){if(!a.ok)throw"failed to load wasm binary file at '"+P+"'";return a.arrayBuffer()}).catch(function(){return Da()});if(z)return new Promise(function(a,b){z(P,function(d){a(new Uint8Array(d))},b)})}return Promise.resolve().then(function(){return Da()})}var Q,Fa;
function Ga(a){for(;0<a.length;){var b=a.shift();if("function"==typeof b)b(c);else{var d=b.Nb;"number"==typeof d?void 0===b.qa?Ha(d)():Ha(d)(b.qa):d(void 0===b.qa?null:b.qa)}}}var Ia=[];function Ha(a){var b=Ia[a];b||(a>=Ia.length&&(Ia.length=a+1),Ia[a]=b=sa.get(a));return b}
var Ja=(a,b)=>{for(var d=0,e=a.length-1;0<=e;e--){var f=a[e];"."===f?a.splice(e,1):".."===f?(a.splice(e,1),d++):d&&(a.splice(e,1),d--)}if(b)for(;d;d--)a.unshift("..");return a},R=a=>{var b="/"===a.charAt(0),d="/"===a.substr(-1);(a=Ja(a.split("/").filter(e=>!!e),!b).join("/"))||b||(a=".");a&&d&&(a+="/");return(b?"/":"")+a},Ka=a=>{var b=/^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/.exec(a).slice(1);a=b[0];b=b[1];if(!a&&!b)return".";b&&(b=b.substr(0,b.length-1));return a+b},S=a=>{if("/"===
a)return"/";a=R(a);a=a.replace(/\/$/,"");var b=a.lastIndexOf("/");return-1===b?a:a.substr(b+1)},La=(a,b)=>R(a+"/"+b);function Ma(){if("object"==typeof crypto&&"function"==typeof crypto.getRandomValues){var a=new Uint8Array(1);return function(){crypto.getRandomValues(a);return a[0]}}if(ea)try{var b=require("crypto");return function(){return b.randomBytes(1)[0]}}catch(d){}return function(){G("randomDevice")}}
function U(){for(var a="",b=!1,d=arguments.length-1;-1<=d&&!b;d--){b=0<=d?arguments[d]:V.cwd();if("string"!=typeof b)throw new TypeError("Arguments to path.resolve must be strings");if(!b)return"";a=b+"/"+a;b="/"===b.charAt(0)}a=Ja(a.split("/").filter(e=>!!e),!b).join("/");return(b?"/":"")+a||"."}
var Na=(a,b)=>{function d(k){for(var m=0;m<k.length&&""===k[m];m++);for(var n=k.length-1;0<=n&&""===k[n];n--);return m>n?[]:k.slice(m,n-m+1)}a=U(a).substr(1);b=U(b).substr(1);a=d(a.split("/"));b=d(b.split("/"));for(var e=Math.min(a.length,b.length),f=e,g=0;g<e;g++)if(a[g]!==b[g]){f=g;break}e=[];for(g=f;g<a.length;g++)e.push("..");e=e.concat(b.slice(f));return e.join("/")},Oa=[];function Pa(a,b){Oa[a]={input:[],output:[],X:b};V.Ga(a,Qa)}
var Qa={open:function(a){var b=Oa[a.node.rdev];if(!b)throw new V.s(43);a.tty=b;a.seekable=!1},close:function(a){a.tty.X.flush(a.tty)},flush:function(a){a.tty.X.flush(a.tty)},read:function(a,b,d,e){if(!a.tty||!a.tty.X.Ua)throw new V.s(60);for(var f=0,g=0;g<e;g++){try{var k=a.tty.X.Ua(a.tty)}catch(m){throw new V.s(29);}if(void 0===k&&0===f)throw new V.s(6);if(null===k||void 0===k)break;f++;b[d+g]=k}f&&(a.node.timestamp=Date.now());return f},write:function(a,b,d,e){if(!a.tty||!a.tty.X.Da)throw new V.s(60);
try{for(var f=0;f<e;f++)a.tty.X.Da(a.tty,b[d+f])}catch(g){throw new V.s(29);}e&&(a.node.timestamp=Date.now());return f}},Sa={Ua:function(a){if(!a.input.length){var b=null;if(ea){var d=Buffer.alloc(256),e=0;try{e=fs.readSync(process.stdin.fd,d,0,256,-1)}catch(f){if(f.toString().includes("EOF"))e=0;else throw f;}0<e?b=d.slice(0,e).toString("utf-8"):b=null}else"undefined"!=typeof window&&"function"==typeof window.prompt?(b=window.prompt("Input: "),null!==b&&(b+="\n")):"function"==typeof readline&&(b=
readline(),null!==b&&(b+="\n"));if(!b)return null;a.input=Ra(b)}return a.input.shift()},Da:function(a,b){null===b||10===b?(E(H(a.output,0)),a.output=[]):0!=b&&a.output.push(b)},flush:function(a){a.output&&0<a.output.length&&(E(H(a.output,0)),a.output=[])}},Ta={Da:function(a,b){null===b||10===b?(D(H(a.output,0)),a.output=[]):0!=b&&a.output.push(b)},flush:function(a){a.output&&0<a.output.length&&(D(H(a.output,0)),a.output=[])}},W={M:null,D:function(){return W.createNode(null,"/",16895,0)},createNode:function(a,
b,d,e){if(V.sb(d)||V.isFIFO(d))throw new V.s(63);W.M||(W.M={dir:{node:{J:W.u.J,G:W.u.G,lookup:W.u.lookup,O:W.u.O,rename:W.u.rename,unlink:W.u.unlink,rmdir:W.u.rmdir,readdir:W.u.readdir,symlink:W.u.symlink},stream:{K:W.A.K}},file:{node:{J:W.u.J,G:W.u.G},stream:{K:W.A.K,read:W.A.read,write:W.A.write,Z:W.A.Z,ba:W.A.ba,fa:W.A.fa}},link:{node:{J:W.u.J,G:W.u.G,readlink:W.u.readlink},stream:{}},Ka:{node:{J:W.u.J,G:W.u.G},stream:V.hb}});d=V.createNode(a,b,d,e);V.F(d.mode)?(d.u=W.M.dir.node,d.A=W.M.dir.stream,
d.v={}):V.isFile(d.mode)?(d.u=W.M.file.node,d.A=W.M.file.stream,d.C=0,d.v=null):V.aa(d.mode)?(d.u=W.M.link.node,d.A=W.M.link.stream):V.ha(d.mode)&&(d.u=W.M.Ka.node,d.A=W.M.Ka.stream);d.timestamp=Date.now();a&&(a.v[b]=d,a.timestamp=d.timestamp);return d},Pb:function(a){return a.v?a.v.subarray?a.v.subarray(0,a.C):new Uint8Array(a.v):new Uint8Array(0)},Qa:function(a,b){var d=a.v?a.v.length:0;d>=b||(b=Math.max(b,d*(1048576>d?2:1.125)>>>0),0!=d&&(b=Math.max(b,256)),d=a.v,a.v=new Uint8Array(b),0<a.C&&a.v.set(d.subarray(0,
a.C),0))},Cb:function(a,b){if(a.C!=b)if(0==b)a.v=null,a.C=0;else{var d=a.v;a.v=new Uint8Array(b);d&&a.v.set(d.subarray(0,Math.min(b,a.C)));a.C=b}},u:{J:function(a){var b={};b.dev=V.ha(a.mode)?a.id:1;b.ino=a.id;b.mode=a.mode;b.nlink=1;b.uid=0;b.gid=0;b.rdev=a.rdev;V.F(a.mode)?b.size=4096:V.isFile(a.mode)?b.size=a.C:V.aa(a.mode)?b.size=a.link.length:b.size=0;b.atime=new Date(a.timestamp);b.mtime=new Date(a.timestamp);b.ctime=new Date(a.timestamp);b.fb=4096;b.blocks=Math.ceil(b.size/b.fb);return b},
G:function(a,b){void 0!==b.mode&&(a.mode=b.mode);void 0!==b.timestamp&&(a.timestamp=b.timestamp);void 0!==b.size&&W.Cb(a,b.size)},lookup:function(){throw V.ta[44];},O:function(a,b,d,e){return W.createNode(a,b,d,e)},rename:function(a,b,d){if(V.F(a.mode)){try{var e=V.N(b,d)}catch(g){}if(e)for(var f in e.v)throw new V.s(55);}delete a.parent.v[a.name];a.parent.timestamp=Date.now();a.name=d;b.v[d]=a;b.timestamp=a.parent.timestamp;a.parent=b},unlink:function(a,b){delete a.v[b];a.timestamp=Date.now()},rmdir:function(a,
b){var d=V.N(a,b),e;for(e in d.v)throw new V.s(55);delete a.v[b];a.timestamp=Date.now()},readdir:function(a){var b=[".",".."],d;for(d in a.v)a.v.hasOwnProperty(d)&&b.push(d);return b},symlink:function(a,b,d){a=W.createNode(a,b,41471,0);a.link=d;return a},readlink:function(a){if(!V.aa(a.mode))throw new V.s(28);return a.link}},A:{read:function(a,b,d,e,f){var g=a.node.v;if(f>=a.node.C)return 0;a=Math.min(a.node.C-f,e);if(8<a&&g.subarray)b.set(g.subarray(f,f+a),d);else for(e=0;e<a;e++)b[d+e]=g[f+e];return a},
write:function(a,b,d,e,f,g){if(!e)return 0;a=a.node;a.timestamp=Date.now();if(b.subarray&&(!a.v||a.v.subarray)){if(g)return a.v=b.subarray(d,d+e),a.C=e;if(0===a.C&&0===f)return a.v=b.slice(d,d+e),a.C=e;if(f+e<=a.C)return a.v.set(b.subarray(d,d+e),f),e}W.Qa(a,f+e);if(a.v.subarray&&b.subarray)a.v.set(b.subarray(d,d+e),f);else for(g=0;g<e;g++)a.v[f+g]=b[d+g];a.C=Math.max(a.C,f+e);return e},K:function(a,b,d){1===d?b+=a.position:2===d&&V.isFile(a.node.mode)&&(b+=a.node.C);if(0>b)throw new V.s(28);return b},
Z:function(a,b,d){W.Qa(a.node,b+d);a.node.C=Math.max(a.node.C,b+d)},ba:function(a,b,d,e,f,g){if(0!==b)throw new V.s(28);if(!V.isFile(a.node.mode))throw new V.s(43);a=a.node.v;if(g&2||a.buffer!==pa){if(0<e||e+d<a.length)a.subarray?a=a.subarray(e,e+d):a=Array.prototype.slice.call(a,e,e+d);e=!0;G();d=void 0;if(!d)throw new V.s(48);I.set(a,d)}else e=!1,d=a.byteOffset;return{Wb:d,Hb:e}},fa:function(a,b,d,e,f){if(!V.isFile(a.node.mode))throw new V.s(43);if(f&2)return 0;W.A.write(a,b,0,e,d,!1);return 0}}};
function Ua(a,b,d){var e="al "+a;z(a,function(f){f||G('Loading data file "'+a+'" failed (no arrayBuffer).');b(new Uint8Array(f));e&&Aa()},function(){if(d)d();else throw'Loading data file "'+a+'" failed.';});e&&za()}
var V={root:null,ea:[],Oa:{},streams:[],xb:1,L:null,Na:"/",xa:!1,Ya:!0,s:null,ta:{},pb:null,na:0,B:(a,b={})=>{a=U(V.cwd(),a);if(!a)return{path:"",node:null};b=Object.assign({sa:!0,Fa:0},b);if(8<b.Fa)throw new V.s(32);a=Ja(a.split("/").filter(k=>!!k),!1);for(var d=V.root,e="/",f=0;f<a.length;f++){var g=f===a.length-1;if(g&&b.parent)break;d=V.N(d,a[f]);e=R(e+"/"+a[f]);V.S(d)&&(!g||g&&b.sa)&&(d=d.da.root);if(!g||b.I)for(g=0;V.aa(d.mode);)if(d=V.readlink(e),e=U(Ka(e),d),d=V.B(e,{Fa:b.Fa+1}).node,40<g++)throw new V.s(32);
}return{path:e,node:d}},R:a=>{for(var b;;){if(V.ia(a))return a=a.D.Za,b?"/"!==a[a.length-1]?a+"/"+b:a+b:a;b=b?a.name+"/"+b:a.name;a=a.parent}},wa:(a,b)=>{for(var d=0,e=0;e<b.length;e++)d=(d<<5)-d+b.charCodeAt(e)|0;return(a+d>>>0)%V.L.length},Wa:a=>{var b=V.wa(a.parent.id,a.name);a.U=V.L[b];V.L[b]=a},Xa:a=>{var b=V.wa(a.parent.id,a.name);if(V.L[b]===a)V.L[b]=a.U;else for(b=V.L[b];b;){if(b.U===a){b.U=a.U;break}b=b.U}},N:(a,b)=>{var d=V.ub(a);if(d)throw new V.s(d,a);for(d=V.L[V.wa(a.id,b)];d;d=d.U){var e=
d.name;if(d.parent.id===a.id&&e===b)return d}return V.lookup(a,b)},createNode:(a,b,d,e)=>{a=new V.ab(a,b,d,e);V.Wa(a);return a},ra:a=>{V.Xa(a)},ia:a=>a===a.parent,S:a=>!!a.da,isFile:a=>32768===(a&61440),F:a=>16384===(a&61440),aa:a=>40960===(a&61440),ha:a=>8192===(a&61440),sb:a=>24576===(a&61440),isFIFO:a=>4096===(a&61440),isSocket:a=>49152===(a&49152),qb:{r:0,"r+":2,w:577,"w+":578,a:1089,"a+":1090},wb:a=>{var b=V.qb[a];if("undefined"==typeof b)throw Error("Unknown file open mode: "+a);return b},Ra:a=>
{var b=["r","w","rw"][a&3];a&512&&(b+="w");return b},V:(a,b)=>{if(V.Ya)return 0;if(!b.includes("r")||a.mode&292){if(b.includes("w")&&!(a.mode&146)||b.includes("x")&&!(a.mode&73))return 2}else return 2;return 0},ub:a=>{var b=V.V(a,"x");return b?b:a.u.lookup?0:2},Ca:(a,b)=>{try{return V.N(a,b),20}catch(d){}return V.V(a,"wx")},ja:(a,b,d)=>{try{var e=V.N(a,b)}catch(f){return f.H}if(a=V.V(a,"wx"))return a;if(d){if(!V.F(e.mode))return 54;if(V.ia(e)||V.R(e)===V.cwd())return 10}else if(V.F(e.mode))return 31;
return 0},vb:(a,b)=>a?V.aa(a.mode)?32:V.F(a.mode)&&("r"!==V.Ra(b)||b&512)?31:V.V(a,V.Ra(b)):44,bb:4096,yb:(a=0,b=V.bb)=>{for(;a<=b;a++)if(!V.streams[a])return a;throw new V.s(33);},W:a=>V.streams[a],Ma:(a,b,d)=>{V.oa||(V.oa=function(){this.ma={}},V.oa.prototype={object:{get:function(){return this.node},set:function(e){this.node=e}},flags:{get:function(){return this.ma.flags},set:function(e){this.ma.flags=e}},position:{get Ob(){return this.ma.position},set:function(e){this.ma.position=e}}});a=Object.assign(new V.oa,
a);b=V.yb(b,d);a.fd=b;return V.streams[b]=a},ib:a=>{V.streams[a]=null},hb:{open:a=>{a.A=V.rb(a.node.rdev).A;a.A.open&&a.A.open(a)},K:()=>{throw new V.s(70);}},Ba:a=>a>>8,Sb:a=>a&255,T:(a,b)=>a<<8|b,Ga:(a,b)=>{V.Oa[a]={A:b}},rb:a=>V.Oa[a],Ta:a=>{var b=[];for(a=[a];a.length;){var d=a.pop();b.push(d);a.push.apply(a,d.ea)}return b},$a:(a,b)=>{function d(k){V.na--;return b(k)}function e(k){if(k){if(!e.ob)return e.ob=!0,d(k)}else++g>=f.length&&d(null)}"function"==typeof a&&(b=a,a=!1);V.na++;1<V.na&&D("warning: "+
V.na+" FS.syncfs operations in flight at once, probably just doing extra work");var f=V.Ta(V.root.D),g=0;f.forEach(k=>{if(!k.type.$a)return e(null);k.type.$a(k,a,e)})},D:(a,b,d)=>{var e="/"===d,f=!d;if(e&&V.root)throw new V.s(10);if(!e&&!f){var g=V.B(d,{sa:!1});d=g.path;g=g.node;if(V.S(g))throw new V.s(10);if(!V.F(g.mode))throw new V.s(54);}b={type:a,Vb:b,Za:d,ea:[]};a=a.D(b);a.D=b;b.root=a;e?V.root=a:g&&(g.da=b,g.D&&g.D.ea.push(b));return a},Zb:a=>{a=V.B(a,{sa:!1});if(!V.S(a.node))throw new V.s(28);
a=a.node;var b=a.da,d=V.Ta(b);Object.keys(V.L).forEach(e=>{for(e=V.L[e];e;){var f=e.U;d.includes(e.D)&&V.ra(e);e=f}});a.da=null;a.D.ea.splice(a.D.ea.indexOf(b),1)},lookup:(a,b)=>a.u.lookup(a,b),O:(a,b,d)=>{var e=V.B(a,{parent:!0}).node;a=S(a);if(!a||"."===a||".."===a)throw new V.s(28);var f=V.Ca(e,a);if(f)throw new V.s(f);if(!e.u.O)throw new V.s(63);return e.u.O(e,a,b,d)},create:(a,b)=>V.O(a,(void 0!==b?b:438)&4095|32768,0),mkdir:(a,b)=>V.O(a,(void 0!==b?b:511)&1023|16384,0),Tb:(a,b)=>{a=a.split("/");
for(var d="",e=0;e<a.length;++e)if(a[e]){d+="/"+a[e];try{V.mkdir(d,b)}catch(f){if(20!=f.H)throw f;}}},ka:(a,b,d)=>{"undefined"==typeof d&&(d=b,b=438);return V.O(a,b|8192,d)},symlink:(a,b)=>{if(!U(a))throw new V.s(44);var d=V.B(b,{parent:!0}).node;if(!d)throw new V.s(44);b=S(b);var e=V.Ca(d,b);if(e)throw new V.s(e);if(!d.u.symlink)throw new V.s(63);return d.u.symlink(d,b,a)},rename:(a,b)=>{var d=Ka(a),e=Ka(b),f=S(a),g=S(b);var k=V.B(a,{parent:!0});var m=k.node;k=V.B(b,{parent:!0});k=k.node;if(!m||
!k)throw new V.s(44);if(m.D!==k.D)throw new V.s(75);var n=V.N(m,f);a=Na(a,e);if("."!==a.charAt(0))throw new V.s(28);a=Na(b,d);if("."!==a.charAt(0))throw new V.s(55);try{var l=V.N(k,g)}catch(p){}if(n!==l){b=V.F(n.mode);if(f=V.ja(m,f,b))throw new V.s(f);if(f=l?V.ja(k,g,b):V.Ca(k,g))throw new V.s(f);if(!m.u.rename)throw new V.s(63);if(V.S(n)||l&&V.S(l))throw new V.s(10);if(k!==m&&(f=V.V(m,"w")))throw new V.s(f);V.Xa(n);try{m.u.rename(n,k,g)}catch(p){throw p;}finally{V.Wa(n)}}},rmdir:a=>{var b=V.B(a,
{parent:!0}).node;a=S(a);var d=V.N(b,a),e=V.ja(b,a,!0);if(e)throw new V.s(e);if(!b.u.rmdir)throw new V.s(63);if(V.S(d))throw new V.s(10);b.u.rmdir(b,a);V.ra(d)},readdir:a=>{a=V.B(a,{I:!0}).node;if(!a.u.readdir)throw new V.s(54);return a.u.readdir(a)},unlink:a=>{var b=V.B(a,{parent:!0}).node;if(!b)throw new V.s(44);a=S(a);var d=V.N(b,a),e=V.ja(b,a,!1);if(e)throw new V.s(e);if(!b.u.unlink)throw new V.s(63);if(V.S(d))throw new V.s(10);b.u.unlink(b,a);V.ra(d)},readlink:a=>{a=V.B(a).node;if(!a)throw new V.s(44);
if(!a.u.readlink)throw new V.s(28);return U(V.R(a.parent),a.u.readlink(a))},stat:(a,b)=>{a=V.B(a,{I:!b}).node;if(!a)throw new V.s(44);if(!a.u.J)throw new V.s(63);return a.u.J(a)},lstat:a=>V.stat(a,!0),chmod:(a,b,d)=>{a="string"==typeof a?V.B(a,{I:!d}).node:a;if(!a.u.G)throw new V.s(63);a.u.G(a,{mode:b&4095|a.mode&-4096,timestamp:Date.now()})},lchmod:(a,b)=>{V.chmod(a,b,!0)},fchmod:(a,b)=>{a=V.W(a);if(!a)throw new V.s(8);V.chmod(a.node,b)},chown:(a,b,d,e)=>{a="string"==typeof a?V.B(a,{I:!e}).node:
a;if(!a.u.G)throw new V.s(63);a.u.G(a,{timestamp:Date.now()})},lchown:(a,b,d)=>{V.chown(a,b,d,!0)},fchown:(a,b,d)=>{a=V.W(a);if(!a)throw new V.s(8);V.chown(a.node,b,d)},truncate:(a,b)=>{if(0>b)throw new V.s(28);a="string"==typeof a?V.B(a,{I:!0}).node:a;if(!a.u.G)throw new V.s(63);if(V.F(a.mode))throw new V.s(31);if(!V.isFile(a.mode))throw new V.s(28);var d=V.V(a,"w");if(d)throw new V.s(d);a.u.G(a,{size:b,timestamp:Date.now()})},Mb:(a,b)=>{a=V.W(a);if(!a)throw new V.s(8);if(0===(a.flags&2097155))throw new V.s(28);
V.truncate(a.node,b)},$b:(a,b,d)=>{a=V.B(a,{I:!0}).node;a.u.G(a,{timestamp:Math.max(b,d)})},open:(a,b,d)=>{if(""===a)throw new V.s(44);b="string"==typeof b?V.wb(b):b;d=b&64?("undefined"==typeof d?438:d)&4095|32768:0;if("object"==typeof a)var e=a;else{a=R(a);try{e=V.B(a,{I:!(b&131072)}).node}catch(g){}}var f=!1;if(b&64)if(e){if(b&128)throw new V.s(20);}else e=V.O(a,d,0),f=!0;if(!e)throw new V.s(44);V.ha(e.mode)&&(b&=-513);if(b&65536&&!V.F(e.mode))throw new V.s(54);if(!f&&(d=V.vb(e,b)))throw new V.s(d);
b&512&&!f&&V.truncate(e,0);b&=-131713;e=V.Ma({node:e,path:V.R(e),flags:b,seekable:!0,position:0,A:e.A,Gb:[],error:!1});e.A.open&&e.A.open(e);!c.logReadFiles||b&1||(V.Ea||(V.Ea={}),a in V.Ea||(V.Ea[a]=1));return e},close:a=>{if(V.$(a))throw new V.s(8);a.va&&(a.va=null);try{a.A.close&&a.A.close(a)}catch(b){throw b;}finally{V.ib(a.fd)}a.fd=null},$:a=>null===a.fd,K:(a,b,d)=>{if(V.$(a))throw new V.s(8);if(!a.seekable||!a.A.K)throw new V.s(70);if(0!=d&&1!=d&&2!=d)throw new V.s(28);a.position=a.A.K(a,b,
d);a.Gb=[];return a.position},read:(a,b,d,e,f)=>{if(0>e||0>f)throw new V.s(28);if(V.$(a))throw new V.s(8);if(1===(a.flags&2097155))throw new V.s(8);if(V.F(a.node.mode))throw new V.s(31);if(!a.A.read)throw new V.s(28);var g="undefined"!=typeof f;if(!g)f=a.position;else if(!a.seekable)throw new V.s(70);b=a.A.read(a,b,d,e,f);g||(a.position+=b);return b},write:(a,b,d,e,f,g)=>{if(0>e||0>f)throw new V.s(28);if(V.$(a))throw new V.s(8);if(0===(a.flags&2097155))throw new V.s(8);if(V.F(a.node.mode))throw new V.s(31);
if(!a.A.write)throw new V.s(28);a.seekable&&a.flags&1024&&V.K(a,0,2);var k="undefined"!=typeof f;if(!k)f=a.position;else if(!a.seekable)throw new V.s(70);b=a.A.write(a,b,d,e,f,g);k||(a.position+=b);return b},Z:(a,b,d)=>{if(V.$(a))throw new V.s(8);if(0>b||0>=d)throw new V.s(28);if(0===(a.flags&2097155))throw new V.s(8);if(!V.isFile(a.node.mode)&&!V.F(a.node.mode))throw new V.s(43);if(!a.A.Z)throw new V.s(138);a.A.Z(a,b,d)},ba:(a,b,d,e,f,g)=>{if(0!==(f&2)&&0===(g&2)&&2!==(a.flags&2097155))throw new V.s(2);
if(1===(a.flags&2097155))throw new V.s(2);if(!a.A.ba)throw new V.s(43);return a.A.ba(a,b,d,e,f,g)},fa:(a,b,d,e,f)=>a&&a.A.fa?a.A.fa(a,b,d,e,f):0,Ub:()=>0,ya:(a,b,d)=>{if(!a.A.ya)throw new V.s(59);return a.A.ya(a,b,d)},readFile:(a,b={})=>{b.flags=b.flags||0;b.encoding=b.encoding||"binary";if("utf8"!==b.encoding&&"binary"!==b.encoding)throw Error('Invalid encoding type "'+b.encoding+'"');var d,e=V.open(a,b.flags);a=V.stat(a).size;var f=new Uint8Array(a);V.read(e,f,0,a,0);"utf8"===b.encoding?d=H(f,0):
"binary"===b.encoding&&(d=f);V.close(e);return d},writeFile:(a,b,d={})=>{d.flags=d.flags||577;a=V.open(a,d.flags,d.mode);if("string"==typeof b){var e=new Uint8Array(ma(b)+1);b=la(b,e,0,e.length);V.write(a,e,0,b,void 0,d.gb)}else if(ArrayBuffer.isView(b))V.write(a,b,0,b.byteLength,void 0,d.gb);else throw Error("Unsupported data type");V.close(a)},cwd:()=>V.Na,chdir:a=>{a=V.B(a,{I:!0});if(null===a.node)throw new V.s(44);if(!V.F(a.node.mode))throw new V.s(54);var b=V.V(a.node,"x");if(b)throw new V.s(b);
V.Na=a.path},kb:()=>{V.mkdir("/tmp");V.mkdir("/home");V.mkdir("/home/web_user")},jb:()=>{V.mkdir("/dev");V.Ga(V.T(1,3),{read:()=>0,write:(b,d,e,f)=>f});V.ka("/dev/null",V.T(1,3));Pa(V.T(5,0),Sa);Pa(V.T(6,0),Ta);V.ka("/dev/tty",V.T(5,0));V.ka("/dev/tty1",V.T(6,0));var a=Ma();V.P("/dev","random",a);V.P("/dev","urandom",a);V.mkdir("/dev/shm");V.mkdir("/dev/shm/tmp")},mb:()=>{V.mkdir("/proc");var a=V.mkdir("/proc/self");V.mkdir("/proc/self/fd");V.D({D:()=>{var b=V.createNode(a,"fd",16895,73);b.u={lookup:(d,
e)=>{var f=V.W(+e);if(!f)throw new V.s(8);d={parent:null,D:{Za:"fake"},u:{readlink:()=>f.path}};return d.parent=d}};return b}},{},"/proc/self/fd")},nb:()=>{c.stdin?V.P("/dev","stdin",c.stdin):V.symlink("/dev/tty","/dev/stdin");c.stdout?V.P("/dev","stdout",null,c.stdout):V.symlink("/dev/tty","/dev/stdout");c.stderr?V.P("/dev","stderr",null,c.stderr):V.symlink("/dev/tty1","/dev/stderr");V.open("/dev/stdin",0);V.open("/dev/stdout",1);V.open("/dev/stderr",1)},Pa:()=>{V.s||(V.s=function(a,b){this.node=
b;this.Db=function(d){this.H=d};this.Db(a);this.message="FS error"},V.s.prototype=Error(),V.s.prototype.constructor=V.s,[44].forEach(a=>{V.ta[a]=new V.s(a);V.ta[a].stack="<generic error, no stack>"}))},Eb:()=>{V.Pa();V.L=Array(4096);V.D(W,{},"/");V.kb();V.jb();V.mb();V.pb={MEMFS:W}},ga:(a,b,d)=>{V.ga.xa=!0;V.Pa();c.stdin=a||c.stdin;c.stdout=b||c.stdout;c.stderr=d||c.stderr;V.nb()},Xb:()=>{V.ga.xa=!1;for(var a=0;a<V.streams.length;a++){var b=V.streams[a];b&&V.close(b)}},ua:(a,b)=>{var d=0;a&&(d|=365);
b&&(d|=146);return d},Lb:(a,b)=>{a=V.pa(a,b);return a.exists?a.object:null},pa:(a,b)=>{try{var d=V.B(a,{I:!b});a=d.path}catch(f){}var e={ia:!1,exists:!1,error:0,name:null,path:null,object:null,zb:!1,Bb:null,Ab:null};try{d=V.B(a,{parent:!0}),e.zb=!0,e.Bb=d.path,e.Ab=d.node,e.name=S(a),d=V.B(a,{I:!b}),e.exists=!0,e.path=d.path,e.object=d.node,e.name=d.node.name,e.ia="/"===d.path}catch(f){e.error=f.H}return e},Jb:(a,b)=>{a="string"==typeof a?a:V.R(a);for(b=b.split("/").reverse();b.length;){var d=b.pop();
if(d){var e=R(a+"/"+d);try{V.mkdir(e)}catch(f){}a=e}}return e},lb:(a,b,d,e,f)=>{a="string"==typeof a?a:V.R(a);b=R(a+"/"+b);return V.create(b,V.ua(e,f))},La:(a,b,d,e,f,g)=>{var k=b;a&&(a="string"==typeof a?a:V.R(a),k=b?R(a+"/"+b):a);a=V.ua(e,f);k=V.create(k,a);if(d){if("string"==typeof d){b=Array(d.length);e=0;for(f=d.length;e<f;++e)b[e]=d.charCodeAt(e);d=b}V.chmod(k,a|146);b=V.open(k,577);V.write(b,d,0,d.length,0,g);V.close(b);V.chmod(k,a)}return k},P:(a,b,d,e)=>{a=La("string"==typeof a?a:V.R(a),
b);b=V.ua(!!d,!!e);V.P.Ba||(V.P.Ba=64);var f=V.T(V.P.Ba++,0);V.Ga(f,{open:g=>{g.seekable=!1},close:()=>{e&&e.buffer&&e.buffer.length&&e(10)},read:(g,k,m,n)=>{for(var l=0,p=0;p<n;p++){try{var r=d()}catch(t){throw new V.s(29);}if(void 0===r&&0===l)throw new V.s(6);if(null===r||void 0===r)break;l++;k[m+p]=r}l&&(g.node.timestamp=Date.now());return l},write:(g,k,m,n)=>{for(var l=0;l<n;l++)try{e(k[m+l])}catch(p){throw new V.s(29);}n&&(g.node.timestamp=Date.now());return l}});return V.ka(a,b,f)},Sa:a=>{if(a.za||
a.tb||a.link||a.v)return!0;if("undefined"!=typeof XMLHttpRequest)throw Error("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.");if(y)try{a.v=Ra(y(a.url)),a.C=a.v.length}catch(b){throw new V.s(29);}else throw Error("Cannot load without read() or XMLHttpRequest.");},Ib:(a,b,d,e,f)=>{function g(){this.Aa=!1;this.la=[]}g.prototype.get=function(l){if(!(l>this.length-
1||0>l)){var p=l%this.chunkSize;return this.Va(l/this.chunkSize|0)[p]}};g.prototype.Fb=function(l){this.Va=l};g.prototype.Ja=function(){var l=new XMLHttpRequest;l.open("HEAD",d,!1);l.send(null);if(!(200<=l.status&&300>l.status||304===l.status))throw Error("Couldn't load "+d+". Status: "+l.status);var p=Number(l.getResponseHeader("Content-length")),r,t=(r=l.getResponseHeader("Accept-Ranges"))&&"bytes"===r;l=(r=l.getResponseHeader("Content-Encoding"))&&"gzip"===r;var v=1048576;t||(v=p);var u=this;u.Fb(J=>
{var T=J*v,K=(J+1)*v-1;K=Math.min(K,p-1);if("undefined"==typeof u.la[J]){var ab=u.la;if(T>K)throw Error("invalid range ("+T+", "+K+") or no bytes requested!");if(K>p-1)throw Error("only "+p+" bytes available! programmer error!");var w=new XMLHttpRequest;w.open("GET",d,!1);p!==v&&w.setRequestHeader("Range","bytes="+T+"-"+K);w.responseType="arraybuffer";w.overrideMimeType&&w.overrideMimeType("text/plain; charset=x-user-defined");w.send(null);if(!(200<=w.status&&300>w.status||304===w.status))throw Error("Couldn't load "+
d+". Status: "+w.status);T=void 0!==w.response?new Uint8Array(w.response||[]):Ra(w.responseText||"");ab[J]=T}if("undefined"==typeof u.la[J])throw Error("doXHR failed!");return u.la[J]});if(l||!p)v=p=1,v=p=this.Va(0).length,E("LazyFiles on gzip forces download of the whole file when length is accessed");this.eb=p;this.cb=v;this.Aa=!0};if("undefined"!=typeof XMLHttpRequest){if(!q)throw"Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc";
var k=new g;Object.defineProperties(k,{length:{get:function(){this.Aa||this.Ja();return this.eb}},chunkSize:{get:function(){this.Aa||this.Ja();return this.cb}}});k={za:!1,v:k}}else k={za:!1,url:d};var m=V.lb(a,b,k,e,f);k.v?m.v=k.v:k.url&&(m.v=null,m.url=k.url);Object.defineProperties(m,{C:{get:function(){return this.v.length}}});var n={};Object.keys(m.A).forEach(l=>{var p=m.A[l];n[l]=function(){V.Sa(m);return p.apply(null,arguments)}});n.read=(l,p,r,t,v)=>{V.Sa(m);l=l.node.v;if(v>=l.length)return 0;
t=Math.min(l.length-v,t);if(l.slice)for(var u=0;u<t;u++)p[r+u]=l[v+u];else for(u=0;u<t;u++)p[r+u]=l.get(v+u);return t};m.A=n;return m},Kb:(a,b,d,e,f,g,k,m,n,l)=>{function p(t){function v(u){l&&l();m||V.La(a,b,u,e,f,n);g&&g();Aa()}Va.Qb(t,r,v,()=>{k&&k();Aa()})||v(t)}var r=b?U(R(a+"/"+b)):a;za();"string"==typeof d?Ua(d,t=>p(t),k):p(d)},indexedDB:()=>window.indexedDB||window.mozIndexedDB||window.webkitIndexedDB||window.msIndexedDB,Ha:()=>"EM_FS_"+window.location.pathname,Ia:20,Y:"FILE_DATA",Yb:(a,b,
d)=>{b=b||(()=>{});d=d||(()=>{});var e=V.indexedDB();try{var f=e.open(V.Ha(),V.Ia)}catch(g){return d(g)}f.onupgradeneeded=()=>{E("creating db");f.result.createObjectStore(V.Y)};f.onsuccess=()=>{var g=f.result.transaction([V.Y],"readwrite"),k=g.objectStore(V.Y),m=0,n=0,l=a.length;a.forEach(p=>{p=k.put(V.pa(p).object.v,p);p.onsuccess=()=>{m++;m+n==l&&(0==n?b():d())};p.onerror=()=>{n++;m+n==l&&(0==n?b():d())}});g.onerror=d};f.onerror=d},Rb:(a,b,d)=>{b=b||(()=>{});d=d||(()=>{});var e=V.indexedDB();try{var f=
e.open(V.Ha(),V.Ia)}catch(g){return d(g)}f.onupgradeneeded=d;f.onsuccess=()=>{var g=f.result;try{var k=g.transaction([V.Y],"readonly")}catch(r){d(r);return}var m=k.objectStore(V.Y),n=0,l=0,p=a.length;a.forEach(r=>{var t=m.get(r);t.onsuccess=()=>{V.pa(r).exists&&V.unlink(r);V.La(Ka(r),S(r),t.result,!0,!0,!0);n++;n+l==p&&(0==l?b():d())};t.onerror=()=>{l++;n+l==p&&(0==l?b():d())}});k.onerror=d};f.onerror=d}},X=void 0;function Y(){X+=4;return L[X-4>>2]}
function Z(a){a=V.W(a);if(!a)throw new V.s(8);return a}function Wa(a,b,d,e){a||(a=this);this.parent=a;this.D=a.D;this.da=null;this.id=V.xb++;this.name=b;this.mode=d;this.u={};this.A={};this.rdev=e}Object.defineProperties(Wa.prototype,{read:{get:function(){return 365===(this.mode&365)},set:function(a){a?this.mode|=365:this.mode&=-366}},write:{get:function(){return 146===(this.mode&146)},set:function(a){a?this.mode|=146:this.mode&=-147}},tb:{get:function(){return V.F(this.mode)}},za:{get:function(){return V.ha(this.mode)}}});
V.ab=Wa;V.Eb();var Va;function Ra(a){var b=Array(ma(a)+1);a=la(a,b,0,b.length);b.length=a;return b}
var Ya={c:function(a,b,d){X=d;try{var e=Z(a);switch(b){case 0:var f=Y();return 0>f?-28:V.Ma(e,f).fd;case 1:case 2:return 0;case 3:return e.flags;case 4:return f=Y(),e.flags|=f,0;case 5:return f=Y(),ra[f+0>>1]=2,0;case 6:case 7:return 0;case 16:case 8:return-28;case 9:return L[Xa()>>2]=28,-1;default:return-28}}catch(g){if("undefined"==typeof V||!(g instanceof V.s))throw g;return-g.H}},g:function(a,b,d){X=d;try{var e=Z(a);switch(b){case 21509:case 21505:return e.tty?0:-59;case 21510:case 21511:case 21512:case 21506:case 21507:case 21508:return e.tty?
0:-59;case 21519:if(!e.tty)return-59;var f=Y();return L[f>>2]=0;case 21520:return e.tty?-28:-59;case 21531:return f=Y(),V.ya(e,b,f);case 21523:return e.tty?0:-59;case 21524:return e.tty?0:-59;default:G("bad ioctl syscall "+b)}}catch(g){if("undefined"==typeof V||!(g instanceof V.s))throw g;return-g.H}},h:function(a,b,d,e){X=e;try{b=b?H(qa,b):"";var f=b;if("/"===f.charAt(0))b=f;else{if(-100===a)var g=V.cwd();else{var k=V.W(a);if(!k)throw new V.s(8);g=k.path}if(0==f.length)throw new V.s(44);b=R(g+"/"+
f)}var m=e?Y():0;return V.open(b,d,m).fd}catch(n){if("undefined"==typeof V||!(n instanceof V.s))throw n;return-n.H}},i:function(a,b,d){qa.copyWithin(a,b,b+d)},e:function(){G("OOM")},a:function(a){try{var b=Z(a);V.close(b);return 0}catch(d){if("undefined"==typeof V||!(d instanceof V.s))throw d;return d.H}},f:function(a,b,d,e){try{a:{var f=Z(a);a=b;for(var g=b=0;g<d;g++){var k=M[a>>2],m=M[a+4>>2];a+=8;var n=V.read(f,I,k,m,void 0);if(0>n){var l=-1;break a}b+=n;if(n<m)break}l=b}L[e>>2]=l;return 0}catch(p){if("undefined"==
typeof V||!(p instanceof V.s))throw p;return p.H}},d:function(a,b,d,e,f){try{var g=Z(a);a=4294967296*d+(b>>>0);if(-9007199254740992>=a||9007199254740992<=a)return 61;V.K(g,a,e);Fa=[g.position>>>0,(Q=g.position,1<=+Math.abs(Q)?0<Q?(Math.min(+Math.floor(Q/4294967296),4294967295)|0)>>>0:~~+Math.ceil((Q-+(~~Q>>>0))/4294967296)>>>0:0)];L[f>>2]=Fa[0];L[f+4>>2]=Fa[1];g.va&&0===a&&0===e&&(g.va=null);return 0}catch(k){if("undefined"==typeof V||!(k instanceof V.s))throw k;return k.H}},b:function(a,b,d,e){try{a:{var f=
Z(a);a=b;for(var g=b=0;g<d;g++){var k=M[a>>2],m=M[a+4>>2];a+=8;var n=V.write(f,I,k,m,void 0);if(0>n){var l=-1;break a}b+=n}l=b}L[e>>2]=l;return 0}catch(p){if("undefined"==typeof V||!(p instanceof V.s))throw p;return p.H}}};
(function(){function a(f){c.asm=f.exports;ha=c.asm.j;pa=f=ha.buffer;c.HEAP8=I=new Int8Array(f);c.HEAP16=ra=new Int16Array(f);c.HEAP32=L=new Int32Array(f);c.HEAPU8=qa=new Uint8Array(f);c.HEAPU16=new Uint16Array(f);c.HEAPU32=M=new Uint32Array(f);c.HEAPF32=new Float32Array(f);c.HEAPF64=new Float64Array(f);sa=c.asm.m;ua.unshift(c.asm.k);Aa()}function b(f){a(f.instance)}function d(f){return Ea().then(function(g){return WebAssembly.instantiate(g,e)}).then(function(g){return g}).then(f,function(g){D("failed to asynchronously prepare wasm: "+
g);G(g)})}var e={a:Ya};za();if(c.instantiateWasm)try{return c.instantiateWasm(e,a)}catch(f){return D("Module.instantiateWasm callback failed with error: "+f),!1}(function(){return F||"function"!=typeof WebAssembly.instantiateStreaming||Ba()||P.startsWith("file://")||"function"!=typeof fetch?d(b):fetch(P,{credentials:"same-origin"}).then(function(f){return WebAssembly.instantiateStreaming(f,e).then(b,function(g){D("wasm streaming compile failed: "+g);D("falling back to ArrayBuffer instantiation");
return d(b)})})})();return{}})();c.___wasm_call_ctors=function(){return(c.___wasm_call_ctors=c.asm.k).apply(null,arguments)};c._main=function(){return(c._main=c.asm.l).apply(null,arguments)};var Xa=c.___errno_location=function(){return(Xa=c.___errno_location=c.asm.n).apply(null,arguments)},oa=c.stackAlloc=function(){return(oa=c.stackAlloc=c.asm.o).apply(null,arguments)};c.callMain=Za;c.FS=V;var $a;
function C(a){this.name="ExitStatus";this.message="Program terminated with exit("+a+")";this.status=a}O=function bb(){$a||cb();$a||(O=bb)};function Za(a){var b=c._main;a=a||[];var d=a.length+1,e=oa(4*(d+1));L[e>>2]=na(ca);for(var f=1;f<d;f++)L[(e>>2)+f]=na(a[f-1]);L[(e>>2)+d]=0;try{var g=b(d,e);ja=ja=g;if(!noExitRuntime){if(c.onExit)c.onExit(g);ia=!0}h(g,new C(g));return g}catch(m){if(m instanceof C||"unwind"==m)var k=ja;else h(1,m),k=void 0;return k}finally{}}
function cb(a){function b(){if(!$a&&($a=!0,c.calledRun=!0,!ia)){c.noFSInit||V.ga.xa||V.ga();V.Ya=!1;Ga(ua);Ga(va);if(c.onRuntimeInitialized)c.onRuntimeInitialized();db&&Za(a);if(c.postRun)for("function"==typeof c.postRun&&(c.postRun=[c.postRun]);c.postRun.length;){var d=c.postRun.shift();wa.unshift(d)}Ga(wa)}}a=a||ba;if(!(0<N)){if(c.preRun)for("function"==typeof c.preRun&&(c.preRun=[c.preRun]);c.preRun.length;)xa();Ga(ta);0<N||(c.setStatus?(c.setStatus("Running..."),setTimeout(function(){setTimeout(function(){c.setStatus("")},
1);b()},1)):b())}}c.run=cb;if(c.preInit)for("function"==typeof c.preInit&&(c.preInit=[c.preInit]);0<c.preInit.length;)c.preInit.pop()();var db=!1;c.noInitialRun&&(db=!1);cb();module.exports=c;

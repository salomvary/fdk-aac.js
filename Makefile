PRE_JS = build/pre.js
POST_JS = build/post.js

AAC_ENC_OBJS = build/fdk-aac/aac-enc.o build/fdk-aac/wavreader.o 
AAC_ENC_SHARED_DEPS = build/fdk-aac/.libs/libfdk-aac.a

all: aac-enc.js fdk-aac.umd.js

clean:
	rm -f fdk-aac.umd.js aac-enc.js aac-enc.wasm
	cd build/fdk-aac && make clean

build/fdk-aac/configure:
	cd build/fdk-aac && ./autogen.sh

build/fdk-aac/.libs/libfdk-aac.a: build/fdk-aac/configure
	cd build/fdk-aac && \
	emconfigure ./configure --enable-example  && \
	emmake make

aac-enc.js: $(AAC_ENC_OBJS) $(AAC_ENC_SHARED_DEPS) $(PRE_JS) $(POST_JS)
	emcc $(AAC_ENC_OBJS) $(AAC_ENC_SHARED_DEPS) \
		--closure 1 -O3 \
		-s INVOKE_RUN=0 \
		-s EXPORTED_RUNTIME_METHODS=callMain,FS \
		--pre-js $(PRE_JS) \
		--post-js $(POST_JS) \
		-o $@

fdk-aac.umd.js: aac-enc.js fdk-aac.js
	npx browserify fdk-aac.js \
		--detect-globals=false \
		--no-builtins \
		--no-commondir \
		--insert-global-vars="nonexistent" \
		--standalone fdkAac \
		-o $@ 

// @ts-nocheck
/*
 * Adapted from binji/wasm-clang (shared.js)
 * Copyright 2020 WebAssembly Community Group participants
 * Licensed under the Apache License, Version 2.0
 * https://github.com/binji/wasm-clang
 *
 * 변경점:
 *  - IIFE 대신 ES 모듈로 export
 *  - 상태 로그(hostLog)와 프로그램 출력(hostWrite)을 분리 (stdout 오염 방지)
 *  - clang 인자에서 -fcolor-diagnostics 제거, -std=gnu++17 추가
 *  - canvas 전역 참조를 모듈 스코프 변수로 선언 (사용 안 함)
 */

let canvas = null;
let ctx2d = null;

function readStr(u8, o, len = -1) {
  let str = '';
  let end = u8.length;
  if (len != -1) end = o + len;
  for (let i = o; i < end && u8[i] != 0; ++i) str += String.fromCharCode(u8[i]);
  return str;
}

function getImportObject(obj, names) {
  const result = {};
  for (let name of names) result[name] = obj[name].bind(obj);
  return result;
}

function getInstance(module, imports) {
  return WebAssembly.instantiate(module, imports);
}

function msToSec(start, end) {
  return ((end - start) / 1000).toFixed(2);
}

function assert(cond) {
  if (!cond) throw new Error('assertion failed.');
}

const ESUCCESS = 0;

class ProcExit extends Error {
  constructor(code) {
    super(`process exited with code ${code}.`);
    this.code = code;
  }
}

class NotImplemented extends Error {
  constructor(modname, fieldname) {
    super(`${modname}.${fieldname} not implemented.`);
  }
}

class AbortError extends Error {
  constructor(msg = 'abort') { super(msg); }
}

class Memory {
  constructor(memory) {
    this.memory = memory;
    this.buffer = this.memory.buffer;
    this.u8 = new Uint8Array(this.buffer);
    this.u32 = new Uint32Array(this.buffer);
  }
  check() {
    if (this.buffer.byteLength === 0) {
      this.buffer = this.memory.buffer;
      this.u8 = new Uint8Array(this.buffer);
      this.u32 = new Uint32Array(this.buffer);
    }
  }
  read8(o) { return this.u8[o]; }
  read32(o) { return this.u32[o >> 2]; }
  write8(o, v) { this.u8[o] = v; }
  write32(o, v) { this.u32[o >> 2] = v; }
  write64(o, vlo, vhi = 0) { this.write32(o, vlo); this.write32(o + 4, vhi); }
  readStr(o, len) { return readStr(this.u8, o, len); }
  writeStr(o, str) {
    o += this.write(o, str);
    this.write8(o, 0);
    return str.length + 1;
  }
  write(o, buf) {
    if (buf instanceof ArrayBuffer) {
      return this.write(o, new Uint8Array(buf));
    } else if (typeof buf === 'string') {
      return this.write(o, buf.split('').map(x => x.charCodeAt(0)));
    } else {
      const dst = new Uint8Array(this.buffer, o, buf.length);
      dst.set(buf);
      return buf.length;
    }
  }
}

class MemFS {
  constructor(options) {
    const compileStreaming = options.compileStreaming;
    this.hostWrite = options.hostWrite;
    this.stdinStr = options.stdinStr || '';
    this.stdinStrPos = 0;
    this.memfsFilename = options.memfsFilename;
    this.hostMem_ = null;

    const env = getImportObject(this, [
      'abort', 'host_write', 'host_read', 'memfs_log', 'copy_in', 'copy_out',
    ]);

    this.ready = compileStreaming(this.memfsFilename)
      .then(module => WebAssembly.instantiate(module, { env }))
      .then(instance => {
        this.instance = instance;
        this.exports = instance.exports;
        this.mem = new Memory(this.exports.memory);
        this.exports.init();
      });
  }

  set hostMem(mem) { this.hostMem_ = mem; }

  setStdinStr(str) {
    this.stdinStr = str;
    this.stdinStrPos = 0;
  }

  addDirectory(path) {
    this.mem.check();
    this.mem.write(this.exports.GetPathBuf(), path);
    this.exports.AddDirectoryNode(path.length);
  }

  addFile(path, contents) {
    const length = contents instanceof ArrayBuffer ? contents.byteLength : contents.length;
    this.mem.check();
    this.mem.write(this.exports.GetPathBuf(), path);
    const inode = this.exports.AddFileNode(path.length, length);
    const addr = this.exports.GetFileNodeAddress(inode);
    this.mem.check();
    this.mem.write(addr, contents);
  }

  getFileContents(path) {
    this.mem.check();
    this.mem.write(this.exports.GetPathBuf(), path);
    const inode = this.exports.FindNode(path.length);
    const addr = this.exports.GetFileNodeAddress(inode);
    const size = this.exports.GetFileNodeSize(inode);
    return new Uint8Array(this.mem.buffer, addr, size);
  }

  abort() { throw new AbortError(); }

  host_write(fd, iovs, iovs_len, nwritten_out) {
    this.hostMem_.check();
    assert(fd <= 2);
    let size = 0;
    let str = '';
    for (let i = 0; i < iovs_len; ++i) {
      const buf = this.hostMem_.read32(iovs);
      iovs += 4;
      const len = this.hostMem_.read32(iovs);
      iovs += 4;
      str += this.hostMem_.readStr(buf, len);
      size += len;
    }
    this.hostMem_.write32(nwritten_out, size);
    this.hostWrite(str);
    return ESUCCESS;
  }

  host_read(fd, iovs, iovs_len, nread) {
    this.hostMem_.check();
    assert(fd === 0);
    let size = 0;
    for (let i = 0; i < iovs_len; ++i) {
      const buf = this.hostMem_.read32(iovs);
      iovs += 4;
      const len = this.hostMem_.read32(iovs);
      iovs += 4;
      const lenToWrite = Math.min(len, this.stdinStr.length - this.stdinStrPos);
      if (lenToWrite === 0) break;
      this.hostMem_.write(buf, this.stdinStr.substr(this.stdinStrPos, lenToWrite));
      size += lenToWrite;
      this.stdinStrPos += lenToWrite;
      if (lenToWrite !== len) break;
    }
    this.hostMem_.write32(nread, size);
    return ESUCCESS;
  }

  memfs_log(buf, len) {
    this.mem.check();
    console.log(this.mem.readStr(buf, len));
  }

  copy_out(clang_dst, memfs_src, size) {
    this.hostMem_.check();
    const dst = new Uint8Array(this.hostMem_.buffer, clang_dst, size);
    this.mem.check();
    const src = new Uint8Array(this.mem.buffer, memfs_src, size);
    dst.set(src);
  }

  copy_in(memfs_dst, clang_src, size) {
    this.mem.check();
    const dst = new Uint8Array(this.mem.buffer, memfs_dst, size);
    this.hostMem_.check();
    const src = new Uint8Array(this.hostMem_.buffer, clang_src, size);
    dst.set(src);
  }
}

const RAF_PROC_EXIT_CODE = 0xc0c0a;

class App {
  constructor(module, memfs, name, ...args) {
    this.argv = [name, ...args];
    this.environ = { USER: 'alice' };
    this.memfs = memfs;
    this.allowRequestAnimationFrame = true;
    this.handles = new Map();
    this.nextHandle = 0;

    const env = getImportObject(this, [
      'canvas_arc', 'canvas_arcTo', 'canvas_beginPath', 'canvas_bezierCurveTo',
      'canvas_clearRect', 'canvas_clip', 'canvas_closePath', 'canvas_createImageData',
      'canvas_destroyHandle', 'canvas_ellipse', 'canvas_fill', 'canvas_fillRect',
      'canvas_fillText', 'canvas_imageDataSetData', 'canvas_lineTo', 'canvas_measureText',
      'canvas_moveTo', 'canvas_putImageData', 'canvas_quadraticCurveTo', 'canvas_rect',
      'canvas_requestAnimationFrame', 'canvas_restore', 'canvas_rotate', 'canvas_save',
      'canvas_scale', 'canvas_setFillStyle', 'canvas_setFont', 'canvas_setGlobalAlpha',
      'canvas_setHeight', 'canvas_setLineCap', 'canvas_setLineDashOffset', 'canvas_setLineJoin',
      'canvas_setLineWidth', 'canvas_setMiterLimit', 'canvas_setShadowBlur', 'canvas_setShadowColor',
      'canvas_setShadowOffsetX', 'canvas_setShadowOffsetY', 'canvas_setStrokeStyle',
      'canvas_setTextAlign', 'canvas_setTextBaseline', 'canvas_setTransform', 'canvas_setWidth',
      'canvas_stroke', 'canvas_strokeRect', 'canvas_strokeText', 'canvas_transform', 'canvas_translate',
    ]);

    const wasi_unstable = getImportObject(this, [
      'proc_exit', 'environ_sizes_get', 'environ_get', 'args_sizes_get',
      'args_get', 'random_get', 'clock_time_get', 'poll_oneoff',
    ]);

    Object.assign(wasi_unstable, this.memfs.exports);

    this.ready = getInstance(module, { wasi_unstable, env }).then(instance => {
      this.instance = instance;
      this.exports = this.instance.exports;
      this.mem = new Memory(this.exports.memory);
      this.memfs.hostMem = this.mem;
    });
  }

  async run() {
    await this.ready;
    try {
      this.exports._start();
    } catch (exn) {
      let writeStack = true;
      if (exn instanceof ProcExit) {
        if (exn.code === RAF_PROC_EXIT_CODE) return true;
        this.allowRequestAnimationFrame = false;
        if (exn.code == 0) return false;
        writeStack = false;
      }
      let msg = `Error: ${exn.message}`;
      if (writeStack) msg = msg + `\n${exn.stack}`;
      msg += '\n';
      this.memfs.hostWrite(msg);
      throw exn;
    }
  }

  proc_exit(code) { throw new ProcExit(code); }

  environ_sizes_get(environ_count_out, environ_buf_size_out) {
    this.mem.check();
    let size = 0;
    const names = Object.getOwnPropertyNames(this.environ);
    for (const name of names) {
      const value = this.environ[name];
      size += name.length + value.length + 2;
    }
    this.mem.write64(environ_count_out, names.length);
    this.mem.write64(environ_buf_size_out, size);
    return ESUCCESS;
  }

  environ_get(environ_ptrs, environ_buf) {
    this.mem.check();
    const names = Object.getOwnPropertyNames(this.environ);
    for (const name of names) {
      this.mem.write32(environ_ptrs, environ_buf);
      environ_ptrs += 4;
      environ_buf += this.mem.writeStr(environ_buf, `${name}=${this.environ[name]}`);
    }
    this.mem.write32(environ_ptrs, 0);
    return ESUCCESS;
  }

  args_sizes_get(argc_out, argv_buf_size_out) {
    this.mem.check();
    let size = 0;
    for (let arg of this.argv) size += arg.length + 1;
    this.mem.write64(argc_out, this.argv.length);
    this.mem.write64(argv_buf_size_out, size);
    return ESUCCESS;
  }

  args_get(argv_ptrs, argv_buf) {
    this.mem.check();
    for (let arg of this.argv) {
      this.mem.write32(argv_ptrs, argv_buf);
      argv_ptrs += 4;
      argv_buf += this.mem.writeStr(argv_buf, arg);
    }
    this.mem.write32(argv_ptrs, 0);
    return ESUCCESS;
  }

  random_get(buf, buf_len) {
    const data = new Uint8Array(this.mem.buffer, buf, buf_len);
    for (let i = 0; i < buf_len; ++i) data[i] = (Math.random() * 256) | 0;
  }

  clock_time_get(clock_id, precision, time_out) {
    this.mem.check();
    this.mem.write64(time_out, 0);
    return ESUCCESS;
  }

  poll_oneoff() { throw new NotImplemented('wasi_unstable', 'poll_oneoff'); }

  // Canvas API (사용하지 않음 — C++ 프로그램이 canvas를 쓰지 않는 한 호출되지 않음)
  canvas_destroyHandle(handle) { this.handles.delete(handle); }
  canvas_setWidth(width) { if (canvas) canvas.width = width; }
  canvas_setHeight(height) { if (canvas) canvas.height = height; }
  canvas_requestAnimationFrame() {}
  canvas_createImageData() { return -1; }
  canvas_putImageData() {}
  canvas_imageDataSetData() {}
  canvas_arc() {}
  canvas_arcTo() {}
  canvas_beginPath() {}
  canvas_bezierCurveTo() {}
  canvas_clearRect() {}
  canvas_clip() {}
  canvas_closePath() {}
  canvas_ellipse() {}
  canvas_fill() {}
  canvas_fillRect() {}
  canvas_fillText() {}
  canvas_lineTo() {}
  canvas_measureText() { return 0; }
  canvas_moveTo() {}
  canvas_quadraticCurveTo() {}
  canvas_rect() {}
  canvas_restore() {}
  canvas_rotate() {}
  canvas_save() {}
  canvas_scale() {}
  canvas_setTransform() {}
  canvas_stroke() {}
  canvas_strokeRect() {}
  canvas_strokeText() {}
  canvas_transform() {}
  canvas_translate() {}
  canvas_setFillStyle() {}
  canvas_setFont() {}
  canvas_setGlobalAlpha() {}
  canvas_setLineCap() {}
  canvas_setLineDashOffset() {}
  canvas_setLineJoin() {}
  canvas_setLineWidth() {}
  canvas_setMiterLimit() {}
  canvas_setShadowBlur() {}
  canvas_setShadowColor() {}
  canvas_setShadowOffsetX() {}
  canvas_setShadowOffsetY() {}
  canvas_setStrokeStyle() {}
  canvas_setTextAlign() {}
  canvas_setTextBaseline() {}
}

class Tar {
  constructor(buffer) {
    this.u8 = new Uint8Array(buffer);
    this.offset = 0;
  }
  readStr(len) {
    const result = readStr(this.u8, this.offset, len);
    this.offset += len;
    return result;
  }
  readOctal(len) { return parseInt(this.readStr(len), 8); }
  alignUp() { this.offset = (this.offset + 511) & ~511; }
  readEntry() {
    if (this.offset + 512 > this.u8.length) return null;
    const entry = {
      filename: this.readStr(100),
      mode: this.readOctal(8),
      owner: this.readOctal(8),
      group: this.readOctal(8),
      size: this.readOctal(12),
      mtim: this.readOctal(12),
      checksum: this.readOctal(8),
      type: this.readStr(1),
      linkname: this.readStr(100),
    };
    if (this.readStr(8) !== 'ustar  ') return null;
    entry.ownerName = this.readStr(32);
    entry.groupName = this.readStr(32);
    entry.devMajor = this.readStr(8);
    entry.devMinor = this.readStr(8);
    entry.filenamePrefix = this.readStr(155);
    this.alignUp();
    if (entry.type === '0') {
      entry.contents = this.u8.subarray(this.offset, this.offset + entry.size);
      this.offset += entry.size;
      this.alignUp();
    } else if (entry.type !== '5') {
      assert(false);
    }
    return entry;
  }
  untar(memfs) {
    let entry;
    while ((entry = this.readEntry())) {
      switch (entry.type) {
        case '0': memfs.addFile(entry.filename, entry.contents); break;
        case '5': memfs.addDirectory(entry.filename); break;
      }
    }
  }
}

export class API {
  constructor(options) {
    this.moduleCache = {};
    this.readBuffer = options.readBuffer;
    this.compileStreaming = options.compileStreaming;
    this.hostWrite = options.hostWrite;          // 프로그램 stdout/stderr + 컴파일러 진단
    this.logWrite = options.hostLog || (() => {}); // 상태 로그 (별도 분리)
    this.clangFilename = options.clang || 'clang';
    this.lldFilename = options.lld || 'lld';
    this.sysrootFilename = options.sysroot || 'sysroot.tar';
    this.showTiming = options.showTiming || false;

    this.clangCommonArgs = [
      '-disable-free',
      '-isysroot', '/',
      '-internal-isystem', '/include/c++/v1',
      '-internal-isystem', '/include',
      '-internal-isystem', '/lib/clang/8.0.1/include',
      '-ferror-limit', '19',
      '-fmessage-length', '80',
      '-std=gnu++17',
    ];

    this.memfs = new MemFS({
      compileStreaming: this.compileStreaming,
      hostWrite: this.hostWrite,
      memfsFilename: options.memfs || 'memfs',
    });
    this.ready = this.memfs.ready.then(() => this.untar(this.memfs, this.sysrootFilename));
  }

  hostLog(message) {
    this.logWrite(`> ${message}`);
  }

  async hostLogAsync(message, promise) {
    const start = +new Date();
    this.hostLog(`${message}...`);
    const result = await promise;
    const end = +new Date();
    this.logWrite(' done.');
    if (this.showTiming) this.logWrite(` (${msToSec(start, end)}s)`);
    this.logWrite('\n');
    return result;
  }

  async getModule(name) {
    if (this.moduleCache[name]) return this.moduleCache[name];
    const module = await this.hostLogAsync(`Fetching and compiling ${name}`, this.compileStreaming(name));
    this.moduleCache[name] = module;
    return module;
  }

  async untar(memfs, filename) {
    await this.memfs.ready;
    const promise = (async () => {
      const tar = new Tar(await this.readBuffer(filename));
      tar.untar(this.memfs);
    })();
    await this.hostLogAsync(`Untarring ${filename}`, promise);
  }

  async compile(options) {
    const input = options.input;
    const contents = options.contents;
    const obj = options.obj;
    await this.ready;
    this.memfs.addFile(input, contents);
    const clang = await this.getModule(this.clangFilename);
    return await this.run(clang, 'clang', '-cc1', '-emit-obj',
      ...this.clangCommonArgs, '-O2', '-o', obj, '-x', 'c++', input);
  }

  async link(obj, wasm) {
    const stackSize = 8 * 1024 * 1024;
    const libdir = 'lib/wasm32-wasi';
    const crt1 = `${libdir}/crt1.o`;
    await this.ready;
    const lld = await this.getModule(this.lldFilename);
    // libclang_rt.builtins-wasm32.a 를 마지막에 링크해야 한다.
    // (libc++ 의 algorithm.cpp.obj 등이 long double 소프트플로트 빌트인 __lttf2 등을 참조)
    const builtins = 'lib/clang/8.0.1/lib/wasi/libclang_rt.builtins-wasm32.a';
    return await this.run(lld, 'wasm-ld', '--no-threads', '--export-dynamic',
      '-z', `stack-size=${stackSize}`, `-L${libdir}`, crt1, obj,
      '-lc', '-lc++', '-lc++abi', '-lcanvas', builtins, '-o', wasm);
  }

  async run(module, ...args) {
    this.hostLog(`${args.join(' ')}\n`);
    const start = +new Date();
    const app = new App(module, this.memfs, ...args);
    const instantiate = +new Date();
    const stillRunning = await app.run();
    const end = +new Date();
    if (this.showTiming) {
      this.logWrite(`(${msToSec(start, instantiate)}s/${msToSec(instantiate, end)}s)\n`);
    }
    return stillRunning ? app : null;
  }
}

import "./chunk-PR4QN5HX.js";

// node_modules/mupdf/dist/mupdf-wasm.js
var _ = async function(_2 = {}) {
  var a, e, t = _2, s = new Promise((_3, t2) => {
    a = _3, e = t2;
  }), n = "object" == typeof window, i = "undefined" != typeof WorkerGlobalScope, m = "object" == typeof process && "object" == typeof process.versions && "string" == typeof process.versions.node && "renderer" != process.type;
  if (m) {
    const { createRequire: _3 } = await import("./module-VRDZC4OG.js");
    var r = _3(import.meta.url);
  }
  var o, p, d = "./this.program", w = (_3, a2) => {
    throw a2;
  }, f = import.meta.url, l = "";
  if (m) {
    var c = r("fs"), g = r("path");
    f.startsWith("file:") && (l = g.dirname(r("url").fileURLToPath(f)) + "/"), p = (_3) => (_3 = U(_3) ? new URL(_3) : _3, c.readFileSync(_3)), o = async (_3, a2 = true) => (_3 = U(_3) ? new URL(_3) : _3, c.readFileSync(_3, a2 ? void 0 : "utf8")), process.argv.length > 1 && (d = process.argv[1].replace(/\\/g, "/")), process.argv.slice(2), w = (_3, a2) => {
      throw process.exitCode = _3, a2;
    };
  } else if (n || i) {
    try {
      l = new URL(".", f).href;
    } catch {
    }
    i && (p = (_3) => {
      var a2 = new XMLHttpRequest();
      return a2.open("GET", _3, false), a2.responseType = "arraybuffer", a2.send(null), new Uint8Array(a2.response);
    }), o = async (_3) => {
      if (U(_3)) return new Promise((a3, e2) => {
        var t2 = new XMLHttpRequest();
        t2.open("GET", _3, true), t2.responseType = "arraybuffer", t2.onload = () => {
          200 == t2.status || 0 == t2.status && t2.response ? a3(t2.response) : e2(t2.status);
        }, t2.onerror = e2, t2.send(null);
      });
      var a2 = await fetch(_3, { credentials: "same-origin" });
      if (a2.ok) return a2.arrayBuffer();
      throw new Error(a2.status + " : " + a2.url);
    };
  }
  var u, h, b, v, y, x, k, T = console.log.bind(console), j = console.error.bind(console), $ = false, A = false, U = (_3) => _3.startsWith("file://");
  function R() {
    var _3 = h.buffer;
    new Int8Array(_3), new Int16Array(_3), t.HEAPU8 = b = new Uint8Array(_3), new Uint16Array(_3), t.HEAP32 = v = new Int32Array(_3), t.HEAPU32 = y = new Uint32Array(_3), t.HEAPF32 = new Float32Array(_3), k = new Float64Array(_3), x = new BigInt64Array(_3), new BigUint64Array(_3);
  }
  var C, E = 0, S = null;
  function D() {
    return t.locateFile ? (_3 = "mupdf-wasm.wasm", t.locateFile ? t.locateFile(_3, l) : l + _3) : new URL("mupdf-wasm.wasm", import.meta.url).href;
    var _3;
  }
  async function M(_3) {
    if (!u) try {
      var a2 = await o(_3);
      return new Uint8Array(a2);
    } catch {
    }
    return (function(_4) {
      if (_4 == C && u) return new Uint8Array(u);
      if (p) return p(_4);
      throw "both async and sync fetching of the wasm failed";
    })(_3);
  }
  async function F(_3, a2) {
    try {
      var s2 = await M(_3);
      return await WebAssembly.instantiate(s2, a2);
    } catch (_4) {
      j(`failed to asynchronously prepare wasm: ${_4}`), (function(_5) {
        t.onAbort?.(_5), j(_5 = "Aborted(" + _5 + ")"), $ = true, _5 += ". Build with -sASSERTIONS for more info.", A && o_();
        var a3 = new WebAssembly.RuntimeError(_5);
        throw e(a3), a3;
      })(_4);
    }
  }
  class P {
    name = "ExitStatus";
    constructor(_3) {
      this.message = `Program terminated with exit(${_3})`, this.status = _3;
    }
  }
  var I = (_3) => {
    for (; _3.length > 0; ) _3.shift()(t);
  }, B = [], q = (_3) => B.push(_3), L = [], z = (_3) => L.push(_3), W = true, H = new TextDecoder(), N = (_3, a2) => {
    if (!_3) return "";
    for (var e2 = _3 + a2, t2 = _3; !(t2 >= e2) && b[t2]; ) ++t2;
    return H.decode(b.subarray(_3, t2));
  }, O = { varargs: void 0, getStr: (_3) => N(_3) }, G = (_3) => _3 < -9007199254740992 || _3 > 9007199254740992 ? NaN : Number(_3), Y = (_3, a2, e2) => ((_4, a3, e3, t2) => {
    if (!(t2 > 0)) return 0;
    for (var s2 = e3, n2 = e3 + t2 - 1, i2 = 0; i2 < _4.length; ++i2) {
      var m2 = _4.charCodeAt(i2);
      if (m2 >= 55296 && m2 <= 57343 && (m2 = 65536 + ((1023 & m2) << 10) | 1023 & _4.charCodeAt(++i2)), m2 <= 127) {
        if (e3 >= n2) break;
        a3[e3++] = m2;
      } else if (m2 <= 2047) {
        if (e3 + 1 >= n2) break;
        a3[e3++] = 192 | m2 >> 6, a3[e3++] = 128 | 63 & m2;
      } else if (m2 <= 65535) {
        if (e3 + 2 >= n2) break;
        a3[e3++] = 224 | m2 >> 12, a3[e3++] = 128 | m2 >> 6 & 63, a3[e3++] = 128 | 63 & m2;
      } else {
        if (e3 + 3 >= n2) break;
        a3[e3++] = 240 | m2 >> 18, a3[e3++] = 128 | m2 >> 12 & 63, a3[e3++] = 128 | m2 >> 6 & 63, a3[e3++] = 128 | 63 & m2;
      }
    }
    return a3[e3] = 0, e3 - s2;
  })(_3, b, a2, e2), X = () => Date.now(), J = [], K = (_3, a2, e2) => {
    var t2 = ((_4, a3) => {
      var e3;
      for (J.length = 0; e3 = b[_4++]; ) {
        var t3 = 105 != e3;
        a3 += (t3 &= 112 != e3) && a3 % 8 ? 4 : 0, J.push(112 == e3 ? y[a3 >> 2] : 106 == e3 ? x[a3 >> 3] : 105 == e3 ? v[a3 >> 2] : k[a3 >> 3]), a3 += t3 ? 8 : 4;
      }
      return J;
    })(a2, e2);
    return i_[_3](...t2);
  }, Q = (_3, a2) => Math.ceil(_3 / a2) * a2, V = (_3) => {
    var a2 = (_3 - h.buffer.byteLength + 65535) / 65536 | 0;
    try {
      return h.grow(a2), R(), 1;
    } catch (_4) {
    }
  }, Z = {}, __ = () => {
    if (!__.strings) {
      var _3 = { USER: "web_user", LOGNAME: "web_user", PATH: "/", PWD: "/", HOME: "/home/web_user", LANG: ("object" == typeof navigator && navigator.languages && navigator.languages[0] || "C").replace("-", "_") + ".UTF-8", _: d || "./this.program" };
      for (var a2 in Z) void 0 === Z[a2] ? delete _3[a2] : _3[a2] = Z[a2];
      var e2 = [];
      for (var a2 in _3) e2.push(`${a2}=${_3[a2]}`);
      __.strings = e2;
    }
    return __.strings;
  }, a_ = (_3) => {
    for (var a2 = 0, e2 = 0; e2 < _3.length; ++e2) {
      var t2 = _3.charCodeAt(e2);
      t2 <= 127 ? a2++ : t2 <= 2047 ? a2 += 2 : t2 >= 55296 && t2 <= 57343 ? (a2 += 4, ++e2) : a2 += 3;
    }
    return a2;
  }, e_ = (_3) => {
    W || (t.onExit?.(_3), $ = true), w(_3, new P(_3));
  }, t_ = (_3, a2) => {
    e_(_3);
  }, s_ = [null, [], []], n_ = (_3, a2) => {
    var e2 = s_[_3];
    0 === a2 || 10 === a2 ? ((1 === _3 ? T : j)(((_4, a3 = 0, e3 = NaN) => {
      for (var t2 = a3 + e3, s2 = a3; _4[s2] && !(s2 >= t2); ) ++s2;
      return H.decode(_4.buffer ? _4.subarray(a3, s2) : new Uint8Array(_4.slice(a3, s2)));
    })(e2)), e2.length = 0) : e2.push(a2);
  };
  t.noExitRuntime && (W = t.noExitRuntime), t.print && (T = t.print), t.printErr && (j = t.printErr), t.wasmBinary && (u = t.wasmBinary), t.arguments && t.arguments, t.thisProgram && (d = t.thisProgram), t.UTF8ToString = N, t.stringToUTF8 = Y, t.lengthBytesUTF8 = a_;
  var i_ = { 6111552: () => {
    throw "TRYLATER";
  }, 6111574: () => {
    throw "ABORT";
  }, 6111593: (_3) => {
    throw new Error(N(_3));
  }, 6111632: () => {
    throw new Error("Cannot create MuPDF context!");
  }, 6111685: (_3, a2, e2, t2, s2, n2, i2) => {
    globalThis.$libmupdf_text_walk.begin_span(_3, a2, e2, t2, s2, n2, i2);
  }, 6111759: (_3, a2, e2, t2, s2, n2, i2, m2) => {
    globalThis.$libmupdf_text_walk.show_glyph(_3, a2, e2, t2, s2, n2, i2, m2);
  }, 6111837: (_3) => {
    globalThis.$libmupdf_text_walk.end_span(_3);
  }, 6111885: (_3, a2, e2, t2) => globalThis.$libmupdf_load_font_file(_3, a2, e2, t2), 6111948: (_3, a2, e2, t2) => globalThis.$libmupdf_stm_read(_3, a2, e2, t2), 6112006: (_3) => {
    globalThis.$libmupdf_stm_close(_3);
  }, 6112046: (_3, a2, e2, t2) => globalThis.$libmupdf_stm_seek(_3, a2, e2, t2), 6112104: (_3, a2, e2) => {
    globalThis.$libmupdf_path_walk.moveto(_3, a2, e2);
  }, 6112158: (_3, a2, e2) => {
    globalThis.$libmupdf_path_walk.lineto(_3, a2, e2);
  }, 6112212: (_3, a2, e2, t2, s2, n2, i2) => {
    globalThis.$libmupdf_path_walk.curveto(_3, a2, e2, t2, s2, n2, i2);
  }, 6112283: (_3) => {
    globalThis.$libmupdf_path_walk.closepath(_3);
  }, 6112332: (_3) => {
    globalThis.$libmupdf_device.close_device(_3);
  }, 6112381: (_3) => {
    globalThis.$libmupdf_device.drop_device(_3);
  }, 6112429: (_3, a2, e2, t2, s2, n2, i2, m2) => {
    globalThis.$libmupdf_device.fill_path(_3, a2, e2, t2, s2, n2, i2, m2);
  }, 6112503: (_3, a2, e2, t2, s2, n2, i2, m2) => {
    globalThis.$libmupdf_device.stroke_path(_3, a2, e2, t2, s2, n2, i2, m2);
  }, 6112579: (_3, a2, e2, t2) => {
    globalThis.$libmupdf_device.clip_path(_3, a2, e2, t2);
  }, 6112637: (_3, a2, e2, t2) => {
    globalThis.$libmupdf_device.clip_stroke_path(_3, a2, e2, t2);
  }, 6112702: (_3, a2, e2, t2, s2, n2, i2) => {
    globalThis.$libmupdf_device.fill_text(_3, a2, e2, t2, s2, n2, i2);
  }, 6112772: (_3, a2, e2, t2, s2, n2, i2, m2) => {
    globalThis.$libmupdf_device.stroke_text(_3, a2, e2, t2, s2, n2, i2, m2);
  }, 6112848: (_3, a2, e2) => {
    globalThis.$libmupdf_device.clip_text(_3, a2, e2);
  }, 6112902: (_3, a2, e2, t2) => {
    globalThis.$libmupdf_device.clip_stroke_text(_3, a2, e2, t2);
  }, 6112967: (_3, a2, e2) => {
    globalThis.$libmupdf_device.ignore_text(_3, a2, e2);
  }, 6113023: (_3, a2, e2, t2) => {
    globalThis.$libmupdf_device.fill_shade(_3, a2, e2, t2);
  }, 6113082: (_3, a2, e2, t2) => {
    globalThis.$libmupdf_device.fill_image(_3, a2, e2, t2);
  }, 6113141: (_3, a2, e2, t2, s2, n2, i2) => {
    globalThis.$libmupdf_device.fill_image_mask(_3, a2, e2, t2, s2, n2, i2);
  }, 6113217: (_3, a2, e2) => {
    globalThis.$libmupdf_device.clip_image_mask(_3, a2, e2);
  }, 6113277: (_3) => {
    globalThis.$libmupdf_device.pop_clip(_3);
  }, 6113322: (_3, a2, e2, t2, s2, n2) => {
    globalThis.$libmupdf_device.begin_mask(_3, a2, e2, t2, s2, n2);
  }, 6113389: (_3, a2) => {
    globalThis.$libmupdf_device.end_mask(_3, a2);
  }, 6113438: (_3, a2, e2, t2, s2, n2, i2) => {
    globalThis.$libmupdf_device.begin_group(_3, a2, e2, t2, s2, n2, i2);
  }, 6113510: (_3) => {
    globalThis.$libmupdf_device.end_group(_3);
  }, 6113556: (_3, a2, e2, t2, s2, n2, i2) => globalThis.$libmupdf_device.begin_tile(_3, a2, e2, t2, s2, n2, i2), 6113634: (_3) => {
    globalThis.$libmupdf_device.end_tile(_3);
  }, 6113679: (_3, a2) => {
    globalThis.$libmupdf_device.begin_layer(_3, a2);
  }, 6113731: (_3) => {
    globalThis.$libmupdf_device.end_layer(_3);
  } }, m_ = { g: function(_3, a2, e2) {
    return O.varargs = e2, 0;
  }, u: function(_3, a2) {
    a2 = G(a2);
  }, t: function(_3, a2, e2) {
    return O.varargs = e2, 0;
  }, f: function(_3, a2, e2, t2) {
    O.varargs = t2;
  }, s: (_3) => {
  }, e: (_3, a2, e2) => {
  }, m: function(_3, a2) {
    _3 = G(_3);
    var e2 = new Date(1e3 * _3);
    v[a2 >> 2] = e2.getUTCSeconds(), v[a2 + 4 >> 2] = e2.getUTCMinutes(), v[a2 + 8 >> 2] = e2.getUTCHours(), v[a2 + 12 >> 2] = e2.getUTCDate(), v[a2 + 16 >> 2] = e2.getUTCMonth(), v[a2 + 20 >> 2] = e2.getUTCFullYear() - 1900, v[a2 + 24 >> 2] = e2.getUTCDay();
    var t2 = Date.UTC(e2.getUTCFullYear(), 0, 1, 0, 0, 0, 0), s2 = (e2.getTime() - t2) / 864e5 | 0;
    v[a2 + 28 >> 2] = s2;
  }, l: function(_3) {
    var a2 = (() => {
      var a3 = Date.UTC(v[_3 + 20 >> 2] + 1900, v[_3 + 16 >> 2], v[_3 + 12 >> 2], v[_3 + 8 >> 2], v[_3 + 4 >> 2], v[_3 >> 2], 0), e2 = new Date(a3);
      v[_3 + 24 >> 2] = e2.getUTCDay();
      var t2 = Date.UTC(e2.getUTCFullYear(), 0, 1, 0, 0, 0, 0), s2 = (e2.getTime() - t2) / 864e5 | 0;
      return v[_3 + 28 >> 2] = s2, e2.getTime() / 1e3;
    })();
    return BigInt(a2);
  }, k: (_3, a2, e2, t2) => {
    var s2 = (/* @__PURE__ */ new Date()).getFullYear(), n2 = new Date(s2, 0, 1), i2 = new Date(s2, 6, 1), m2 = n2.getTimezoneOffset(), r2 = i2.getTimezoneOffset(), o2 = Math.max(m2, r2);
    y[_3 >> 2] = 60 * o2, v[a2 >> 2] = Number(m2 != r2);
    var p2 = (_4) => {
      var a3 = _4 >= 0 ? "-" : "+", e3 = Math.abs(_4);
      return `UTC${a3}${String(Math.floor(e3 / 60)).padStart(2, "0")}${String(e3 % 60).padStart(2, "0")}`;
    }, d2 = p2(m2), w2 = p2(r2);
    r2 < m2 ? (Y(d2, e2, 17), Y(w2, t2, 17)) : (Y(d2, t2, 17), Y(w2, e2, 17));
  }, r: function(_3, a2, e2) {
    if (a2 = G(a2), !((t2 = _3) >= 0 && t2 <= 3)) return 28;
    var t2, s2;
    s2 = 0 === _3 ? X() : performance.now();
    var n2 = Math.round(1e3 * s2 * 1e3);
    return x[e2 >> 3] = BigInt(n2), 0;
  }, a: (_3, a2, e2) => K(_3, a2, e2), j: (_3, a2, e2) => K(_3, a2, e2), i: X, h: (_3) => {
    var a2 = b.length, e2 = 2147483648;
    if ((_3 >>>= 0) > e2) return false;
    for (var t2 = 1; t2 <= 4; t2 *= 2) {
      var s2 = a2 * (1 + 0.2 / t2);
      s2 = Math.min(s2, _3 + 100663296);
      var n2 = Math.min(e2, Q(Math.max(_3, s2), 65536));
      if (V(n2)) return true;
    }
    return false;
  }, q: (_3, a2) => {
    var e2 = 0, t2 = 0;
    for (var s2 of __()) {
      var n2 = a2 + e2;
      y[_3 + t2 >> 2] = n2, e2 += Y(s2, n2, 1 / 0) + 1, t2 += 4;
    }
    return 0;
  }, p: (_3, a2) => {
    var e2 = __();
    y[_3 >> 2] = e2.length;
    var t2 = 0;
    for (var s2 of e2) t2 += a_(s2) + 1;
    return y[a2 >> 2] = t2, 0;
  }, b: t_, d: (_3) => 52, o: (_3, a2, e2, t2) => 52, n: function(_3, a2, e2, t2) {
    return a2 = G(a2), 70;
  }, c: (_3, a2, e2, t2) => {
    for (var s2 = 0, n2 = 0; n2 < e2; n2++) {
      var i2 = y[a2 >> 2], m2 = y[a2 + 4 >> 2];
      a2 += 8;
      for (var r2 = 0; r2 < m2; r2++) n_(_3, b[i2 + r2]);
      s2 += m2;
    }
    return y[t2 >> 2] = s2, 0;
  } }, r_ = await (async function() {
    function _3(_4, a3) {
      return r_ = _4.exports, h = r_.v, R(), (function() {
        if (E--, t.monitorRunDependencies?.(E), 0 == E && S) {
          var _5 = S;
          S = null, _5();
        }
      })(), r_;
    }
    E++, t.monitorRunDependencies?.(E);
    var a2 = { a: m_ };
    if (t.instantiateWasm) return new Promise((e2, s3) => {
      t.instantiateWasm(a2, (a3, t2) => {
        e2(_3(a3));
      });
    });
    C ??= D();
    try {
      var s2 = (function(a3) {
        return _3(a3.instance);
      })(await (async function(_4, a3, e2) {
        if (!_4 && "function" == typeof WebAssembly.instantiateStreaming && !U(a3) && !m) try {
          var t2 = fetch(a3, { credentials: "same-origin" });
          return await WebAssembly.instantiateStreaming(t2, e2);
        } catch (_5) {
          j(`wasm streaming compile failed: ${_5}`), j("falling back to ArrayBuffer instantiation");
        }
        return F(a3, e2);
      })(u, C, a2));
      return s2;
    } catch (_4) {
      return e(_4), Promise.reject(_4);
    }
  })(), o_ = (r_.w, t._wasm_init_context = r_.x, t._wasm_malloc = r_.y, t._wasm_free = r_.z, t._wasm_enable_icc = r_.A, t._wasm_disable_icc = r_.B, t._wasm_set_user_css = r_.C, t._wasm_empty_store = r_.D, t._wasm_shrink_store = r_.E, t._wasm_Memento_checkAllMemory = r_.F, t._wasm_Memento_listBlocks = r_.G, t._wasm_keep_buffer = r_.H, t._wasm_drop_buffer = r_.I, t._wasm_keep_stream = r_.J, t._wasm_drop_stream = r_.K, t._wasm_keep_colorspace = r_.L, t._wasm_drop_colorspace = r_.M, t._wasm_keep_pixmap = r_.N, t._wasm_drop_pixmap = r_.O, t._wasm_keep_font = r_.P, t._wasm_drop_font = r_.Q, t._wasm_keep_stroke_state = r_.R, t._wasm_drop_stroke_state = r_.S, t._wasm_keep_image = r_.T, t._wasm_drop_image = r_.U, t._wasm_keep_shade = r_.V, t._wasm_drop_shade = r_.W, t._wasm_keep_path = r_.X, t._wasm_drop_path = r_.Y, t._wasm_keep_text = r_.Z, t._wasm_drop_text = r_._, t._wasm_keep_device = r_.$, t._wasm_drop_device = r_.aa, t._wasm_keep_display_list = r_.ba, t._wasm_drop_display_list = r_.ca, t._wasm_drop_stext_page = r_.da, t._wasm_drop_document_writer = r_.ea, t._wasm_drop_outline_iterator = r_.fa, t._wasm_keep_document = r_.ga, t._wasm_drop_document = r_.ha, t._wasm_keep_page = r_.ia, t._wasm_drop_page = r_.ja, t._wasm_keep_link = r_.ka, t._wasm_drop_link = r_.la, t._wasm_keep_outline = r_.ma, t._wasm_drop_outline = r_.na, t._wasm_pdf_keep_annot = r_.oa, t._wasm_pdf_drop_annot = r_.pa, t._wasm_pdf_keep_obj = r_.qa, t._wasm_pdf_drop_obj = r_.ra, t._wasm_pdf_keep_graft_map = r_.sa, t._wasm_pdf_drop_graft_map = r_.ta, t._wasm_buffer_get_data = r_.ua, t._wasm_buffer_get_len = r_.va, t._wasm_colorspace_get_type = r_.wa, t._wasm_colorspace_get_n = r_.xa, t._wasm_colorspace_get_name = r_.ya, t._wasm_pixmap_get_w = r_.za, t._wasm_pixmap_get_h = r_.Aa, t._wasm_pixmap_get_x = r_.Ba, t._wasm_pixmap_get_y = r_.Ca, t._wasm_pixmap_get_n = r_.Da, t._wasm_pixmap_get_stride = r_.Ea, t._wasm_pixmap_get_alpha = r_.Fa, t._wasm_pixmap_get_xres = r_.Ga, t._wasm_pixmap_get_yres = r_.Ha, t._wasm_pixmap_get_colorspace = r_.Ia, t._wasm_pixmap_get_samples = r_.Ja, t._wasm_pixmap_set_xres = r_.Ka, t._wasm_pixmap_set_yres = r_.La, t._wasm_font_get_name = r_.Ma, t._wasm_stroke_state_get_start_cap = r_.Na, t._wasm_stroke_state_set_start_cap = r_.Oa, t._wasm_stroke_state_get_dash_cap = r_.Pa, t._wasm_stroke_state_set_dash_cap = r_.Qa, t._wasm_stroke_state_get_end_cap = r_.Ra, t._wasm_stroke_state_set_end_cap = r_.Sa, t._wasm_stroke_state_get_linejoin = r_.Ta, t._wasm_stroke_state_set_linejoin = r_.Ua, t._wasm_stroke_state_get_linewidth = r_.Va, t._wasm_stroke_state_set_linewidth = r_.Wa, t._wasm_stroke_state_get_miterlimit = r_.Xa, t._wasm_stroke_state_set_miterlimit = r_.Ya, t._wasm_stroke_state_get_dash_phase = r_.Za, t._wasm_stroke_state_set_dash_phase = r_._a, t._wasm_stroke_state_get_dash_len = r_.$a, t._wasm_image_get_w = r_.ab, t._wasm_image_get_h = r_.bb, t._wasm_image_get_n = r_.cb, t._wasm_image_get_bpc = r_.db, t._wasm_image_get_xres = r_.eb, t._wasm_image_get_yres = r_.fb, t._wasm_image_get_imagemask = r_.gb, t._wasm_image_get_colorspace = r_.hb, t._wasm_image_get_mask = r_.ib, t._wasm_outline_get_title = r_.jb, t._wasm_outline_get_uri = r_.kb, t._wasm_outline_get_next = r_.lb, t._wasm_outline_get_down = r_.mb, t._wasm_outline_get_is_open = r_.nb, t._wasm_outline_item_get_title = r_.ob, t._wasm_outline_item_get_uri = r_.pb, t._wasm_outline_item_get_is_open = r_.qb, t._wasm_link_get_rect = r_.rb, t._wasm_link_get_uri = r_.sb, t._wasm_link_get_next = r_.tb, t._wasm_stext_page_get_mediabox = r_.ub, t._wasm_stext_page_get_first_block = r_.vb, t._wasm_stext_block_get_next = r_.wb, t._wasm_stext_block_get_type = r_.xb, t._wasm_stext_block_get_bbox = r_.yb, t._wasm_stext_block_get_first_line = r_.zb, t._wasm_stext_block_get_transform = r_.Ab, t._wasm_stext_block_get_image = r_.Bb, t._wasm_stext_block_get_v_flags = r_.Cb, t._wasm_stext_block_get_v_argb = r_.Db, t._wasm_stext_line_get_next = r_.Eb, t._wasm_stext_line_get_wmode = r_.Fb, t._wasm_stext_line_get_dir = r_.Gb, t._wasm_stext_line_get_bbox = r_.Hb, t._wasm_stext_line_get_first_char = r_.Ib, t._wasm_stext_char_get_next = r_.Jb, t._wasm_stext_char_get_c = r_.Kb, t._wasm_stext_char_get_origin = r_.Lb, t._wasm_stext_char_get_quad = r_.Mb, t._wasm_stext_char_get_size = r_.Nb, t._wasm_stext_char_get_font = r_.Ob, t._wasm_stext_char_get_argb = r_.Pb, t._wasm_link_dest_get_chapter = r_.Qb, t._wasm_link_dest_get_page = r_.Rb, t._wasm_link_dest_get_type = r_.Sb, t._wasm_link_dest_get_x = r_.Tb, t._wasm_link_dest_get_y = r_.Ub, t._wasm_link_dest_get_w = r_.Vb, t._wasm_link_dest_get_h = r_.Wb, t._wasm_link_dest_get_zoom = r_.Xb, t._wasm_pdf_layer_config_ui_get_text = r_.Yb, t._wasm_pdf_layer_config_ui_get_depth = r_.Zb, t._wasm_pdf_layer_config_ui_get_type = r_._b, t._wasm_pdf_layer_config_ui_get_selected = r_.$b, t._wasm_pdf_layer_config_ui_get_locked = r_.ac, t._wasm_pdf_filespec_params_get_filename = r_.bc, t._wasm_pdf_filespec_params_get_mimetype = r_.cc, t._wasm_pdf_filespec_params_get_size = r_.dc, t._wasm_pdf_filespec_params_get_created = r_.ec, t._wasm_pdf_filespec_params_get_modified = r_.fc, t._wasm_pdf_page_get_obj = r_.gc, t._wasm_new_buffer = r_.hc, t._wasm_new_buffer_from_data = r_.ic, t._wasm_append_string = r_.jc, t._wasm_append_byte = r_.kc, t._wasm_append_buffer = r_.lc, t._wasm_slice_buffer = r_.mc, t._wasm_string_from_buffer = r_.nc, t._wasm_device_gray = r_.oc, t._wasm_device_rgb = r_.pc, t._wasm_device_bgr = r_.qc, t._wasm_device_cmyk = r_.rc, t._wasm_device_lab = r_.sc, t._wasm_new_icc_colorspace = r_.tc, t._wasm_new_stroke_state = r_.uc, t._wasm_stroke_state_get_dash_item = r_.vc, t._wasm_stroke_state_set_dash_item = r_.wc, t._wasm_new_base14_font = r_.xc, t._wasm_new_cjk_font = r_.yc, t._wasm_new_font_from_buffer = r_.zc, t._wasm_encode_character = r_.Ac, t._wasm_advance_glyph = r_.Bc, t._wasm_font_is_monospaced = r_.Cc, t._wasm_font_is_serif = r_.Dc, t._wasm_font_is_bold = r_.Ec, t._wasm_font_is_italic = r_.Fc, t._wasm_new_image_from_pixmap = r_.Gc, t._wasm_new_image_from_buffer = r_.Hc, t._wasm_get_pixmap_from_image = r_.Ic, t._wasm_new_pixmap_from_page = r_.Jc, t._wasm_new_pixmap_from_page_contents = r_.Kc, t._wasm_pdf_new_pixmap_from_page_with_usage = r_.Lc, t._wasm_pdf_new_pixmap_from_page_contents_with_usage = r_.Mc, t._wasm_new_pixmap_with_bbox = r_.Nc, t._wasm_clear_pixmap = r_.Oc, t._wasm_clear_pixmap_with_value = r_.Pc, t._wasm_invert_pixmap = r_.Qc, t._wasm_invert_pixmap_luminance = r_.Rc, t._wasm_gamma_pixmap = r_.Sc, t._wasm_tint_pixmap = r_.Tc, t._wasm_new_buffer_from_pixmap_as_png = r_.Uc, t._wasm_new_buffer_from_pixmap_as_pam = r_.Vc, t._wasm_new_buffer_from_pixmap_as_psd = r_.Wc, t._wasm_new_buffer_from_pixmap_as_jpeg = r_.Xc, t._wasm_convert_pixmap = r_.Yc, t._wasm_warp_pixmap = r_.Zc, t._wasm_bound_shade = r_._c, t._wasm_new_display_list = r_.$c, t._wasm_bound_display_list = r_.ad, t._wasm_run_display_list = r_.bd, t._wasm_new_pixmap_from_display_list = r_.cd, t._wasm_new_stext_page_from_display_list = r_.dd, t._wasm_search_display_list = r_.ed, t._wasm_new_path = r_.fd, t._wasm_moveto = r_.gd, t._wasm_lineto = r_.hd, t._wasm_curveto = r_.id, t._wasm_curvetov = r_.jd, t._wasm_curvetoy = r_.kd, t._wasm_closepath = r_.ld, t._wasm_rectto = r_.md, t._wasm_transform_path = r_.nd, t._wasm_bound_path = r_.od, t._wasm_new_text = r_.pd, t._wasm_bound_text = r_.qd, t._wasm_show_glyph = r_.rd, t._wasm_show_string = r_.sd, t._wasm_new_draw_device = r_.td, t._wasm_new_display_list_device = r_.ud, t._wasm_close_device = r_.vd, t._wasm_fill_path = r_.wd, t._wasm_stroke_path = r_.xd, t._wasm_clip_path = r_.yd, t._wasm_clip_stroke_path = r_.zd, t._wasm_fill_text = r_.Ad, t._wasm_stroke_text = r_.Bd, t._wasm_clip_text = r_.Cd, t._wasm_clip_stroke_text = r_.Dd, t._wasm_ignore_text = r_.Ed, t._wasm_fill_shade = r_.Fd, t._wasm_fill_image = r_.Gd, t._wasm_fill_image_mask = r_.Hd, t._wasm_clip_image_mask = r_.Id, t._wasm_pop_clip = r_.Jd, t._wasm_begin_mask = r_.Kd, t._wasm_end_mask = r_.Ld, t._wasm_begin_group = r_.Md, t._wasm_end_group = r_.Nd, t._wasm_begin_tile = r_.Od, t._wasm_end_tile = r_.Pd, t._wasm_begin_layer = r_.Qd, t._wasm_end_layer = r_.Rd, t._wasm_new_document_writer_with_buffer = r_.Sd, t._wasm_begin_page = r_.Td, t._wasm_end_page = r_.Ud, t._wasm_close_document_writer = r_.Vd, t._wasm_print_stext_page_as_json = r_.Wd, t._wasm_search_stext_page = r_.Xd, t._wasm_snap_selection = r_.Yd, t._wasm_copy_selection = r_.Zd, t._wasm_highlight_selection = r_._d, t._wasm_print_stext_page_as_html = r_.$d, t._wasm_print_stext_page_as_text = r_.ae, t._wasm_open_document_with_buffer = r_.be, t._wasm_open_document_with_stream = r_.ce, t._wasm_format_link_uri = r_.de, t._wasm_needs_password = r_.ee, t._wasm_authenticate_password = r_.fe, t._wasm_has_permission = r_.ge, t._wasm_count_pages = r_.he, t._wasm_load_page = r_.ie, t._wasm_lookup_metadata = r_.je, t._wasm_set_metadata = r_.ke, t._wasm_resolve_link = r_.le, t._wasm_resolve_link_dest = r_.me, t._wasm_load_outline = r_.ne, t._wasm_outline_get_page = r_.oe, t._wasm_layout_document = r_.pe, t._wasm_is_document_reflowable = r_.qe, t._wasm_link_set_rect = r_.re, t._wasm_link_set_uri = r_.se, t._wasm_bound_page = r_.te, t._wasm_load_links = r_.ue, t._wasm_create_link = r_.ve, t._wasm_delete_link = r_.we, t._wasm_run_page = r_.xe, t._wasm_run_page_contents = r_.ye, t._wasm_run_page_annots = r_.ze, t._wasm_run_page_widgets = r_.Ae, t._wasm_new_stext_page_from_page = r_.Be, t._wasm_new_display_list_from_page = r_.Ce, t._wasm_new_display_list_from_page_contents = r_.De, t._wasm_page_label = r_.Ee, t._wasm_search_page = r_.Fe, t._wasm_new_outline_iterator = r_.Ge, t._wasm_outline_iterator_next = r_.He, t._wasm_outline_iterator_prev = r_.Ie, t._wasm_outline_iterator_up = r_.Je, t._wasm_outline_iterator_down = r_.Ke, t._wasm_outline_iterator_delete = r_.Le, t._wasm_outline_iterator_item = r_.Me, t._wasm_outline_iterator_insert = r_.Ne, t._wasm_outline_iterator_update = r_.Oe, t._wasm_pdf_document_from_fz_document = r_.Pe, t._wasm_pdf_page_from_fz_page = r_.Qe, t._wasm_pdf_create_document = r_.Re, t._wasm_pdf_version = r_.Se, t._wasm_pdf_was_repaired = r_.Te, t._wasm_pdf_has_unsaved_changes = r_.Ue, t._wasm_pdf_can_be_saved_incrementally = r_.Ve, t._wasm_pdf_count_versions = r_.We, t._wasm_pdf_count_unsaved_versions = r_.Xe, t._wasm_pdf_validate_change_history = r_.Ye, t._wasm_pdf_enable_journal = r_.Ze, t._wasm_pdf_undoredo_state_position = r_._e, t._wasm_pdf_undoredo_state_count = r_.$e, t._wasm_pdf_undoredo_step = r_.af, t._wasm_pdf_begin_operation = r_.bf, t._wasm_pdf_begin_implicit_operation = r_.cf, t._wasm_pdf_end_operation = r_.df, t._wasm_pdf_abandon_operation = r_.ef, t._wasm_pdf_undo = r_.ff, t._wasm_pdf_redo = r_.gf, t._wasm_pdf_can_undo = r_.hf, t._wasm_pdf_can_redo = r_.jf, t._wasm_pdf_document_language = r_.kf, t._wasm_pdf_set_document_language = r_.lf, t._wasm_pdf_trailer = r_.mf, t._wasm_pdf_xref_len = r_.nf, t._wasm_pdf_lookup_page_obj = r_.of, t._wasm_pdf_add_object = r_.pf, t._wasm_pdf_create_object = r_.qf, t._wasm_pdf_delete_object = r_.rf, t._wasm_pdf_add_stream = r_.sf, t._wasm_pdf_add_simple_font = r_.tf, t._wasm_pdf_add_cjk_font = r_.uf, t._wasm_pdf_add_cid_font = r_.vf, t._wasm_pdf_add_image = r_.wf, t._wasm_pdf_load_image = r_.xf, t._wasm_pdf_set_page_tree_cache = r_.yf, t._wasm_pdf_add_page = r_.zf, t._wasm_pdf_insert_page = r_.Af, t._wasm_pdf_delete_page = r_.Bf, t._wasm_pdf_set_page_labels = r_.Cf, t._wasm_pdf_delete_page_labels = r_.Df, t._wasm_pdf_is_embedded_file = r_.Ef, t._wasm_pdf_get_filespec_params = r_.Ff, t._wasm_pdf_add_embedded_file = r_.Gf, t._wasm_pdf_load_embedded_file_contents = r_.Hf, t._wasm_pdf_write_document_buffer = r_.If, t._wasm_pdf_js_supported = r_.Jf, t._wasm_pdf_enable_js = r_.Kf, t._wasm_pdf_disable_js = r_.Lf, t._wasm_pdf_rearrange_pages = r_.Mf, t._wasm_pdf_subset_fonts = r_.Nf, t._wasm_pdf_bake_document = r_.Of, t._wasm_pdf_count_layer_configs = r_.Pf, t._wasm_pdf_layer_config_creator = r_.Qf, t._wasm_pdf_layer_config_name = r_.Rf, t._wasm_pdf_select_layer_config = r_.Sf, t._wasm_pdf_count_layer_config_uis = r_.Tf, t._wasm_pdf_layer_config_ui_info = r_.Uf, t._wasm_pdf_count_layers = r_.Vf, t._wasm_pdf_layer_name = r_.Wf, t._wasm_pdf_layer_is_enabled = r_.Xf, t._wasm_pdf_enable_layer = r_.Yf, t._wasm_pdf_page_transform = r_.Zf, t._wasm_pdf_set_page_box = r_._f, t._wasm_pdf_first_annot = r_.$f, t._wasm_pdf_next_annot = r_.ag, t._wasm_pdf_first_widget = r_.bg, t._wasm_pdf_next_widget = r_.cg, t._wasm_pdf_create_annot = r_.dg, t._wasm_pdf_delete_annot = r_.eg, t._wasm_pdf_update_page = r_.fg, t._wasm_pdf_redact_page = r_.gg, t._wasm_pdf_new_graft_map = r_.hg, t._wasm_pdf_graft_mapped_object = r_.ig, t._wasm_pdf_graft_object = r_.jg, t._wasm_pdf_graft_mapped_page = r_.kg, t._wasm_pdf_graft_page = r_.lg, t._wasm_pdf_bound_annot = r_.mg, t._wasm_pdf_run_annot = r_.ng, t._wasm_pdf_new_pixmap_from_annot = r_.og, t._wasm_pdf_new_display_list_from_annot = r_.pg, t._wasm_pdf_update_annot = r_.qg, t._wasm_pdf_annot_obj = r_.rg, t._wasm_pdf_annot_type = r_.sg, t._wasm_pdf_annot_flags = r_.tg, t._wasm_pdf_set_annot_flags = r_.ug, t._wasm_pdf_annot_contents = r_.vg, t._wasm_pdf_set_annot_contents = r_.wg, t._wasm_pdf_annot_author = r_.xg, t._wasm_pdf_set_annot_author = r_.yg, t._wasm_pdf_annot_creation_date = r_.zg, t._wasm_pdf_set_annot_creation_date = r_.Ag, t._wasm_pdf_annot_modification_date = r_.Bg, t._wasm_pdf_set_annot_modification_date = r_.Cg, t._wasm_pdf_annot_border_width = r_.Dg, t._wasm_pdf_set_annot_border_width = r_.Eg, t._wasm_pdf_annot_border_style = r_.Fg, t._wasm_pdf_set_annot_border_style = r_.Gg, t._wasm_pdf_annot_border_effect = r_.Hg, t._wasm_pdf_set_annot_border_effect = r_.Ig, t._wasm_pdf_annot_border_effect_intensity = r_.Jg, t._wasm_pdf_set_annot_border_effect_intensity = r_.Kg, t._wasm_pdf_annot_opacity = r_.Lg, t._wasm_pdf_set_annot_opacity = r_.Mg, t._wasm_pdf_annot_filespec = r_.Ng, t._wasm_pdf_set_annot_filespec = r_.Og, t._wasm_pdf_annot_quadding = r_.Pg, t._wasm_pdf_set_annot_quadding = r_.Qg, t._wasm_pdf_annot_is_open = r_.Rg, t._wasm_pdf_set_annot_is_open = r_.Sg, t._wasm_pdf_annot_hidden_for_editing = r_.Tg, t._wasm_pdf_set_annot_hidden_for_editing = r_.Ug, t._wasm_pdf_annot_icon_name = r_.Vg, t._wasm_pdf_set_annot_icon_name = r_.Wg, t._wasm_pdf_annot_intent = r_.Xg, t._wasm_pdf_set_annot_intent = r_.Yg, t._wasm_pdf_annot_callout_style = r_.Zg, t._wasm_pdf_set_annot_callout_style = r_._g, t._wasm_pdf_annot_line_leader = r_.$g, t._wasm_pdf_set_annot_line_leader = r_.ah, t._wasm_pdf_annot_line_leader_extension = r_.bh, t._wasm_pdf_set_annot_line_leader_extension = r_.ch, t._wasm_pdf_annot_line_leader_offset = r_.dh, t._wasm_pdf_set_annot_line_leader_offset = r_.eh, t._wasm_pdf_annot_line_caption = r_.fh, t._wasm_pdf_set_annot_line_caption = r_.gh, t._wasm_pdf_annot_rich_defaults = r_.hh, t._wasm_pdf_set_annot_rich_defaults = r_.ih, t._wasm_pdf_annot_callout_point = r_.jh, t._wasm_pdf_annot_line_caption_offset = r_.kh, t._wasm_pdf_annot_rect = r_.lh, t._wasm_pdf_annot_popup = r_.mh, t._wasm_pdf_annot_quad_point_count = r_.nh, t._wasm_pdf_annot_quad_point = r_.oh, t._wasm_pdf_annot_vertex_count = r_.ph, t._wasm_pdf_annot_vertex = r_.qh, t._wasm_pdf_annot_ink_list_count = r_.rh, t._wasm_pdf_annot_ink_list_stroke_count = r_.sh, t._wasm_pdf_annot_ink_list_stroke_vertex = r_.th, t._wasm_pdf_annot_rich_contents = r_.uh, t._wasm_pdf_annot_border_dash_count = r_.vh, t._wasm_pdf_annot_border_dash_item = r_.wh, t._wasm_pdf_annot_has_rect = r_.xh, t._wasm_pdf_annot_has_ink_list = r_.yh, t._wasm_pdf_annot_has_quad_points = r_.zh, t._wasm_pdf_annot_has_vertices = r_.Ah, t._wasm_pdf_annot_has_line = r_.Bh, t._wasm_pdf_annot_has_interior_color = r_.Ch, t._wasm_pdf_annot_has_line_ending_styles = r_.Dh, t._wasm_pdf_annot_has_border = r_.Eh, t._wasm_pdf_annot_has_border_effect = r_.Fh, t._wasm_pdf_annot_has_icon_name = r_.Gh, t._wasm_pdf_annot_has_open = r_.Hh, t._wasm_pdf_annot_has_author = r_.Ih, t._wasm_pdf_annot_has_filespec = r_.Jh, t._wasm_pdf_annot_has_callout = r_.Kh, t._wasm_pdf_annot_has_rich_contents = r_.Lh, t._wasm_pdf_annot_language = r_.Mh, t._wasm_pdf_set_annot_language = r_.Nh, t._wasm_pdf_set_annot_popup = r_.Oh, t._wasm_pdf_set_annot_rect = r_.Ph, t._wasm_pdf_clear_annot_quad_points = r_.Qh, t._wasm_pdf_clear_annot_vertices = r_.Rh, t._wasm_pdf_clear_annot_ink_list = r_.Sh, t._wasm_pdf_clear_annot_border_dash = r_.Th, t._wasm_pdf_add_annot_quad_point = r_.Uh, t._wasm_pdf_add_annot_vertex = r_.Vh, t._wasm_pdf_add_annot_ink_list_stroke = r_.Wh, t._wasm_pdf_add_annot_ink_list_stroke_vertex = r_.Xh, t._wasm_pdf_add_annot_border_dash_item = r_.Yh, t._wasm_pdf_annot_line_ending_styles_start = r_.Zh, t._wasm_pdf_annot_line_1 = r_._h, t._wasm_pdf_annot_line_2 = r_.$h, t._wasm_pdf_set_annot_line = r_.ai, t._wasm_pdf_set_annot_callout_point = r_.bi, t._wasm_pdf_annot_callout_line = r_.ci, t._wasm_pdf_set_annot_callout_line = r_.di, t._wasm_pdf_set_annot_line_caption_offset = r_.ei, t._wasm_pdf_annot_line_ending_styles_end = r_.fi, t._wasm_pdf_set_annot_line_ending_styles = r_.gi, t._wasm_pdf_annot_color = r_.hi, t._wasm_pdf_annot_interior_color = r_.ii, t._wasm_pdf_set_annot_color = r_.ji, t._wasm_pdf_set_annot_interior_color = r_.ki, t._wasm_pdf_set_annot_default_appearance = r_.li, t._wasm_pdf_annot_default_appearance_font = r_.mi, t._wasm_pdf_annot_default_appearance_size = r_.ni, t._wasm_pdf_annot_default_appearance_color = r_.oi, t._wasm_pdf_set_annot_rich_contents = r_.pi, t._wasm_pdf_set_annot_stamp_image = r_.qi, t._wasm_pdf_set_annot_appearance_from_display_list = r_.ri, t._wasm_pdf_set_annot_appearance = r_.si, t._wasm_pdf_apply_redaction = r_.ti, t._wasm_pdf_reset_form = r_.ui, t._wasm_pdf_annot_field_type = r_.vi, t._wasm_pdf_annot_field_flags = r_.wi, t._wasm_pdf_annot_field_label = r_.xi, t._wasm_pdf_annot_field_value = r_.yi, t._wasm_pdf_load_field_name = r_.zi, t._wasm_pdf_annot_text_widget_max_len = r_.Ai, t._wasm_pdf_set_annot_text_field_value = r_.Bi, t._wasm_pdf_set_annot_choice_field_value = r_.Ci, t._wasm_pdf_annot_choice_field_option_count = r_.Di, t._wasm_pdf_annot_choice_field_option = r_.Ei, t._wasm_pdf_toggle_widget = r_.Fi, t._wasm_pdf_is_indirect = r_.Gi, t._wasm_pdf_is_bool = r_.Hi, t._wasm_pdf_is_int = r_.Ii, t._wasm_pdf_is_real = r_.Ji, t._wasm_pdf_is_number = r_.Ki, t._wasm_pdf_is_name = r_.Li, t._wasm_pdf_is_string = r_.Mi, t._wasm_pdf_is_array = r_.Ni, t._wasm_pdf_is_dict = r_.Oi, t._wasm_pdf_is_stream = r_.Pi, t._wasm_pdf_to_num = r_.Qi, t._wasm_pdf_to_bool = r_.Ri, t._wasm_pdf_to_real = r_.Si, t._wasm_pdf_to_name = r_.Ti, t._wasm_pdf_to_text_string = r_.Ui, t._wasm_pdf_new_indirect = r_.Vi, t._wasm_pdf_new_array = r_.Wi, t._wasm_pdf_new_dict = r_.Xi, t._wasm_pdf_new_bool = r_.Yi, t._wasm_pdf_new_int = r_.Zi, t._wasm_pdf_new_real = r_._i, t._wasm_pdf_new_name = r_.$i, t._wasm_pdf_new_text_string = r_.aj, t._wasm_pdf_new_string = r_.bj, t._wasm_pdf_resolve_indirect = r_.cj, t._wasm_pdf_array_len = r_.dj, t._wasm_pdf_array_get = r_.ej, t._wasm_pdf_dict_get = r_.fj, t._wasm_pdf_dict_len = r_.gj, t._wasm_pdf_dict_get_key = r_.hj, t._wasm_pdf_dict_get_val = r_.ij, t._wasm_pdf_dict_get_inheritable = r_.jj, t._wasm_pdf_dict_gets = r_.kj, t._wasm_pdf_dict_gets_inheritable = r_.lj, t._wasm_pdf_dict_put = r_.mj, t._wasm_pdf_dict_puts = r_.nj, t._wasm_pdf_dict_del = r_.oj, t._wasm_pdf_dict_dels = r_.pj, t._wasm_pdf_array_put = r_.qj, t._wasm_pdf_array_push = r_.rj, t._wasm_pdf_array_delete = r_.sj, t._wasm_pdf_sprint_obj = r_.tj, t._wasm_pdf_load_stream = r_.uj, t._wasm_pdf_load_raw_stream = r_.vj, t._wasm_pdf_update_object = r_.wj, t._wasm_pdf_update_stream = r_.xj, t._wasm_pdf_to_string = r_.yj, t._wasm_new_stream = r_.zj, t._wasm_walk_path = r_.Aj, t._wasm_walk_text = r_.Bj, t._wasm_new_js_device = r_.Cj, r_.Dj);
  return (function() {
    if (t.preInit) for ("function" == typeof t.preInit && (t.preInit = [t.preInit]); t.preInit.length > 0; ) t.preInit.shift()();
  })(), (function _3() {
    function e2() {
      t.calledRun = true, $ || (A = true, r_.w(), a(t), t.onRuntimeInitialized?.(), (function() {
        if (t.postRun) for ("function" == typeof t.postRun && (t.postRun = [t.postRun]); t.postRun.length; ) q(t.postRun.shift());
        I(B);
      })());
    }
    E > 0 ? S = _3 : ((function() {
      if (t.preRun) for ("function" == typeof t.preRun && (t.preRun = [t.preRun]); t.preRun.length; ) z(t.preRun.shift());
      I(L);
    })(), E > 0 ? S = _3 : t.setStatus ? (t.setStatus("Running..."), setTimeout(() => {
      setTimeout(() => t.setStatus(""), 1), e2();
    }, 1)) : e2());
  })(), s;
};
var mupdf_wasm_default = _;

// node_modules/mupdf/dist/mupdf.js
var node_fs = null;
if (typeof process !== "undefined" && process.versions && process.versions.node)
  node_fs = await import("./node_fs-YNKJHPX4.js");
var libmupdf = await mupdf_wasm_default(globalThis["$libmupdf_wasm_Module"]);
libmupdf._wasm_init_context();
function Malloc(size) {
  return libmupdf._wasm_malloc(size);
}
function Free(ptr) {
  libmupdf._wasm_free(ptr);
}
var memento = {
  listBlocks() {
    libmupdf._wasm_Memento_listBlocks();
  },
  checkAllMemory() {
    libmupdf._wasm_Memento_checkAllMemory();
  }
};
var Matrix = {
  identity: [1, 0, 0, 1, 0, 0],
  scale(sx, sy) {
    return [sx, 0, 0, sy, 0, 0];
  },
  translate(tx, ty) {
    return [1, 0, 0, 1, tx, ty];
  },
  rotate(d) {
    while (d < 0)
      d += 360;
    while (d >= 360)
      d -= 360;
    let s = Math.sin(d * Math.PI / 180);
    let c = Math.cos(d * Math.PI / 180);
    return [c, s, -s, c, 0, 0];
  },
  invert(m) {
    checkMatrix(m);
    let det = m[0] * m[3] - m[1] * m[2];
    if (det > -1e-23 && det < 1e-23)
      return m;
    let rdet = 1 / det;
    let inva = m[3] * rdet;
    let invb = -m[1] * rdet;
    let invc = -m[2] * rdet;
    let invd = m[0] * rdet;
    let inve = -m[4] * inva - m[5] * invc;
    let invf = -m[4] * invb - m[5] * invd;
    return [inva, invb, invc, invd, inve, invf];
  },
  concat(one, two) {
    checkMatrix(one);
    checkMatrix(two);
    return [
      one[0] * two[0] + one[1] * two[2],
      one[0] * two[1] + one[1] * two[3],
      one[2] * two[0] + one[3] * two[2],
      one[2] * two[1] + one[3] * two[3],
      one[4] * two[0] + one[5] * two[2] + two[4],
      one[4] * two[1] + one[5] * two[3] + two[5]
    ];
  }
};
var Rect = {
  MIN_INF_RECT: 2147483648,
  MAX_INF_RECT: 2147483520,
  empty: [2147483648, 2147483648, 2147483520, 2147483520],
  invalid: [0, 0, -1, -1],
  infinite: [2147483520, 2147483520, 2147483648, 2147483648],
  isEmpty: function(rect) {
    checkRect(rect);
    return rect[0] >= rect[2] || rect[1] >= rect[3];
  },
  isValid: function(rect) {
    checkRect(rect);
    return rect[0] <= rect[2] && rect[1] <= rect[3];
  },
  isInfinite: function(rect) {
    checkRect(rect);
    return rect[0] === Rect.MAX_INF_RECT && rect[1] === Rect.MAX_INF_RECT && rect[2] === Rect.MIN_INF_RECT && rect[3] === Rect.MIN_INF_RECT;
  },
  transform: function(rect, matrix) {
    checkRect(rect);
    checkMatrix(matrix);
    var t;
    if (Rect.isInfinite(rect))
      return rect;
    if (!Rect.isValid(rect))
      return rect;
    var ax0 = rect[0] * matrix[0];
    var ax1 = rect[2] * matrix[0];
    if (ax0 > ax1)
      t = ax0, ax0 = ax1, ax1 = t;
    var cy0 = rect[1] * matrix[2];
    var cy1 = rect[3] * matrix[2];
    if (cy0 > cy1)
      t = cy0, cy0 = cy1, cy1 = t;
    ax0 += cy0 + matrix[4];
    ax1 += cy1 + matrix[4];
    var bx0 = rect[0] * matrix[1];
    var bx1 = rect[2] * matrix[1];
    if (bx0 > bx1)
      t = bx0, bx0 = bx1, bx1 = t;
    var dy0 = rect[1] * matrix[3];
    var dy1 = rect[3] * matrix[3];
    if (dy0 > dy1)
      t = dy0, dy0 = dy1, dy1 = t;
    bx0 += dy0 + matrix[5];
    bx1 += dy1 + matrix[5];
    return [ax0, bx0, ax1, bx1];
  }
};
function enableICC() {
  libmupdf._wasm_enable_icc();
}
function disableICC() {
  libmupdf._wasm_disable_icc();
}
function setUserCSS(text) {
  libmupdf._wasm_set_user_css(STRING(text));
}
function emptyStore() {
  libmupdf._wasm_empty_store();
}
function shrinkStore(percent) {
  return libmupdf._wasm_shrink_store(percent);
}
function installLoadFontFunction(f) {
  $libmupdf_load_font_file_js = f;
}
var _wasm_int = Malloc(4);
var _wasm_point = Malloc(4 * 6) >> 2;
var _wasm_rect = Malloc(4 * 8) >> 2;
var _wasm_matrix = Malloc(4 * 6) >> 2;
var _wasm_color = Malloc(4 * 4) >> 2;
var _wasm_quad = Malloc(4 * 8) >> 2;
var _wasm_string = [0, 0];
function checkType(value, type) {
  if (typeof type === "string" && typeof value !== type)
    throw new TypeError("expected " + type);
  if (typeof type === "function" && !(value instanceof type))
    throw new TypeError("expected " + type.name);
}
function checkPoint(value) {
  if (!Array.isArray(value) || value.length !== 2)
    throw new TypeError("expected point");
}
function checkRect(value) {
  if (!Array.isArray(value) || value.length !== 4)
    throw new TypeError("expected rectangle");
}
function checkMatrix(value) {
  if (!Array.isArray(value) || value.length !== 6)
    throw new TypeError("expected matrix");
}
function checkQuad(value) {
  if (!Array.isArray(value) || value.length !== 8)
    throw new TypeError("expected quad");
}
function checkColor(value) {
  if (!Array.isArray(value) || value.length !== 1 && value.length !== 3 && value.length !== 4)
    throw new TypeError("expected color array");
}
function checkAnnotColor(value) {
  if (!Array.isArray(value) || value.length !== 0 && value.length !== 1 && value.length !== 3 && value.length !== 4)
    throw new TypeError("expected color array");
}
function BUFFER(input) {
  if (input instanceof Buffer)
    return input.pointer;
  if (input instanceof ArrayBuffer || input instanceof Uint8Array)
    return new Buffer(input).pointer;
  if (typeof input === "string")
    return new Buffer(input).pointer;
  throw new TypeError("expected buffer");
}
function ENUM(value, list) {
  if (typeof value === "number") {
    if (value >= 0 && value < list.length)
      return value;
  }
  if (typeof value === "string") {
    let idx = list.indexOf(value);
    if (idx >= 0)
      return idx;
  }
  throw new TypeError(`invalid enum value ("${value}"; expected ${list.join(", ")})`);
}
function allocateUTF8(str) {
  var size = libmupdf.lengthBytesUTF8(str) + 1;
  var pointer = Malloc(size);
  libmupdf.stringToUTF8(str, pointer, size);
  return pointer;
}
function STRING_N(s, i) {
  if (_wasm_string[i]) {
    Free(_wasm_string[i]);
    _wasm_string[i] = 0;
  }
  return _wasm_string[i] = allocateUTF8(s);
}
function STRING(s) {
  return STRING_N(s, 0);
}
function STRING2(s) {
  return STRING_N(s, 1);
}
function STRING_OPT(s) {
  return typeof s === "string" ? STRING_N(s, 0) : 0;
}
function STRING2_OPT(s) {
  return typeof s === "string" ? STRING_N(s, 1) : 0;
}
function POINT(p) {
  libmupdf.HEAPF32[_wasm_point + 0] = p[0];
  libmupdf.HEAPF32[_wasm_point + 1] = p[1];
  return _wasm_point << 2;
}
function POINT2(p) {
  libmupdf.HEAPF32[_wasm_point + 2] = p[0];
  libmupdf.HEAPF32[_wasm_point + 3] = p[1];
  return _wasm_point + 2 << 2;
}
function POINT3(p) {
  libmupdf.HEAPF32[_wasm_point + 4] = p[0];
  libmupdf.HEAPF32[_wasm_point + 5] = p[1];
  return _wasm_point + 4 << 2;
}
function RECT(r) {
  libmupdf.HEAPF32[_wasm_rect + 0] = r[0];
  libmupdf.HEAPF32[_wasm_rect + 1] = r[1];
  libmupdf.HEAPF32[_wasm_rect + 2] = r[2];
  libmupdf.HEAPF32[_wasm_rect + 3] = r[3];
  return _wasm_rect << 2;
}
function RECT2(r) {
  libmupdf.HEAPF32[_wasm_rect + 4] = r[0];
  libmupdf.HEAPF32[_wasm_rect + 5] = r[1];
  libmupdf.HEAPF32[_wasm_rect + 6] = r[2];
  libmupdf.HEAPF32[_wasm_rect + 7] = r[3];
  return _wasm_rect + 4 << 2;
}
function MATRIX(m) {
  libmupdf.HEAPF32[_wasm_matrix + 0] = m[0];
  libmupdf.HEAPF32[_wasm_matrix + 1] = m[1];
  libmupdf.HEAPF32[_wasm_matrix + 2] = m[2];
  libmupdf.HEAPF32[_wasm_matrix + 3] = m[3];
  libmupdf.HEAPF32[_wasm_matrix + 4] = m[4];
  libmupdf.HEAPF32[_wasm_matrix + 5] = m[5];
  return _wasm_matrix << 2;
}
function QUAD(q) {
  libmupdf.HEAPF32[_wasm_quad + 0] = q[0];
  libmupdf.HEAPF32[_wasm_quad + 1] = q[1];
  libmupdf.HEAPF32[_wasm_quad + 2] = q[2];
  libmupdf.HEAPF32[_wasm_quad + 3] = q[3];
  libmupdf.HEAPF32[_wasm_quad + 4] = q[4];
  libmupdf.HEAPF32[_wasm_quad + 5] = q[5];
  libmupdf.HEAPF32[_wasm_quad + 6] = q[6];
  libmupdf.HEAPF32[_wasm_quad + 7] = q[7];
  return _wasm_quad << 2;
}
function COLOR(c) {
  if (typeof c !== "undefined") {
    switch (c.length) {
      case 0:
        break;
      case 1:
        libmupdf.HEAPF32[_wasm_color + 0] = c[0];
        break;
      case 3:
        libmupdf.HEAPF32[_wasm_color + 0] = c[0];
        libmupdf.HEAPF32[_wasm_color + 1] = c[1];
        libmupdf.HEAPF32[_wasm_color + 2] = c[2];
        break;
      case 4:
        libmupdf.HEAPF32[_wasm_color + 0] = c[0];
        libmupdf.HEAPF32[_wasm_color + 1] = c[1];
        libmupdf.HEAPF32[_wasm_color + 2] = c[2];
        libmupdf.HEAPF32[_wasm_color + 3] = c[3];
        break;
    }
  }
  return _wasm_color << 2;
}
function fromColor(n) {
  if (n === 1)
    return [
      libmupdf.HEAPF32[_wasm_color]
    ];
  if (n === 3)
    return [
      libmupdf.HEAPF32[_wasm_color + 0],
      libmupdf.HEAPF32[_wasm_color + 1],
      libmupdf.HEAPF32[_wasm_color + 2]
    ];
  if (n === 4)
    return [
      libmupdf.HEAPF32[_wasm_color + 0],
      libmupdf.HEAPF32[_wasm_color + 1],
      libmupdf.HEAPF32[_wasm_color + 2],
      libmupdf.HEAPF32[_wasm_color + 3]
    ];
  throw new TypeError("invalid number of components for Color: " + n);
}
function fromAnnotColor(n) {
  if (n === 0)
    return [];
  return fromColor(n);
}
function fromColorArray(n, ptr) {
  let addr = ptr >> 2;
  let color = [];
  for (let i = 0; i < n; ++i)
    color.push(libmupdf.HEAPF32[addr + i]);
  return color;
}
function fromStringOrNull(ptr) {
  if (ptr === 0)
    return null;
  return libmupdf.UTF8ToString(ptr);
}
function fromString(ptr) {
  return libmupdf.UTF8ToString(ptr);
}
function fromStringFree(ptr) {
  let str = libmupdf.UTF8ToString(ptr);
  Free(ptr);
  return str;
}
function fromPoint(ptr) {
  let addr = ptr >> 2;
  return [
    libmupdf.HEAPF32[addr + 0],
    libmupdf.HEAPF32[addr + 1]
  ];
}
function fromRect(ptr) {
  let addr = ptr >> 2;
  return [
    libmupdf.HEAPF32[addr + 0],
    libmupdf.HEAPF32[addr + 1],
    libmupdf.HEAPF32[addr + 2],
    libmupdf.HEAPF32[addr + 3]
  ];
}
function fromMatrix(ptr) {
  let addr = ptr >> 2;
  return [
    libmupdf.HEAPF32[addr + 0],
    libmupdf.HEAPF32[addr + 1],
    libmupdf.HEAPF32[addr + 2],
    libmupdf.HEAPF32[addr + 3],
    libmupdf.HEAPF32[addr + 4],
    libmupdf.HEAPF32[addr + 5]
  ];
}
function fromQuad(ptr) {
  let addr = ptr >> 2;
  return [
    libmupdf.HEAPF32[addr + 0],
    libmupdf.HEAPF32[addr + 1],
    libmupdf.HEAPF32[addr + 2],
    libmupdf.HEAPF32[addr + 3],
    libmupdf.HEAPF32[addr + 4],
    libmupdf.HEAPF32[addr + 5],
    libmupdf.HEAPF32[addr + 6],
    libmupdf.HEAPF32[addr + 7]
  ];
}
function fromBuffer(ptr) {
  let data = libmupdf._wasm_buffer_get_data(ptr);
  let size = libmupdf._wasm_buffer_get_len(ptr);
  return libmupdf.HEAPU8.slice(data, data + size);
}
function fromLayerConfigUIInfo(ptr) {
  return {
    text: libmupdf._wasm_pdf_layer_config_ui_get_text(ptr),
    depth: libmupdf._wasm_pdf_layer_config_ui_get_depth(ptr),
    type: libmupdf._wasm_pdf_layer_config_ui_get_type(ptr),
    selected: libmupdf._wasm_pdf_layer_config_ui_get_selected(ptr),
    locked: libmupdf._wasm_pdf_layer_config_ui_get_locked(ptr)
  };
}
function colorFromNumber(argb) {
  var r = argb >> 16 & 255;
  var g = argb >> 8 & 255;
  var b = argb & 255;
  return [r / 255, g / 255, b / 255];
}
function runSearch(searchFun, searchThis, needle, max_hits = 500) {
  checkType(needle, "string");
  let hits = 0;
  let marks = 0;
  try {
    hits = Malloc(32 * max_hits);
    marks = Malloc(4 * max_hits);
    let n = searchFun(searchThis, STRING(needle), marks, hits, max_hits);
    let outer = [];
    if (n > 0) {
      let inner = [];
      for (let i = 0; i < n; ++i) {
        let mark = libmupdf.HEAP32[(marks >> 2) + i];
        let quad = fromQuad(hits + i * 32);
        if (i > 0 && mark) {
          outer.push(inner);
          inner = [];
        }
        inner.push(quad);
      }
      outer.push(inner);
    }
    return outer;
  } finally {
    Free(marks);
    Free(hits);
  }
}
var Userdata = class {
  constructor(pointer) {
    if (typeof pointer !== "number")
      throw new Error("invalid pointer: " + typeof pointer);
    if (pointer !== 0) {
      let ctor = this.constructor;
      if (!ctor._finalizer)
        ctor._finalizer = new FinalizationRegistry(ctor._drop);
      ctor._finalizer.register(this, pointer, this);
    }
    this.pointer = pointer;
  }
  destroy() {
    if (this.pointer !== 0) {
      let ctor = this.constructor;
      ctor._finalizer.unregister(this);
      ctor._drop(this.pointer);
    }
    this.pointer = 0;
  }
  // Custom "console.log" formatting for Node
  [/* @__PURE__ */ Symbol.for("nodejs.util.inspect.custom")]() {
    return this.toString();
  }
  toString() {
    return `[${this.constructor.name} ${this.pointer}]`;
  }
  valueOf() {
    throw new Error("cannot convert Userdata to Javascript value");
  }
};
var Buffer = class _Buffer extends Userdata {
  constructor(arg) {
    if (typeof arg === "undefined")
      super(libmupdf._wasm_new_buffer(1024));
    else if (typeof arg === "number")
      super(arg);
    else if (typeof arg === "string") {
      let data_len = libmupdf.lengthBytesUTF8(arg);
      let data_ptr = Malloc(data_len + 1);
      libmupdf.stringToUTF8(arg, data_ptr, data_len + 1);
      super(libmupdf._wasm_new_buffer_from_data(data_ptr, data_len));
    } else if (arg instanceof ArrayBuffer || arg instanceof Uint8Array) {
      let data_len = arg.byteLength;
      let data_ptr = Malloc(data_len);
      libmupdf.HEAPU8.set(new Uint8Array(arg), data_ptr);
      super(libmupdf._wasm_new_buffer_from_data(data_ptr, data_len));
    }
  }
  get length() {
    return this.getLength();
  }
  set length(_2) {
    throw new TypeError("buffer length is read-only");
  }
  getLength() {
    return libmupdf._wasm_buffer_get_len(this.pointer);
  }
  readByte(at) {
    let data = libmupdf._wasm_buffer_get_data(this.pointer);
    return libmupdf.HEAPU8[data + at];
  }
  write(s) {
    libmupdf._wasm_append_string(this.pointer, STRING(s));
  }
  writeByte(b) {
    libmupdf._wasm_append_byte(this.pointer, b);
  }
  writeLine(s) {
    this.write(s);
    this.writeByte(10);
  }
  writeBuffer(other) {
    libmupdf._wasm_append_buffer(this.pointer, BUFFER(other));
  }
  asUint8Array() {
    let data = libmupdf._wasm_buffer_get_data(this.pointer);
    let size = libmupdf._wasm_buffer_get_len(this.pointer);
    return libmupdf.HEAPU8.subarray(data, data + size);
  }
  slice(start, end) {
    if (typeof end === "undefined")
      end = this.getLength();
    return new _Buffer(libmupdf._wasm_slice_buffer(this.pointer, start, end));
  }
  asString() {
    return fromString(libmupdf._wasm_string_from_buffer(this.pointer));
  }
  save(filename) {
    if (node_fs)
      node_fs.writeFileSync(filename, this.asUint8Array());
    else
      throw new Error("missing 'fs' module");
  }
};
Buffer._drop = libmupdf._wasm_drop_buffer;
var ColorSpace = class _ColorSpace extends Userdata {
  constructor(from, name) {
    if (typeof from === "number") {
      super(from);
    } else {
      if (typeof from === "string") {
        if (node_fs)
          from = node_fs.readFileSync(from);
        else
          throw new Error("missing 'fs' module");
      }
      super(libmupdf._wasm_new_icc_colorspace(STRING_OPT(name), BUFFER(from)));
    }
  }
  getName() {
    return fromString(libmupdf._wasm_colorspace_get_name(this.pointer));
  }
  getType() {
    return _ColorSpace.COLORSPACE_TYPES[libmupdf._wasm_colorspace_get_type(this.pointer)] || "None";
  }
  getNumberOfComponents() {
    return libmupdf._wasm_colorspace_get_n(this.pointer);
  }
  isGray() {
    return this.getType() === "Gray";
  }
  isRGB() {
    return this.getType() === "RGB";
  }
  isCMYK() {
    return this.getType() === "CMYK";
  }
  isIndexed() {
    return this.getType() === "Indexed";
  }
  isLab() {
    return this.getType() === "Lab";
  }
  isDeviceN() {
    return this.getType() === "Separation";
  }
  isSubtractive() {
    return this.getType() === "CMYK" || this.getType() === "Separation";
  }
  toString() {
    return "[ColorSpace " + this.getName() + "]";
  }
};
ColorSpace._drop = libmupdf._wasm_drop_colorspace;
ColorSpace.COLORSPACE_TYPES = [
  "None",
  "Gray",
  "RGB",
  "BGR",
  "CMYK",
  "Lab",
  "Indexed",
  "Separation"
];
ColorSpace.DeviceGray = new ColorSpace(libmupdf._wasm_device_gray());
ColorSpace.DeviceRGB = new ColorSpace(libmupdf._wasm_device_rgb());
ColorSpace.DeviceBGR = new ColorSpace(libmupdf._wasm_device_bgr());
ColorSpace.DeviceCMYK = new ColorSpace(libmupdf._wasm_device_cmyk());
ColorSpace.Lab = new ColorSpace(libmupdf._wasm_device_lab());
var Font = class _Font extends Userdata {
  constructor(name_or_pointer, data, subfont = 0) {
    let pointer = 0;
    if (typeof name_or_pointer === "number") {
      pointer = libmupdf._wasm_keep_font(name_or_pointer);
    } else {
      if (typeof data === "string") {
        if (node_fs)
          data = node_fs.readFileSync(data);
        else
          throw new Error("missing 'fs' module");
      }
      if (data)
        pointer = libmupdf._wasm_new_font_from_buffer(STRING(name_or_pointer), BUFFER(data), subfont);
      else if (name_or_pointer === "zh-Hant")
        pointer = libmupdf._wasm_new_cjk_font(_Font.ADOBE_CNS);
      else if (name_or_pointer === "zh-Hans")
        pointer = libmupdf._wasm_new_cjk_font(_Font.ADOBE_GB);
      else if (name_or_pointer === "ja")
        pointer = libmupdf._wasm_new_cjk_font(_Font.ADOBE_JAPAN);
      else if (name_or_pointer === "ko")
        pointer = libmupdf._wasm_new_cjk_font(_Font.ADOBE_KOREA);
      else
        pointer = libmupdf._wasm_new_base14_font(STRING(name_or_pointer));
    }
    super(pointer);
  }
  getName() {
    return fromString(libmupdf._wasm_font_get_name(this.pointer));
  }
  encodeCharacter(uni) {
    if (typeof uni === "string")
      uni = uni.charCodeAt(0);
    return libmupdf._wasm_encode_character(this.pointer, uni);
  }
  advanceGlyph(gid, wmode = 0) {
    return libmupdf._wasm_advance_glyph(this.pointer, gid, wmode);
  }
  isMono() {
    return !!libmupdf._wasm_font_is_monospaced(this.pointer);
  }
  isSerif() {
    return !!libmupdf._wasm_font_is_serif(this.pointer);
  }
  isBold() {
    return !!libmupdf._wasm_font_is_bold(this.pointer);
  }
  isItalic() {
    return !!libmupdf._wasm_font_is_italic(this.pointer);
  }
};
Font._drop = libmupdf._wasm_drop_font;
Font.SIMPLE_ENCODING = [
  "Latin",
  "Greek",
  "Cyrillic"
];
Font.SIMPLE_ENCODING_LATIN = "Latin";
Font.SIMPLE_ENCODING_GREEK = "Greek";
Font.SIMPLE_ENCODING_CYRILLIC = "Cyrillic";
Font.ADOBE_CNS = 0;
Font.ADOBE_GB = 1;
Font.ADOBE_JAPAN = 2;
Font.ADOBE_KOREA = 3;
Font.CJK_ORDERING_BY_LANG = {
  "Adobe-CNS1": 0,
  "Adobe-GB1": 1,
  "Adobe-Japan1": 2,
  "Adobe-Korea1": 3,
  "zh-Hant": 0,
  "zh-TW": 0,
  "zh-HK": 0,
  "zh-Hans": 1,
  "zh-CN": 1,
  "ja": 2,
  "ko": 3
};
var Image = class _Image extends Userdata {
  constructor(data, mask) {
    let pointer = 0;
    if (typeof data === "number") {
      pointer = libmupdf._wasm_keep_image(data);
    } else if (data instanceof Pixmap) {
      pointer = libmupdf._wasm_new_image_from_pixmap(data.pointer, mask ? mask.pointer : 0);
    } else {
      if (typeof data === "string") {
        if (node_fs)
          data = node_fs.readFileSync(data);
        else
          throw new Error("missing 'fs' module");
      }
      pointer = libmupdf._wasm_new_image_from_buffer(BUFFER(data));
    }
    super(pointer);
  }
  getWidth() {
    return libmupdf._wasm_image_get_w(this.pointer);
  }
  getHeight() {
    return libmupdf._wasm_image_get_h(this.pointer);
  }
  getNumberOfComponents() {
    return libmupdf._wasm_image_get_n(this.pointer);
  }
  getBitsPerComponent() {
    return libmupdf._wasm_image_get_bpc(this.pointer);
  }
  getXResolution() {
    return libmupdf._wasm_image_get_xres(this.pointer);
  }
  getYResolution() {
    return libmupdf._wasm_image_get_yres(this.pointer);
  }
  getImageMask() {
    return !!libmupdf._wasm_image_get_imagemask(this.pointer);
  }
  getColorSpace() {
    let cs = libmupdf._wasm_image_get_colorspace(this.pointer);
    if (cs)
      return new ColorSpace(libmupdf._wasm_keep_colorspace(cs));
    return null;
  }
  getMask() {
    let mask = libmupdf._wasm_image_get_mask(this.pointer);
    if (mask)
      return new _Image(libmupdf._wasm_keep_image(mask));
    return null;
  }
  toPixmap() {
    return new Pixmap(libmupdf._wasm_get_pixmap_from_image(this.pointer));
  }
};
Image._drop = libmupdf._wasm_drop_image;
var StrokeState = class _StrokeState extends Userdata {
  constructor(data) {
    if (typeof data === "number") {
      super(data);
      return this;
    }
    super(libmupdf._wasm_new_stroke_state(data?.dashes?.length ?? 0));
    let lineCap = ENUM(data.lineCap, _StrokeState.LINE_CAP);
    let lineJoin = ENUM(data.lineJoin, _StrokeState.LINE_JOIN);
    libmupdf._wasm_stroke_state_set_start_cap(this.pointer, lineCap);
    libmupdf._wasm_stroke_state_set_dash_cap(this.pointer, lineCap);
    libmupdf._wasm_stroke_state_set_end_cap(this.pointer, lineCap);
    libmupdf._wasm_stroke_state_set_linejoin(this.pointer, lineJoin);
    libmupdf._wasm_stroke_state_set_linewidth(this.pointer, data.lineWidth);
    libmupdf._wasm_stroke_state_set_miterlimit(this.pointer, data.miterLimit);
    libmupdf._wasm_stroke_state_set_dash_phase(this.pointer, data.dashPhase ?? 0);
    if (data.dashes) {
      for (let i = 0; i < data.dashes.length; ++i)
        libmupdf._wasm_stroke_state_set_dash_item(this.pointer, i, data.dashes[i] ?? 0);
    }
  }
  getLineCap() {
    return libmupdf._wasm_stroke_state_get_start_cap(this.pointer);
  }
  getLineJoin() {
    return libmupdf._wasm_stroke_state_get_linejoin(this.pointer);
  }
  getLineWidth() {
    return libmupdf._wasm_stroke_state_get_linewidth(this.pointer);
  }
  getMiterLimit() {
    return libmupdf._wasm_stroke_state_get_miterlimit(this.pointer);
  }
  getDashPhase() {
    return libmupdf._wasm_stroke_state_get_dash_phase(this.pointer);
  }
  getDashes() {
    var n = libmupdf._wasm_stroke_state_get_dash_len(this.pointer);
    if (n > 0) {
      var out = [];
      for (let i = 0; i < n; ++i)
        out[i] = libmupdf._wasm_stroke_state_get_dash_item(this.pointer, i);
      return out;
    }
    return null;
  }
};
StrokeState._drop = libmupdf._wasm_drop_stroke_state;
StrokeState.LINE_CAP = [
  "Butt",
  "Round",
  "Square",
  "Triangle"
];
StrokeState.LINE_JOIN = [
  "Miter",
  "Round",
  "Bevel",
  "MiterXPS"
];
var Path = class extends Userdata {
  constructor(pointer) {
    if (typeof pointer === "number")
      super(pointer);
    else
      super(libmupdf._wasm_new_path());
  }
  getBounds(strokeState, transform) {
    if (strokeState !== null)
      checkType(strokeState, StrokeState);
    checkMatrix(transform);
    return fromRect(libmupdf._wasm_bound_path(this.pointer, strokeState?.pointer, MATRIX(transform)));
  }
  moveTo(x, y) {
    checkType(x, "number");
    checkType(y, "number");
    libmupdf._wasm_moveto(this.pointer, x, y);
  }
  lineTo(x, y) {
    checkType(x, "number");
    checkType(y, "number");
    libmupdf._wasm_lineto(this.pointer, x, y);
  }
  curveTo(x1, y1, x2, y2, x3, y3) {
    checkType(x1, "number");
    checkType(y1, "number");
    checkType(x2, "number");
    checkType(y2, "number");
    checkType(x3, "number");
    checkType(y3, "number");
    libmupdf._wasm_curveto(this.pointer, x1, y1, x2, y2, x3, y3);
  }
  curveToV(cx, cy, ex, ey) {
    checkType(cx, "number");
    checkType(cy, "number");
    checkType(ex, "number");
    checkType(ey, "number");
    libmupdf._wasm_curvetov(this.pointer, cx, cy, ex, ey);
  }
  curveToY(cx, cy, ex, ey) {
    checkType(cx, "number");
    checkType(cy, "number");
    checkType(ex, "number");
    checkType(ey, "number");
    libmupdf._wasm_curvetoy(this.pointer, cx, cy, ex, ey);
  }
  closePath() {
    libmupdf._wasm_closepath(this.pointer);
  }
  rect(x1, y1, x2, y2) {
    checkType(x1, "number");
    checkType(y1, "number");
    checkType(x2, "number");
    checkType(y2, "number");
    libmupdf._wasm_rectto(this.pointer, x1, y1, x2, y2);
  }
  transform(matrix) {
    checkMatrix(matrix);
    libmupdf._wasm_transform_path(this.pointer, MATRIX(matrix));
  }
  walk(walker) {
    let id = $libmupdf_path_id++;
    $libmupdf_path_table.set(id, walker);
    libmupdf._wasm_walk_path(this.pointer, id);
    $libmupdf_path_table.delete(id);
  }
};
Path._drop = libmupdf._wasm_drop_path;
var Text = class extends Userdata {
  constructor(pointer) {
    if (typeof pointer === "number")
      super(pointer);
    else
      super(libmupdf._wasm_new_text());
  }
  getBounds(strokeState, transform) {
    if (strokeState !== null)
      checkType(strokeState, StrokeState);
    checkMatrix(transform);
    return fromRect(libmupdf._wasm_bound_text(this.pointer, strokeState?.pointer, MATRIX(transform)));
  }
  showGlyph(font, trm, gid, uni, wmode = 0) {
    checkType(font, Font);
    checkMatrix(trm);
    checkType(gid, "number");
    checkType(uni, "number");
    libmupdf._wasm_show_glyph(this.pointer, font.pointer, MATRIX(trm), gid, uni, wmode);
  }
  showString(font, trm, str, wmode = 0) {
    checkType(font, Font);
    checkMatrix(trm);
    checkType(str, "string");
    return fromMatrix(libmupdf._wasm_show_string(this.pointer, font.pointer, MATRIX(trm), STRING(str), wmode));
  }
  walk(walker) {
    let id = $libmupdf_text_id++;
    $libmupdf_text_table.set(id, walker);
    libmupdf._wasm_walk_text(this.pointer, id);
    $libmupdf_text_table.delete(id);
  }
};
Text._drop = libmupdf._wasm_drop_text;
var DisplayList = class extends Userdata {
  constructor(arg1) {
    let pointer = 0;
    if (typeof arg1 === "number") {
      pointer = arg1;
    } else {
      checkRect(arg1);
      pointer = libmupdf._wasm_new_display_list(RECT(arg1));
    }
    super(pointer);
  }
  getBounds() {
    return fromRect(libmupdf._wasm_bound_display_list(this.pointer));
  }
  toPixmap(matrix, colorspace, alpha = false) {
    checkMatrix(matrix);
    checkType(colorspace, ColorSpace);
    return new Pixmap(libmupdf._wasm_new_pixmap_from_display_list(this.pointer, MATRIX(matrix), colorspace.pointer, alpha));
  }
  toStructuredText(options = "") {
    checkType(options, "string");
    return new StructuredText(libmupdf._wasm_new_stext_page_from_display_list(this.pointer, STRING(options)));
  }
  run(device, matrix) {
    checkType(device, Device);
    checkMatrix(matrix);
    libmupdf._wasm_run_display_list(this.pointer, device.pointer, MATRIX(matrix));
  }
  search(needle, max_hits = 500) {
    return runSearch(libmupdf._wasm_search_display_list, this.pointer, needle, max_hits);
  }
};
DisplayList._drop = libmupdf._wasm_drop_display_list;
var Pixmap = class _Pixmap extends Userdata {
  constructor(arg1, bbox, alpha = false) {
    if (typeof arg1 === "number") {
      super(arg1);
    }
    if (arg1 instanceof ColorSpace) {
      checkRect(bbox);
      super(libmupdf._wasm_new_pixmap_with_bbox(arg1.pointer, RECT(bbox), alpha));
    }
    if (arg1 === null) {
      checkRect(bbox);
      super(libmupdf._wasm_new_pixmap_with_bbox(0, RECT(bbox), alpha));
    }
  }
  getBounds() {
    let x = libmupdf._wasm_pixmap_get_x(this.pointer);
    let y = libmupdf._wasm_pixmap_get_y(this.pointer);
    let w = libmupdf._wasm_pixmap_get_w(this.pointer);
    let h = libmupdf._wasm_pixmap_get_h(this.pointer);
    return [x, y, x + w, y + h];
  }
  clear(value) {
    if (typeof value === "undefined")
      libmupdf._wasm_clear_pixmap(this.pointer);
    else
      libmupdf._wasm_clear_pixmap_with_value(this.pointer, value);
  }
  getWidth() {
    return libmupdf._wasm_pixmap_get_w(this.pointer);
  }
  getHeight() {
    return libmupdf._wasm_pixmap_get_h(this.pointer);
  }
  getX() {
    return libmupdf._wasm_pixmap_get_x(this.pointer);
  }
  getY() {
    return libmupdf._wasm_pixmap_get_y(this.pointer);
  }
  getStride() {
    return libmupdf._wasm_pixmap_get_stride(this.pointer);
  }
  getNumberOfComponents() {
    return libmupdf._wasm_pixmap_get_n(this.pointer);
  }
  getAlpha() {
    return libmupdf._wasm_pixmap_get_alpha(this.pointer);
  }
  getXResolution() {
    return libmupdf._wasm_pixmap_get_xres(this.pointer);
  }
  getYResolution() {
    return libmupdf._wasm_pixmap_get_yres(this.pointer);
  }
  setResolution(x, y) {
    libmupdf._wasm_pixmap_set_xres(this.pointer, x);
    libmupdf._wasm_pixmap_set_yres(this.pointer, y);
  }
  getColorSpace() {
    let cs = libmupdf._wasm_pixmap_get_colorspace(this.pointer);
    if (cs)
      return new ColorSpace(libmupdf._wasm_keep_colorspace(cs));
    return null;
  }
  getPixels() {
    let s = libmupdf._wasm_pixmap_get_stride(this.pointer);
    let h = libmupdf._wasm_pixmap_get_h(this.pointer);
    let p = libmupdf._wasm_pixmap_get_samples(this.pointer);
    return new Uint8ClampedArray(libmupdf.HEAPU8.buffer, p, s * h);
  }
  asPNG() {
    let buf = libmupdf._wasm_new_buffer_from_pixmap_as_png(this.pointer);
    try {
      return fromBuffer(buf);
    } finally {
      libmupdf._wasm_drop_buffer(buf);
    }
  }
  asPSD() {
    let buf = libmupdf._wasm_new_buffer_from_pixmap_as_psd(this.pointer);
    try {
      return fromBuffer(buf);
    } finally {
      libmupdf._wasm_drop_buffer(buf);
    }
  }
  asPAM() {
    let buf = libmupdf._wasm_new_buffer_from_pixmap_as_pam(this.pointer);
    try {
      return fromBuffer(buf);
    } finally {
      libmupdf._wasm_drop_buffer(buf);
    }
  }
  asJPEG(quality, invert_cmyk = false) {
    let buf = libmupdf._wasm_new_buffer_from_pixmap_as_jpeg(this.pointer, quality, invert_cmyk);
    try {
      return fromBuffer(buf);
    } finally {
      libmupdf._wasm_drop_buffer(buf);
    }
  }
  invert() {
    libmupdf._wasm_invert_pixmap(this.pointer);
  }
  invertLuminance() {
    libmupdf._wasm_invert_pixmap_luminance(this.pointer);
  }
  gamma(p) {
    libmupdf._wasm_gamma_pixmap(this.pointer, p);
  }
  tint(black, white) {
    let black_hex = 0;
    let white_hex = 16777215;
    if (typeof black === "number")
      black_hex = black;
    else if (black instanceof Array && black.length === 3)
      black_hex = black[0] * 255 << 16 | black[1] * 255 << 8 | black[2] * 255;
    if (typeof white === "number")
      white_hex = white;
    else if (white instanceof Array && white.length === 3)
      white = white[0] * 255 << 16 | white[1] * 255 << 8 | white[2] * 255;
    libmupdf._wasm_tint_pixmap(this.pointer, black_hex, white_hex);
  }
  convertToColorSpace(colorspace, keepAlpha = false) {
    checkType(colorspace, ColorSpace);
    checkType(keepAlpha, "boolean");
    return new _Pixmap(libmupdf._wasm_convert_pixmap(this.pointer, colorspace.pointer, keepAlpha));
  }
  warp(points, width, height) {
    let quad = points.flat();
    checkQuad(quad);
    checkType(width, "number");
    checkType(height, "number");
    return new _Pixmap(libmupdf._wasm_warp_pixmap(this.pointer, QUAD(quad), width, height));
  }
};
Pixmap._drop = libmupdf._wasm_drop_pixmap;
var Shade = class extends Userdata {
  getBounds() {
    return fromRect(libmupdf._wasm_bound_shade(this.pointer));
  }
};
Shade._drop = libmupdf._wasm_drop_shade;
var StructuredText = class _StructuredText extends Userdata {
  walk(walker) {
    let block = libmupdf._wasm_stext_page_get_first_block(this.pointer);
    while (block) {
      let block_type = libmupdf._wasm_stext_block_get_type(block);
      let block_bbox = fromRect(libmupdf._wasm_stext_block_get_bbox(block));
      if (block_type === 0) {
        if (walker.beginTextBlock)
          walker.beginTextBlock(block_bbox);
        let line = libmupdf._wasm_stext_block_get_first_line(block);
        while (line) {
          let line_bbox = fromRect(libmupdf._wasm_stext_line_get_bbox(line));
          let line_wmode = libmupdf._wasm_stext_line_get_wmode(line);
          let line_dir = fromPoint(libmupdf._wasm_stext_line_get_dir(line));
          if (walker.beginLine)
            walker.beginLine(line_bbox, line_wmode, line_dir);
          if (walker.onChar) {
            let ch = libmupdf._wasm_stext_line_get_first_char(line);
            while (ch) {
              let ch_rune = String.fromCharCode(libmupdf._wasm_stext_char_get_c(ch));
              let ch_origin = fromPoint(libmupdf._wasm_stext_char_get_origin(ch));
              let ch_font = new Font(libmupdf._wasm_stext_char_get_font(ch));
              let ch_size = libmupdf._wasm_stext_char_get_size(ch);
              let ch_quad = fromQuad(libmupdf._wasm_stext_char_get_quad(ch));
              let ch_color = colorFromNumber(libmupdf._wasm_stext_char_get_argb(ch));
              walker.onChar(ch_rune, ch_origin, ch_font, ch_size, ch_quad, ch_color);
              ch = libmupdf._wasm_stext_char_get_next(ch);
            }
          }
          if (walker.endLine)
            walker.endLine();
          line = libmupdf._wasm_stext_line_get_next(line);
        }
        if (walker.endTextBlock)
          walker.endTextBlock();
      } else if (block_type === 1) {
        if (walker.onImageBlock) {
          let matrix = fromMatrix(libmupdf._wasm_stext_block_get_transform(block));
          let image = new Image(libmupdf._wasm_stext_block_get_image(block));
          walker.onImageBlock(block_bbox, matrix, image);
        }
      } else if (block_type === 2) {
      } else if (block_type === 3) {
        if (walker.onVector) {
          let v_flags_word = libmupdf._wasm_stext_block_get_v_flags(block);
          let v_flags = {
            isStroked: !!(v_flags_word & 1),
            isRectangle: !!(v_flags_word & 2)
          };
          let v_color = colorFromNumber(libmupdf._wasm_stext_block_get_v_argb(block));
          walker.onVector(block_bbox, v_flags, v_color);
        }
      } else if (block_type === 4) {
      }
      block = libmupdf._wasm_stext_block_get_next(block);
    }
  }
  asJSON(scale = 1) {
    return fromStringFree(libmupdf._wasm_print_stext_page_as_json(this.pointer, scale));
  }
  asHTML(id) {
    return fromStringFree(libmupdf._wasm_print_stext_page_as_html(this.pointer, id));
  }
  asText() {
    return fromStringFree(libmupdf._wasm_print_stext_page_as_text(this.pointer));
  }
  snap(p, q, mode) {
    let mm = ENUM(mode, _StructuredText.SELECT_MODE);
    return fromQuad(libmupdf._wasm_snap_selection(this.pointer, POINT(p), POINT2(q), mm));
  }
  copy(p, q) {
    return fromStringFree(libmupdf._wasm_copy_selection(this.pointer, POINT(p), POINT2(q)));
  }
  highlight(p, q, max_hits = 100) {
    let hits = 0;
    let result = [];
    try {
      hits = Malloc(32 * max_hits);
      let n = libmupdf._wasm_highlight_selection(this.pointer, POINT(p), POINT2(q), hits, max_hits);
      for (let i = 0; i < n; ++i)
        result.push(fromQuad(hits + i * 32));
    } finally {
      Free(hits);
    }
    return result;
  }
  search(needle, max_hits = 500) {
    return runSearch(libmupdf._wasm_search_stext_page, this.pointer, needle, max_hits);
  }
};
StructuredText._drop = libmupdf._wasm_drop_stext_page;
StructuredText.SELECT_MODE = [
  "chars",
  "words",
  "lines"
];
StructuredText.SELECT_CHARS = "chars";
StructuredText.SELECT_WORDS = "words";
StructuredText.SELECT_LINES = "lines";
var Device = class _Device extends Userdata {
  constructor(pointer_or_callbacks) {
    if (typeof pointer_or_callbacks === "number")
      super(pointer_or_callbacks);
    else {
      let id = $libmupdf_device_id++;
      $libmupdf_device_table.set(id, pointer_or_callbacks);
      super(libmupdf._wasm_new_js_device(id));
    }
  }
  fillPath(path, evenOdd, ctm, colorspace, color, alpha) {
    checkType(path, Path);
    checkMatrix(ctm);
    checkType(colorspace, ColorSpace);
    checkColor(color);
    libmupdf._wasm_fill_path(this.pointer, path.pointer, evenOdd, MATRIX(ctm), colorspace.pointer, COLOR(color), alpha);
  }
  strokePath(path, stroke, ctm, colorspace, color, alpha) {
    checkType(path, Path);
    checkType(stroke, StrokeState);
    checkMatrix(ctm);
    checkType(colorspace, ColorSpace);
    checkColor(color);
    libmupdf._wasm_stroke_path(this.pointer, path.pointer, stroke.pointer, MATRIX(ctm), colorspace.pointer, COLOR(color), alpha);
  }
  clipPath(path, evenOdd, ctm) {
    checkType(path, Path);
    checkMatrix(ctm);
    libmupdf._wasm_clip_path(this.pointer, path.pointer, evenOdd, MATRIX(ctm));
  }
  clipStrokePath(path, stroke, ctm) {
    checkType(path, Path);
    checkType(stroke, StrokeState);
    checkMatrix(ctm);
    libmupdf._wasm_clip_stroke_path(this.pointer, path.pointer, stroke.pointer, MATRIX(ctm));
  }
  fillText(text, ctm, colorspace, color, alpha) {
    checkType(text, Text);
    checkMatrix(ctm);
    checkType(colorspace, ColorSpace);
    checkColor(color);
    libmupdf._wasm_fill_text(this.pointer, text.pointer, MATRIX(ctm), colorspace.pointer, COLOR(color), alpha);
  }
  strokeText(text, stroke, ctm, colorspace, color, alpha) {
    checkType(text, Text);
    checkType(stroke, StrokeState);
    checkMatrix(ctm);
    checkType(colorspace, ColorSpace);
    checkColor(color);
    libmupdf._wasm_stroke_text(this.pointer, text.pointer, stroke.pointer, MATRIX(ctm), colorspace.pointer, COLOR(color), alpha);
  }
  clipText(text, ctm) {
    checkType(text, Text);
    checkMatrix(ctm);
    libmupdf._wasm_clip_text(this.pointer, text.pointer, MATRIX(ctm));
  }
  clipStrokeText(text, stroke, ctm) {
    checkType(text, Text);
    checkType(stroke, StrokeState);
    checkMatrix(ctm);
    libmupdf._wasm_clip_stroke_text(this.pointer, text.pointer, stroke.pointer, MATRIX(ctm));
  }
  ignoreText(text, ctm) {
    checkType(text, Text);
    checkMatrix(ctm);
    libmupdf._wasm_ignore_text(this.pointer, text.pointer, MATRIX(ctm));
  }
  fillShade(shade, ctm, alpha) {
    checkType(shade, Shade);
    checkMatrix(ctm);
    libmupdf._wasm_fill_shade(this.pointer, shade.pointer, MATRIX(ctm), alpha);
  }
  fillImage(image, ctm, alpha) {
    checkType(image, Image);
    checkMatrix(ctm);
    libmupdf._wasm_fill_image(this.pointer, image.pointer, MATRIX(ctm), alpha);
  }
  fillImageMask(image, ctm, colorspace, color, alpha) {
    checkType(image, Image);
    checkMatrix(ctm);
    checkType(colorspace, ColorSpace);
    checkColor(color);
    libmupdf._wasm_fill_image_mask(this.pointer, image.pointer, MATRIX(ctm), colorspace.pointer, COLOR(color), alpha);
  }
  clipImageMask(image, ctm) {
    checkType(image, Image);
    checkMatrix(ctm);
    libmupdf._wasm_clip_image_mask(this.pointer, image.pointer, MATRIX(ctm));
  }
  popClip() {
    libmupdf._wasm_pop_clip(this.pointer);
  }
  beginMask(area, luminosity, colorspace, color) {
    checkRect(area);
    checkType(colorspace, ColorSpace);
    checkColor(color);
    libmupdf._wasm_begin_mask(this.pointer, RECT(area), luminosity, colorspace.pointer, COLOR(color));
  }
  endMask() {
    libmupdf._wasm_end_mask(this.pointer);
  }
  beginGroup(area, colorspace, isolated, knockout, blendmode, alpha) {
    checkRect(area);
    checkType(colorspace, ColorSpace);
    let blendmode_ix = ENUM(blendmode, _Device.BLEND_MODES);
    libmupdf._wasm_begin_group(this.pointer, RECT(area), colorspace.pointer, isolated, knockout, blendmode_ix, alpha);
  }
  endGroup() {
    libmupdf._wasm_end_group(this.pointer);
  }
  beginTile(area, view, xstep, ystep, ctm, id, doc_id) {
    checkRect(area);
    checkRect(view);
    checkMatrix(ctm);
    return libmupdf._wasm_begin_tile(this.pointer, RECT(area), RECT2(view), xstep, ystep, MATRIX(ctm), id, doc_id);
  }
  endTile() {
    libmupdf._wasm_end_tile(this.pointer);
  }
  beginLayer(name) {
    libmupdf._wasm_begin_layer(this.pointer, STRING(name));
  }
  endLayer() {
    libmupdf._wasm_end_layer(this.pointer);
  }
  close() {
    libmupdf._wasm_close_device(this.pointer);
  }
};
Device._drop = libmupdf._wasm_drop_device;
Device.BLEND_MODES = [
  "Normal",
  "Multiply",
  "Screen",
  "Overlay",
  "Darken",
  "Lighten",
  "ColorDodge",
  "ColorBurn",
  "HardLight",
  "SoftLight",
  "Difference",
  "Exclusion",
  "Hue",
  "Saturation",
  "Color",
  "Luminosity"
];
Device.BLEND_NORMAL = "Normal";
Device.BLEND_MULTIPLY = "Multiply";
Device.BLEND_SCREEN = "Screen";
Device.BLEND_OVERLAY = "Overlay";
Device.BLEND_DARKEN = "Darken";
Device.BLEND_LIGHTEN = "Lighten";
Device.BLEND_COLOR_DODGE = "ColorDodge";
Device.BLEND_COLOR_BURN = "ColorBurn";
Device.BLEND_HARD_LIGHT = "HardLight";
Device.BLEND_SOFT_LIGHT = "SoftLight";
Device.BLEND_DIFFERENCE = "Difference";
Device.BLEND_EXCLUSION = "Exclusion";
Device.BLEND_HUE = "Hue";
Device.BLEND_SATURATION = "Saturation";
Device.BLEND_COLOR = "Color";
Device.BLEND_LUMINOSITY = "Luminosity";
var DrawDevice = class extends Device {
  constructor(matrix, pixmap) {
    checkMatrix(matrix);
    checkType(pixmap, Pixmap);
    super(libmupdf._wasm_new_draw_device(MATRIX(matrix), pixmap.pointer));
  }
};
var DisplayListDevice = class extends Device {
  constructor(displayList) {
    checkType(displayList, DisplayList);
    super(libmupdf._wasm_new_display_list_device(displayList.pointer));
  }
};
var DocumentWriter = class extends Userdata {
  constructor(buffer, format, options) {
    super(libmupdf._wasm_new_document_writer_with_buffer(BUFFER(buffer), STRING(format), STRING2(options)));
  }
  beginPage(mediabox) {
    checkRect(mediabox);
    return new Device(libmupdf._wasm_keep_device(libmupdf._wasm_begin_page(this.pointer, RECT(mediabox))));
  }
  endPage() {
    libmupdf._wasm_end_page(this.pointer);
  }
  close() {
    libmupdf._wasm_close_document_writer(this.pointer);
  }
};
DocumentWriter._drop = libmupdf._wasm_drop_document_writer;
var LinkDestination = class {
  constructor(chapter = 0, page = 0, type = "Fit", x = NaN, y = NaN, width = NaN, height = NaN, zoom = NaN) {
    this.chapter = chapter;
    this.page = page;
    this.type = type;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.zoom = zoom;
  }
};
LinkDestination.LINK_DEST = [
  "Fit",
  "FitB",
  "FitH",
  "FitBH",
  "FitV",
  "FitBV",
  "FitR",
  "XYZ"
];
LinkDestination.FIT = "Fit";
LinkDestination.FIT_B = "FitB";
LinkDestination.FIT_H = "FitH";
LinkDestination.FIT_BH = "FitBH";
LinkDestination.FIT_V = "FitV";
LinkDestination.FIT_BV = "FitBV";
LinkDestination.FIT_R = "FitR";
LinkDestination.XYZ = "XYZ";
var Document = class _Document extends Userdata {
  static openDocument(from, magic) {
    let pointer = 0;
    let free_from = false;
    if (typeof from === "string") {
      magic = from;
      if (node_fs)
        from = node_fs.readFileSync(from);
      else
        throw new Error("missing 'fs' module");
    } else {
      if (typeof magic === "undefined")
        magic = "application/pdf";
    }
    checkType(magic, "string");
    if (from instanceof ArrayBuffer || from instanceof Uint8Array) {
      from = new Buffer(from);
      free_from = true;
    }
    if (from instanceof Buffer)
      pointer = libmupdf._wasm_open_document_with_buffer(STRING(magic), from.pointer);
    else if (from instanceof Stream)
      pointer = libmupdf._wasm_open_document_with_stream(STRING(magic), from.pointer);
    else
      throw new Error("not a Buffer or Stream");
    if (free_from) {
      from.destroy();
    }
    let pdf = libmupdf._wasm_pdf_document_from_fz_document(pointer);
    if (pdf)
      return new PDFDocument(pdf);
    return new _Document(pointer);
  }
  formatLinkURI(dest) {
    return fromStringFree(libmupdf._wasm_format_link_uri(this.pointer, dest.chapter | 0, dest.page | 0, ENUM(dest.type, LinkDestination.LINK_DEST), +dest.x, +dest.y, +dest.width, +dest.height, +dest.zoom));
  }
  asPDF() {
    if (this instanceof PDFDocument)
      return this;
    return null;
  }
  isPDF() {
    return this instanceof PDFDocument;
  }
  needsPassword() {
    return !!libmupdf._wasm_needs_password(this.pointer);
  }
  authenticatePassword(password) {
    return libmupdf._wasm_authenticate_password(this.pointer, STRING(password));
  }
  hasPermission(perm) {
    let perm_ix = typeof perm === "number" ? perm : _Document.PERMISSION[perm];
    return !!libmupdf._wasm_has_permission(this.pointer, perm_ix);
  }
  getMetaData(key) {
    let value = libmupdf._wasm_lookup_metadata(this.pointer, STRING(key));
    if (value)
      return fromString(value);
    return void 0;
  }
  setMetaData(key, value) {
    libmupdf._wasm_set_metadata(this.pointer, STRING(key), STRING2(value));
  }
  countPages() {
    return libmupdf._wasm_count_pages(this.pointer);
  }
  isReflowable() {
    libmupdf._wasm_is_document_reflowable(this.pointer);
  }
  layout(w, h, em) {
    libmupdf._wasm_layout_document(this.pointer, w, h, em);
  }
  loadPage(index) {
    let fz_ptr = libmupdf._wasm_load_page(this.pointer, index);
    if (this instanceof PDFDocument) {
      let pdf_ptr = libmupdf._wasm_pdf_page_from_fz_page(fz_ptr);
      if (pdf_ptr)
        return new PDFPage(this, pdf_ptr);
    }
    return new Page(fz_ptr);
  }
  loadOutline() {
    let doc = this.pointer;
    function to_outline(outline) {
      let result = [];
      while (outline) {
        let title = libmupdf._wasm_outline_get_title(outline);
        let uri = libmupdf._wasm_outline_get_uri(outline);
        let open = libmupdf._wasm_outline_get_is_open(outline);
        let item = {
          title: title ? fromString(title) : void 0,
          uri: uri ? fromString(uri) : void 0,
          open: !!open
        };
        let page = libmupdf._wasm_outline_get_page(doc, outline);
        if (page >= 0)
          item.page = page;
        let down = libmupdf._wasm_outline_get_down(outline);
        if (down)
          item.down = to_outline(down);
        result.push(item);
        outline = libmupdf._wasm_outline_get_next(outline);
      }
      return result;
    }
    let root = libmupdf._wasm_load_outline(doc);
    if (root)
      return to_outline(root);
    return null;
  }
  resolveLink(link) {
    if (link instanceof Link)
      return libmupdf._wasm_resolve_link(this.pointer, libmupdf._wasm_link_get_uri(link.pointer));
    return libmupdf._wasm_resolve_link(this.pointer, STRING(link));
  }
  resolveLinkDestination(link) {
    let dest;
    if (link instanceof Link)
      dest = libmupdf._wasm_resolve_link_dest(this.pointer, libmupdf._wasm_link_get_uri(link.pointer));
    else
      dest = libmupdf._wasm_resolve_link_dest(this.pointer, STRING(link));
    return {
      type: LinkDestination.LINK_DEST[libmupdf._wasm_link_dest_get_type(dest)],
      chapter: libmupdf._wasm_link_dest_get_chapter(dest),
      page: libmupdf._wasm_link_dest_get_page(dest),
      x: libmupdf._wasm_link_dest_get_x(dest),
      y: libmupdf._wasm_link_dest_get_y(dest),
      width: libmupdf._wasm_link_dest_get_w(dest),
      height: libmupdf._wasm_link_dest_get_h(dest),
      zoom: libmupdf._wasm_link_dest_get_zoom(dest)
    };
  }
  outlineIterator() {
    return new OutlineIterator(libmupdf._wasm_new_outline_iterator(this.pointer));
  }
};
Document._drop = libmupdf._wasm_drop_document;
Document.META_FORMAT = "format";
Document.META_ENCRYPTION = "encryption";
Document.META_INFO_AUTHOR = "info:Author";
Document.META_INFO_TITLE = "info:Title";
Document.META_INFO_SUBJECT = "info:Subject";
Document.META_INFO_KEYWORDS = "info:Keywords";
Document.META_INFO_CREATOR = "info:Creator";
Document.META_INFO_PRODUCER = "info:Producer";
Document.META_INFO_CREATIONDATE = "info:CreationDate";
Document.META_INFO_MODIFICATIONDATE = "info:ModDate";
Document.PERMISSION_PRINT = "print";
Document.PERMISSION_COPY = "copy";
Document.PERMISSION_EDIT = "eedit";
Document.PERMISSION_ANNOTATE = "annotate";
Document.PERMISSION_FORM = "form";
Document.PERMISSION_ACCESSIBILITY = "accessibility";
Document.PERMISSION_ASSEMBLE = "assemble";
Document.PERMISSION_PRINT_HQ = "print-hq";
Document.PERMISSION = {
  "print": "p".charCodeAt(0),
  "copy": "c".charCodeAt(0),
  "edit": "e".charCodeAt(0),
  "annotate": "n".charCodeAt(0),
  "form": "f".charCodeAt(0),
  "accessibility": "y".charCodeAt(0),
  "assemble": "a".charCodeAt(0),
  "print-hq": "h".charCodeAt(0)
};
var OutlineIterator = class extends Userdata {
  item() {
    let item = libmupdf._wasm_outline_iterator_item(this.pointer);
    if (item) {
      let title_ptr = libmupdf._wasm_outline_item_get_title(item);
      let uri_ptr = libmupdf._wasm_outline_item_get_uri(item);
      let is_open = libmupdf._wasm_outline_item_get_is_open(item);
      return {
        title: title_ptr ? fromString(title_ptr) : void 0,
        uri: uri_ptr ? fromString(uri_ptr) : void 0,
        open: !!is_open
      };
    }
    return null;
  }
  next() {
    return libmupdf._wasm_outline_iterator_next(this.pointer);
  }
  prev() {
    return libmupdf._wasm_outline_iterator_prev(this.pointer);
  }
  up() {
    return libmupdf._wasm_outline_iterator_up(this.pointer);
  }
  down() {
    return libmupdf._wasm_outline_iterator_down(this.pointer);
  }
  delete() {
    return libmupdf._wasm_outline_iterator_delete(this.pointer);
  }
  insert(item) {
    return libmupdf._wasm_outline_iterator_insert(this.pointer, STRING_OPT(item.title), STRING2_OPT(item.uri), item.open);
  }
  update(item) {
    libmupdf._wasm_outline_iterator_update(this.pointer, STRING_OPT(item.title), STRING2_OPT(item.uri), item.open);
  }
};
OutlineIterator._drop = libmupdf._wasm_drop_outline_iterator;
OutlineIterator.ITERATOR_DID_NOT_MOVE = -1;
OutlineIterator.ITERATOR_AT_ITEM = 0;
OutlineIterator.ITERATOR_AT_EMPTY = 1;
OutlineIterator.FLAG_BOLD = 1;
OutlineIterator.FLAG_ITALIC = 2;
var Link = class extends Userdata {
  getBounds() {
    return fromRect(libmupdf._wasm_link_get_rect(this.pointer));
  }
  setBounds(rect) {
    checkRect(rect);
    libmupdf._wasm_link_set_rect(this.pointer, RECT(rect));
  }
  getURI() {
    return fromString(libmupdf._wasm_link_get_uri(this.pointer));
  }
  setURI(uri) {
    checkType(uri, "string");
    libmupdf._wasm_link_set_uri(this.pointer, STRING(uri));
  }
  isExternal() {
    return /^\w[\w+-.]*:/.test(this.getURI());
  }
};
Link._drop = libmupdf._wasm_drop_link;
var Page = class _Page extends Userdata {
  isPDF() {
    return this instanceof PDFPage;
  }
  getBounds(box = "CropBox") {
    let box_ix = ENUM(box, _Page.BOXES);
    return fromRect(libmupdf._wasm_bound_page(this.pointer, box_ix));
  }
  getLabel() {
    return fromString(libmupdf._wasm_page_label(this.pointer));
  }
  run(device, matrix) {
    checkType(device, Device);
    checkMatrix(matrix);
    libmupdf._wasm_run_page(this.pointer, device.pointer, MATRIX(matrix));
  }
  runPageContents(device, matrix) {
    checkType(device, Device);
    checkMatrix(matrix);
    libmupdf._wasm_run_page_contents(this.pointer, device.pointer, MATRIX(matrix));
  }
  runPageAnnots(device, matrix) {
    checkType(device, Device);
    checkMatrix(matrix);
    libmupdf._wasm_run_page_annots(this.pointer, device.pointer, MATRIX(matrix));
  }
  runPageWidgets(device, matrix) {
    checkType(device, Device);
    checkMatrix(matrix);
    libmupdf._wasm_run_page_widgets(this.pointer, device.pointer, MATRIX(matrix));
  }
  toPixmap(matrix, colorspace, alpha = false, showExtras = true) {
    checkType(colorspace, ColorSpace);
    checkMatrix(matrix);
    let result;
    if (showExtras)
      result = libmupdf._wasm_new_pixmap_from_page(this.pointer, MATRIX(matrix), colorspace.pointer, alpha);
    else
      result = libmupdf._wasm_new_pixmap_from_page_contents(this.pointer, MATRIX(matrix), colorspace.pointer, alpha);
    return new Pixmap(result);
  }
  toDisplayList(showExtras = true) {
    let result;
    if (showExtras)
      result = libmupdf._wasm_new_display_list_from_page(this.pointer);
    else
      result = libmupdf._wasm_new_display_list_from_page_contents(this.pointer);
    return new DisplayList(result);
  }
  toStructuredText(options = "") {
    checkType(options, "string");
    return new StructuredText(libmupdf._wasm_new_stext_page_from_page(this.pointer, STRING(options)));
  }
  getLinks() {
    let links = [];
    let link = libmupdf._wasm_load_links(this.pointer);
    while (link) {
      links.push(new Link(libmupdf._wasm_keep_link(link)));
      link = libmupdf._wasm_link_get_next(link);
    }
    return links;
  }
  createLink(bbox, uri) {
    checkRect(bbox);
    return new Link(libmupdf._wasm_create_link(this.pointer, RECT(bbox), STRING(uri)));
  }
  deleteLink(link) {
    checkType(link, Link);
    libmupdf._wasm_delete_link(this.pointer, link.pointer);
  }
  search(needle, max_hits = 500) {
    return runSearch(libmupdf._wasm_search_page, this.pointer, needle, max_hits);
  }
};
Page._drop = libmupdf._wasm_drop_page;
Page.BOXES = [
  "MediaBox",
  "CropBox",
  "BleedBox",
  "TrimBox",
  "ArtBox"
];
Page.MEDIA_BOX = "MediaBox";
Page.CROP_BOX = "CropBox";
Page.BLEED_BOX = "BleedBox";
Page.TRIM_BOX = "TrimBox";
Page.ART_BOX = "ArtBox";
var PDFDocument = class _PDFDocument extends Document {
  constructor(arg1) {
    if (typeof arg1 === "undefined")
      super(libmupdf._wasm_pdf_create_document());
    else if (typeof arg1 === "number")
      super(arg1);
    else if (arg1 instanceof _PDFDocument) {
      super(arg1.pointer);
      libmupdf._wasm_keep_document(this.pointer);
    } else {
      let doc = Document.openDocument(arg1, "application/pdf");
      if (doc instanceof _PDFDocument)
        return doc;
      throw new Error("not a PDF document");
    }
  }
  loadPage(index) {
    return super.loadPage(index);
  }
  // PDFObject instances are always bound to a document, so the WASM/JS value interface lives here.
  // Wrap a pdf_obj in a Userdata object. The pointer must be newly created or we already own it.
  _fromPDFObjectNew(ptr) {
    if (ptr === 0)
      return PDFObject.Null;
    return new PDFObject(this, ptr);
  }
  // Wrap a pdf_obj in a Userdata object. The pointer must be a borrowed pointer, so we have to take ownership.
  _fromPDFObjectKeep(ptr) {
    if (ptr === 0)
      return PDFObject.Null;
    return new PDFObject(this, libmupdf._wasm_pdf_keep_obj(ptr));
  }
  _toPDFObject(obj) {
    if (obj instanceof PDFObject)
      return obj;
    if (obj === null || obj === void 0)
      return this.newNull();
    if (typeof obj === "string") {
      if (obj.startsWith("(") && obj.endsWith(")"))
        return this.newString(obj.slice(1, -1));
      return this.newName(obj);
    }
    if (typeof obj === "number") {
      if (obj === (obj | 0))
        return this.newInteger(obj);
      return this.newReal(obj);
    }
    if (typeof obj === "boolean")
      return this.newBoolean(obj);
    if (obj instanceof Array) {
      let result = this.newArray();
      for (let item of obj)
        result.push(item);
      return result;
    }
    if (obj instanceof Object) {
      let result = this.newDictionary();
      for (let key in obj)
        result.put(key, obj[key]);
      return result;
    }
    throw new TypeError("cannot convert value to PDFObject");
  }
  _PDFOBJ(obj) {
    return this._toPDFObject(obj).pointer;
  }
  getVersion() {
    return libmupdf._wasm_pdf_version(this.pointer);
  }
  getLanguage() {
    return fromStringOrNull(libmupdf._wasm_pdf_document_language(this.pointer));
  }
  setLanguage(lang) {
    libmupdf._wasm_pdf_set_document_language(this.pointer, STRING(lang));
  }
  countObjects() {
    return libmupdf._wasm_pdf_xref_len(this.pointer);
  }
  getTrailer() {
    return new PDFObject(this, libmupdf._wasm_pdf_trailer(this.pointer));
  }
  createObject() {
    let num = libmupdf._wasm_pdf_create_object(this.pointer);
    return this._fromPDFObjectNew(libmupdf._wasm_pdf_new_indirect(this.pointer, num));
  }
  newNull() {
    return PDFObject.Null;
  }
  newBoolean(v) {
    return this._fromPDFObjectNew(libmupdf._wasm_pdf_new_bool(v));
  }
  newInteger(v) {
    return this._fromPDFObjectNew(libmupdf._wasm_pdf_new_int(v));
  }
  newReal(v) {
    return this._fromPDFObjectNew(libmupdf._wasm_pdf_new_real(v));
  }
  newName(v) {
    return this._fromPDFObjectNew(libmupdf._wasm_pdf_new_name(STRING(v)));
  }
  newString(v) {
    return this._fromPDFObjectNew(libmupdf._wasm_pdf_new_text_string(STRING(v)));
  }
  newByteString(v) {
    if (v instanceof Array)
      v = Uint8Array.from(v);
    checkType(v, Uint8Array);
    let len = v.byteLength;
    let ptr = Malloc(len);
    libmupdf.HEAPU8.set(v, ptr);
    try {
      return this._fromPDFObjectNew(libmupdf._wasm_pdf_new_string(ptr, len));
    } finally {
      Free(ptr);
    }
  }
  newIndirect(v) {
    return this._fromPDFObjectNew(libmupdf._wasm_pdf_new_indirect(this.pointer, v));
  }
  newArray() {
    return this._fromPDFObjectNew(libmupdf._wasm_pdf_new_array(this.pointer));
  }
  newDictionary() {
    return this._fromPDFObjectNew(libmupdf._wasm_pdf_new_dict(this.pointer));
  }
  deleteObject(num) {
    if (num instanceof PDFObject)
      num = num.asIndirect();
    else
      checkType(num, "number");
    libmupdf._wasm_pdf_delete_object(this.pointer, num);
  }
  addObject(obj) {
    return this._fromPDFObjectNew(libmupdf._wasm_pdf_add_object(this.pointer, this._PDFOBJ(obj)));
  }
  addStream(buf, obj) {
    return this._fromPDFObjectNew(libmupdf._wasm_pdf_add_stream(this.pointer, BUFFER(buf), this._PDFOBJ(obj), 0));
  }
  addRawStream(buf, obj) {
    return this._fromPDFObjectNew(libmupdf._wasm_pdf_add_stream(this.pointer, BUFFER(buf), this._PDFOBJ(obj), 1));
  }
  newGraftMap() {
    return new PDFGraftMap(this, libmupdf._wasm_pdf_new_graft_map(this.pointer));
  }
  graftObject(obj) {
    checkType(obj, PDFObject);
    return this._fromPDFObjectNew(libmupdf._wasm_pdf_graft_object(this.pointer, obj.pointer));
  }
  graftPage(to, srcDoc, srcPage) {
    checkType(to, "number");
    checkType(srcDoc, _PDFDocument);
    checkType(srcPage, "number");
    libmupdf._wasm_pdf_graft_page(this.pointer, to, srcDoc.pointer, srcPage);
  }
  addSimpleFont(font, encoding = "Latin") {
    checkType(font, Font);
    var encoding_ix = ENUM(encoding, Font.SIMPLE_ENCODING);
    return this._fromPDFObjectNew(libmupdf._wasm_pdf_add_simple_font(this.pointer, font.pointer, encoding_ix));
  }
  addCJKFont(font, lang, wmode = 0, serif = true) {
    checkType(font, Font);
    if (typeof lang === "string")
      lang = Font.CJK_ORDERING_BY_LANG[lang];
    return this._fromPDFObjectNew(libmupdf._wasm_pdf_add_cjk_font(this.pointer, font.pointer, lang, wmode, serif));
  }
  addFont(font) {
    checkType(font, Font);
    return this._fromPDFObjectNew(libmupdf._wasm_pdf_add_cid_font(this.pointer, font.pointer));
  }
  addImage(image) {
    checkType(image, Image);
    return this._fromPDFObjectNew(libmupdf._wasm_pdf_add_image(this.pointer, image.pointer));
  }
  loadImage(ref) {
    checkType(ref, PDFObject);
    return new Image(libmupdf._wasm_pdf_load_image(this.pointer, ref.pointer));
  }
  findPage(index) {
    checkType(index, "number");
    return this._fromPDFObjectKeep(libmupdf._wasm_pdf_lookup_page_obj(this.pointer, index));
  }
  setPageTreeCache(enabled) {
    checkType(enabled, "boolean");
    libmupdf._wasm_pdf_set_page_tree_cache(this.pointer, enabled);
  }
  addPage(mediabox, rotate, resources, contents) {
    checkRect(mediabox);
    checkType(rotate, "number");
    return this._fromPDFObjectNew(libmupdf._wasm_pdf_add_page(this.pointer, RECT(mediabox), rotate, this._PDFOBJ(resources), BUFFER(contents)));
  }
  insertPage(at, obj) {
    checkType(at, "number");
    libmupdf._wasm_pdf_insert_page(this.pointer, at, this._PDFOBJ(obj));
  }
  deletePage(at) {
    checkType(at, "number");
    libmupdf._wasm_pdf_delete_page(this.pointer, at);
  }
  isEmbeddedFile(ref) {
    checkType(ref, PDFObject);
    return !!libmupdf._wasm_pdf_is_embedded_file(ref.pointer);
  }
  addEmbeddedFile(filename, mimetype, contents, created, modified, checksum = false) {
    checkType(filename, "string");
    checkType(mimetype, "string");
    checkType(created, Date);
    checkType(modified, Date);
    checkType(checksum, "boolean");
    return this._fromPDFObjectNew(libmupdf._wasm_pdf_add_embedded_file(this.pointer, STRING(filename), STRING2(mimetype), BUFFER(contents), created.getTime() / 1e3 | 0, modified.getTime() / 1e3 | 0, checksum));
  }
  getFilespecParams(ref) {
    checkType(ref, PDFObject);
    let ptr = libmupdf._wasm_pdf_get_filespec_params(ref.pointer);
    return {
      filename: fromString(libmupdf._wasm_pdf_filespec_params_get_filename(ptr)),
      mimetype: fromString(libmupdf._wasm_pdf_filespec_params_get_mimetype(ptr)),
      size: libmupdf._wasm_pdf_filespec_params_get_filename(ptr),
      creationDate: new Date(libmupdf._wasm_pdf_filespec_params_get_created(ptr) * 1e3),
      modificationDate: new Date(libmupdf._wasm_pdf_filespec_params_get_modified(ptr) * 1e3)
    };
  }
  getEmbeddedFileContents(ref) {
    checkType(ref, PDFObject);
    let contents = libmupdf._wasm_pdf_load_embedded_file_contents(ref.pointer);
    if (contents)
      return new Buffer(contents);
    return null;
  }
  getEmbeddedFiles() {
    function _getEmbeddedFilesRec(result, N) {
      var i, n;
      if (N.isDictionary()) {
        var NN = N.get("Names");
        if (NN)
          for (i = 0, n = NN.length; i < n; i += 2)
            result[NN.get(i + 0).asString()] = NN.get(i + 1);
        var NK = N.get("Kids");
        if (NK)
          for (i = 0, n = NK.length; i < n; i += 1)
            _getEmbeddedFilesRec(result, NK.get(i));
      }
      return result;
    }
    return _getEmbeddedFilesRec({}, this.getTrailer().get("Root", "Names", "EmbeddedFiles"));
  }
  loadNameTree(treeName) {
    function _loadNameTreeRec(dict2, node2) {
      var kids = node2.get("Kids");
      if (kids && kids.isArray())
        for (var i = 0; i < kids.length; i += 1)
          _loadNameTreeRec(dict2, kids.get(i));
      var names = node2.get("Names");
      if (names && names.isArray())
        for (var i = 0; i < names.length; i += 2)
          dict2[names.get(i).asString()] = names.get(i + 1);
    }
    var node = this.getTrailer().get("Root").get("Names").get(treeName);
    var dict = {};
    if (node.isDictionary())
      _loadNameTreeRec(dict, node);
    return dict;
  }
  insertEmbeddedFile(filename, filespec) {
    var efs = this.getEmbeddedFiles();
    efs[filename] = filespec;
    this._rewriteEmbeddedFiles(efs);
  }
  deleteEmbeddedFile(filename) {
    var efs = this.getEmbeddedFiles();
    delete efs[filename];
    this._rewriteEmbeddedFiles(efs);
  }
  _rewriteEmbeddedFiles(efs) {
    var efs_keys = Object.keys(efs);
    efs_keys.sort();
    var root = this.getTrailer().get("Root");
    var root_names = root.get("Names");
    if (!root_names.isDictionary())
      root_names = root.put("Names", this.newDictionary());
    var root_names_efs = root_names.put("EmbeddedFiles", this.newDictionary());
    var root_names_efs_names = root_names_efs.put("Names", this.newArray());
    for (var key of efs_keys) {
      root_names_efs_names.push(this.newString(key));
      root_names_efs_names.push(efs[key]);
    }
  }
  saveToBuffer(options = "") {
    var options_string;
    if (typeof options === "object") {
      options_string = Object.entries(options).map((kv) => {
        var k = kv[0];
        var v = kv[1];
        if (v === true)
          return k + "=yes";
        else if (v === false)
          return k + "=no";
        else
          return k + "=" + String(v).replaceAll(",", ":");
      }).join(",");
    } else {
      options_string = options;
    }
    return new Buffer(libmupdf._wasm_pdf_write_document_buffer(this.pointer, STRING(options_string)));
  }
  save(filename, options = "") {
    if (node_fs)
      node_fs.writeFileSync(filename, this.saveToBuffer(options).asUint8Array());
    else
      throw new Error("missing 'fs' module");
  }
  setPageLabels(index, style = "D", prefix = "", start = 1) {
    libmupdf._wasm_pdf_set_page_labels(this.pointer, index, style.charCodeAt(0), STRING(prefix), start);
  }
  deletePageLabels(index) {
    libmupdf._wasm_pdf_delete_page_labels(this.pointer, index);
  }
  wasRepaired() {
    return !!libmupdf._wasm_pdf_was_repaired(this.pointer);
  }
  hasUnsavedChanges() {
    return !!libmupdf._wasm_pdf_has_unsaved_changes(this.pointer);
  }
  countVersions() {
    return libmupdf._wasm_pdf_count_versions(this.pointer);
  }
  countUnsavedVersions() {
    return libmupdf._wasm_pdf_count_unsaved_versions(this.pointer);
  }
  validateChangeHistory() {
    return libmupdf._wasm_pdf_validate_change_history(this.pointer);
  }
  canBeSavedIncrementally() {
    return !!libmupdf._wasm_pdf_can_be_saved_incrementally(this.pointer);
  }
  enableJournal() {
    libmupdf._wasm_pdf_enable_journal(this.pointer);
  }
  getJournal() {
    let position = libmupdf._wasm_pdf_undoredo_state_position(this.pointer);
    let n = libmupdf._wasm_pdf_undoredo_state_count(this.pointer);
    let steps = [];
    for (let i = 0; i < n; ++i)
      steps.push(fromString(libmupdf._wasm_pdf_undoredo_step(this.pointer, i)));
    return { position, steps };
  }
  beginOperation(op) {
    libmupdf._wasm_pdf_begin_operation(this.pointer, STRING(op));
  }
  beginImplicitOperation() {
    libmupdf._wasm_pdf_begin_implicit_operation(this.pointer);
  }
  endOperation() {
    libmupdf._wasm_pdf_end_operation(this.pointer);
  }
  abandonOperation() {
    libmupdf._wasm_pdf_abandon_operation(this.pointer);
  }
  canUndo() {
    return !!libmupdf._wasm_pdf_can_undo(this.pointer);
  }
  canRedo() {
    return !!libmupdf._wasm_pdf_can_redo(this.pointer);
  }
  undo() {
    libmupdf._wasm_pdf_undo(this.pointer);
  }
  redo() {
    libmupdf._wasm_pdf_redo(this.pointer);
  }
  isJSSupported() {
    return !!libmupdf._wasm_pdf_js_supported(this.pointer);
  }
  enableJS() {
    libmupdf._wasm_pdf_enable_js(this.pointer);
  }
  disableJS() {
    libmupdf._wasm_pdf_disable_js(this.pointer);
  }
  setJSEventListener(_listener) {
    throw "TODO";
  }
  rearrangePages(pages) {
    let n = pages.length;
    let ptr = Malloc(n << 2);
    for (let i = 0; i < n; ++i)
      libmupdf.HEAPU32[(ptr >> 2) + i] = pages[i] || 0;
    try {
      libmupdf._wasm_pdf_rearrange_pages(this.pointer, n, ptr);
    } finally {
      Free(ptr);
    }
  }
  subsetFonts() {
    libmupdf._wasm_pdf_subset_fonts(this.pointer);
  }
  bake(bakeAnnots = true, bakeWidgets = true) {
    libmupdf._wasm_pdf_bake_document(this.pointer, bakeAnnots, bakeWidgets);
  }
  countLayerConfigs() {
    return libmupdf._wasm_pdf_count_layer_configs(this.pointer);
  }
  getLayerConfigCreator(config) {
    return fromString(libmupdf._wasm_pdf_layer_config_creator(this.pointer, config));
  }
  getLayerConfigName(config) {
    return fromString(libmupdf._wasm_pdf_layer_config_name(this.pointer, config));
  }
  selectLayerConfig(config) {
    libmupdf._wasm_pdf_select_layer_config(this.pointer, config);
  }
  countLayerConfigUIs() {
    return libmupdf._wasm_pdf_count_layer_config_uis(this.pointer);
  }
  getLayerConfigUIInfo(configui) {
    return fromLayerConfigUIInfo(libmupdf._wasm_pdf_layer_config_ui_info(this.pointer, configui));
  }
  countLayers() {
    return libmupdf._wasm_pdf_count_layers(this.pointer);
  }
  isLayerVisible(layer) {
    return !!libmupdf._wasm_pdf_layer_is_enabled(this.pointer, layer);
  }
  setLayerVisible(layer, visible) {
    libmupdf._wasm_pdf_enable_layer(this.pointer, layer, Number(visible));
  }
  getLayerName(layer) {
    return fromString(libmupdf._wasm_pdf_layer_name(this.pointer, layer));
  }
  resetForm(fields, exclude) {
    libmupdf._wasm_pdf_reset_form(this.pointer, this._PDFOBJ(fields), Number(exclude));
  }
};
PDFDocument.PAGE_LABEL_NONE = "\0";
PDFDocument.PAGE_LABEL_DECIMAL = "D";
PDFDocument.PAGE_LABEL_ROMAN_UC = "R";
PDFDocument.PAGE_LABEL_ROMAN_LC = "r";
PDFDocument.PAGE_LABEL_ALPHA_UC = "A";
PDFDocument.PAGE_LABEL_ALPHA_LC = "a";
var PDFPage = class extends Page {
  // PRIVATE
  constructor(doc, pointer) {
    super(pointer);
    this._doc = doc;
    this._annots = null;
    this._widgets = null;
  }
  getObject() {
    return this._doc._fromPDFObjectKeep(libmupdf._wasm_pdf_page_get_obj(this.pointer));
  }
  getTransform() {
    return fromMatrix(libmupdf._wasm_pdf_page_transform(this.pointer));
  }
  setPageBox(box, rect) {
    let box_ix = ENUM(box, Page.BOXES);
    checkRect(rect);
    libmupdf._wasm_pdf_set_page_box(this.pointer, box_ix, RECT(rect));
  }
  toPixmap(matrix, colorspace, alpha = false, showExtras = true, usage = "View", box = "CropBox") {
    checkMatrix(matrix);
    checkType(colorspace, ColorSpace);
    let box_ix = ENUM(box, Page.BOXES);
    let result;
    if (showExtras)
      result = libmupdf._wasm_pdf_new_pixmap_from_page_with_usage(this.pointer, MATRIX(matrix), colorspace.pointer, alpha, STRING(usage), box_ix);
    else
      result = libmupdf._wasm_pdf_new_pixmap_from_page_contents_with_usage(this.pointer, MATRIX(matrix), colorspace.pointer, alpha, STRING(usage), box_ix);
    return new Pixmap(result);
  }
  getWidgets() {
    if (!this._widgets) {
      this._widgets = [];
      let widget = libmupdf._wasm_pdf_first_widget(this.pointer);
      while (widget) {
        this._widgets.push(new PDFWidget(this._doc, libmupdf._wasm_pdf_keep_annot(widget)));
        widget = libmupdf._wasm_pdf_next_widget(widget);
      }
    }
    return this._widgets;
  }
  getAnnotations() {
    if (!this._annots) {
      this._annots = [];
      let annot = libmupdf._wasm_pdf_first_annot(this.pointer);
      while (annot) {
        this._annots.push(new PDFAnnotation(this._doc, libmupdf._wasm_pdf_keep_annot(annot)));
        annot = libmupdf._wasm_pdf_next_annot(annot);
      }
    }
    return this._annots;
  }
  createAnnotation(type) {
    let type_ix = ENUM(type, PDFAnnotation.ANNOT_TYPES);
    let annot = new PDFAnnotation(this._doc, libmupdf._wasm_pdf_create_annot(this.pointer, type_ix));
    if (this._annots)
      this._annots.push(annot);
    return annot;
  }
  deleteAnnotation(annot) {
    checkType(annot, PDFAnnotation);
    libmupdf._wasm_pdf_delete_annot(this.pointer, annot.pointer);
    if (this._annots) {
      let ix = this._annots.indexOf(annot);
      if (ix >= 0)
        this._annots.splice(ix, 1);
    }
  }
  applyRedactions(black_boxes = true, image_method = 2, line_art_method = 1, text_method = 0) {
    libmupdf._wasm_pdf_redact_page(this.pointer, Number(black_boxes), image_method, line_art_method, text_method);
  }
  update() {
    return !!libmupdf._wasm_pdf_update_page(this.pointer);
  }
};
PDFPage.REDACT_IMAGE_NONE = 0;
PDFPage.REDACT_IMAGE_REMOVE = 1;
PDFPage.REDACT_IMAGE_PIXELS = 2;
PDFPage.REDACT_IMAGE_UNLESS_INVISIBLE = 3;
PDFPage.REDACT_LINE_ART_NONE = 0;
PDFPage.REDACT_LINE_ART_REMOVE_IF_COVERED = 1;
PDFPage.REDACT_LINE_ART_REMOVE_IF_TOUCHED = 2;
PDFPage.REDACT_TEXT_REMOVE = 0;
PDFPage.REDACT_TEXT_NONE = 1;
var PDFObject = class _PDFObject extends Userdata {
  // PRIVATE
  constructor(doc, pointer) {
    super(libmupdf._wasm_pdf_keep_obj(pointer));
    this._doc = doc;
  }
  isNull() {
    return this === _PDFObject.Null;
  }
  isIndirect() {
    return !!libmupdf._wasm_pdf_is_indirect(this.pointer);
  }
  isBoolean() {
    return !!libmupdf._wasm_pdf_is_bool(this.pointer);
  }
  isInteger() {
    return !!libmupdf._wasm_pdf_is_int(this.pointer);
  }
  isReal() {
    return !!libmupdf._wasm_pdf_is_real(this.pointer);
  }
  isNumber() {
    return !!libmupdf._wasm_pdf_is_number(this.pointer);
  }
  isName() {
    return !!libmupdf._wasm_pdf_is_name(this.pointer);
  }
  isString() {
    return !!libmupdf._wasm_pdf_is_string(this.pointer);
  }
  isArray() {
    return !!libmupdf._wasm_pdf_is_array(this.pointer);
  }
  isDictionary() {
    return !!libmupdf._wasm_pdf_is_dict(this.pointer);
  }
  isStream() {
    return !!libmupdf._wasm_pdf_is_stream(this.pointer);
  }
  asIndirect() {
    return libmupdf._wasm_pdf_to_num(this.pointer);
  }
  asBoolean() {
    return !!libmupdf._wasm_pdf_to_bool(this.pointer);
  }
  asNumber() {
    return libmupdf._wasm_pdf_to_real(this.pointer);
  }
  asName() {
    return fromString(libmupdf._wasm_pdf_to_name(this.pointer));
  }
  asString() {
    return fromString(libmupdf._wasm_pdf_to_text_string(this.pointer));
  }
  asByteString() {
    let ptr = libmupdf._wasm_pdf_to_string(this.pointer, _wasm_int);
    let len = libmupdf.HEAPU32[_wasm_int >> 2];
    return libmupdf.HEAPU8.slice(ptr, ptr + len);
  }
  readStream() {
    return new Buffer(libmupdf._wasm_pdf_load_stream(this.pointer));
  }
  readRawStream() {
    return new Buffer(libmupdf._wasm_pdf_load_raw_stream(this.pointer));
  }
  writeObject(obj) {
    if (!this.isIndirect())
      throw new TypeError("can only call PDFObject.writeObject on an indirect reference");
    libmupdf._wasm_pdf_update_object(this._doc.pointer, this.asIndirect(), this._doc._PDFOBJ(obj));
  }
  writeStream(buf) {
    if (!this.isIndirect())
      throw new TypeError("can only call PDFObject.writeStream on an indirect reference");
    libmupdf._wasm_pdf_update_stream(this._doc.pointer, this.pointer, BUFFER(buf), 0);
  }
  writeRawStream(buf) {
    if (!this.isIndirect())
      throw new TypeError("can only call PDFObject.writeRawStream on an indirect reference");
    libmupdf._wasm_pdf_update_stream(this._doc.pointer, this.pointer, BUFFER(buf), 1);
  }
  resolve() {
    return this._doc._fromPDFObjectKeep(libmupdf._wasm_pdf_resolve_indirect(this.pointer));
  }
  get length() {
    return libmupdf._wasm_pdf_array_len(this.pointer);
  }
  set length(_2) {
    throw new TypeError("object length is read-only");
  }
  _get(path) {
    let obj = this.pointer;
    for (let key of path) {
      if (typeof key === "number")
        obj = libmupdf._wasm_pdf_array_get(obj, key);
      else if (key instanceof _PDFObject)
        obj = libmupdf._wasm_pdf_dict_get(obj, key.pointer);
      else
        obj = libmupdf._wasm_pdf_dict_gets(obj, STRING(key));
      if (obj === 0)
        break;
    }
    return obj;
  }
  get(...path) {
    return this._doc._fromPDFObjectKeep(this._get(path));
  }
  getInheritable(key) {
    if (key instanceof _PDFObject)
      return this._doc._fromPDFObjectKeep(libmupdf._wasm_pdf_dict_get_inheritable(this.pointer, key.pointer));
    return this._doc._fromPDFObjectKeep(libmupdf._wasm_pdf_dict_gets_inheritable(this.pointer, STRING(key)));
  }
  put(key, value) {
    value = this._doc._toPDFObject(value);
    if (typeof key === "number")
      libmupdf._wasm_pdf_array_put(this.pointer, key, value.pointer);
    else if (key instanceof _PDFObject)
      libmupdf._wasm_pdf_dict_put(this.pointer, key.pointer, value.pointer);
    else
      libmupdf._wasm_pdf_dict_puts(this.pointer, STRING(key), value.pointer);
    return value;
  }
  push(value) {
    value = this._doc._toPDFObject(value);
    libmupdf._wasm_pdf_array_push(this.pointer, value.pointer);
    return value;
  }
  delete(key) {
    if (typeof key === "number")
      libmupdf._wasm_pdf_array_delete(this.pointer, key);
    else if (key instanceof _PDFObject)
      libmupdf._wasm_pdf_dict_del(this.pointer, key.pointer);
    else
      libmupdf._wasm_pdf_dict_dels(this.pointer, STRING(key));
  }
  valueOf() {
    if (this.isNull())
      return null;
    if (this.isBoolean())
      return this.asBoolean();
    if (this.isNumber())
      return this.asNumber();
    if (this.isName())
      return this.asName();
    if (this.isString())
      return this.asString();
    if (this.isIndirect())
      return `${this.asIndirect()} 0 R`;
    return this;
  }
  toString(tight = true, ascii = true) {
    return fromStringFree(libmupdf._wasm_pdf_sprint_obj(this.pointer, tight, ascii));
  }
  forEach(fn) {
    if (this.isArray()) {
      let n = this.length;
      for (let i = 0; i < n; ++i)
        fn(this.get(i), i, this);
    } else if (this.isDictionary()) {
      let n = libmupdf._wasm_pdf_dict_len(this.pointer);
      for (let i = 0; i < n; ++i) {
        let key = this._doc._fromPDFObjectKeep(libmupdf._wasm_pdf_dict_get_key(this.pointer, i));
        let val = this._doc._fromPDFObjectKeep(libmupdf._wasm_pdf_dict_get_val(this.pointer, i));
        fn(val, key.asName(), this);
      }
    }
  }
  // Convert to plain Javascript values, objects, and arrays.
  // If you want to resolve indirect references, pass an empty object or array as the first argument.
  // On exit, this object will contain all indirect objects encountered indexed by object number.
  // Note: This function will omit cyclic references.
  asJS(seen) {
    if (this.isIndirect()) {
      let ref = this.asIndirect();
      if (!seen)
        return `${ref} 0 R`;
      if (ref in seen)
        return seen[ref];
      seen[ref] = _PDFObject.Null;
      return seen[ref] = this.resolve().asJS(seen);
    }
    if (this.isArray()) {
      let result = [];
      this.forEach((val) => {
        result.push(val.asJS(seen));
      });
      return result;
    }
    if (this.isDictionary()) {
      let result = {};
      this.forEach((val, key) => {
        result[key] = val.asJS(seen);
      });
      return result;
    }
    return this.valueOf();
  }
};
PDFObject._drop = libmupdf._wasm_pdf_drop_obj;
PDFObject.Null = new PDFObject(null, 0);
var PDFGraftMap = class extends Userdata {
  // PRIVATE
  constructor(doc, pointer) {
    super(pointer);
    this._doc = doc;
  }
  graftObject(obj) {
    checkType(obj, PDFObject);
    return this._doc._fromPDFObjectNew(libmupdf._wasm_pdf_graft_mapped_object(this.pointer, obj.pointer));
  }
  graftPage(to, srcDoc, srcPage) {
    checkType(to, "number");
    checkType(srcDoc, PDFDocument);
    checkType(srcPage, "number");
    libmupdf._wasm_pdf_graft_mapped_page(this.pointer, to, srcDoc.pointer, srcPage);
  }
};
PDFGraftMap._drop = libmupdf._wasm_pdf_drop_graft_map;
var PDFAnnotation = class _PDFAnnotation extends Userdata {
  // PRIVATE
  constructor(doc, pointer) {
    super(pointer);
    this._doc = doc;
  }
  getObject() {
    return this._doc._fromPDFObjectKeep(libmupdf._wasm_pdf_annot_obj(this.pointer));
  }
  getBounds() {
    return fromRect(libmupdf._wasm_pdf_bound_annot(this.pointer));
  }
  run(device, matrix) {
    checkType(device, Device);
    checkMatrix(matrix);
    libmupdf._wasm_pdf_run_annot(this.pointer, device.pointer, MATRIX(matrix));
  }
  toPixmap(matrix, colorspace, alpha = false) {
    checkMatrix(matrix);
    checkType(colorspace, ColorSpace);
    return new Pixmap(libmupdf._wasm_pdf_new_pixmap_from_annot(this.pointer, MATRIX(matrix), colorspace.pointer, alpha));
  }
  toDisplayList() {
    return new DisplayList(libmupdf._wasm_pdf_new_display_list_from_annot(this.pointer));
  }
  update() {
    return !!libmupdf._wasm_pdf_update_annot(this.pointer);
  }
  getType() {
    let type = libmupdf._wasm_pdf_annot_type(this.pointer);
    return _PDFAnnotation.ANNOT_TYPES[type] || "Text";
  }
  getLanguage() {
    return fromStringOrNull(libmupdf._wasm_pdf_annot_language(this.pointer));
  }
  setLanguage(lang) {
    libmupdf._wasm_pdf_set_annot_language(this.pointer, STRING(lang));
  }
  getFlags() {
    return libmupdf._wasm_pdf_annot_flags(this.pointer);
  }
  setFlags(flags) {
    return libmupdf._wasm_pdf_set_annot_flags(this.pointer, flags);
  }
  getContents() {
    return fromString(libmupdf._wasm_pdf_annot_contents(this.pointer));
  }
  setContents(text) {
    libmupdf._wasm_pdf_set_annot_contents(this.pointer, STRING(text));
  }
  getAuthor() {
    return fromString(libmupdf._wasm_pdf_annot_author(this.pointer));
  }
  setAuthor(text) {
    libmupdf._wasm_pdf_set_annot_author(this.pointer, STRING(text));
  }
  getCreationDate() {
    return new Date(libmupdf._wasm_pdf_annot_creation_date(this.pointer) * 1e3);
  }
  setCreationDate(date) {
    checkType(date, Date);
    libmupdf._wasm_pdf_set_annot_creation_date(this.pointer, date.getTime() / 1e3);
  }
  getModificationDate() {
    return new Date(libmupdf._wasm_pdf_annot_modification_date(this.pointer) * 1e3);
  }
  setModificationDate(date) {
    checkType(date, Date);
    libmupdf._wasm_pdf_set_annot_modification_date(this.pointer, date.getTime() / 1e3);
  }
  hasRect() {
    return !!libmupdf._wasm_pdf_annot_has_rect(this.pointer);
  }
  hasInkList() {
    return !!libmupdf._wasm_pdf_annot_has_ink_list(this.pointer);
  }
  hasQuadPoints() {
    return !!libmupdf._wasm_pdf_annot_has_quad_points(this.pointer);
  }
  hasVertices() {
    return !!libmupdf._wasm_pdf_annot_has_vertices(this.pointer);
  }
  hasLine() {
    return !!libmupdf._wasm_pdf_annot_has_line(this.pointer);
  }
  hasInteriorColor() {
    return !!libmupdf._wasm_pdf_annot_has_interior_color(this.pointer);
  }
  hasLineEndingStyles() {
    return !!libmupdf._wasm_pdf_annot_has_line_ending_styles(this.pointer);
  }
  hasBorder() {
    return !!libmupdf._wasm_pdf_annot_has_border(this.pointer);
  }
  hasBorderEffect() {
    return !!libmupdf._wasm_pdf_annot_has_border_effect(this.pointer);
  }
  hasIcon() {
    return !!libmupdf._wasm_pdf_annot_has_icon_name(this.pointer);
  }
  hasOpen() {
    return !!libmupdf._wasm_pdf_annot_has_open(this.pointer);
  }
  hasAuthor() {
    return !!libmupdf._wasm_pdf_annot_has_author(this.pointer);
  }
  hasFilespec() {
    return !!libmupdf._wasm_pdf_annot_has_filespec(this.pointer);
  }
  hasCallout() {
    return !!libmupdf._wasm_pdf_annot_has_callout(this.pointer);
  }
  hasRichContents() {
    return !!libmupdf._wasm_pdf_annot_has_rich_contents(this.pointer);
  }
  getRect() {
    return fromRect(libmupdf._wasm_pdf_annot_rect(this.pointer));
  }
  setRect(rect) {
    checkRect(rect);
    libmupdf._wasm_pdf_set_annot_rect(this.pointer, RECT(rect));
  }
  getPopup() {
    return fromRect(libmupdf._wasm_pdf_annot_popup(this.pointer));
  }
  setPopup(rect) {
    checkRect(rect);
    libmupdf._wasm_pdf_set_annot_popup(this.pointer, RECT(rect));
  }
  getIsOpen() {
    return !!libmupdf._wasm_pdf_annot_is_open(this.pointer);
  }
  setIsOpen(isOpen) {
    checkType(isOpen, "boolean");
    libmupdf._wasm_pdf_set_annot_is_open(this.pointer, isOpen);
  }
  getHiddenForEditing() {
    return !!libmupdf._wasm_pdf_annot_hidden_for_editing(this.pointer);
  }
  setHiddenForEditing(isHidden) {
    checkType(isHidden, "boolean");
    libmupdf._wasm_pdf_set_annot_hidden_for_editing(this.pointer, isHidden);
  }
  getIcon() {
    return fromString(libmupdf._wasm_pdf_annot_icon_name(this.pointer));
  }
  setIcon(text) {
    checkType(text, "string");
    libmupdf._wasm_pdf_set_annot_icon_name(this.pointer, STRING(text));
  }
  getOpacity() {
    return libmupdf._wasm_pdf_annot_opacity(this.pointer);
  }
  setOpacity(opacity) {
    checkType(opacity, "number");
    libmupdf._wasm_pdf_set_annot_opacity(this.pointer, opacity);
  }
  getQuadding() {
    return libmupdf._wasm_pdf_annot_quadding(this.pointer);
  }
  setQuadding(quadding) {
    checkType(quadding, "number");
    libmupdf._wasm_pdf_set_annot_quadding(this.pointer, quadding);
  }
  getLine() {
    let a = fromPoint(libmupdf._wasm_pdf_annot_line_1(this.pointer));
    let b = fromPoint(libmupdf._wasm_pdf_annot_line_2(this.pointer));
    return [a, b];
  }
  setLine(a, b) {
    checkPoint(a);
    checkPoint(b);
    libmupdf._wasm_pdf_set_annot_line(this.pointer, POINT(a), POINT2(b));
  }
  getLineEndingStyles() {
    let a = libmupdf._wasm_pdf_annot_line_ending_styles_start(this.pointer);
    let b = libmupdf._wasm_pdf_annot_line_ending_styles_end(this.pointer);
    return {
      start: _PDFAnnotation.LINE_ENDING[a] || "None",
      end: _PDFAnnotation.LINE_ENDING[b] || "None"
    };
  }
  setLineEndingStyles(start, end) {
    let start_ix = ENUM(start, _PDFAnnotation.LINE_ENDING);
    let end_ix = ENUM(end, _PDFAnnotation.LINE_ENDING);
    libmupdf._wasm_pdf_set_annot_line_ending_styles(this.pointer, start_ix, end_ix);
  }
  getLineCaption() {
    return libmupdf._wasm_pdf_annot_line_caption(this.pointer);
  }
  setLineCaption(on) {
    return libmupdf._wasm_pdf_set_annot_line_caption(this.pointer, on);
  }
  getLineCaptionOffset() {
    return fromPoint(libmupdf._wasm_pdf_annot_line_caption_offset(this.pointer));
  }
  setLineCaptionOffset(p) {
    return libmupdf._wasm_pdf_set_annot_line_caption_offset(this.pointer, POINT(p));
  }
  getLineLeader() {
    return libmupdf._wasm_pdf_annot_line_leader(this.pointer);
  }
  getLineLeaderExtension() {
    return libmupdf._wasm_pdf_annot_line_leader_extension(this.pointer);
  }
  getLineLeaderOffset() {
    return libmupdf._wasm_pdf_annot_line_leader_offset(this.pointer);
  }
  setLineLeader(v) {
    return libmupdf._wasm_pdf_set_annot_line_leader(this.pointer, v);
  }
  setLineLeaderExtension(v) {
    return libmupdf._wasm_pdf_set_annot_line_leader_extension(this.pointer, v);
  }
  setLineLeaderOffset(v) {
    return libmupdf._wasm_pdf_set_annot_line_leader_offset(this.pointer, v);
  }
  getCalloutStyle() {
    let style = libmupdf._wasm_pdf_annot_callout_style(this.pointer);
    return _PDFAnnotation.LINE_ENDING[style] || "None";
  }
  setCalloutStyle(style) {
    let style_ix = ENUM(style, _PDFAnnotation.LINE_ENDING);
    libmupdf._wasm_pdf_set_annot_callout_style(this.pointer, style_ix);
  }
  getCalloutLine() {
    let n = libmupdf._wasm_pdf_annot_callout_line(this.pointer, _wasm_point << 2);
    if (n == 3)
      return [
        fromPoint(_wasm_point + 0 << 2),
        fromPoint(_wasm_point + 1 << 2),
        fromPoint(_wasm_point + 2 << 2)
      ];
    if (n == 2)
      return [
        fromPoint(_wasm_point + 0 << 2),
        fromPoint(_wasm_point + 1 << 2)
      ];
    return null;
  }
  setCalloutLine(line) {
    let a = line[0] || [0, 0];
    let b = line[1] || [0, 0];
    let c = line[2] || [0, 0];
    libmupdf._wasm_pdf_set_annot_callout_line(this.pointer, line.length, POINT(a), POINT2(b), POINT3(c));
  }
  getCalloutPoint() {
    let line = this.getCalloutLine();
    if (line)
      return line[0];
    return void 0;
  }
  setCalloutPoint(p) {
    libmupdf._wasm_pdf_set_annot_callout_point(this.pointer, POINT(p));
  }
  getColor() {
    return fromAnnotColor(libmupdf._wasm_pdf_annot_color(this.pointer, COLOR()));
  }
  getInteriorColor() {
    return fromAnnotColor(libmupdf._wasm_pdf_annot_interior_color(this.pointer, COLOR()));
  }
  setColor(color) {
    checkAnnotColor(color);
    libmupdf._wasm_pdf_set_annot_color(this.pointer, color.length, COLOR(color));
  }
  setInteriorColor(color) {
    checkAnnotColor(color);
    libmupdf._wasm_pdf_set_annot_interior_color(this.pointer, color.length, COLOR(color));
  }
  getBorderWidth() {
    return libmupdf._wasm_pdf_annot_border_width(this.pointer);
  }
  setBorderWidth(value) {
    checkType(value, "number");
    return libmupdf._wasm_pdf_set_annot_border_width(this.pointer, value);
  }
  getBorderStyle() {
    return _PDFAnnotation.BORDER_STYLE[libmupdf._wasm_pdf_annot_border_style(this.pointer)] || "Solid";
  }
  setBorderStyle(value) {
    let value_ix = ENUM(value, _PDFAnnotation.BORDER_STYLE);
    return libmupdf._wasm_pdf_set_annot_border_style(this.pointer, value_ix);
  }
  getBorderEffect() {
    return _PDFAnnotation.BORDER_EFFECT[libmupdf._wasm_pdf_annot_border_effect(this.pointer)] || "None";
  }
  setBorderEffect(value) {
    let value_ix = ENUM(value, _PDFAnnotation.BORDER_EFFECT);
    return libmupdf._wasm_pdf_set_annot_border_effect(this.pointer, value_ix);
  }
  getBorderEffectIntensity() {
    return libmupdf._wasm_pdf_annot_border_effect_intensity(this.pointer);
  }
  setBorderEffectIntensity(value) {
    checkType(value, "number");
    return libmupdf._wasm_pdf_set_annot_border_effect_intensity(this.pointer, value);
  }
  getBorderDashCount() {
    return libmupdf._wasm_pdf_annot_border_dash_count(this.pointer);
  }
  getBorderDashItem(idx) {
    return libmupdf._wasm_pdf_annot_border_dash_item(this.pointer, idx);
  }
  clearBorderDash() {
    libmupdf._wasm_pdf_clear_annot_border_dash(this.pointer);
  }
  addBorderDashItem(v) {
    checkType(v, "number");
    return libmupdf._wasm_pdf_add_annot_border_dash_item(this.pointer, v);
  }
  getBorderDashPattern() {
    let n = this.getBorderDashCount();
    let result = new Array(n);
    for (let i = 0; i < n; ++i)
      result[i] = this.getBorderDashItem(i);
    return result;
  }
  setBorderDashPattern(list) {
    this.clearBorderDash();
    for (let v of list)
      this.addBorderDashItem(v);
  }
  getIntent() {
    return _PDFAnnotation.INTENT[libmupdf._wasm_pdf_annot_intent(this.pointer)] || null;
  }
  setIntent(value) {
    let value_ix = ENUM(value, _PDFAnnotation.INTENT);
    return libmupdf._wasm_pdf_set_annot_intent(this.pointer, value_ix);
  }
  setDefaultAppearance(fontName, size, color) {
    checkType(fontName, "string");
    checkType(size, "number");
    checkAnnotColor(color);
    libmupdf._wasm_pdf_set_annot_default_appearance(this.pointer, STRING(fontName), size, color.length, COLOR(color));
  }
  getDefaultAppearance() {
    let font = fromString(libmupdf._wasm_pdf_annot_default_appearance_font(this.pointer));
    let size = libmupdf._wasm_pdf_annot_default_appearance_size(this.pointer);
    let color = fromAnnotColor(libmupdf._wasm_pdf_annot_default_appearance_color(this.pointer, COLOR()));
    return { font, size, color };
  }
  getFileSpec() {
    return this._doc._fromPDFObjectKeep(libmupdf._wasm_pdf_annot_filespec(this.pointer));
  }
  setFileSpec(fs) {
    return libmupdf._wasm_pdf_set_annot_filespec(this.pointer, this._doc._PDFOBJ(fs));
  }
  getQuadPoints() {
    let n = libmupdf._wasm_pdf_annot_quad_point_count(this.pointer);
    let result = [];
    for (let i = 0; i < n; ++i)
      result.push(fromQuad(libmupdf._wasm_pdf_annot_quad_point(this.pointer, i)));
    return result;
  }
  clearQuadPoints() {
    libmupdf._wasm_pdf_clear_annot_quad_points(this.pointer);
  }
  addQuadPoint(quad) {
    checkQuad(quad);
    libmupdf._wasm_pdf_add_annot_quad_point(this.pointer, QUAD(quad));
  }
  setQuadPoints(quadlist) {
    this.clearQuadPoints();
    for (let quad of quadlist)
      this.addQuadPoint(quad);
  }
  getVertices() {
    let n = libmupdf._wasm_pdf_annot_vertex_count(this.pointer);
    let result = new Array(n);
    for (let i = 0; i < n; ++i)
      result[i] = fromPoint(libmupdf._wasm_pdf_annot_vertex(this.pointer, i));
    return result;
  }
  clearVertices() {
    libmupdf._wasm_pdf_clear_annot_vertices(this.pointer);
  }
  addVertex(vertex) {
    checkPoint(vertex);
    libmupdf._wasm_pdf_add_annot_vertex(this.pointer, POINT(vertex));
  }
  setVertices(vertexlist) {
    this.clearVertices();
    for (let vertex of vertexlist)
      this.addVertex(vertex);
  }
  getInkList() {
    let n = libmupdf._wasm_pdf_annot_ink_list_count(this.pointer);
    let outer = [];
    for (let i = 0; i < n; ++i) {
      let m = libmupdf._wasm_pdf_annot_ink_list_stroke_count(this.pointer, i);
      let inner = new Array(m);
      for (let k = 0; k < m; ++k)
        inner[k] = fromPoint(libmupdf._wasm_pdf_annot_ink_list_stroke_vertex(this.pointer, i, k));
      outer.push(inner);
    }
    return outer;
  }
  clearInkList() {
    libmupdf._wasm_pdf_clear_annot_ink_list(this.pointer);
  }
  addInkListStroke() {
    libmupdf._wasm_pdf_add_annot_ink_list_stroke(this.pointer);
  }
  addInkListStrokeVertex(v) {
    checkPoint(v);
    libmupdf._wasm_pdf_add_annot_ink_list_stroke_vertex(this.pointer, POINT(v));
  }
  setInkList(inklist) {
    this.clearInkList();
    for (let stroke of inklist) {
      this.addInkListStroke();
      for (let vertex of stroke)
        this.addInkListStrokeVertex(vertex);
    }
  }
  getRichContents() {
    return fromString(libmupdf._wasm_pdf_annot_rich_contents(this.pointer));
  }
  setRichContents(plain, html) {
    checkType(plain, "string");
    checkType(html, "string");
    libmupdf._wasm_pdf_set_annot_rich_contents(this.pointer, STRING(plain), STRING2(html));
  }
  getRichDefaults() {
    return fromString(libmupdf._wasm_pdf_annot_rich_defaults(this.pointer));
  }
  setRichDefaults(style) {
    checkType(style, "string");
    libmupdf._wasm_pdf_set_annot_rich_defaults(this.pointer, STRING(style));
  }
  setStampImage(image) {
    libmupdf._wasm_pdf_set_annot_stamp_image(this.pointer, image.pointer);
  }
  setAppearanceFromDisplayList(appearance, state, transform, list) {
    checkMatrix(transform);
    checkType(list, DisplayList);
    libmupdf._wasm_pdf_set_annot_appearance_from_display_list(this.pointer, STRING_OPT(appearance), STRING2_OPT(state), MATRIX(transform), list.pointer);
  }
  setAppearance(appearance, state, transform, bbox, resources, contents) {
    checkMatrix(transform);
    checkRect(bbox);
    libmupdf._wasm_pdf_set_annot_appearance(this.pointer, STRING_OPT(appearance), STRING2_OPT(state), MATRIX(transform), RECT(bbox), this._doc._PDFOBJ(resources), BUFFER(contents));
  }
  applyRedaction(black_boxes = 1, image_method = 2, line_art_method = 1, text_method = 0) {
    libmupdf._wasm_pdf_apply_redaction(this.pointer, black_boxes, image_method, line_art_method, text_method);
  }
};
PDFAnnotation._drop = libmupdf._wasm_pdf_drop_annot;
PDFAnnotation.ANNOT_TYPES = [
  "Text",
  "Link",
  "FreeText",
  "Line",
  "Square",
  "Circle",
  "Polygon",
  "PolyLine",
  "Highlight",
  "Underline",
  "Squiggly",
  "StrikeOut",
  "Redact",
  "Stamp",
  "Caret",
  "Ink",
  "Popup",
  "FileAttachment",
  "Sound",
  "Movie",
  "RichMedia",
  "Widget",
  "Screen",
  "PrinterMark",
  "TrapNet",
  "Watermark",
  "3D",
  "Projection"
];
PDFAnnotation.LINE_ENDING = [
  "None",
  "Square",
  "Circle",
  "Diamond",
  "OpenArrow",
  "ClosedArrow",
  "Butt",
  "ROpenArrow",
  "RClosedArrow",
  "Slash"
];
PDFAnnotation.BORDER_STYLE = ["Solid", "Dashed", "Beveled", "Inset", "Underline"];
PDFAnnotation.BORDER_EFFECT = ["None", "Cloudy"];
PDFAnnotation.INTENT = [
  null,
  "FreeTextCallout",
  "FreeTextTypeWriter",
  "LineArrow",
  "LineDimension",
  "PloyLine",
  "PolygonCloud",
  "PolygonDimension",
  "StampImage",
  "StampSnapshot"
];
PDFAnnotation.IS_INVISIBLE = 1 << 1 - 1;
PDFAnnotation.IS_HIDDEN = 1 << 2 - 1;
PDFAnnotation.IS_PRINT = 1 << 3 - 1;
PDFAnnotation.IS_NO_ZOOM = 1 << 4 - 1;
PDFAnnotation.IS_NO_ROTATE = 1 << 5 - 1;
PDFAnnotation.IS_NO_VIEW = 1 << 6 - 1;
PDFAnnotation.IS_READ_ONLY = 1 << 7 - 1;
PDFAnnotation.IS_LOCKED = 1 << 8 - 1;
PDFAnnotation.IS_TOGGLE_NO_VIEW = 1 << 9 - 1;
PDFAnnotation.IS_LOCKED_CONTENTS = 1 << 10 - 1;
var PDFWidget = class _PDFWidget extends PDFAnnotation {
  getFieldType() {
    return _PDFWidget.WIDGET_TYPES[libmupdf._wasm_pdf_annot_field_type(this.pointer)] || "button";
  }
  isButton() {
    let type = this.getFieldType();
    return type === "button" || type === "checkbox" || type === "radiobutton";
  }
  isPushButton() {
    return this.getFieldType() === "button";
  }
  isCheckbox() {
    return this.getFieldType() === "checkbox";
  }
  isRadioButton() {
    return this.getFieldType() === "radiobutton";
  }
  isText() {
    return this.getFieldType() === "text";
  }
  isChoice() {
    let type = this.getFieldType();
    return type === "combobox" || type === "listbox";
  }
  isListBox() {
    return this.getFieldType() === "listbox";
  }
  isComboBox() {
    return this.getFieldType() === "combobox";
  }
  getFieldFlags() {
    return libmupdf._wasm_pdf_annot_field_flags(this.pointer);
  }
  isMultiline() {
    return (this.getFieldFlags() & _PDFWidget.TX_FIELD_IS_MULTILINE) !== 0;
  }
  isPassword() {
    return (this.getFieldFlags() & _PDFWidget.TX_FIELD_IS_PASSWORD) !== 0;
  }
  isComb() {
    return (this.getFieldFlags() & _PDFWidget.TX_FIELD_IS_COMB) !== 0;
  }
  isReadOnly() {
    return (this.getFieldFlags() & _PDFWidget.FIELD_IS_READ_ONLY) !== 0;
  }
  getLabel() {
    return fromString(libmupdf._wasm_pdf_annot_field_label(this.pointer));
  }
  getName() {
    return fromStringFree(libmupdf._wasm_pdf_load_field_name(this.pointer));
  }
  getValue() {
    return fromString(libmupdf._wasm_pdf_annot_field_value(this.pointer));
  }
  setTextValue(value) {
    return libmupdf._wasm_pdf_set_annot_text_field_value(this.pointer, STRING(value));
  }
  getMaxLen() {
    return libmupdf._wasm_pdf_annot_text_widget_max_len(this.pointer);
  }
  setChoiceValue(value) {
    return libmupdf._wasm_pdf_set_annot_choice_field_value(this.pointer, STRING(value));
  }
  getOptions(isExport = false) {
    let result = [];
    let n = libmupdf._wasm_pdf_annot_choice_field_option_count(this.pointer);
    for (let i = 0; i < n; ++i) {
      result.push(fromString(libmupdf._wasm_pdf_annot_choice_field_option(this.pointer, isExport, i)));
    }
    return result;
  }
  toggle() {
    return libmupdf._wasm_pdf_toggle_widget(this.pointer);
  }
};
PDFWidget.WIDGET_TYPES = [
  "widget",
  // unknown
  "button",
  "checkbox",
  "combobox",
  "listbox",
  "radiobutton",
  "signature",
  "text"
];
PDFWidget.FIELD_IS_READ_ONLY = 1;
PDFWidget.FIELD_IS_REQUIRED = 1 << 1;
PDFWidget.FIELD_IS_NO_EXPORT = 1 << 2;
PDFWidget.TX_FIELD_IS_MULTILINE = 1 << 12;
PDFWidget.TX_FIELD_IS_PASSWORD = 1 << 13;
PDFWidget.TX_FIELD_IS_COMB = 1 << 24;
PDFWidget.BTN_FIELD_IS_NO_TOGGLE_TO_OFF = 1 << 14;
PDFWidget.BTN_FIELD_IS_RADIO = 1 << 15;
PDFWidget.BTN_FIELD_IS_PUSHBUTTON = 1 << 16;
PDFWidget.CH_FIELD_IS_COMBO = 1 << 17;
PDFWidget.CH_FIELD_IS_EDIT = 1 << 18;
PDFWidget.CH_FIELD_IS_SORT = 1 << 19;
PDFWidget.CH_FIELD_IS_MULTI_SELECT = 1 << 21;
var $libmupdf_stm_id = 0;
var $libmupdf_stm_table = /* @__PURE__ */ new Map();
globalThis.$libmupdf_stm_close = function(id) {
  let handle = $libmupdf_stm_table.get(id);
  if (handle) {
    handle.close();
    $libmupdf_stm_table.delete(id);
    return;
  }
  throw new Error("invalid file handle");
};
globalThis.$libmupdf_stm_seek = function(id, pos, offset, whence) {
  let handle = $libmupdf_stm_table.get(id);
  if (handle) {
    if (whence === 0)
      return offset;
    if (whence === 1)
      return pos + offset;
    if (whence === 2) {
      let size = handle.fileSize();
      if (size < 0)
        return -1;
      return size + offset;
    }
    throw new Error("invalid whence argument");
  }
  throw new Error("invalid file handle");
};
globalThis.$libmupdf_stm_read = function(id, pos, addr, size) {
  let handle = $libmupdf_stm_table.get(id);
  if (handle) {
    return handle.read(libmupdf.HEAPU8, addr, size, pos);
  }
  throw new Error("invalid file handle");
};
var Stream = class extends Userdata {
  constructor(handle) {
    let id = $libmupdf_stm_id++;
    $libmupdf_stm_table.set(id, handle);
    super(libmupdf._wasm_new_stream(id));
  }
};
Stream._drop = libmupdf._wasm_drop_stream;
var $libmupdf_load_font_file_js;
globalThis.$libmupdf_load_font_file = function(name, script, bold, italic) {
  if ($libmupdf_load_font_file_js) {
    var font = $libmupdf_load_font_file_js(fromString(name), fromString(script), bold, italic);
    if (font) {
      checkType(font, Font);
      return font.pointer;
    }
  }
  return 0;
};
var $libmupdf_device_id = 0;
var $libmupdf_device_table = /* @__PURE__ */ new Map();
var $libmupdf_path_id = 0;
var $libmupdf_path_table = /* @__PURE__ */ new Map();
var $libmupdf_text_id = 0;
var $libmupdf_text_table = /* @__PURE__ */ new Map();
globalThis.$libmupdf_path_walk = {
  moveto(id, x, y) {
    $libmupdf_path_table.get(id)?.moveTo?.(x, y);
  },
  lineto(id, x, y) {
    $libmupdf_path_table.get(id)?.lineTo?.(x, y);
  },
  curveto(id, x1, y1, x2, y2, x3, y3) {
    $libmupdf_path_table.get(id)?.curveTo?.(x1, y1, x2, y2, x3, y3);
  },
  closepath(id) {
    $libmupdf_path_table.get(id)?.closePath?.();
  }
};
var $libmupdf_text_font = null;
globalThis.$libmupdf_text_walk = {
  begin_span(id, font, trm, wmode, bidi, dir, lang) {
    if (font !== $libmupdf_text_font?.pointer)
      $libmupdf_text_font = new Font(font);
    $libmupdf_text_table.get(id)?.beginSpan?.($libmupdf_text_font, fromMatrix(trm), wmode, bidi, dir, fromString(lang));
  },
  end_span(id) {
    $libmupdf_text_table.get(id)?.endSpan?.();
  },
  show_glyph(id, font, trm, glyph, unicode, wmode, bidi) {
    if (font !== $libmupdf_text_font?.pointer)
      $libmupdf_text_font = new Font(font);
    $libmupdf_text_table.get(id)?.showGlyph?.($libmupdf_text_font, fromMatrix(trm), glyph, unicode, wmode, bidi);
  }
};
globalThis.$libmupdf_device = {
  drop_device(id) {
    $libmupdf_device_table.get(id)?.drop?.();
    $libmupdf_device_table.delete(id);
  },
  close_device(id) {
    $libmupdf_device_table.get(id)?.close?.();
  },
  fill_path(id, path, even_odd, ctm, colorspace, color_n, color_arr, alpha) {
    $libmupdf_device_table.get(id)?.fillPath?.(new Path(libmupdf._wasm_keep_path(path)), !!even_odd, fromMatrix(ctm), new ColorSpace(libmupdf._wasm_keep_colorspace(colorspace)), fromColorArray(color_n, color_arr), alpha);
  },
  clip_path(id, path, even_odd, ctm) {
    $libmupdf_device_table.get(id)?.clipPath?.(new Path(libmupdf._wasm_keep_path(path)), !!even_odd, fromMatrix(ctm));
  },
  stroke_path(id, path, stroke, ctm, colorspace, color_n, color_arr, alpha) {
    $libmupdf_device_table.get(id)?.strokePath?.(new Path(libmupdf._wasm_keep_path(path)), new StrokeState(libmupdf._wasm_keep_stroke_state(stroke)), fromMatrix(ctm), new ColorSpace(libmupdf._wasm_keep_colorspace(colorspace)), fromColorArray(color_n, color_arr), alpha);
  },
  clip_stroke_path(id, path, stroke, ctm) {
    $libmupdf_device_table.get(id)?.clipStrokePath?.(new Path(libmupdf._wasm_keep_path(path)), new StrokeState(libmupdf._wasm_keep_stroke_state(stroke)), fromMatrix(ctm));
  },
  fill_text(id, text, ctm, colorspace, color_n, color_arr, alpha) {
    $libmupdf_device_table.get(id)?.fillText?.(new Text(libmupdf._wasm_keep_text(text)), fromMatrix(ctm), new ColorSpace(libmupdf._wasm_keep_colorspace(colorspace)), fromColorArray(color_n, color_arr), alpha);
  },
  stroke_text(id, text, stroke, ctm, colorspace, color_n, color_arr, alpha) {
    $libmupdf_device_table.get(id)?.strokeText?.(new Text(libmupdf._wasm_keep_text(text)), new StrokeState(libmupdf._wasm_keep_stroke_state(stroke)), fromMatrix(ctm), new ColorSpace(libmupdf._wasm_keep_colorspace(colorspace)), fromColorArray(color_n, color_arr), alpha);
  },
  clip_text(id, text, ctm) {
    $libmupdf_device_table.get(id)?.clipText?.(new Text(libmupdf._wasm_keep_text(text)), fromMatrix(ctm));
  },
  clip_stroke_text(id, text, stroke, ctm) {
    $libmupdf_device_table.get(id)?.clipStrokeText?.(new Text(libmupdf._wasm_keep_text(text)), new StrokeState(libmupdf._wasm_keep_stroke_state(stroke)), fromMatrix(ctm));
  },
  ignore_text(id, text, ctm) {
    $libmupdf_device_table.get(id)?.ignoreText?.(new Text(libmupdf._wasm_keep_text(text)), fromMatrix(ctm));
  },
  fill_shade(id, shade, ctm, alpha) {
    $libmupdf_device_table.get(id)?.fillShade?.(new Shade(shade), fromMatrix(ctm), alpha);
  },
  fill_image(id, image, ctm, alpha) {
    $libmupdf_device_table.get(id)?.fillImage?.(new Image(image), fromMatrix(ctm), alpha);
  },
  fill_image_mask(id, image, ctm, colorspace, color_n, color_arr, alpha) {
    $libmupdf_device_table.get(id)?.fillImageMask?.(new Image(image), fromMatrix(ctm), new ColorSpace(libmupdf._wasm_keep_colorspace(colorspace)), fromColorArray(color_n, color_arr), alpha);
  },
  clip_image_mask(id, image, ctm) {
    $libmupdf_device_table.get(id)?.clipImageMask?.(new Image(image), fromMatrix(ctm));
  },
  pop_clip(id) {
    $libmupdf_device_table.get(id)?.popClip?.();
  },
  begin_mask(id, bbox, luminosity, colorspace, color_n, color_arr) {
    $libmupdf_device_table.get(id)?.beginMask?.(fromRect(bbox), !!luminosity, new ColorSpace(libmupdf._wasm_keep_colorspace(colorspace)), fromColorArray(color_n, color_arr));
  },
  begin_group(id, bbox, colorspace, isolated, knockout, blendmode, alpha) {
    $libmupdf_device_table.get(id)?.beginGroup?.(fromRect(bbox), new ColorSpace(libmupdf._wasm_keep_colorspace(colorspace)), !!isolated, !!knockout, Device.BLEND_MODES[blendmode], alpha);
  },
  begin_tile(id, area, view, xstep, ystep, ctm, tile_id, doc_id) {
    return $libmupdf_device_table.get(id)?.beginTile?.(fromRect(area), fromRect(view), xstep, ystep, fromMatrix(ctm), tile_id, doc_id) || 0;
  },
  begin_layer(id, name) {
    $libmupdf_device_table.get(id)?.beginLayer?.(fromString(name));
  },
  end_mask(id) {
    $libmupdf_device_table.get(id)?.endMask?.();
  },
  end_group(id) {
    $libmupdf_device_table.get(id)?.endGroup?.();
  },
  end_tile(id) {
    $libmupdf_device_table.get(id)?.endTile?.();
  },
  end_layer(id) {
    $libmupdf_device_table.get(id)?.endLayer?.();
  }
};
var mupdf_default = {
  // const
  Matrix,
  Rect,
  // function
  enableICC,
  disableICC,
  setUserCSS,
  installLoadFontFunction,
  // class
  Buffer,
  ColorSpace,
  Font,
  Image,
  StrokeState,
  Path,
  Text,
  DisplayList,
  Pixmap,
  Shade,
  StructuredText,
  Device,
  DrawDevice,
  DisplayListDevice,
  DocumentWriter,
  Document,
  OutlineIterator,
  Link,
  Page,
  PDFDocument,
  PDFPage,
  PDFObject,
  PDFGraftMap,
  PDFAnnotation,
  PDFWidget,
  Stream,
  // debugging
  memento
};
export {
  Buffer,
  ColorSpace,
  Device,
  DisplayList,
  DisplayListDevice,
  Document,
  DocumentWriter,
  DrawDevice,
  Font,
  Image,
  Link,
  LinkDestination,
  Matrix,
  OutlineIterator,
  PDFAnnotation,
  PDFDocument,
  PDFGraftMap,
  PDFObject,
  PDFPage,
  PDFWidget,
  Page,
  Path,
  Pixmap,
  Rect,
  Shade,
  Stream,
  StrokeState,
  StructuredText,
  Text,
  mupdf_default as default,
  disableICC,
  emptyStore,
  enableICC,
  installLoadFontFunction,
  memento,
  setUserCSS,
  shrinkStore
};
//# sourceMappingURL=mupdf.js.map

/*! For license information please see sdk.js.LICENSE.txt */ ! function (e, t) {
  "object" == typeof exports && "object" == typeof module ? module.exports = t() :
    "function" == typeof define && define.amd ? define("liff", [], t) : "object" ==
      typeof exports ? exports.liff = t() : e.liff = t()
}(self, (() => (() => {
  var e = {
    255: function (e, t) {
      var n, r, i;
      r = [], void 0 === (i = "function" == typeof (n = function () {
        var e = function e(t) {
          function n(e, t) {
            return e >>> t | e << 32 - t
          }
          for (var r, i, o = Math.pow, a = o(2, 32), s = "length", c = "",
            u = [], l = 8 * t[s], f = e.h = e.h || [], d = e.k = e.k || [],
            h = d[s], p = {}, v = 2; h < 64; v++)
            if (!p[v]) {
              for (r = 0; r < 313; r += v) p[r] = v;
              f[h] = o(v, .5) * a | 0, d[h++] = o(v, 1 / 3) * a | 0
            }
          for (t += ""; t[s] % 64 - 56;) t += "\0";
          for (r = 0; r < t[s]; r++) {
            if ((i = t.charCodeAt(r)) >> 8) return;
            u[r >> 2] |= i << (3 - r) % 4 * 8
          }
          for (u[u[s]] = l / a | 0, u[u[s]] = l, i = 0; i < u[s];) {
            var w = u.slice(i, i += 16),
              m = f;
            for (f = f.slice(0, 8), r = 0; r < 64; r++) {
              var b = w[r - 15],
                g = w[r - 2],
                y = f[0],
                I = f[4],
                S = f[7] + (n(I, 6) ^ n(I, 11) ^ n(I, 25)) + (I & f[5] ^ ~I &
                  f[6]) + d[r] + (w[r] = r < 16 ? w[r] : w[r - 16] + (n(b, 7) ^
                    n(b, 18) ^ b >>> 3) + w[r - 7] + (n(g, 17) ^ n(g, 19) ^ g >>>
                      10) | 0);
              (f = [S + ((n(y, 2) ^ n(y, 13) ^ n(y, 22)) + (y & f[1] ^ y & f[
                2] ^ f[1] & f[2])) | 0].concat(f))[4] = f[4] + S | 0
            }
            for (r = 0; r < 8; r++) f[r] = f[r] + m[r] | 0
          }
          for (r = 0; r < 8; r++)
            for (i = 3; i + 1; i--) {
              var T = f[r] >> 8 * i & 255;
              c += (T < 16 ? 0 : "") + T.toString(16)
            }
          return c
        };
        return e.code =
          'var sha256=function a(b){function c(a,b){return a>>>b|a<<32-b}for(var d,e,f=Math.pow,g=f(2,32),h="length",i="",j=[],k=8*b[h],l=a.h=a.h||[],m=a.k=a.k||[],n=m[h],o={},p=2;64>n;p++)if(!o[p]){for(d=0;313>d;d+=p)o[d]=p;l[n]=f(p,.5)*g|0,m[n++]=f(p,1/3)*g|0}for(b+="\\x80";b[h]%64-56;)b+="\\x00";for(d=0;d<b[h];d++){if(e=b.charCodeAt(d),e>>8)return;j[d>>2]|=e<<(3-d)%4*8}for(j[j[h]]=k/g|0,j[j[h]]=k,e=0;e<j[h];){var q=j.slice(e,e+=16),r=l;for(l=l.slice(0,8),d=0;64>d;d++){var s=q[d-15],t=q[d-2],u=l[0],v=l[4],w=l[7]+(c(v,6)^c(v,11)^c(v,25))+(v&l[5]^~v&l[6])+m[d]+(q[d]=16>d?q[d]:q[d-16]+(c(s,7)^c(s,18)^s>>>3)+q[d-7]+(c(t,17)^c(t,19)^t>>>10)|0),x=(c(u,2)^c(u,13)^c(u,22))+(u&l[1]^u&l[2]^l[1]&l[2]);l=[w+x|0].concat(l),l[4]=l[4]+w|0}for(d=0;8>d;d++)l[d]=l[d]+r[d]|0}for(d=0;8>d;d++)for(e=3;e+1;e--){var y=l[d]>>8*e&255;i+=(16>y?0:"")+y.toString(16)}return i};',
          e
      }) ? n.apply(t, r) : n) || (e.exports = i)
    }
  },
    t = {};

  function n(r) {
    var i = t[r];
    if (void 0 !== i) return i.exports;
    var o = t[r] = {
      exports: {}
    };
    return e[r].call(o.exports, o, o.exports, n), o.exports
  }
  n.n = e => {
    var t = e && e.__esModule ? () => e.default : () => e;
    return n.d(t, {
      a: t
    }), t
  }, n.d = (e, t) => {
    for (var r in t) n.o(t, r) && !n.o(e, r) && Object.defineProperty(e, r, {
      enumerable: !0,
      get: t[r]
    })
  }, n.o = (e, t) => Object.prototype.hasOwnProperty.call(e, t);
  var r = {};
  return (() => {
    "use strict";
    n.d(r, {
      default: () => wo
    });
    var e = "undefined" != typeof globalThis && globalThis || "undefined" !=
      typeof self && self || void 0 !== e && e,
      t = "URLSearchParams" in e,
      i = "Symbol" in e && "iterator" in Symbol,
      o = "FileReader" in e && "Blob" in e && function () {
        try {
          return new Blob, !0
        } catch (e) {
          return !1
        }
      }(),
      a = "FormData" in e,
      s = "ArrayBuffer" in e;
    if (s) var c = ["[object Int8Array]", "[object Uint8Array]",
      "[object Uint8ClampedArray]", "[object Int16Array]",
      "[object Uint16Array]", "[object Int32Array]", "[object Uint32Array]",
      "[object Float32Array]", "[object Float64Array]"
    ],
      u = ArrayBuffer.isView || function (e) {
        return e && c.indexOf(Object.prototype.toString.call(e)) > -1
      };

    function l(e) {
      if ("string" != typeof e && (e = String(e)),
        /[^a-z0-9\-#$%&'*+.^_`|~!]/i.test(e) || "" === e) throw new TypeError(
          'Invalid character in header field name: "' + e + '"');
      return e.toLowerCase()
    }

    function f(e) {
      return "string" != typeof e && (e = String(e)), e
    }

    function d(e) {
      var t = {
        next: function () {
          var t = e.shift();
          return {
            done: void 0 === t,
            value: t
          }
        }
      };
      return i && (t[Symbol.iterator] = function () {
        return t
      }), t
    }

    function h(e) {
      this.map = {}, e instanceof h ? e.forEach((function (e, t) {
        this.append(t, e)
      }), this) : Array.isArray(e) ? e.forEach((function (e) {
        this.append(e[0], e[1])
      }), this) : e && Object.getOwnPropertyNames(e).forEach((function (t) {
        this.append(t, e[t])
      }), this)
    }

    function p(e) {
      if (e.bodyUsed) return Promise.reject(new TypeError("Already read"));
      e.bodyUsed = !0
    }

    function v(e) {
      return new Promise((function (t, n) {
        e.onload = function () {
          t(e.result)
        }, e.onerror = function () {
          n(e.error)
        }
      }))
    }

    function w(e) {
      var t = new FileReader,
        n = v(t);
      return t.readAsArrayBuffer(e), n
    }

    function m(e) {
      if (e.slice) return e.slice(0);
      var t = new Uint8Array(e.byteLength);
      return t.set(new Uint8Array(e)), t.buffer
    }

    function b() {
      return this.bodyUsed = !1, this._initBody = function (e) {
        var n;
        this.bodyUsed = this.bodyUsed, this._bodyInit = e, e ? "string" ==
          typeof e ? this._bodyText = e : o && Blob.prototype.isPrototypeOf(e) ?
          this._bodyBlob = e : a && FormData.prototype.isPrototypeOf(e) ? this
            ._bodyFormData = e : t && URLSearchParams.prototype.isPrototypeOf(e) ?
            this._bodyText = e.toString() : s && o && ((n = e) && DataView.prototype
              .isPrototypeOf(n)) ? (this._bodyArrayBuffer = m(e.buffer), this._bodyInit =
                new Blob([this._bodyArrayBuffer])) : s && (ArrayBuffer.prototype.isPrototypeOf(
                  e) || u(e)) ? this._bodyArrayBuffer = m(e) : this._bodyText = e =
                  Object.prototype.toString.call(e) : this._bodyText = "", this.headers
                    .get("content-type") || ("string" == typeof e ? this.headers.set(
                      "content-type", "text/plain;charset=UTF-8") : this._bodyBlob &&
                        this._bodyBlob.type ? this.headers.set("content-type", this._bodyBlob
                          .type) : t && URLSearchParams.prototype.isPrototypeOf(e) && this.headers
                            .set("content-type",
                              "application/x-www-form-urlencoded;charset=UTF-8"))
      }, o && (this.blob = function () {
        var e = p(this);
        if (e) return e;
        if (this._bodyBlob) return Promise.resolve(this._bodyBlob);
        if (this._bodyArrayBuffer) return Promise.resolve(new Blob([this._bodyArrayBuffer]));
        if (this._bodyFormData) throw new Error(
          "could not read FormData body as blob");
        return Promise.resolve(new Blob([this._bodyText]))
      }, this.arrayBuffer = function () {
        if (this._bodyArrayBuffer) {
          var e = p(this);
          return e || (ArrayBuffer.isView(this._bodyArrayBuffer) ? Promise.resolve(
            this._bodyArrayBuffer.buffer.slice(this._bodyArrayBuffer.byteOffset,
              this._bodyArrayBuffer.byteOffset + this._bodyArrayBuffer.byteLength
            )) : Promise.resolve(this._bodyArrayBuffer))
        }
        return this.blob().then(w)
      }), this.text = function () {
        var e, t, n, r = p(this);
        if (r) return r;
        if (this._bodyBlob) return e = this._bodyBlob, t = new FileReader, n =
          v(t), t.readAsText(e), n;
        if (this._bodyArrayBuffer) return Promise.resolve(function (e) {
          for (var t = new Uint8Array(e), n = new Array(t.length), r = 0; r <
            t.length; r++) n[r] = String.fromCharCode(t[r]);
          return n.join("")
        }(this._bodyArrayBuffer));
        if (this._bodyFormData) throw new Error(
          "could not read FormData body as text");
        return Promise.resolve(this._bodyText)
      }, a && (this.formData = function () {
        return this.text().then(I)
      }), this.json = function () {
        return this.text().then(JSON.parse)
      }, this
    }
    h.prototype.append = function (e, t) {
      e = l(e), t = f(t);
      var n = this.map[e];
      this.map[e] = n ? n + ", " + t : t
    }, h.prototype.delete = function (e) {
      delete this.map[l(e)]
    }, h.prototype.get = function (e) {
      return e = l(e), this.has(e) ? this.map[e] : null
    }, h.prototype.has = function (e) {
      return this.map.hasOwnProperty(l(e))
    }, h.prototype.set = function (e, t) {
      this.map[l(e)] = f(t)
    }, h.prototype.forEach = function (e, t) {
      for (var n in this.map) this.map.hasOwnProperty(n) && e.call(t, this.map[
        n], n, this)
    }, h.prototype.keys = function () {
      var e = [];
      return this.forEach((function (t, n) {
        e.push(n)
      })), d(e)
    }, h.prototype.values = function () {
      var e = [];
      return this.forEach((function (t) {
        e.push(t)
      })), d(e)
    }, h.prototype.entries = function () {
      var e = [];
      return this.forEach((function (t, n) {
        e.push([n, t])
      })), d(e)
    }, i && (h.prototype[Symbol.iterator] = h.prototype.entries);
    var g = ["DELETE", "GET", "HEAD", "OPTIONS", "POST", "PUT"];

    function y(e, t) {
      if (!(this instanceof y)) throw new TypeError(
        'Please use the "new" operator, this DOM object constructor cannot be called as a function.'
      );
      var n, r, i = (t = t || {}).body;
      if (e instanceof y) {
        if (e.bodyUsed) throw new TypeError("Already read");
        this.url = e.url, this.credentials = e.credentials, t.headers || (this
          .headers = new h(e.headers)), this.method = e.method, this.mode = e.mode,
          this.signal = e.signal, i || null == e._bodyInit || (i = e._bodyInit,
            e.bodyUsed = !0)
      } else this.url = String(e);
      if (this.credentials = t.credentials || this.credentials ||
        "same-origin", !t.headers && this.headers || (this.headers = new h(t.headers)),
        this.method = (n = t.method || this.method || "GET", r = n.toUpperCase(),
          g.indexOf(r) > -1 ? r : n), this.mode = t.mode || this.mode || null,
        this.signal = t.signal || this.signal, this.referrer = null, ("GET" ===
          this.method || "HEAD" === this.method) && i) throw new TypeError(
            "Body not allowed for GET or HEAD requests");
      if (this._initBody(i), !("GET" !== this.method && "HEAD" !== this.method ||
        "no-store" !== t.cache && "no-cache" !== t.cache)) {
        var o = /([?&])_=[^&]*/;
        if (o.test(this.url)) this.url = this.url.replace(o, "$1_=" + (new Date)
          .getTime());
        else {
          this.url += (/\?/.test(this.url) ? "&" : "?") + "_=" + (new Date).getTime()
        }
      }
    }

    function I(e) {
      var t = new FormData;
      return e.trim().split("&").forEach((function (e) {
        if (e) {
          var n = e.split("="),
            r = n.shift().replace(/\+/g, " "),
            i = n.join("=").replace(/\+/g, " ");
          t.append(decodeURIComponent(r), decodeURIComponent(i))
        }
      })), t
    }

    function S(e, t) {
      if (!(this instanceof S)) throw new TypeError(
        'Please use the "new" operator, this DOM object constructor cannot be called as a function.'
      );
      t || (t = {}), this.type = "default", this.status = void 0 === t.status ?
        200 : t.status, this.ok = this.status >= 200 && this.status < 300,
        this.statusText = void 0 === t.statusText ? "" : "" + t.statusText,
        this.headers = new h(t.headers), this.url = t.url || "", this._initBody(
          e)
    }
    y.prototype.clone = function () {
      return new y(this, {
        body: this._bodyInit
      })
    }, b.call(y.prototype), b.call(S.prototype), S.prototype.clone =
      function () {
        return new S(this._bodyInit, {
          status: this.status,
          statusText: this.statusText,
          headers: new h(this.headers),
          url: this.url
        })
      }, S.error = function () {
        var e = new S(null, {
          status: 0,
          statusText: ""
        });
        return e.type = "error", e
      };
    var T = [301, 302, 303, 307, 308];
    S.redirect = function (e, t) {
      if (-1 === T.indexOf(t)) throw new RangeError("Invalid status code");
      return new S(null, {
        status: t,
        headers: {
          location: e
        }
      })
    };
    var E = e.DOMException;
    try {
      new E
    } catch (mo) {
      (E = function (e, t) {
        this.message = e, this.name = t;
        var n = Error(e);
        this.stack = n.stack
      }).prototype = Object.create(Error.prototype), E.prototype.constructor =
        E
    }

    function C(t, n) {
      return new Promise((function (r, i) {
        var a = new y(t, n);
        if (a.signal && a.signal.aborted) return i(new E("Aborted",
          "AbortError"));
        var c = new XMLHttpRequest;

        function u() {
          c.abort()
        }
        c.onload = function () {
          var e, t, n = {
            status: c.status,
            statusText: c.statusText,
            headers: (e = c.getAllResponseHeaders() || "", t = new h, e.replace(
              /\r?\n[\t ]+/g, " ").split("\r").map((function (e) {
                return 0 === e.indexOf("\n") ? e.substr(1, e.length) : e
              })).forEach((function (e) {
                var n = e.split(":"),
                  r = n.shift().trim();
                if (r) {
                  var i = n.join(":").trim();
                  t.append(r, i)
                }
              })), t)
          };
          n.url = "responseURL" in c ? c.responseURL : n.headers.get(
            "X-Request-URL");
          var i = "response" in c ? c.response : c.responseText;
          setTimeout((function () {
            r(new S(i, n))
          }), 0)
        }, c.onerror = function () {
          setTimeout((function () {
            i(new TypeError("Network request failed"))
          }), 0)
        }, c.ontimeout = function () {
          setTimeout((function () {
            i(new TypeError("Network request failed"))
          }), 0)
        }, c.onabort = function () {
          setTimeout((function () {
            i(new E("Aborted", "AbortError"))
          }), 0)
        }, c.open(a.method, function (t) {
          try {
            return "" === t && e.location.href ? e.location.href : t
          } catch (n) {
            return t
          }
        }(a.url), !0), "include" === a.credentials ? c.withCredentials = !
          0 : "omit" === a.credentials && (c.withCredentials = !1),
          "responseType" in c && (o ? c.responseType = "blob" : s && a.headers
            .get("Content-Type") && -1 !== a.headers.get("Content-Type").indexOf(
              "application/octet-stream") && (c.responseType = "arraybuffer")), !
                n || "object" != typeof n.headers || n.headers instanceof h ? a.headers
                  .forEach((function (e, t) {
                    c.setRequestHeader(t, e)
                  })) : Object.getOwnPropertyNames(n.headers).forEach((function (e) {
                    c.setRequestHeader(e, f(n.headers[e]))
                  })), a.signal && (a.signal.addEventListener("abort", u), c.onreadystatechange =
                    function () {
                      4 === c.readyState && a.signal.removeEventListener("abort", u)
                    }), c.send(void 0 === a._bodyInit ? null : a._bodyInit)
      }))
    }
    C.polyfill = !0, e.fetch || (e.fetch = C, e.Headers = h, e.Request = y,
      e.Response = S);
    var P = function (e, t) {
      return P = Object.setPrototypeOf || {
        __proto__: []
      }
        instanceof Array && function (e, t) {
          e.__proto__ = t
        } || function (e, t) {
          for (var n in t) Object.prototype.hasOwnProperty.call(t, n) && (e[n] =
            t[n])
        }, P(e, t)
    };

    function O(e, t) {
      if ("function" != typeof t && null !== t) throw new TypeError(
        "Class extends value " + String(t) + " is not a constructor or null");

      function n() {
        this.constructor = e
      }
      P(e, t), e.prototype = null === t ? Object.create(t) : (n.prototype = t
        .prototype, new n)
    }
    var _ = function () {
      return _ = Object.assign || function (e) {
        for (var t, n = 1, r = arguments.length; n < r; n++)
          for (var i in t = arguments[n]) Object.prototype.hasOwnProperty.call(
            t, i) && (e[i] = t[i]);
        return e
      }, _.apply(this, arguments)
    };

    function k(e, t, n, r) {
      return new (n || (n = Promise))((function (i, o) {
        function a(e) {
          try {
            c(r.next(e))
          } catch (t) {
            o(t)
          }
        }

        function s(e) {
          try {
            c(r.throw(e))
          } catch (t) {
            o(t)
          }
        }

        function c(e) {
          var t;
          e.done ? i(e.value) : (t = e.value, t instanceof n ? t : new n((
            function (e) {
              e(t)
            }))).then(a, s)
        }
        c((r = r.apply(e, t || [])).next())
      }))
    }

    function A(e, t) {
      var n, r, i, o, a = {
        label: 0,
        sent: function () {
          if (1 & i[0]) throw i[1];
          return i[1]
        },
        trys: [],
        ops: []
      };
      return o = {
        next: s(0),
        throw: s(1),
        return: s(2)
      }, "function" == typeof Symbol && (o[Symbol.iterator] = function () {
        return this
      }), o;

      function s(o) {
        return function (s) {
          return function (o) {
            if (n) throw new TypeError("Generator is already executing.");
            for (; a;) try {
              if (n = 1, r && (i = 2 & o[0] ? r.return : o[0] ? r.throw || ((i =
                r.return) && i.call(r), 0) : r.next) && !(i = i.call(r, o[1]))
                  .done) return i;
              switch (r = 0, i && (o = [2 & o[0], i.value]), o[0]) {
                case 0:
                case 1:
                  i = o;
                  break;
                case 4:
                  return a.label++, {
                    value: o[1],
                    done: !1
                  };
                case 5:
                  a.label++, r = o[1], o = [0];
                  continue;
                case 7:
                  o = a.ops.pop(), a.trys.pop();
                  continue;
                default:
                  if (!(i = a.trys, (i = i.length > 0 && i[i.length - 1]) || 6 !==
                    o[0] && 2 !== o[0])) {
                    a = 0;
                    continue
                  }
                  if (3 === o[0] && (!i || o[1] > i[0] && o[1] < i[3])) {
                    a.label = o[1];
                    break
                  }
                  if (6 === o[0] && a.label < i[1]) {
                    a.label = i[1], i = o;
                    break
                  }
                  if (i && a.label < i[2]) {
                    a.label = i[2], a.ops.push(o);
                    break
                  }
                  i[2] && a.ops.pop(), a.trys.pop();
                  continue
              }
              o = t.call(e, a)
            } catch (s) {
              o = [6, s], r = 0
            } finally {
              n = i = 0
            }
            if (5 & o[0]) throw o[1];
            return {
              value: o[0] ? o[1] : void 0,
              done: !0
            }
          }([o, s])
        }
      }
    }
    Object.create;

    function L(e) {
      var t = "function" == typeof Symbol && Symbol.iterator,
        n = t && e[t],
        r = 0;
      if (n) return n.call(e);
      if (e && "number" == typeof e.length) return {
        next: function () {
          return e && r >= e.length && (e = void 0), {
            value: e && e[r++],
            done: !e
          }
        }
      };
      throw new TypeError(t ? "Object is not iterable." :
        "Symbol.iterator is not defined.")
    }

    function x(e, t) {
      var n = "function" == typeof Symbol && e[Symbol.iterator];
      if (!n) return e;
      var r, i, o = n.call(e),
        a = [];
      try {
        for (;
          (void 0 === t || t-- > 0) && !(r = o.next()).done;) a.push(r.value)
      } catch (s) {
        i = {
          error: s
        }
      } finally {
        try {
          r && !r.done && (n = o.return) && n.call(o)
        } finally {
          if (i) throw i.error
        }
      }
      return a
    }

    function F(e, t, n) {
      if (n || 2 === arguments.length)
        for (var r, i = 0, o = t.length; i < o; i++) !r && i in t || (r || (r =
          Array.prototype.slice.call(t, 0, i)), r[i] = t[i]);
      return e.concat(r || Array.prototype.slice.call(t))
    }
    var j;
    Object.create;
    ! function (e) {
      e[e.DEBUG = 1] = "DEBUG", e[e.INFO = 2] = "INFO", e[e.WARN = 3] =
        "WARN", e[e.ERROR = 4] = "ERROR"
    }(j || (j = {}));
    var N, U = function () {
      function e(e) {
        void 0 === e && (e = j.INFO), this.logLevel = e, this._debug =
          console.debug, this._info = console.info, this._warn = console.warn,
          this._error = console.error
      }
      return e.prototype.debug = function () {
        for (var e = [], t = 0; t < arguments.length; t++) e[t] = arguments[
          t];
        this.logLevel <= j.DEBUG && (e.unshift("[DEBUG]"), this._debug.apply(
          this, F([], x(e), !1)))
      }, e.prototype.info = function () {
        for (var e = [], t = 0; t < arguments.length; t++) e[t] = arguments[
          t];
        this.logLevel <= j.INFO && (e.unshift("[INFO]"), this._info.apply(
          this, F([], x(e), !1)))
      }, e.prototype.warn = function () {
        for (var e = [], t = 0; t < arguments.length; t++) e[t] = arguments[
          t];
        this.logLevel <= j.WARN && (e.unshift("[WARN]"), this._warn.apply(
          this, F([], x(e), !1)))
      }, e.prototype.error = function () {
        for (var e = [], t = 0; t < arguments.length; t++) e[t] = arguments[
          t];
        this.logLevel <= j.ERROR && (e.unshift("[ERROR]"), this._error.apply(
          this, F([], x(e), !1)))
      }, e
    }(),
      R = new U(Number("3")),
      D = function (e, t) {
        this._driver = e, this.liff = t, this.hooks = this._driver.hooks, this
          .internalHooks = this._driver.internalHooks
      },
      B = function (e, t) {
        this._driver = e, this.liff = t, this.hooks = this._driver.hooks
      },
      M = function () {
        function e(e, t) {
          this.pluginCtx = new B(e, t), this.moduleCtx = new D(e, t)
        }
        return Object.defineProperty(e.prototype, "pluginContext", {
          get: function () {
            return this.pluginCtx
          },
          enumerable: !1,
          configurable: !0
        }), Object.defineProperty(e.prototype, "moduleContext", {
          get: function () {
            return this.moduleCtx
          },
          enumerable: !1,
          configurable: !0
        }), e
      }(),
      W = function () {
        function e() {
          this.modules = new Map, this.hooks = {}, this.internalHooks = {}
        }
        return e.prototype.addModule = function (e, t) {
          this.modules.set(e, t), t.hooks && (this.hooks[e] = Object.entries(t
            .hooks).reduce((function (e, t) {
              var n, r = x(t, 2),
                i = r[0],
                o = r[1];
              return _(_({}, e), ((n = {})[i] = o.on.bind(o), n))
            }), {})), "internalHooks" in t && t.internalHooks && (this.internalHooks[
              e] = Object.entries(t.internalHooks).reduce((function (e, t) {
                var n, r = x(t, 2),
                  i = r[0],
                  o = r[1];
                return _(_({}, e), ((n = {})[i] = o.on.bind(o), n))
              }), {}))
        }, e.prototype.hasModule = function (e) {
          return this.modules.has(e)
        }, e
      }(),
      H = function () { },
      V = function (e) {
        return e instanceof H
      },
      G = function (e) {
        function t(t, n, r) {
          var i = e.call(this) || this;
          return i.driver = t, i.contextHolder = n, i.option = r, i
        }
        return O(t, e), t.prototype.install = function () {
          return this.factory(this.driver, this.contextHolder)
        }, Object.defineProperty(t.prototype, "name", {
          get: function () {
            return "use"
          },
          enumerable: !1,
          configurable: !0
        }), Object.defineProperty(t.prototype, "defaultOption", {
          get: function () {
            return {
              namespacePrefix: "$"
            }
          },
          enumerable: !1,
          configurable: !0
        }), t.prototype.factory = function (e, t) {
          var n = Object.assign({}, this.defaultOption, this.option).namespacePrefix;
          return function (r, i) {
            if (!r || "function" != typeof r.install || "string" != typeof r.name)
              return R.warn(
                "To install the plugin, you need to define the `name` property and the `install` method."
              ), this;
            var o = V(r) ? r.name : "".concat(n).concat(r.name);
            if (e.hasModule(o)) return this;
            var a = V(r) ? r.install.call(r, t.moduleContext, i) : r.install.call(
              r, t.pluginContext, i);
            return this["".concat(o)] ? (R.warn(
              "There is a duplicate plugin name. `".concat(o,
                "` plugin namespace will be override.")), this["".concat(o)] =
              a) : void 0 !== a && (this["".concat(o)] = a), e.addModule(o, r),
              this
          }
        }, t
      }(H),
      K = new Promise((function (e) {
        N = e
      })),
      J = "UNKNOWN",
      q = "UNAUTHORIZED",
      z = "INVALID_ARGUMENT",
      $ = "INIT_FAILED",
      X = "FORBIDDEN",
      Q = "INVALID_CONFIG",
      Y = "INVALID_ID_TOKEN",
      Z = "CREATE_SUBWINDOW_FAILED",
      ee = "EXCEPTION_IN_SUBWINDOW",
      te = "liffEvent",
      ne = "LIFF_STORE",
      re = "https://liff.".concat("line.me", "/"),
      ie = "https://miniapp.".concat("line.me", "/"),
      oe = {
        ACCESS_TOKEN: "accessToken",
        ID_TOKEN: "IDToken",
        DECODED_ID_TOKEN: "decodedIDToken",
        FEATURE_TOKEN: "featureToken",
        LOGIN_TMP: "loginTmp",
        CONFIG: "config",
        CONTEXT: "context",
        EXPIRES: "expires",
        RAW_CONTEXT: "rawContext",
        CLIENT_ID: "clientId",
        IS_SUBSEQUENT_LIFF_APP: "isSubsequentLiffApp",
        MST_CHALLENGE: "mstChallenge",
        MSIT: "msit",
        MST: "mst",
        MST_VERIFIER: "mstVerifier",
        APP_DATA: "appData"
      },
      ae = "isInClient",
      se = ["context_token", "feature_token", "access_token", "id_token",
        "client_id", "mst_verifier", "mst_challenge", "msit"
      ],
      ce = ["liff.ref.source", "liff.ref.medium", "liff.ref.campaign",
        "liff.ref.term", "liff.ref.content"
      ],
      ue = {
        INIT: "init",
        SUBMIT: "submit",
        CANCEL: "cancel",
        CLOSE: "close",
        ERROR: "error"
      },
      le = "liff.subwindow",
      fe = "healthCheck",
      de = ["profile", "chat_message.write", "openid", "email"];

    function he(e) {
      return window.atob(e.replace(/-/g, "+").replace(/_/g, "/"))
    }
    var pe = {
      decode: he,
      encode: function (e) {
        return window.btoa(e).replace(/\+/g, "-").replace(/\//g, "_").replace(
          /=+$/, "")
      },
      decodeUnicode: function (e) {
        var t = he(e).split("").map((function (e) {
          return "%" + ("00" + e.charCodeAt(0).toString(16)).slice(-2)
        })).join("");
        return decodeURIComponent(t)
      }
    };

    function ve(e, t) {
      if (e === t) return 0;
      for (var n = e.split("."), r = t.split("."), i = Math.max(n.length, r.length),
        o = 0; o < i; o++) {
        n[o] || (n[o] = "0"), r[o] || (r[o] = "0");
        var a = parseInt(n[o]) - parseInt(r[o]);
        if (0 !== a) return a > 0 ? 1 : -1
      }
      return 0
    }

    function we(e) {
      var t = e.replace("#", "").match(/.{2}/g) || [];
      if (4 !== t.length) return R.warn(
        "convertArgbToRgba: Received invalid ARGB color"), "";
      var n = function (e) {
        var t = me(e);
        return Math.round(t / 255 * 100) / 100
      }(t[0]),
        r = me(t[1]),
        i = me(t[2]),
        o = me(t[3]);
      return "rgba(".concat(r, ", ").concat(i, ", ").concat(o, ", ").concat(n,
        ")")
    }

    function me(e) {
      return parseInt(e, 16)
    }

    function be(e) {
      var t = e.replace("#", "").match(/.{2}/g) || [];
      if (3 !== t.length) return R.warn(
        "convertArgbToRgba: Received invalid hex color"), "";
      var n = me(t[0]),
        r = me(t[1]),
        i = me(t[2]);
      return "".concat(n, ", ").concat(r, ", ").concat(i)
    }

    function ge(e) {
      for (var t = e.length, n = new ArrayBuffer(t), r = new Uint8Array(n), i =
        0; i < t; i++) r[i] = e.charCodeAt(i);
      return n
    }
    var ye = function (e) {
      var t = new RegExp("(?:(?:^|.*;\\s*)".concat(e,
        "\\s*\\=\\s*([^;]*).*$)|^.*$"));
      return document.cookie.replace(t, "$1")
    },
      Ie = function (e, t, n) {
        var r = e + "=" + t;
        if (n)
          for (var i in n) {
            var o = n[i] ? "=".concat(n[i]) : "";
            r += "; ".concat(i).concat(o)
          }
        R.debug("set cookie", r), document.cookie = r
      },
      Se = function (e, t) {
        var n = "".concat(e, "=; expires=Thu, 01 Jan 1970 00:00:00 GMT");
        if (t)
          for (var r in t) n += "; ".concat(r, "=").concat(t[r]);
        document.cookie = n
      },
      Te = new Set(["400", "401", "403", "404", "429", "500"]),
      Ee = function (e) {
        function t(t, n, r) {
          var i = e.call(this, n, r) || this;
          return i.code = t, i
        }
        return O(t, e), t
      }(Error);

    function Ce(e, t, n) {
      return null == n || n.cause, new Ee(e, t || "", n || {})
    }

    function Pe(e) {
      var t = e.match(/([^-]+)-[^-]+/);
      return t && t[1]
    }
    var Oe, _e = function () {
      function e() {
        this.map = {}
      }
      return e.prototype.clear = function () {
        this.map = {}
      }, e.prototype.getItem = function (e) {
        var t = this.map[e];
        return void 0 === t ? null : t
      }, e.prototype.setItem = function (e, t) {
        this.map[e] = t
      }, e.prototype.removeItem = function (e) {
        delete this.map[e]
      }, e.prototype.key = function (e) {
        var t = Object.keys(this.map)[e];
        return void 0 === t ? null : t
      }, Object.defineProperty(e.prototype, "length", {
        get: function () {
          return Object.keys(this.map).length
        },
        enumerable: !1,
        configurable: !0
      }), e
    }(),
      ke = function (e) {
        return e.replace(/^\?/, "").replace(/^#\/?/, "").split(/&+/).filter((
          function (e) {
            return e.length > 0
          })).reduce((function (e, t) {
            var n = x(t.split("=").map(decodeURIComponent), 2),
              r = n[0],
              i = n[1],
              o = e[r];
            return Array.isArray(o) ? o.push(i) : Object.prototype.hasOwnProperty
              .call(e, r) ? e[r] = [o, i] : e[r] = i, e
          }), {})
      },
      Ae = function (e) {
        return Object.keys(e).map((function (t) {
          var n = e[t],
            r = function (e) {
              return void 0 !== e ? "".concat(encodeURIComponent(t), "=").concat(
                encodeURIComponent(e)) : encodeURIComponent(t)
            };
          return Array.isArray(n) ? n.map((function (e) {
            return r(e)
          })).join("&") : r(n)
        })).join("&")
      },
      Le = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

    function xe(e) {
      for (var t = "", n = 0; n < e; n++) t += Le[Math.floor(window.crypto.getRandomValues(
        new Uint32Array(1))[0] / 4294967296 * Le.length)];
      return t
    }

    function Fe(e) {
      var t = new URL(e),
        n = t.hash.slice(1).split("&").filter((function (e) {
          return !se.some((function (t) {
            return e.startsWith("".concat(t, "="))
          }))
        })).join("&");
      return t.hash = n, t.toString()
    }

    function je(e) {
      var t, n, r = new URL(e);
      return r.toString().replace(new RegExp(String.raw(Ue || (t = ["^", ""],
        n = ["^", ""], Object.defineProperty ? Object.defineProperty(t,
          "raw", {
          value: n
        }) : t.raw = n, Ue = t), r.origin)), "")
    }

    function Ne(e, t) {
      if (!e) throw new Error("addParamsToUrl: invalid URL");
      var n = new URL(e);
      return Object.entries(t).forEach((function (e) {
        var t = x(e, 2),
          r = t[0],
          i = t[1];
        n.searchParams.set(r, i)
      })), n.toString()
    }
    var Ue, Re = ((Oe = {})[re] = function () {
      var e = Be(re);
      return new RegExp("^".concat(e, "(\\d+-\\w+)"))
    }, Oe[ie] = function () {
      var e = Be(ie);
      return new RegExp("^".concat(e, "((\\d+-\\w+)|(\\w+$))"))
    }, Oe);

    function De(e) {
      for (var t in Re) {
        var n = e.match(Re[t]());
        if (n) return n[1]
      }
      return null
    }

    function Be(e) {
      return e.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    }

    function Me(e) {
      return e.startsWith("line:")
    }

    function We(e) {
      return void 0 === e && (e = window.navigator.userAgent), /ipad/.test(e.toLowerCase())
    }

    function He(e) {
      return void 0 === e && (e = window.navigator.userAgent),
        /Line\/\d+\.\d+\.\d+/.test(e)
    }

    function Ve(e) {
      return void 0 === e && (e = window.navigator.userAgent),
        /Line\/\d+\.\d+\.\d+ LIFF/.test(e)
    }
    var Ge = function () {
      return "undefined" == typeof window
    },
      Ke = null;

    function Je() {
      return null === Ke && (Ke = Ve() || He() && /[#|&]access_token=/.test(
        location.hash) || "1" === sessionStorage.getItem("".concat(ne, ":").concat(
          ae)), sessionStorage.setItem("".concat(ne, ":").concat(ae), Ke ? "1" :
            "0")), !!Ke
    } ! function (e) {
      function t() {
        return null !== e && e.apply(this, arguments) || this
      }
      O(t, e), Object.defineProperty(t.prototype, "name", {
        get: function () {
          return "isInClient"
        },
        enumerable: !1,
        configurable: !0
      }), t.prototype.install = function () {
        return function () {
          return Je()
        }
      }
    }(H);

    function qe() {
      var e;
      return null !== (e = window.__liffConfig) && void 0 !== e ? e : {}
    }

    function ze(e) {
      return function (e, t) {
        if (!t) throw Ce(Q, "liffId is necessary for liff.init()");
        var n = (Je() ? sessionStorage : localStorage).getItem("".concat(ne,
          ":").concat(t, ":").concat(e));
        try {
          return null === n ? null : JSON.parse(n)
        } catch (r) {
          return null
        }
      }(e, qe().liffId)
    }

    function $e(e, t) {
      var n = qe().liffId;
      if (!n) throw Ce(Q, "liffId is necessary for liff.init()");
      (Je() ? sessionStorage : localStorage).setItem("".concat(ne, ":").concat(
        n, ":").concat(e), JSON.stringify(t))
    }

    function Xe() {
      return ze(oe.CONTEXT)
    }

    function Qe(e) {
      $e(oe.CONTEXT, e)
    } ! function (e) {
      function t() {
        return null !== e && e.apply(this, arguments) || this
      }
      O(t, e), Object.defineProperty(t.prototype, "name", {
        get: function () {
          return "getContext"
        },
        enumerable: !1,
        configurable: !0
      }), t.prototype.install = function () {
        return function () {
          return Xe()
        }
      }
    }(H);

    function Ye() {
      return ((Xe() || {}).d || {}).aId
    } ! function (e) {
      function t() {
        return null !== e && e.apply(this, arguments) || this
      }
      O(t, e), Object.defineProperty(t.prototype, "name", {
        get: function () {
          return "getAId"
        },
        enumerable: !1,
        configurable: !0
      }), t.prototype.install = function () {
        return function () {
          return Ye()
        }
      }
    }(H);

    function Ze() {
      return ((Xe() || {}).d || {}).autoplay || !1
    } ! function (e) {
      function t() {
        return null !== e && e.apply(this, arguments) || this
      }
      O(t, e), Object.defineProperty(t.prototype, "name", {
        get: function () {
          return "getIsVideoAutoPlay"
        },
        enumerable: !1,
        configurable: !0
      }), t.prototype.install = function () {
        return function () {
          return Ze()
        }
      }
    }(H);

    function et() {
      return (Xe() || {}).profilePlus
    } ! function (e) {
      function t() {
        return null !== e && e.apply(this, arguments) || this
      }
      O(t, e), Object.defineProperty(t.prototype, "name", {
        get: function () {
          return "getProfilePlus"
        },
        enumerable: !1,
        configurable: !0
      }), t.prototype.install = function () {
        return function () {
          return et()
        }
      }
    }(H);

    function tt(e) {
      $e(oe.APP_DATA, e)
    }

    function nt() {
      return ze(oe.MST)
    }

    function rt() {
      return ze(oe.MST_CHALLENGE)
    }

    function it(e) {
      $e(oe.CLIENT_ID, e)
    }

    function ot() {
      return ze(oe.FEATURE_TOKEN)
    }

    function at(e) {
      $e(oe.FEATURE_TOKEN, e)
    }

    function st() {
      return ze(oe.ID_TOKEN)
    }

    function ct(e) {
      $e(oe.ID_TOKEN, e)
    } ! function (e) {
      function t() {
        return null !== e && e.apply(this, arguments) || this
      }
      O(t, e), Object.defineProperty(t.prototype, "name", {
        get: function () {
          return "getIDToken"
        },
        enumerable: !1,
        configurable: !0
      }), t.prototype.install = function () {
        return function () {
          return st()
        }
      }
    }(H);

    function ut() {
      return ze(oe.ACCESS_TOKEN)
    }

    function lt(e) {
      $e(oe.ACCESS_TOKEN, e)
    } ! function (e) {
      function t() {
        return null !== e && e.apply(this, arguments) || this
      }
      O(t, e), Object.defineProperty(t.prototype, "name", {
        get: function () {
          return "getAccessToken"
        },
        enumerable: !1,
        configurable: !0
      }), t.prototype.install = function () {
        return function () {
          return ut()
        }
      }
    }(H);

    function ft(e) {
      var t = qe().liffId;
      if (!t) throw Ce(Q, "liffId is necessary for liff.init()");
      (Je() ? sessionStorage : localStorage).removeItem("".concat(ne, ":").concat(
        t, ":").concat(e))
    }

    function dt() {
      return ze(oe.LOGIN_TMP)
    }

    function ht() {
      ft(oe.LOGIN_TMP)
    }

    function pt(e) {
      var t = qe();
      Ie("".concat(ne, ":").concat(oe.EXPIRES, ":").concat(t.liffId), e.getTime(), {
        expires: e.toUTCString(),
        path: "/",
        secure: null
      })
    }

    function vt() {
      return ze(oe.DECODED_ID_TOKEN)
    }

    function wt(e) {
      $e(oe.DECODED_ID_TOKEN, e)
    } ! function (e) {
      function t() {
        return null !== e && e.apply(this, arguments) || this
      }
      O(t, e), Object.defineProperty(t.prototype, "name", {
        get: function () {
          return "getDecodedIDToken"
        },
        enumerable: !1,
        configurable: !0
      }), t.prototype.install = function () {
        return function () {
          return vt()
        }
      }
    }(H);

    function mt() {
      Object.keys(oe).forEach((function (e) {
        ft(oe[e])
      })),
        function () {
          var e = qe();
          Se("".concat(ne, ":").concat(oe.EXPIRES, ":").concat(e.liffId), {
            path: "/"
          })
        }()
    }

    function bt() {
      return !!ut()
    } ! function (e) {
      function t() {
        return null !== e && e.apply(this, arguments) || this
      }
      O(t, e), Object.defineProperty(t.prototype, "name", {
        get: function () {
          return "isLoggedIn"
        },
        enumerable: !1,
        configurable: !0
      }), t.prototype.install = function () {
        return function () {
          return bt()
        }
      }
    }(H);

    function gt() {
      return "2.27.3"
    } ! function (e) {
      function t() {
        return null !== e && e.apply(this, arguments) || this
      }
      O(t, e), Object.defineProperty(t.prototype, "name", {
        get: function () {
          return "getVersion"
        },
        enumerable: !1,
        configurable: !0
      }), t.prototype.install = function () {
        return function () {
          return "2.27.3"
        }
      }
    }(H);
    var yt = function () {
      function e() { }
      return e.prototype.invoke = function () {
        return function (e) {
          return void 0 === e && (e = window.navigator.userAgent),
            /LIFF\/SubWindow/.test(e)
        }()
      }, e
    }(),
      It = function () {
        function e(e) {
          this.storage = e
        }
        return Object.defineProperty(e, "IN_SUB_WINDOW_KEY", {
          get: function () {
            return "inSubWindow"
          },
          enumerable: !1,
          configurable: !0
        }), e.prototype.invoke = function () {
          return new URLSearchParams(window.location.search).has(le) && this.setInSubWindow(!
            0), !(!this.getInSubWindow() && !this.getSubWindowIdentifier())
        }, e.prototype.getInSubWindow = function () {
          var t = this.storage.getItem("".concat(ne, ":").concat(this.getLiffId(),
            ":").concat(e.IN_SUB_WINDOW_KEY));
          return null !== t && JSON.parse(t)
        }, e.prototype.getSubWindowIdentifier = function () {
          var e, t = "liff.subwindow.identifier",
            n = new URLSearchParams(window.location.search);
          return n.get(t) || (t, (e = n.get("liff.state")) ? new URLSearchParams(
            e).get("liff.subwindow.identifier") : null) || null
        }, e.prototype.setInSubWindow = function (t) {
          this.storage.setItem("".concat(ne, ":").concat(this.getLiffId(), ":")
            .concat(e.IN_SUB_WINDOW_KEY), String(t))
        }, e.prototype.getLiffId = function () {
          var e = qe().liffId;
          if (!e) throw Ce(Q, "liffId is necessary for liff.init()");
          return e
        }, e
      }(),
      St = new (function (e) {
        function t() {
          var t = e.call(this) || this;
          return Ge() ? t.impl = {
            invoke: function () {
              return !1
            }
          } : Je() ? t.impl = new yt : t.impl = new It(window.sessionStorage),
            t
        }
        return O(t, e), Object.defineProperty(t.prototype, "name", {
          get: function () {
            return "isSubWindow"
          },
          enumerable: !1,
          configurable: !0
        }), t.prototype.install = function () {
          return this.impl.invoke.bind(this.impl)
        }, t
      }(H)),
      Tt = St.install();

    function Et() {
      var e = navigator.userAgent.match(/Line\/\d+(\.\d+)*/i);
      return e ? e[0].slice(5) : null
    }
    var Ct;
    ! function (e) {
      function t() {
        return null !== e && e.apply(this, arguments) || this
      }
      O(t, e), Object.defineProperty(t.prototype, "name", {
        get: function () {
          return "getLineVersion"
        },
        enumerable: !1,
        configurable: !0
      }), t.prototype.install = function () {
        return function () {
          return Et()
        }
      }
    }(H);

    function Pt() {
      if (!Ct) {
        var e = window.navigator.userAgent.toLowerCase();
        Ct = /iphone|ipad|ipod/.test(e) ? "ios" : /android/.test(e) ?
          "android" : "web"
      }
      return Ct
    } ! function (e) {
      function t() {
        return e.call(this) || this
      }
      O(t, e), Object.defineProperty(t.prototype, "name", {
        get: function () {
          return "getOS"
        },
        enumerable: !1,
        configurable: !0
      }), t.prototype.install = function () {
        return function () {
          return Pt()
        }
      }
    }(H);

    function Ot(e) {
      var t, n = Xe();
      return null === (t = null == n ? void 0 : n.availability) || void 0 ===
        t ? void 0 : t[e]
    }

    function _t(e, t, n) {
      var r = Ot(e),
        i = n || e;
      if (!r) return {
        available: !1,
        error: {
          code: X,
          message: "".concat(i, " is not allowed in this LIFF app")
        }
      };
      var o = r.minVer,
        a = r.unsupportedFromVer,
        s = !o || function (e, t) {
          var n = Et();
          return !!n && !(t && ve(n, t) > 0) && ve(n, e) >= 0
        }(o, a),
        c = Je();
      return c && !s ? {
        available: !1,
        error: {
          code: X,
          message: "".concat(i, " is unavailable in this client version.")
        }
      } : r.permission ? c && s || t ? {
        available: !0
      } : {
        available: !1,
        error: {
          code: X,
          message: "".concat(i, " is not allowed in external browser")
        }
      } : {
        available: !1,
        error: {
          code: X,
          message: "".concat(i, " is not allowed in this LIFF app")
        }
      }
    }
    var kt = function () {
      return bt() ? !Ve() && He() ? {
        available: !1,
        error: {
          code: X,
          message: "Subwindow is not supported in this browser"
        }
      } : Tt() ? {
        available: !1,
        error: {
          code: X,
          message: "this api can be only called in parent window"
        }
      } : _t("subwindowOpen", !0) : {
        available: !1,
        error: {
          code: q,
          message: "Need access_token for api call, Please login first"
        }
      }
    },
      At = ["subwindowOpen", "shareTargetPicker", "multipleLiffTransition",
        "scanCode", "scanCodeV2", "getAdvertisingId", "addToHomeScreen",
        "bluetoothLeFunction", "skipChannelVerificationScreen",
        "createShortcutOnHomeScreen", "internalCreateShortcutOnHomeScreen",
        "iap"
      ],
      Lt = {
        scanCode: function () {
          return _t("scanCode")
        },
        getAdvertisingId: function () {
          return _t("getAdvertisingId")
        },
        bluetoothLeFunction: function () {
          return _t("bluetoothLeFunction")
        },
        shareTargetPicker: function () {
          return Tt() ? {
            available: !1,
            error: {
              code: X,
              message: "this api can be only called in parent window"
            }
          } : bt() ? _t("shareTargetPicker", !0) : {
            available: !1,
            error: {
              code: q,
              message: "Need access_token for api call, Please login first"
            }
          }
        },
        multipleLiffTransition: function () {
          var e = Ot("multipleLiffTransition");
          return e && e.permission ? Je() ? {
            available: !0
          } : {
            available: !1,
            error: {
              code: X,
              message: "multipleLiffTransition is available only in the LINE App browser"
            }
          } : {
            available: !1,
            error: {
              code: X,
              message: "multipleLiffTransition is not allowed in this LIFF app"
            }
          }
        },
        subwindowOpen: kt,
        scanCodeV2: function () {
          if (!bt()) return {
            available: !1,
            error: {
              code: q,
              message: "Need access_token for api call, Please login first"
            }
          };
          var e = kt();
          return e.available ? _t("scanCodeV2", !0) : e
        },
        addToHomeScreen: function () {
          return Tt() ? {
            available: !1,
            error: {
              code: X,
              message: "this api can be only called in parent window"
            }
          } : _t("addToHomeScreen")
        },
        skipChannelVerificationScreen: function () {
          var e = Xe();
          return e ? "square_chat" === e.type ? {
            available: !1,
            error: {
              code: X,
              message: "skipChannelVerificationScreen is not allowed in OpenChat"
            }
          } : _t("skipChannelVerificationScreen") : {
            available: !1,
            error: {
              code: X,
              message: "Context is not found"
            }
          }
        },
        createShortcutOnHomeScreen: function () {
          if (Tt()) return {
            available: !1,
            error: {
              code: X,
              message: "this api can be only called in parent window"
            }
          };
          if (!bt()) return {
            available: !1,
            error: {
              code: q,
              message: "Need access_token for api call, Please login first"
            }
          };
          var e = Pt();
          return "android" !== e && "ios" !== e ? {
            available: !1,
            error: {
              code: X,
              message: "this api can be only called in mobile device"
            }
          } : _t("addToHomeV2", !0, "createShortcutOnHomeScreen")
        },
        internalCreateShortcutOnHomeScreen: function () {
          if (Tt()) return {
            available: !1,
            error: {
              code: X,
              message: "this api can be only called in parent window"
            }
          };
          if (!bt()) return {
            available: !1,
            error: {
              code: q,
              message: "Need access_token for api call, Please login first"
            }
          };
          var e = Pt();
          if ("android" !== e && "ios" !== e) return {
            available: !1,
            error: {
              code: X,
              message: "this api can be only called in mobile device"
            }
          };
          var t = _t("addToHomeV2", !0, "internalCreateShortcutOnHomeScreen");
          return t.available ? _t("addToHomeLineScheme", !0,
            "internalCreateShortcutOnHomeScreen") : t
        },
        iap: function () {
          return Je() ? bt() ? Tt() ? {
            available: !1,
            error: {
              code: X,
              message: "this api can be only called in parent window"
            }
          } : _t("iap", !1, "In-App Purchase") : {
            available: !1,
            error: {
              code: q,
              message: "Need access_token for api call, Please login first"
            }
          } : {
            available: !1,
            error: {
              code: X,
              message: "In-App Purchase is not allowed in external browser"
            }
          }
        }
      },
      xt = function (e) {
        return function () {
          var t = e();
          if (!t.available) throw Ce(t.error.code, t.error.message)
        }
      },
      Ft = {
        scanCode: xt(Lt.scanCode),
        getAdvertisingId: xt(Lt.getAdvertisingId),
        bluetoothLeFunction: xt(Lt.bluetoothLeFunction),
        shareTargetPicker: xt(Lt.shareTargetPicker),
        multipleLiffTransition: xt(Lt.multipleLiffTransition),
        subwindowOpen: xt(Lt.subwindowOpen),
        scanCodeV2: xt(Lt.scanCodeV2),
        addToHomeScreen: xt(Lt.addToHomeScreen),
        skipChannelVerificationScreen: xt(Lt.skipChannelVerificationScreen),
        createShortcutOnHomeScreen: xt(Lt.createShortcutOnHomeScreen),
        internalCreateShortcutOnHomeScreen: xt(Lt.internalCreateShortcutOnHomeScreen),
        iap: xt(Lt.iap)
      };

    function jt(e) {
      if (! function (e) {
        return At.some((function (t) {
          return t === e
        }))
      }(e)) throw Ce(z, "Unexpected API name.");
      var t = Lt[e];
      return !t || t().available
    } ! function (e) {
      function t() {
        var t = e.apply(this, F([], x(arguments), !1)) || this;
        return t.hooks = {}, t
      }
      O(t, e), Object.defineProperty(t.prototype, "name", {
        get: function () {
          return "isApiAvailable"
        },
        enumerable: !1,
        configurable: !0
      }), t.prototype.install = function () {
        return function (e) {
          return jt(e)
        }
      }
    }(H);
    var Nt = function () {
      function e() { }
      return e.prototype.invoke = function (e) {
        var t = Ft[e];
        return !!t && (t(), !0)
      }, e
    }(),
      Ut = function () {
        function e(e) {
          this.liff = e
        }
        return e.prototype.invoke = function (e) {
          return this.liff.checkFeature(e)
        }, e
      }(),
      Rt = function () {
        function e(t) {
          ve("2.27.3", e.SDK_VERSION_SUPPORTING_NEW) >= 0 ? this.impl = new Nt :
            this.impl = new Ut(t)
        }
        return Object.defineProperty(e, "SDK_VERSION_SUPPORTING_NEW", {
          get: function () {
            return "2.11.0"
          },
          enumerable: !1,
          configurable: !0
        }), e.prototype.invoke = function (e) {
          return this.impl.invoke(e)
        }, e
      }(),
      Dt = function (e, t) {
        return Dt = Object.setPrototypeOf || {
          __proto__: []
        }
          instanceof Array && function (e, t) {
            e.__proto__ = t
          } || function (e, t) {
            for (var n in t) Object.prototype.hasOwnProperty.call(t, n) && (e[n] =
              t[n])
          }, Dt(e, t)
      };
    var Bt = !1,
      Mt = function (e) {
        function t() {
          return null !== e && e.apply(this, arguments) || this
        }
        return function (e, t) {
          if ("function" != typeof t && null !== t) throw new TypeError(
            "Class extends value " + String(t) +
            " is not a constructor or null");

          function n() {
            this.constructor = e
          }
          Dt(e, t), e.prototype = null === t ? Object.create(t) : (n.prototype =
            t.prototype, new n)
        }(t, e), Object.defineProperty(t.prototype, "name", {
          get: function () {
            return "_legacyExtensionsEnabled"
          },
          enumerable: !1,
          configurable: !0
        }), t.prototype.install = function () {
          Bt = !0
        }, t
      }(H);

    function Wt() {
      return Bt ? function () {
        return function (e, t, n, r) {
          return new (n || (n = Promise))((function (i, o) {
            function a(e) {
              try {
                c(r.next(e))
              } catch (t) {
                o(t)
              }
            }

            function s(e) {
              try {
                c(r.throw(e))
              } catch (t) {
                o(t)
              }
            }

            function c(e) {
              var t;
              e.done ? i(e.value) : (t = e.value, t instanceof n ? t : new n(
                (function (e) {
                  e(t)
                }))).then(a, s)
            }
            c((r = r.apply(e, t || [])).next())
          }))
        }(this, void 0, void 0, (function () {
          return function (e, t) {
            var n, r, i, o, a = {
              label: 0,
              sent: function () {
                if (1 & i[0]) throw i[1];
                return i[1]
              },
              trys: [],
              ops: []
            };
            return o = {
              next: s(0),
              throw: s(1),
              return: s(2)
            }, "function" == typeof Symbol && (o[Symbol.iterator] =
              function () {
                return this
              }), o;

            function s(o) {
              return function (s) {
                return function (o) {
                  if (n) throw new TypeError(
                    "Generator is already executing.");
                  for (; a;) try {
                    if (n = 1, r && (i = 2 & o[0] ? r.return : o[0] ? r.throw ||
                      ((i = r.return) && i.call(r), 0) : r.next) && !(i = i.call(
                        r, o[1])).done) return i;
                    switch (r = 0, i && (o = [2 & o[0], i.value]), o[0]) {
                      case 0:
                      case 1:
                        i = o;
                        break;
                      case 4:
                        return a.label++, {
                          value: o[1],
                          done: !1
                        };
                      case 5:
                        a.label++, r = o[1], o = [0];
                        continue;
                      case 7:
                        o = a.ops.pop(), a.trys.pop();
                        continue;
                      default:
                        if (!((i = (i = a.trys).length > 0 && i[i.length - 1]) ||
                          6 !== o[0] && 2 !== o[0])) {
                          a = 0;
                          continue
                        }
                        if (3 === o[0] && (!i || o[1] > i[0] && o[1] < i[3])) {
                          a.label = o[1];
                          break
                        }
                        if (6 === o[0] && a.label < i[1]) {
                          a.label = i[1], i = o;
                          break
                        }
                        if (i && a.label < i[2]) {
                          a.label = i[2], a.ops.push(o);
                          break
                        }
                        i[2] && a.ops.pop(), a.trys.pop();
                        continue
                    }
                    o = t.call(e, a)
                  } catch (s) {
                    o = [6, s], r = 0
                  } finally {
                    n = i = 0
                  }
                  if (5 & o[0]) throw o[1];
                  return {
                    value: o[0] ? o[1] : void 0,
                    done: !0
                  }
                }([o, s])
              }
            }
          }(this, (function (e) {
            switch (e.label) {
              case 0:
                return [3, 2];
              case 1:
                return [2, e.sent().default];
              case 2:
                return [2, new Promise((function (e, t) {
                  var n = document.createElement("script"),
                    r = function () {
                      var e;
                      return "ios" === Pt() ? (e = Et()) && ve(e, "9.19.0") <
                        0 ?
                        "https://static.line-scdn.net/liff/edge/2/ios-918-extensions_2_22_0.js" :
                        "https://static.line-scdn.net/liff/edge/2/ios-extensions_2_22_0.js" :
                        "https://static.line-scdn.net/liff/edge/2/non-ios-extensions_2_22_0.js"
                    }();
                  n.onload = function () {
                    var n = window.liffClientExtension;
                    n ? e(n) : t(Ce($,
                      "Unable to load client features. (Extension is empty)"
                    ))
                  }, n.onerror = function (e) {
                    t(Ce($, "Unable to load client features.", {
                      cause: e
                    }))
                  }, n.src = r, n.type = "text/javascript", document.body
                    .appendChild(n)
                }))]
            }
          }))
        }))
      }() : Promise.resolve(void 0)
    }

    function Ht() {
      mt()
    } ! function (e) {
      function t() {
        return null !== e && e.apply(this, arguments) || this
      }
      O(t, e), Object.defineProperty(t.prototype, "name", {
        get: function () {
          return "logout"
        },
        enumerable: !1,
        configurable: !0
      }), t.prototype.install = function () {
        return function () {
          return Ht()
        }
      }
    }(H);
    var Vt =
      /([\x90\x9D\x81\x8D\x8F<"{|}>\\^`“›„•‚ŽŠ…’—ž–‘”‡™‰ŒšŸ‹œ†¥¿©áÄýÍÎðô]|\n|.*#.*#|%(?![0-9A-Fa-f]{2})[^%]{0,2})/,
      Gt = function (e) {
        if (Vt.test(e)) throw Ce(z, "invalid URL.");
        var t = new URL(e),
          n = t.username,
          r = t.password,
          i = t.hash,
          o = t.search;
        return {
          username: n,
          password: r,
          pathname: t.pathname,
          hash: i,
          origin: t.origin,
          search: o
        }
      },
      Kt = function (e) {
        return e.substring(1).split("&").filter((function (e) {
          return !/^liff\./.test(e) && Boolean(e)
        }))
      },
      Jt = function (e, t) {
        var n = e.substring(t.length);
        return "/" === n ? "" : (n.length > 0 && "/" !== n[0] && (n = "/" + n),
          n)
      },
      qt = function (e) {
        return encodeURIComponent(e).replace(/[!'()*]/g, (function (e) {
          return "%" + e.charCodeAt(0).toString(16).toUpperCase()
        }))
      },
      zt = function (e, t) {
        var n = function (e, t) {
          for (var n = F([], x(e), !1), r = 0; r < t.length; r++) {
            var i = t[r],
              o = n.indexOf(i);
            o > -1 && n.splice(o, 1)
          }
          return n
        }(function (e) {
          var t, n, r = e.replace(/\+/g, "%2B"),
            i = new URLSearchParams(r),
            o = [];
          try {
            for (var a = L(i.entries()), s = a.next(); !s.done; s = a.next()) {
              var c = x(s.value, 2),
                u = c[0],
                l = c[1];
              o.push("".concat(qt(u), "=").concat(qt(l)))
            }
          } catch (d) {
            t = {
              error: d
            }
          } finally {
            try {
              s && !s.done && (n = a.return) && n.call(a)
            } finally {
              if (t) throw t.error
            }
          }
          if (0 === o.length) return [""];
          var f = e.split("&");
          return o.map((function (e, t) {
            return e.endsWith("=") && !f[t].endsWith("=") ? e.slice(0, -1) :
              e
          }))
        }(Kt(e).join("&")), Kt(t)).join("&");
        return "" !== n ? "?".concat(n) : ""
      },
      $t = function (e) {
        var t = new RegExp("^".concat(se.join("|"))),
          n = e.substring(1).split("&").filter((function (e) {
            return !t.test(e) && Boolean(e)
          })).join("&");
        return n ? "#".concat(n) : ""
      },
      Xt = function (e, t) {
        return 0 === t.indexOf(e) && (e.endsWith("/") && (e = e.substring(0, e
          .length - 1)), void 0 === t[e.length] || "/" === t[e.length])
      },
      Qt = function (e, t) {
        var n = Gt(e),
          r = new URL(t);
        if (n.username !== r.username || n.password !== r.password) throw Ce(z,
          "invalid URL.");
        if (r.origin !== n.origin || !Xt(r.pathname, n.pathname)) throw Ce(z,
          "invalid URL.")
      },
      Yt = function (e) {
        function t() {
          var t = e.apply(this, F([], x(arguments), !1)) || this;
          return t.extraParams = "", t.getAndValidateContext = function () {
            var e = Xe();
            if (!e) throw Ce($, "Could not get Context from server.");
            if (!e.endpointUrl) throw Ce($,
              "Could not get endpointUrl from server.");
            if (!e.permanentLinkPattern) throw Ce($,
              "Could not get permanentLinkPattern from server.");
            return e
          }, t.createUrl = function () {
            var e = t.getAndValidateContext(),
              n = window.location,
              r = n.pathname,
              i = n.search,
              o = n.hash,
              a = n.origin,
              s = new URL(e.endpointUrl);
            if (s.origin !== a || !Xt(s.pathname, r)) throw Ce(Q,
              "Current page is not under entrypoint.");
            var c = r.substring(s.pathname.length);
            c.length > 0 && "/" !== c[0] && (c = "/" + c);
            var u = new RegExp("^".concat(se.join("|"))),
              l = o.substring(1).split("&").filter((function (e) {
                return !u.test(e) && Boolean(e)
              })).join("&"),
              f = l === s.hash.substring(1) ? "" : l,
              d = function (e) {
                return e.substring(1).split("&").filter((function (e) {
                  return !/liff\.state/.test(e) && Boolean(e)
                }))
              },
              h = d(i),
              p = d(s.search);
            t.extraParams && h.push(t.extraParams);
            for (var v = 0; v < p.length; v++) {
              var w = p[v],
                m = h.indexOf(w);
              m > -1 && h.splice(m, 1)
            }
            var b = h.join("&"),
              g = "".concat(c).concat("" !== b ? "?".concat(b) : "").concat(f ?
                "#".concat(f) : "");
            return "".concat(re).concat(qe().liffId).concat(g)
          }, t.createUrlBy = function (e) {
            return k(t, void 0, void 0, (function () {
              var t, n, r, i, o, a;
              return A(this, (function (s) {
                if (!(t = qe().liffId)) throw Ce($,
                  "Should run after liff init.");
                return n = this.getAndValidateContext(), Qt(e, n.endpointUrl),
                  r = Gt(e), i = new URL(n.endpointUrl), o = n.miniDomainAllowed ?
                    ie : re, a = n.miniDomainAllowed && n.miniAppId ? n.miniAppId :
                      t, [2, o.concat(a, Jt(r.pathname, i.pathname), zt(r.search,
                        i.search), $t(r.hash))]
              }))
            }))
          }, t.setExtraQueryParam = function (e) {
            t.extraParams = e
          }, t.install = function () {
            return {
              createUrl: t.createUrl,
              createUrlBy: t.createUrlBy,
              setExtraQueryParam: t.setExtraQueryParam
            }
          }, t
        }
        return O(t, e), Object.defineProperty(t.prototype, "name", {
          get: function () {
            return "permanentLink"
          },
          enumerable: !1,
          configurable: !0
        }), t
      }(H),
      Zt = new Yt;

    function en(e) {
      return k(this, void 0, void 0, (function () {
        var t, n, r;
        return A(this, (function (i) {
          switch (i.label) {
            case 0:
              if (!e.ok) return [3, 4];
              i.label = 1;
            case 1:
              return i.trys.push([1, 3, , 4]), [4, e.json()];
            case 2:
              return [2, i.sent()];
            case 3:
              return i.sent(), [2, e];
            case 4:
              return t = String(e.status), n = Te.has(t) ? t : J, [4, e.json()
                .catch((function () {
                  throw Ce(n, e.statusText)
                }))
              ];
            case 5:
              throw Ce((r = i.sent()).error || r.errorCode || n, r.error_description ||
                r.message)
          }
        }))
      }))
    }

    function tn(e) {
      var t = function (e) {
        if (e) return e;
        var t = ut();
        if (!t) throw Ce(q,
          "Need access_token for api call, Please login first");
        return {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: "Bearer ".concat(t)
        }
      }(e && e.headers);
      return _(_({}, e), {
        headers: t
      })
    }

    function nn(e, t) {
      var n;
      try {
        n = tn(t)
      } catch (r) {
        return Promise.reject(r)
      }
      return fetch(e, n).then(en)
    }

    function rn(e, t) {
      var n;
      try {
        n = tn(t)
      } catch (r) {
        return Promise.reject(r)
      }
      return fetch(e, n)
    }

    function on(e) {
      var t = e.subdomain,
        n = void 0 === t ? "api" : t,
        r = e.pathname;
      return "https://".concat(n, ".").concat("line.me", "/").concat(r)
    }
    var an = {
      token: on({
        pathname: "oauth2/v2.1/token"
      }),
      certs: on({
        pathname: "oauth2/v2.1/certs"
      }),
      "openid-configuration": on({
        subdomain: "access",
        pathname: ".well-known/openid-configuration"
      }),
      authorize: on({
        subdomain: "access",
        pathname: "liff/v1/authorize"
      }),
      profile: on({
        pathname: "v2/profile"
      }),
      message: on({
        pathname: "message/v3/share"
      }),
      friendship: on({
        pathname: "friendship/v1/status"
      }),
      shareTargetPicker: on({
        subdomain: "access",
        pathname: "oauth2/v2.1/liff/shareTargetPicker"
      }),
      shareTargetPickerOtt: on({
        pathname: "liff/v2/apps"
      }),
      shareTargetPickerResult: on({
        subdomain: "access",
        pathname: "oauth2/v2.1/liff/shareTargetPicker/result"
      }),
      apps: on({
        pathname: "liff/v2/apps"
      }),
      subWindowGetMSIT: on({
        pathname: "liff/v2/sub/msit"
      }),
      subWindowGetMSTByMSIT: on({
        pathname: "liff/v2/sub/mst"
      }),
      subWindowSubscribe: on({
        subdomain: "liff",
        pathname: "liff/v2/sub/waitResult"
      }),
      subWindowPost: on({
        pathname: "liff/v2/sub/result"
      }),
      subWindowGetAppData: on({
        pathname: "liff/v2/sub/appData"
      }),
      subWindowGetOrigin: function (e) {
        return on({
          pathname: "liff/v2/sub/".concat(e, "/origin")
        })
      },
      accessTokenVerify: on({
        pathname: "oauth2/v2.1/verify"
      }),
      unauthorizedPermissions: on({
        subdomain: "liff",
        pathname: "liff/v2/incrementalAgreement/unauthorizedPermissions"
      }),
      permanentLink: on({
        subdomain: "liff",
        pathname: "liff/v2/permanentLink"
      }),
      createShortcutOnHomeScreen: on({
        subdomain: "liff-shortcut",
        pathname: "api/shortcut"
      }),
      iapVirtualConfirm: on({
        pathname: "iap/v1/product/virtualConfirm"
      })
    };

    function sn(e) {
      return an[e]
    }

    function cn(e) {
      return nn("".concat(sn("accessTokenVerify"), "?access_token=").concat(
        encodeURIComponent(e)), {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        }
      })
    }
    var un = "liff.subwindow.identifier",
      ln = "liff.subwindow.cryptokey",
      fn = _(_({}, ue), {
        GET_DATA: "getData",
        SET_DATA: "setData",
        NOT_FOUND: "notFound",
        TEARDOWN: "teardown"
      }),
      dn = "broadcast",
      hn = "command",
      pn = "main",
      vn = "sub",
      wn = function (e) {
        return k(void 0, void 0, void 0, (function () {
          var t;
          return A(this, (function (n) {
            switch (n.label) {
              case 0:
                return n.trys.push([0, 2, , 3]), [4, window.crypto.subtle.importKey(
                  "jwk", {
                  kty: "oct",
                  k: e,
                  alg: "A128GCM",
                  ext: !0
                }, {
                  name: "AES-GCM"
                }, !1, ["encrypt", "decrypt"])];
              case 1:
                return [2, n.sent()];
              case 2:
                throw t = n.sent(), Ce(J, t);
              case 3:
                return [2]
            }
          }))
        }))
      },
      mn = function (e, t, n) {
        return k(void 0, void 0, void 0, (function () {
          var r, i, o, a;
          return A(this, (function (s) {
            switch (s.label) {
              case 0:
                return s.trys.push([0, 3, , 4]), r = (new TextEncoder).encode(
                  e), [4, wn(t)];
              case 1:
                return i = s.sent(), [4, window.crypto.subtle.encrypt({
                  name: "AES-GCM",
                  iv: r
                }, i, (new TextEncoder).encode(n))];
              case 2:
                return o = s.sent(), [2, btoa(new Uint8Array(o).reduce((
                  function (e, t) {
                    return e + String.fromCharCode(t)
                  }), ""))];
              case 3:
                throw a = s.sent(), Ce(J, a);
              case 4:
                return [2]
            }
          }))
        }))
      },
      bn = function (e, t, n) {
        return k(void 0, void 0, void 0, (function () {
          var r, i, o, a, s, c, u;
          return A(this, (function (l) {
            switch (l.label) {
              case 0:
                return l.trys.push([0, 3, , 4]), r = (new TextEncoder).encode(
                  e), [4, wn(t)];
              case 1:
                for (i = l.sent(), o = atob(n), a = new Uint8Array(o.length),
                  s = 0; s < o.length; s++) a[s] = o.charCodeAt(s);
                return [4, window.crypto.subtle.decrypt({
                  name: "AES-GCM",
                  iv: r
                }, i, a.buffer)];
              case 2:
                return c = l.sent(), [2, (new TextDecoder).decode(new Uint8Array(
                  c))];
              case 3:
                throw u = l.sent(), Ce(J, u);
              case 4:
                return [2]
            }
          }))
        }))
      },
      gn = function (e) {
        return "".concat(e.identifier, "-").concat(e.action, "-").concat(e.timestamp)
      },
      yn = function (e) {
        return Object.keys(ue).map((function (e) {
          return ue[e]
        })).includes(e) ? dn : hn
      };

    function In() {
      var e = document.createElement("form");
      e.method = "POST", e.action = "$MESSAGE_HANDLER_URL";
      var t = document.createElement("input");
      t.type = "hidden", t.name = "identifier", t.value = "$IDENTIFIER", e.appendChild(
        t), document.body.appendChild(e), e.submit()
    }
    var Sn = function (e) {
      void 0 === e && (e = pn);
      var t = this;
      this.identification = {
        identifier: "",
        cryptoKey: ""
      }, this.messageHandlerInstance = null, this.listeners = new Map, this
        .sentMessages = [], this.generateIdentification = function () {
          return k(t, void 0, void 0, (function () {
            var e, t, n, r, i;
            return A(this, (function (o) {
              switch (o.label) {
                case 0:
                  return e = new URLSearchParams(window.location.search), t =
                    function (t) {
                      var n = e.get("liff.state");
                      return n ? new URLSearchParams(n).get(t) : null
                    }, n = this, i = {
                      identifier: this.windowType === pn ? xe(12) : e.get(
                        "liff.subwindow.identifier") || t(
                          "liff.subwindow.identifier") || ""
                    }, this.windowType !== pn ? [3, 2] : [4, k(void 0, void 0,
                      void 0, (function () {
                        var e, t, n;
                        return A(this, (function (r) {
                          switch (r.label) {
                            case 0:
                              return r.trys.push([0, 3, , 4]), [4, window.crypto
                                .subtle.generateKey({
                                  name: "AES-GCM",
                                  length: 128
                                }, !0, ["encrypt", "decrypt"])
                              ];
                            case 1:
                              return e = r.sent(), [4, window.crypto.subtle.exportKey(
                                "jwk", e)];
                            case 2:
                              if (!(t = r.sent()) || !t.k) throw Ce(J,
                                "failed to generate key");
                              return [2, t.k];
                            case 3:
                              throw n = r.sent(), Ce(J, n);
                            case 4:
                              return [2]
                          }
                        }))
                      }))];
                case 1:
                  return r = o.sent(), [3, 3];
                case 2:
                  r = e.get(ln) || t(ln) || "", o.label = 3;
                case 3:
                  return n.identification = (i.cryptoKey = r, i), [2]
              }
            }))
          }))
        }, this.hasIdentification = function () {
          var e = t.identification,
            n = e.identifier,
            r = e.cryptoKey;
          return "string" == typeof n && "string" == typeof r && n.length > 0 &&
            r.length > 0
        }, this.isReady = function () {
          return t.hasIdentification() && !!t.messageHandlerInstance
        }, this.setup = function () {
          return k(t, void 0, void 0, (function () {
            var e, t, n, r, i, o = this;
            return A(this, (function (a) {
              switch (a.label) {
                case 0:
                  return this.messageHandlerInstance ? [2] : [4, this.generateIdentification()];
                case 1:
                  if (a.sent(), !(e = this.identification.identifier)) return
                  [2];
                  if (t = /^[a-zA-Z0-9]+$/gm, !e.match(t)) throw Ce(J,
                    "Invalid identifier");
                  return (n = document.createElement("iframe")).style.display =
                    "none", n.src = "about:blank", document.body.appendChild(
                      n), null === (i = null == n ? void 0 : n.contentWindow) ||
                      void 0 === i || i.window.eval("(".concat(In.toString().replace(
                        "$MESSAGE_HANDLER_URL", "".concat(
                          "https://liff-subwindow.line.me/liff/v2/sub/messageHandler"
                        )).replace("$IDENTIFIER", e.split("'")[0]), ")()")), r =
                    "iframe-".concat(e, "-ready"), [4, new Promise((function (
                      e) {
                      var t = function (i) {
                        i.data[r] && (o.messageHandlerInstance = n, window.addEventListener(
                          "message", o.proxyToListeners), e(), document.removeEventListener(
                            "message", t))
                      };
                      window.addEventListener("message", t)
                    }))];
                case 2:
                  return [2, a.sent()]
              }
            }))
          }))
        }, this.teardown = function () {
          return k(t, void 0, void 0, (function () {
            var e, t;
            return A(this, (function (n) {
              switch (n.label) {
                case 0:
                  return this.isReady() ? [4, this.send({
                    eventName: fn.TEARDOWN
                  })] : [3, 2];
                case 1:
                  n.sent(), window.removeEventListener("message", this.proxyToListeners),
                    this.listeners.clear(), null === (t = null === (e = this.messageHandlerInstance) ||
                      void 0 === e ? void 0 : e.parentNode) || void 0 === t ||
                    t.removeChild(this.messageHandlerInstance), this.messageHandlerInstance =
                    null, n.label = 2;
                case 2:
                  return [2]
              }
            }))
          }))
        }, this.listen = function (e) {
          t.listeners.set(e, e)
        }, this.listenRepliedEvent = function (e, n) {
          var r = function (i) {
            i.replyTarget && function (e, t) {
              return gn(e) === gn(t)
            }(i.replyTarget, e) && (n(i), t.listeners.delete(r))
          };
          t.listeners.set(r, r)
        }, this.send = function (e) {
          return k(t, void 0, void 0, (function () {
            var t, n, r, i, o = this;
            return A(this, (function (a) {
              switch (a.label) {
                case 0:
                  if (!this.isReady()) throw Ce(
                    "message bus is not ready to send message");
                  return n = {
                    action: yn(e.eventName),
                    identifier: this.identification.identifier || "",
                    timestamp: (new Date).getTime()
                  }, [4, this.getEncryptedContext(e)];
                case 1:
                  return n.context = a.sent(), t = n, null === (i = null ===
                    (r = this.messageHandlerInstance) || void 0 === r ? void 0 :
                    r.contentWindow) || void 0 === i || i.postMessage({
                      messageBusEvent: t
                    }, "*"), this.sentMessages.push(gn(t)), [4, new Promise((
                      function (e) {
                        o.listenRepliedEvent(t, (function (t) {
                          e(t.context)
                        }))
                      }))];
                case 2:
                  return [2, a.sent()]
              }
            }))
          }))
        }, this.reply = function (e, n) {
          return k(t, void 0, void 0, (function () {
            var t, r, i, o;
            return A(this, (function (a) {
              switch (a.label) {
                case 0:
                  if (!this.isReady()) throw Ce(
                    "message bus is not ready to send message");
                  if (!e.identifier || !e.timestamp) throw Ce(J,
                    "target message is not valid");
                  return r = {
                    action: dn
                  }, [4, this.getEncryptedContext(n)];
                case 1:
                  return r.context = a.sent(), r.identifier = this.identification
                    .identifier || "", r.timestamp = (new Date).getTime(), r.replyTarget = {
                      action: e.action,
                      identifier: e.identifier,
                      timestamp: e.timestamp
                    }, t = r, null === (o = null === (i = this.messageHandlerInstance) ||
                      void 0 === i ? void 0 : i.contentWindow) || void 0 === o ||
                    o.postMessage({
                      messageBusEvent: t
                    }, "*"), this.sentMessages.push(gn(t)), [2]
              }
            }))
          }))
        }, this.setData = function (e, n) {
          void 0 === e && (e = "appData"), t.send({
            eventName: fn.SET_DATA,
            key: e,
            data: n
          })
        }, this.getData = function () {
          for (var e = [], n = 0; n < arguments.length; n++) e[n] = arguments[
            n];
          return k(t, F([], x(e), !1), void 0, (function (e) {
            return void 0 === e && (e = "appData"), A(this, (function (t) {
              switch (t.label) {
                case 0:
                  return [4, this.send({
                    eventName: fn.GET_DATA,
                    key: e
                  })];
                case 1:
                  return [2, t.sent()]
              }
            }))
          }))
        }, this.proxyToListeners = function (e) {
          return k(t, void 0, void 0, (function () {
            var t, n = this;
            return A(this, (function (r) {
              return t = e.data.messageBusEvent,
                "https://liff-subwindow.line.me" !== e.origin ? [2] : t ? (
                  this.sentMessages.includes(gn(t)) || t.identifier !== this
                    .identification.identifier || t.action !== dn && !t.replyTarget ||
                  this.listeners.forEach((function (e) {
                    return k(n, void 0, void 0, (function () {
                      var n, r, i;
                      return A(this, (function (o) {
                        switch (o.label) {
                          case 0:
                            return n = e, r = [_({}, t)], i = {}, [4,
                              this.getDecryptedContext(t.context)
                            ];
                          case 1:
                            return n.apply(void 0, [_.apply(void 0, r.concat(
                              [(i.context = o.sent(), i)]))]), [2]
                        }
                      }))
                    }))
                  })), [2]) : [2]
            }))
          }))
        }, this.getEncryptedContext = function (e) {
          return k(t, void 0, void 0, (function () {
            var t, n, r, i, o, a, s;
            return A(this, (function (c) {
              switch (c.label) {
                case 0:
                  return t = this.identification, n = t.identifier, r = t.cryptoKey,
                    o = (i = JSON).stringify, s = {
                      eventName: e.eventName,
                      key: e.key ? e.key : void 0
                    }, e.data ? [4, mn(n, r, JSON.stringify(e.data))] : [3, 2];
                case 1:
                  return a = c.sent(), [3, 3];
                case 2:
                  a = void 0, c.label = 3;
                case 3:
                  return [2, o.apply(i, [(s.data = a, s)])]
              }
            }))
          }))
        }, this.getDecryptedContext = function (e) {
          return k(t, void 0, void 0, (function () {
            var t, n, r, i, o, a, s, c;
            return A(this, (function (u) {
              switch (u.label) {
                case 0:
                  return t = this.identification, n = t.identifier, r = t.cryptoKey, (
                    i = JSON.parse(e)).data && "string" == typeof i.data ? (
                    c = (s = JSON).parse, [4, bn(n, r, i.data)]) : [3, 2];
                case 1:
                  return a = c.apply(s, [u.sent()]), [3, 3];
                case 2:
                  a = void 0, u.label = 3;
                case 3:
                  return o = a, [2, _(_({}, i), {
                    data: o
                  })]
              }
            }))
          }))
        }, this.windowType = e
    };
    ! function () {
      if ("undefined" != typeof window && "function" != typeof window.CustomEvent) {
        function e(e, t) {
          var n = t || {},
            r = n.bubbles,
            i = void 0 !== r && r,
            o = n.cancelable,
            a = void 0 !== o && o,
            s = n.detail,
            c = void 0 === s ? void 0 : s,
            u = document.createEvent("CustomEvent");
          return u.initCustomEvent(e, i, a, c), u
        }
        e.prototype = Event.prototype, window.CustomEvent = e
      }
    }();
    var Tn = {},
      En = !1;

    function Cn(e, t) {
      En || (En = !0, window.addEventListener(te, (function (e) {
        e && e.detail && e.detail.type && Tn[e.detail.type] && Tn[e.detail
          .type].forEach((function (t) {
            return t(e)
          }))
      }))), Tn[e] ? Tn[e].push(t) : Tn[e] = [t]
    }

    function Pn(e, t) {
      var n = Tn[e];
      if (n && Array.isArray(n)) {
        var r = n.indexOf(t);
        r >= 0 && n.splice(r, 1)
      }
    }

    function On(e, t, n) {
      void 0 === t && (t = {}), void 0 === n && (n = "");
      var r = ot();
      if (!r) throw Ce(X, "Invalid featureToken for client features");
      if (!window._liff || !window._liff.postMessage) throw Ce(z,
        "postMessage is not available from client");
      R.debug("[js postMessage to client]", e, n, t), window._liff.postMessage(
        e, r, n, JSON.stringify(t))
    }

    function _n(e, t, n) {
      return void 0 === t && (t = {}), void 0 === n && (n = {
        once: !0
      }), ot() ? (n = _({
        callbackId: xe(12),
        once: !0
      }, n), new Promise((function (r, i) {
        var o = function (t) {
          if (t && t.detail) {
            var a = t.detail.callbackId === n.callbackId,
              s = "string" != typeof t.detail.callbackId;
            (a || s) && (n.once && Pn(e, o), R.debug("[callback detail]", t
              .detail), t.detail.error ? i(t.detail.error) : t.detail.data ?
                r(t.detail.data) : i(t.detail))
          }
          i()
        };
        Cn(e, o), On(e, t, n.callbackId)
      }))) : Promise.reject(Ce(X, "Invalid featureToken for client features"))
    }

    function kn() {
      var e = Et();
      null !== e && ("ios" === Pt() && ve(e, "9.19") >= 0 || "android" === Pt() &&
        ve(e, "11.6.0") >= 0) ? location.href = "liff://close" : window._liff &&
          window._liff.postMessage ? null !== e && ve(e, "10.15.0") >= 0 ? "ios" ===
            Pt() ? window._liff.postMessage("closeWindow", "") : window._liff.postMessage(
              "closeWindow", "", "", "") : _n("closeWindow") : window.close()
    } ! function (e) {
      function t() {
        return null !== e && e.apply(this, arguments) || this
      }
      O(t, e), Object.defineProperty(t.prototype, "name", {
        get: function () {
          return "closeWindow"
        },
        enumerable: !1,
        configurable: !0
      }), t.prototype.install = function () {
        return function () {
          return kn()
        }
      }
    }(H);

    function An(e) {
      return nn(sn("subWindowGetOrigin")(e))
    }
    var Ln = {};

    function xn(e, t) {
      e && Ln[e] && Ln[e].forEach((function (e) {
        e(t)
      }))
    }

    function Fn(e, t) {
      Ln[e] || (Ln[e] = []), Ln[e].push(t)
    }

    function jn(e, t) {
      if (Ln[e]) {
        var n = Ln[e].indexOf(t);
        n >= 0 && Ln[e].splice(n, 1)
      }
    }
    var Nn, Un, Rn, Dn, Bn, Mn = function () {
      function e(e) {
        this.storage = e
      }
      return e.prototype.getItem = function (e) {
        return this.storage.getItem("".concat(this.getKeyPrefix(), ":").concat(
          e))
      }, e.prototype.setItem = function (e, t) {
        this.storage.setItem("".concat(this.getKeyPrefix(), ":").concat(e),
          t)
      }, e.prototype.removeItem = function (e) {
        this.storage.removeItem("".concat(this.getKeyPrefix(), ":").concat(e))
      }, e.prototype.clear = function () {
        this.storage.clear()
      }, e.prototype.getKeyPrefix = function () {
        return "".concat(ne, ":").concat(this.getLiffId())
      }, e.prototype.getLiffId = function () {
        var e = qe().liffId;
        if (!e) throw Ce(Q, "liffId is necessary for liff.init()");
        return e
      }, e
    }(),
      Wn = new Mn(new _e);

    function Hn() {
      var e = Wn.getItem("subWindowStatusUpdated");
      return null !== e && JSON.parse(e)
    }

    function Vn(e) {
      Wn.setItem("subWindowStatusUpdated", String(e))
    }

    function Gn(e) {
      Nn = e
    }

    function Kn() {
      return Nn
    }

    function Jn() {
      return Rn
    }

    function qn() {
      return Dn
    }

    function zn() {
      return k(this, arguments, void 0, (function (e) {
        return void 0 === e && (e = pn), A(this, (function (t) {
          switch (t.label) {
            case 0:
              return [4, (Bn = new Sn(e)).setup()];
            case 1:
              return t.sent(), [2, Bn]
          }
        }))
      }))
    }

    function $n() {
      return Bn
    }
    var Xn = new _e,
      Qn = new Mn(Ge() ? Xn : window.sessionStorage);

    function Yn() {
      return Qn.getItem("mainWindowOrigin")
    }

    function Zn(e) {
      return k(this, arguments, void 0, (function (e, t) {
        var n, r, i, o, a, s, c, u;
        return void 0 === t && (t = {}), A(this, (function (l) {
          switch (l.label) {
            case 0:
              if (null == (n = $n()) ? void 0 : n.isReady()) return [3, 5];
              if (r = JSON.stringify(t), i = qe().liffId, o = Yn(), !window
                .opener || !o || !i) throw Ce(ee);
              a = !1, l.label = 1;
            case 1:
              return l.trys.push([1, 3, , 4]), [4, An(i)];
            case 2:
              return s = l.sent(), a = s.subwindowCommonModule, [3, 4];
            case 3:
              throw c = l.sent(), R.debug(c), Ce(ee);
            case 4:
              return u = a ? o : location.origin, [2, new Promise((function (
                t) {
                window.addEventListener("message", (function n(i) {
                  er(i) && (window.removeEventListener("message", n),
                    t({
                      status: e,
                      result: r
                    }))
                })), window.opener.postMessage({
                  status: e,
                  result: r
                }, u)
              }))];
            case 5:
              return n.send({
                eventName: e,
                data: t
              }), [4, new Promise((function (e) {
                setTimeout(e, 500)
              }))];
            case 6:
              return l.sent(), [2, {
                status: e,
                result: JSON.stringify(t)
              }]
          }
        }))
      }))
    }

    function er(e) {
      return !(!e.data || "string" != typeof e.data.type || ![ue.SUBMIT, ue.CANCEL]
        .includes(e.data.type))
    }

    function tr(e) {
      var t, n = qn();
      if (e.origin === n) {
        var r = e.data;
        if (r) {
          var i, o = r.status,
            a = r.result;
          try {
            i = JSON.parse(a || "{}")
          } catch (W) {
            i = {}
          }
          switch (o) {
            case fe:
              window.clearInterval(Jn()), or();
              break;
            case ue.CANCEL:
            case ue.SUBMIT:
              Vn(!0), window.clearInterval(Jn()), window.removeEventListener(
                "message", tr), xn(o, i), null === (t = Kn()) || void 0 === t ||
                t.postMessage({
                  type: o
                }, qn());
              break;
            default:
              R.debug("unexpected message")
          }
        }
      }
    }
    var nr = function (e) {
      return k(void 0, void 0, void 0, (function () {
        var t, n, r, i;
        return A(this, (function (o) {
          if (Hn()) return [2];
          switch (t = e.context, n = t.eventName, r = t.data, i = $n(),
          n) {
            case ue.INIT:
              ir(!r.hasOpener);
              break;
            case ue.CANCEL:
            case ue.SUBMIT:
              Vn(!0), xn(n, r), null == i || i.reply(e, {
                eventName: n
              });
              break;
            case ue.CLOSE:
              !1 === Hn() && (Vn(!0), xn(ue.CLOSE, {})), or()
          }
          return [2]
        }))
      }))
    };

    function rr() {
      window.clearInterval(Un), window.clearInterval(Jn()), window.removeEventListener(
        "message", tr)
    }

    function ir(e) {
      if (void 0 === e && (e = !1), rr(), Vn(!1), e) {
        var t = Kn();
        t && (t.close(), Gn(null))
      }
    }

    function or() {
      return k(this, void 0, void 0, (function () {
        var e;
        return A(this, (function (t) {
          switch (t.label) {
            case 0:
              return (e = $n()) ? [4, e.teardown()] : [3, 2];
            case 1:
              t.sent(), t.label = 2;
            case 2:
              return [2]
          }
        }))
      }))
    }
    var ar = null;

    function sr(e) {
      return k(this, void 0, void 0, (function () {
        var t, n, r, i, o, a, s, c, u, l, f, d, h, p, v = this;
        return A(this, (function (w) {
          switch (w.label) {
            case 0:
              if (t = e.msit, n = e.mstChallenge, r = e.reconnectCount, i =
                void 0 === r ? 0 : r, o = function () {
                  return k(v, void 0, void 0, (function () {
                    return A(this, (function (r) {
                      switch (r.label) {
                        case 0:
                          return [4, (1e3, new Promise((function (e) {
                            return setTimeout(e, 1e3)
                          })))];
                        case 1:
                          return r.sent(), [4, sr({
                            msit: t,
                            mstChallenge: n,
                            onSuccess: e.onSuccess,
                            onError: e.onError,
                            reconnectCount: i + 1
                          })];
                        case 2:
                          return r.sent(), [2]
                      }
                    }))
                  }))
                }, a = function () {
                  for (var t = [], n = 0; n < arguments.length; n++) t[n] =
                    arguments[n];
                  ar = null, e.onSuccess.apply(e, F([], x(t), !1))
                }, s = function () {
                  for (var t = [], n = 0; n < arguments.length; n++) t[n] =
                    arguments[n];
                  ar = null, e.onError.apply(e, F([], x(t), !1))
                }, c = Date.now(), null === ar && (ar = c), u = c - ar, i >=
                10 || u > 6e5) return s(Ce(J, "Failed to connect")), [2];
              w.label = 1;
            case 1:
              return w.trys.push([1, 3, , 5]), [4, rn(sn(
                "subWindowSubscribe"), {
                method: "POST",
                body: JSON.stringify({
                  msit: t,
                  mstChallenge: n
                })
              })];
            case 2:
              return l = w.sent(), [3, 5];
            case 3:
              return w.sent(), [4, o()];
            case 4:
              return w.sent(), [2];
            case 5:
              return l.status >= 500 ? [4, o()] : [3, 7];
            case 6:
              return w.sent(), [3, 17];
            case 7:
              return l.status >= 400 && 500 > l.status ? [4, cr(l)] : [3, 9];
            case 8:
              return d = w.sent(), f = d ? Ce(z, d.errorDetail) : Ce(J,
                "Some error happened in the server"), s(f), [3, 17];
            case 9:
              return 200 !== l.status ? [3, 16] : [4, cr(l)];
            case 10:
              if (!(d = w.sent())) return s(Ce(J,
                "Some error happened in the server")), [2];
              switch (h = d.status, p = d.result, h) {
                case ue.ERROR:
                  return [3, 11];
                case ue.CLOSE:
                case ue.CANCEL:
                case ue.SUBMIT:
                  return [3, 13]
              }
              return [3, 14];
            case 11:
              return [4, o()];
            case 12:
              return w.sent(), [3, 15];
            case 13:
              return a(h, p), [3, 15];
            case 14:
              s(Ce(J, "Some error happened in the server")), w.label = 15;
            case 15:
              return [3, 17];
            case 16:
              s(Ce(J, "Some error happened in the server")), w.label = 17;
            case 17:
              return [2]
          }
        }))
      }))
    }

    function cr(e) {
      return k(this, void 0, void 0, (function () {
        return A(this, (function (t) {
          switch (t.label) {
            case 0:
              return t.trys.push([0, 2, , 3]), [4, e.json()];
            case 1:
              return [2, t.sent()];
            case 2:
              return t.sent(), [2, null];
            case 3:
              return [2]
          }
        }))
      }))
    }

    function ur(e) {
      var t = {};
      return Object.keys(e).forEach((function (n) {
        "closeButtonColor" === n ? "white" === e[n] ? t[n] = "#ffffff" : t[
          n] = "#000000" : t[n] = e[n]
      })), t
    }
    var lr = {
      height: "full",
      closeButtonPosition: "right",
      closeButtonColor: "black",
      closeButtonLabel: ""
    };

    function fr(e) {
      var t = e.appData,
        n = e.native,
        r = qe().liffId,
        i = rt(),
        o = De(e.url);
      if (!r) return Promise.reject(Ce(q, "liffId is invalid"));
      if (!i) return Promise.reject(Ce(q, "mst_challenge is invalid"));
      if (!o) return Promise.reject(Ce(z,
        "params.url must be liff url or mini url"));
      var a = Object.assign({}, lr, n);
      return function (e) {
        var t = e.mainLiffId,
          n = e.subLiffId,
          r = e.mstChallenge,
          i = e.appData,
          o = e.view;
        return t && r ? nn(sn("subWindowGetMSIT"), {
          method: "POST",
          body: JSON.stringify({
            mainLiffId: t,
            subLiffId: n,
            mstChallenge: r,
            appData: i,
            view: o
          })
        }) : Promise.reject(Ce(z, "no proper argument"))
      }({
        mainLiffId: r,
        subLiffId: o,
        mstChallenge: i,
        appData: t,
        view: ur(a)
      }).then((function (e) {
        var t = e.msit;
        return sr({
          msit: t,
          mstChallenge: i,
          onSuccess: function (e, t) {
            xn(e, t)
          },
          onError: function (e) {
            xn(ue.ERROR, e)
          }
        }), t
      })).then((function (t) {
        return function (e, t) {
          return k(this, void 0, void 0, (function () {
            var n, r, i;
            return A(this, (function (o) {
              switch (o.label) {
                case 0:
                  return n = e.url, (r = new URLSearchParams).set("msit",
                    t), [4, null === (i = e.onBeforeTransition) || void 0 ===
                      i ? void 0 : i.call(e)
                    ];
                case 1:
                  return o.sent(), location.href = "".concat(
                    "liff://subwindow", "?url=").concat(
                      encodeURIComponent(n), "&").concat(r.toString()), [2]
              }
            }))
          }))
        }(e, t)
      }))
    }

    function dr(e) {
      return Ft.subwindowOpen(), Je() ? fr(e) : function (e) {
        return k(this, void 0, void 0, (function () {
          var t, n, r, i, o, a, s, c, u, l, f, d;
          return A(this, (function (h) {
            switch (h.label) {
              case 0:
                return (t = De(e.url)) ? (ir(!0), [4, or()]) : [2, Promise.reject(
                  Ce(z, "params.url must be liff url or mini url"))];
              case 1:
                return h.sent(), Gn("ios" !== Pt() || We() ? window.open("",
                  "liffsubwindow",
                  "width=480, height=640, menubar=no, toolbar=no, scrollbars=yes"
                ) : window.open()), n = e.url, r = e.appData, (i = new URL(
                  n)).searchParams.append(le, "true"), [4, zn()];
              case 2:
                return o = h.sent(), i.searchParams.append(un, o.identification
                  .identifier), i.searchParams.append(ln, o.identification.cryptoKey),
                  i.hostname = function (e) {
                    var t = x(e.split(".")),
                      n = t[0],
                      r = t.slice(1);
                    return F(["".concat(n, "-ext")], x(r), !1).join(".")
                  }(i.hostname), a = i.toString(), [4, An(t)];
              case 3:
                if (s = h.sent(), c = s.origin, u = s.subwindowCommonModule, !
                  (l = Kn())) throw Ce(Z);
                if (!u) return l.close(), [2];
                ! function (e) {
                  Dn = e
                }(c), o.listen(nr), o.setData("appData", r), window.addEventListener(
                  "message", tr), h.label = 4;
              case 4:
                return h.trys.push([4, 6, , 7]), [4, null === (d = e.onBeforeTransition) ||
                  void 0 === d ? void 0 : d.call(e)
                ];
              case 5:
                return h.sent(), [3, 7];
              case 6:
                throw f = h.sent(), l.close(), f;
              case 7:
                return l.location.href = a, p = function (e, t) {
                  var n = Kn(),
                    r = {
                      type: fe
                    };
                  return t && (r.message = JSON.stringify(t)), window.setInterval(
                    (function () {
                      null == n || n.postMessage(r, e)
                    }), 100)
                }(c, r), Rn = p,
                  function (e) {
                    Un = e
                  }(window.setInterval((function () {
                    var e = Kn();
                    e && e.closed && (rr(), Gn(null), !1 === Hn() && (Vn(!
                      0), xn(ue.CLOSE, {})))
                  }), 100)), [2]
            }
            var p
          }))
        }))
      }(e)
    }

    function hr(e) {
      if (!e.mst || !e.status) return Promise.reject(Ce(z,
        "no proper argument"));
      var t = JSON.stringify(e);
      return nn(sn("subWindowPost"), {
        method: "POST",
        body: t
      })
    }

    function pr() {
      if (!Tt()) throw Ce(q, "this api can be only called in child window")
    }

    function vr(e) {
      return void 0 === e && (e = {}), pr(), Je() ? function () {
        return k(this, arguments, void 0, (function (e) {
          var t, n;
          return void 0 === e && (e = {}), A(this, (function (r) {
            switch (r.label) {
              case 0:
                return (t = nt()) ? [4, hr({
                  mst: t,
                  status: ue.CANCEL,
                  result: e
                })] : [2, Promise.reject(Ce(q, "mst is invalid"))];
              case 1:
                return n = r.sent(), Vn(!0), [2, n]
            }
          }))
        }))
      }(e) : function (e) {
        return void 0 === e && (e = {}), Zn(ue.CANCEL, e)
      }(e)
    }

    function wr(e) {
      return void 0 === e && (e = {}), pr(), Je() ? function () {
        return k(this, arguments, void 0, (function (e) {
          var t, n;
          return void 0 === e && (e = {}), A(this, (function (r) {
            switch (r.label) {
              case 0:
                return (t = nt()) ? [4, hr({
                  mst: t,
                  status: ue.SUBMIT,
                  result: e
                })] : [2, Promise.reject(Ce(q, "mst is invalid"))];
              case 1:
                return n = r.sent(), Vn(!0), [2, n]
            }
          }))
        }))
      }(e) : function (e) {
        return void 0 === e && (e = {}), Zn(ue.SUBMIT, e)
      }(e)
    }

    function mr() {
      return pr(), Je() ? function () {
        return k(this, void 0, void 0, (function () {
          var e;
          return A(this, (function (t) {
            switch (t.label) {
              case 0:
                return !1 !== Hn() ? [3, 2] : (e = nt()) ? [4, hr({
                  mst: e,
                  status: ue.CLOSE,
                  result: {}
                })] : [2, Promise.reject(Ce(q, "mst is invalid"))];
              case 1:
                t.sent(), t.label = 2;
              case 2:
                return kn(), [2]
            }
          }))
        }))
      }() : function () {
        return k(this, void 0, void 0, (function () {
          var e;
          return A(this, (function (t) {
            return (null == (e = $n()) ? void 0 : e.isReady()) ? (e.send({
              eventName: ue.CLOSE
            }), [2, new Promise((function (e) {
              setTimeout((function () {
                kn(), e()
              }), 100)
            }))]) : (kn(), [2, Promise.resolve()])
          }))
        }))
      }()
    }

    function br() {
      return pr(),
        function () {
          var e, t = ze(oe.APP_DATA);
          try {
            e = t ? JSON.parse(t) : {}
          } catch (n) {
            e = {}
          }
          return Promise.resolve(e)
        }()
    }

    function gr(e) {
      var t = e.msit,
        n = e.mstVerifier;
      return t && n ? nn(sn("subWindowGetMSTByMSIT"), {
        method: "POST",
        body: JSON.stringify({
          msit: t,
          mstVerifier: n
        })
      }) : Promise.reject(Ce(z, "no proper argument"))
    }

    function yr(e) {
      var t = e.mst;
      return t ? nn(sn("subWindowGetAppData"), {
        method: "POST",
        body: JSON.stringify({
          mst: t
        })
      }) : Promise.reject(Ce(z, "no proper argument"))
    }
    var Ir, Sr = {
      on: Fn,
      off: jn,
      open: dr,
      cancel: vr,
      submit: wr,
      close: mr,
      getAppData: br
    },
      Tr = (function (e) {
        function t() {
          return null !== e && e.apply(this, arguments) || this
        }
        O(t, e), Object.defineProperty(t.prototype, "name", {
          get: function () {
            return "subWindow"
          },
          enumerable: !1,
          configurable: !0
        }), t.prototype.install = function () {
          var e = this;
          return {
            on: Fn.bind(this),
            off: jn.bind(this),
            open: function (t) {
              return dr.call(e, _(_({}, t), {
                onBeforeTransition: void 0
              }))
            },
            cancel: vr.bind(this),
            submit: wr.bind(this),
            close: mr.bind(this),
            getAppData: br.bind(this)
          }
        }
      }(H), n(255)),
      Er = n.n(Tr),
      Cr = function () {
        var e = this;
        this.type = "sync", this.fns = new Set, this.on = function (t) {
          e.fns.add(t)
        }, this.call = function () {
          for (var t, n, r = [], i = 0; i < arguments.length; i++) r[i] =
            arguments[i];
          try {
            for (var o = L(e.fns), a = o.next(); !a.done; a = o.next()) {
              var s = a.value;
              s.apply(void 0, F([], x(r), !1))
            }
          } catch (W) {
            t = {
              error: W
            }
          } finally {
            try {
              a && !a.done && (n = o.return) && n.call(o)
            } finally {
              if (t) throw t.error
            }
          }
        }
      },
      Pr = function () {
        var e = this;
        this.type = "async", this.fns = new Set, this.on = function (t) {
          e.fns.add(t)
        }, this.call = function () {
          for (var t = [], n = 0; n < arguments.length; n++) t[n] = arguments[
            n];
          return k(e, void 0, void 0, (function () {
            var e, n, r, i, o, a;
            return A(this, (function (s) {
              switch (s.label) {
                case 0:
                  e = [];
                  try {
                    for (n = L(this.fns), r = n.next(); !r.done; r = n.next())
                      i = r.value, e.push(i.apply(void 0, F([], x(t), !1)))
                  } catch (W) {
                    o = {
                      error: W
                    }
                  } finally {
                    try {
                      r && !r.done && (a = n.return) && a.call(n)
                    } finally {
                      if (o) throw o.error
                    }
                  }
                  return [4, Promise.all(e)];
                case 1:
                  return s.sent(), [2]
              }
            }))
          }))
        }
      },
      Or = function (e) {
        var t, n = xe(43),
          r = function (e) {
            var t = "";
            return e.replace(/\r|\n/g, "").replace(/([\da-fA-F]{2}) ?/g, "0x$1 ")
              .replace(/ +$/, "").split(" ").forEach((function (e) {
                t += String.fromCharCode(parseInt(e))
              })), window.btoa(t)
          }(Er()(n)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, ""),
          i = qe();
        if (!i || !i.liffId) throw Ce(Q,
          "You need to define `liffId` for liff.login()");
        var o = {
          app_id: i.liffId,
          state: xe(12),
          response_type: "code",
          code_challenge_method: "S256",
          code_challenge: r,
          liff_sdk_version: "2.27.3"
        };
        e && e.redirectUri && (o.redirect_uri = e.redirectUri), Tt() && !Je() &&
          ((null === (t = $n()) || void 0 === t ? void 0 : t.isReady()) ? o.redirect_uri =
            window.location.href : o.disable_auto_login = "true"),
          function (e) {
            $e(oe.LOGIN_TMP, e)
          }({
            codeVerifier: n
          });
        var a = sn("authorize") + "?" + Ae(o);
        R.debug("[Redirect] ".concat(a)), window.location.href = a
      },
      _r = function (e) {
        function t() {
          var t = e.apply(this, F([], x(arguments), !1)) || this;
          return t.hooks = {
            before: new Cr
          }, t
        }
        return O(t, e), Object.defineProperty(t.prototype, "name", {
          get: function () {
            return "login"
          },
          enumerable: !1,
          configurable: !0
        }), t.prototype.install = function () {
          return this._login.bind(this)
        }, t.prototype._login = function (e) {
          this.hooks.before.call(e), Or(e)
        }, t
      }(H),
      kr = "undefined" == typeof navigator ? "en" : null !== (Ir = navigator.language) &&
        void 0 !== Ir ? Ir : "en",
      Ar = null;

    function Lr(e) {
      return k(this, void 0, void 0, (function () {
        return A(this, (function (t) {
          switch (t.label) {
            case 0:
              return kr = e, [4, xr()];
            case 1:
              return t.sent(), [2]
          }
        }))
      }))
    }

    function xr() {
      return k(this, void 0, void 0, (function () {
        var e, t;
        return A(this, (function (n) {
          switch (n.label) {
            case 0:
              return [4, nn("".concat(
                "https://liffsdk.line-scdn.net/xlt/manifest.json"), {
                method: "GET",
                headers: {
                  Accept: "application/json"
                }
              })];
            case 1:
              return e = n.sent(), t = "".concat(kr), !e.languages[t] && kr
                .includes("-") && (t = kr.split("-")[0]), e.languages[t] ||
                (t = "en"), [4, nn("".concat(
                  "https://liffsdk.line-scdn.net/xlt", "/").concat(e.languages[
                    t]), {
                  method: "GET",
                  headers: {
                    Accept: "application/json"
                  }
                })];
            case 2:
              return Ar = n.sent(), [2]
          }
        }))
      }))
    }

    function Fr(e) {
      if (null === Ar) throw Ce($, "please call xlt after liff.init");
      return Ar[e]
    }
    var jr = new (function (e) {
      function t() {
        return null !== e && e.apply(this, arguments) || this
      }
      return O(t, e), Object.defineProperty(t.prototype, "name", {
        get: function () {
          return "i18n"
        },
        enumerable: !1,
        configurable: !0
      }), t.prototype.install = function (e) {
        return e.internalHooks.init.beforeFinished(this.beforeInitFinished.bind(
          this)), {
          setLang: Lr
        }
      }, t.prototype.beforeInitFinished = function () {
        return k(this, void 0, void 0, (function () {
          return A(this, (function (e) {
            switch (e.label) {
              case 0:
                return [4, xr()];
              case 1:
                return e.sent(), [2]
            }
          }))
        }))
      }, t
    }(H)),
      Nr = {
        iconColor: "#111111",
        statusBarColor: "BLACK",
        titleTextColor: "#111111",
        titleSubtextColor: "#B7B7B7",
        titleButtonColor: "#111111",
        titleBackgroundColor: "#FFFFFF",
        progressBarColor: "#06C755",
        progressBackgroundColor: "#FFFFFF",
        titleButtonAreaBackgroundColor: "#1FFFFFFF",
        titleButtonAreaBorderColor: "#26000000",
        baseBackgroundColor: "#FFFFFF",
        baseTextColor: "#000000",
        lightButtonBorderColor: "rgba(0, 0, 0, 0.15)"
      },
      Ur = {
        iconColor: "#FFFFFF",
        statusBarColor: "WHITE",
        titleTextColor: "#FFFFFF",
        titleSubtextColor: "#949494",
        titleButtonColor: "#FFFFFF",
        titleBackgroundColor: "#111111",
        progressBarColor: "#06C755",
        progressBackgroundColor: "#111111",
        titleButtonAreaBackgroundColor: "#1FFFFFFF",
        titleButtonAreaBorderColor: "#26000000",
        baseBackgroundColor: "#000000",
        baseTextColor: "#FFFFFF",
        lightButtonBorderColor: "rgba(255, 255, 255, 0.5)"
      };

    function Rr(e) {
      var t = Xe(),
        n = (null == t ? void 0 : t.menuColorSetting) || {
          adaptableColorSchemes: ["light"],
          lightModeColor: Nr,
          darkModeColor: Ur
        },
        r = n.adaptableColorSchemes,
        i = n.lightModeColor,
        o = n.darkModeColor,
        a = r.includes("dark");
      e.matches && a ? Dr(_(_({}, Ur), o)) : Dr(_(_({}, Nr), i))
    }

    function Dr(e) {
      var t = e.iconColor,
        n = e.statusBarColor,
        r = e.titleTextColor,
        i = e.titleSubtextColor,
        o = e.titleButtonColor,
        a = e.titleBackgroundColor,
        s = e.progressBarColor,
        c = e.progressBackgroundColor,
        u = e.titleButtonAreaBackgroundColor,
        l = e.titleButtonAreaBorderColor,
        f = e.baseBackgroundColor,
        d = e.baseTextColor,
        h = e.lightButtonBorderColor;
      Br("--liff-base-background-color", f), Br("--liff-base-text-color", d),
        Br("--liff-base-background-rgb-color", be(f)), Br(
          "--liff-base-text-rgb-color", be(d)), Br(
            "--liff-light-button-border-color", h), Br("--liff-title-text-color",
              r), Br("--liff-title-background-color", a), Br(
                "--liff-title-button-color", o), Br("--liff-icon-color", t), Br(
                  "--liff-status-bar-color", n), Br("--liff-title-subtext-color", i),
        Br("--liff-progress-bar-color", s), Br(
          "--liff-progress-background-color", c), Br(
            "--liff-title-button-area-background-color", we(u)), Br(
              "--liff-title-button-area-border-color", we(l))
    }

    function Br(e, t) {
      document.documentElement.style.setProperty(e, t)
    }
    var Mr = {
      addToHomeScreen: function (e) {
        if (!new Rt(e).invoke("addToHomeScreen")) throw Ce(X,
          "No permission for liff.addToHomeScreen()")
      },
      scanCode: function (e) {
        if (!new Rt(e).invoke("scanCode")) return Promise.reject(Ce(X,
          "No permission for liff.scanCode()"))
      },
      getAdvertisingId: function (e) {
        if (!new Rt(e).invoke("getAdvertisingId")) return Promise.reject(Ce(
          X, "No permission for liff.getAdvertisingId()"))
      },
      initPlugins: function () { }
    };

    function Wr(e) {
      return k(this, void 0, void 0, (function () {
        var t;
        return A(this, (function (n) {
          switch (n.label) {
            case 0:
              return [4, Wt()];
            case 1:
              return (t = n.sent()) ? (t.install(e, Mr), [2]) : [2]
          }
        }))
      }))
    }

    function Hr() {
      return k(this, void 0, void 0, (function () {
        return A(this, (function (e) {
          switch (e.label) {
            case 0:
              return [4, nn(sn("certs"))];
            case 1:
              return [2, e.sent()]
          }
        }))
      }))
    }

    function Vr(e, t, n) {
      return k(this, void 0, void 0, (function () {
        var r;
        return A(this, (function (i) {
          switch (i.label) {
            case 0:
              return [4, crypto.subtle.importKey("jwk", e, {
                name: "ECDSA",
                namedCurve: "P-256"
              }, !1, ["verify"])];
            case 1:
              return r = i.sent(), [4, crypto.subtle.verify({
                name: "ECDSA",
                hash: {
                  name: "SHA-256"
                }
              }, r, n, t)];
            case 2:
              return [2, i.sent()]
          }
        }))
      }))
    }

    function Gr(e, t) {
      return k(this, void 0, void 0, (function () {
        var n, r, i, o, a, s, c, u, l, f, d, h, p, v, w, m;
        return A(this, (function (b) {
          switch (b.label) {
            case 0:
              return n = e.split("."), r = x(n, 3), i = r[0], o = r[1], a =
                r[2], s = JSON.parse(pe.decode(i)), c = JSON.parse(pe.decodeUnicode(
                  o)), u = ge(pe.decode(a)), l = ge("".concat(i, ".").concat(
                    o)), [4, Hr()];
            case 1:
              if (f = b.sent(), !(d = f.keys.find((function (e) {
                return e.kid === s.kid
              })))) return [3, 6];
              if (delete d.alg, "ES256" !== s.alg) throw Ce(Y,
                'Invalid "alg" value in ID_TOKEN');
              h = void 0, b.label = 2;
            case 2:
              return b.trys.push([2, 4, , 5]), [4, Vr(d, l, u)];
            case 3:
              return h = b.sent(), [3, 5];
            case 4:
              throw p = b.sent(), Ce(Y, "".concat(
                "Failed to use Crypto API to verify ID_TOKEN", ": ").concat(
                  p));
            case 5:
              if (h) {
                if (v = c.iss !== "https://access.".concat("line.me"), w = c
                  .aud !== t, m = 1e3 * c.exp < Date.now(), v) throw Ce(Y,
                    'Invalid "iss" value in ID_TOKEN');
                if (w) throw Ce(Y, 'Invalid "aud" value in ID_TOKEN');
                if (m) throw Ce(Y, 'Invalid "exp" value in ID_TOKEN');
                return [2, c]
              }
              throw Ce(Y, "Invalid signature in ID_TOKEN");
            case 6:
              throw Ce(Y, 'Invalid "kid" value in ID_TOKEN');
            case 7:
              return [2]
          }
        }))
      }))
    }

    function Kr(e) {
      var t = e.split(".");
      if (t[1]) try {
        var n = t[1].replace(/-/g, "+").replace(/_/g, "/");
        return JSON.parse(window.atob(n))
      } catch (r) {
        return null
      }
      return null
    }

    function Jr(e) {
      var t = e.pathname,
        n = e.query,
        r = n ? "?".concat(Ae(n)) : "",
        i = "".concat("liff://").concat(t).concat(r);
      location.href = i
    }
    var qr = null;

    function zr() {
      "boolean" == typeof qr && R.warn(
        "liff.init is not expected to be called more than once"), qr = !!
        Boolean(ze(oe.IS_SUBSEQUENT_LIFF_APP)) || !(!Je() || ke(window.location
          .hash).feature_token || ot()) && (function (e) {
            $e(oe.IS_SUBSEQUENT_LIFF_APP, e)
          }(!0), !0)
    }

    function $r() {
      return Boolean(qr)
    }

    function Xr(e, t) {
      return k(this, void 0, void 0, (function () {
        var n;
        return A(this, (function (r) {
          switch (r.label) {
            case 0:
              return (n = nt()) ? [2, n] : e && t ? [4, gr({
                msit: e,
                mstVerifier: t
              })] : [3, 2];
            case 1:
              return [2, r.sent().mst];
            case 2:
              return [2, null]
          }
        }))
      }))
    }

    function Qr(e) {
      return nn("".concat(sn("apps"), "/").concat(e, "/featureToken"))
    }

    function Yr(e) {
      return k(this, void 0, void 0, (function () {
        var t, n, r, i;
        return A(this, (function (o) {
          switch (o.label) {
            case 0:
              return t = ke(window.location.hash), n = function (e) {
                for (var t, n, r = [], i = 1; i < arguments.length; i++) r[
                  i - 1] = arguments[i];
                var o = function (t) {
                  Object.keys(t).filter((function (e) {
                    return null !== t[e] && void 0 !== t[e]
                  })).forEach((function (n) {
                    e[n] = t[n]
                  }))
                };
                try {
                  for (var a = L(r), s = a.next(); !s.done; s = a.next()) o(
                    s.value)
                } catch (V) {
                  t = {
                    error: V
                  }
                } finally {
                  try {
                    s && !s.done && (n = a.return) && n.call(a)
                  } finally {
                    if (t) throw t.error
                  }
                }
                return e
              }({
                access_token: ut(),
                context_token: ze(oe.RAW_CONTEXT),
                feature_token: ot(),
                id_token: st(),
                client_id: ze(oe.CLIENT_ID),
                mst_challenge: rt(),
                mst_verifier: ze(oe.MST_VERIFIER),
                msit: ze(oe.MSIT)
              }, t), $r() ? bt() ? [4, Qr(e)] : [3, 2] : [3, 3];
            case 1:
              r = o.sent().featureToken, n.feature_token || (n.feature_token =
                r), o.label = 2;
            case 2:
              (i = Pe(e)) && (n.client_id = i), o.label = 3;
            case 3:
              return [2, n]
          }
        }))
      }))
    }

    function Zr(e) {
      if (e.persisted && jt("multipleLiffTransition"))
        if ("ios" === Pt()) window.location.reload();
        else {
          var t = qe().liffId,
            n = ot();
          if (!t) throw Ce($, "Invalid LIFF ID.");
          if (!n) throw Ce(X, "Invalid featureToken for client features");
          Jr({
            pathname: "app/".concat(t),
            query: {
              feature_token: n
            }
          })
        }
    }

    function ei(e) {
      return k(this, void 0, void 0, (function () {
        var t, n, r, i, o, a, s, c, u, l, f, d, h, p, v, w, m, b, g;
        return A(this, (function (y) {
          switch (y.label) {
            case 0:
              return [4, new Promise((function (e) {
                var t = Et();
                if (!t || ve(t, "9.5.0") < 0) e();
                else if (window._liff && window._liff.features) e();
                else {
                  R.debug(
                    "cannot find window._liff.features, listen to ready event"
                  );
                  var n = function () {
                    R.debug("ready event is fired"), Pn("ready", n), e()
                  };
                  Cn("ready", n)
                }
              }))];
            case 1:
              return y.sent(), zr(), [4, Yr(e.liffId)];
            case 2:
              if (t = y.sent(), n = t.access_token, r = t.context_token, i =
                t.feature_token, o = t.id_token, a = t.client_id, s = t.mst_verifier,
                c = t.mst_challenge, u = t.msit, r) {
                if ("string" != typeof r) throw Ce($,
                  "Cannot get context token, perhaps there is an incorrect parameter in permanent link"
                );
                Qe(Kr(r))
              }
              if (void 0 !== (null === (b = Xe()) || void 0 === b ? void 0 :
                b.liffId) && (null === (g = Xe()) || void 0 === g ? void 0 :
                  g.liffId) !== e.liffId) throw Ce($, "Invalid LIFF ID");
              return !Tt() && i && (function (e, t) {
                jt("multipleLiffTransition") && Jr({
                  pathname: "app/".concat(e),
                  query: {
                    feature_token: t
                  }
                })
              }(e.liffId, i), $r() && at(i)), c && function (e) {
                $e(oe.MST_CHALLENGE, e)
              }(c), s && function (e) {
                $e(oe.MST_VERIFIER, e)
              }(s), a && it(a), u && function (e) {
                $e(oe.MSIT, e)
              }(u), window.addEventListener("pageshow", Zr), bt() || i &&
                n ? [3, 5] : $r() ? (l = Ne(location.href, {
                  "liff.hback": "2"
                }), Or({
                  redirectUri: l
                }), [4, new Promise((function () { }))]) : [3, 4];
            case 3:
              y.sent(), y.label = 4;
            case 4:
              throw Or(), Ce($,
                "Failed to parse feature_token or access_token");
            case 5:
              return n && i ? [4, cn(n)] : [3, 7];
            case 6:
              if (f = y.sent(), d = f.client_id, h = f.expires_in, p = Pe(e
                .liffId), d !== p) throw Or(), Ce($,
                  "Failed to verify access_token");
              at(i), pt(new Date(Date.now() + 1e3 * h)), lt(n), y.label = 7;
            case 7:
              return [4, Xr(u, s)];
            case 8:
              return (v = y.sent()) ? (function (e) {
                $e(oe.MST, e)
              }(v), [4, yr({
                mst: v
              })]) : [3, 10];
            case 9:
              (w = y.sent().data) && tt(JSON.stringify(w)), y.label = 10;
            case 10:
              return o && !st() && ct(o), o && a && !vt() ? [4, Gr(o, a)] : [
                3, 12
              ];
            case 11:
              (m = y.sent()) && wt(m), y.label = 12;
            case 12:
              return [2]
          }
        }))
      }))
    }

    function ti(e) {
      return k(this, void 0, void 0, (function () {
        var t, n, r, i, o, a, s;
        return A(this, (function (c) {
          switch (c.label) {
            case 0:
              return t = sn("apps"), n = "".concat(t, "/").concat(e,
                "/contextToken"), r = ut(), i = {
                  "Content-Type": "application/json",
                  Accept: "application/json"
                }, r && (i.Authorization = "Bearer ".concat(r)), [4, nn(n, {
                  headers: i
                })];
            case 1:
              if (o = c.sent(), !(a = o.contextToken)) throw Ce($,
                "Can not get context from server.");
              if (!(s = Kr(a))) throw Ce($, "Invalid context token.");
              return [2, s]
          }
        }))
      }))
    }

    function ni() {
      return k(this, void 0, void 0, (function () {
        var e;
        return A(this, (function (t) {
          switch (t.label) {
            case 0:
              if (!(e = qe().liffId)) throw Ce($, "Invalid LIFF ID.");
              return [4, ti(e)];
            case 1:
              return Qe(t.sent()), [2]
          }
        }))
      }))
    }

    function ri(e) {
      return k(this, void 0, void 0, (function () {
        var t, n, r, i = this;
        return A(this, (function (o) {
          switch (o.label) {
            case 0:
              t = function () {
                return k(i, void 0, void 0, (function () {
                  var t, n, r, i, o, a;
                  return A(this, (function (s) {
                    switch (s.label) {
                      case 0:
                        return [4, (c = qe(), u = ke(window.location.search),
                          l = dt(), f = {
                            grant_type: "authorization_code",
                            client_id: u.liffClientId,
                            appId: c.liffId,
                            code: u.code,
                            code_verifier: l.codeVerifier,
                            redirect_uri: c.redirectUri || u.liffRedirectUri,
                            id_token_key_type: "JWK"
                          }, d = Ae(f), nn(sn("token"), {
                            method: "POST",
                            headers: {
                              "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8"
                            },
                            body: d
                          }))];
                      case 1:
                        return t = s.sent(), n = t.access_token, r = t.id_token,
                          i = t.expires_in, it(e), lt(n), pt(new Date(Date
                            .now() + 1e3 * i)), ht(), r ? (ct(r), [4, Gr(r,
                              e)]) : [3, 3];
                      case 2:
                        (o = s.sent()) && wt(o), s.label = 3;
                      case 3:
                        return (a = ke(location.hash).context_token) ? (
                          Qe(Kr(a)), [3, 6]) : [3, 4];
                      case 4:
                        return [4, ni()];
                      case 5:
                        s.sent(), s.label = 6;
                      case 6:
                        return [2]
                    }
                    var c, u, l, f, d
                  }))
                }))
              }, o.label = 1;
            case 1:
              return o.trys.push([1, 3, , 4]), [4, t()];
            case 2:
              return o.sent(), [3, 4];
            case 3:
              throw n = o.sent(), r = n, ht(), r;
            case 4:
              return [2]
          }
        }))
      }))
    }

    function ii() {
      return k(this, void 0, void 0, (function () {
        var e, t, n, r, i, o, a = this;
        return A(this, (function (s) {
          switch (s.label) {
            case 0:
              return (t = $n()) ? [3, 2] : [4, zn(vn)];
            case 1:
              t = s.sent(), s.label = 2;
            case 2:
              return (e = t).isReady() ? (n = xe(8), [4, e.getData(
                "appData")]) : [3, 8];
            case 3:
              return r = s.sent(), i = r.eventName, o = r.data, i !== fn.NOT_FOUND ? [
                3, 6
              ] : [4, e.teardown()];
            case 4:
              return s.sent(), [4, ii()];
            case 5:
              return [2, s.sent()];
            case 6:
              o && tt(JSON.stringify(o)), s.label = 7;
            case 7:
              return e.listen((function (t) {
                return k(a, void 0, void 0, (function () {
                  var r, i;
                  return A(this, (function (o) {
                    return r = t.context, i = r.data, r.eventName ===
                      ue.INIT && (null == i ? void 0 : i.subWindowId) !==
                      n && kn(), r.eventName !== ue.CANCEL && r.eventName !==
                      ue.SUBMIT || e.teardown(), [2]
                  }))
                }))
              })), bt() && e.send({
                eventName: ue.INIT,
                data: {
                  subWindowId: n,
                  hasOpener: !!window.opener
                }
              }), [3, 10];
            case 8:
              return Yn() ? [3, 10] : [4, new Promise((function (e) {
                window.addEventListener("message", function (e) {
                  return function t(n) {
                    var r = n.data,
                      i = n.source,
                      o = n.origin;
                    if (r) {
                      var a = r.type,
                        s = r.message;
                      a === fe && (window.removeEventListener("message",
                        t), s && tt(s), function (e) {
                          Qn.setItem("mainWindowOrigin", e)
                        }(o), i && i.postMessage && i.postMessage({
                          status: fe
                        }, o), e())
                    }
                  }
                }(e))
              }))];
            case 9:
              return [2, s.sent()];
            case 10:
              return [2]
          }
        }))
      }))
    }
    var oi = new (function () {
      function e() {
        var e = this;
        this.getAndValidateContext = function () {
          var e = Xe();
          if (!e) throw Ce($, "Could not get Context from server.");
          if (!e.endpointUrl) throw Ce($,
            "Could not get endpointUrl from server.");
          if (!e.permanentLinkPattern) throw Ce($,
            "Could not get permanentLinkPattern from server.");
          return e
        }, this.decodeState = function (t) {
          var n = e.getAndValidateContext();
          t = t.replace(/\n/g, "%0D%0A");
          var r = e.hasTrailingSlash(n.endpointUrl) || e.hasTrailingSlash(t),
            i = new URL(n.endpointUrl),
            o = i.origin,
            a = i.pathname,
            s = i.search,
            c = new URL("".concat(o).concat(e.attachSlashAtStart(t))),
            u = c.pathname,
            l = c.search,
            f = c.hash,
            d = "".concat(s).concat(s ? l.replace(/\?/g, "&") : l),
            h = "".concat(a).concat(e.attachSlashAtStart(u)).replace("//",
              "/");
          return (h = e.attachSlashAtStart("".concat(h))).endsWith("/") && !
            r && (h = h.substring(0, h.length - 1)), "".concat(o).concat(h).concat(
              d).concat(f).replace(/%0D%0A/g, "\n")
        }
      }
      return e.prototype.attachSlashAtStart = function (e) {
        return "".concat(e && e.length > 0 && !e.startsWith("/") ? "/" : "")
          .concat(e)
      }, e.prototype.hasTrailingSlash = function (e) {
        var t, n = e.indexOf("?"),
          r = e.indexOf("#");
        return (t = -1 === n && -1 === r ? e.length : -1 === n ? r : -1 ===
          r ? n : Math.min(n, r)) > 0 && "/" === e[t - 1]
      }, e.prototype.invoke = function () {
        return k(this, void 0, void 0, (function () {
          var e, t, n, r, i;
          return A(this, (function (o) {
            switch (o.label) {
              case 0:
                if (e = ke(window.location.search), "string" != typeof (t =
                  e["liff.state"])) return [2];
                o.label = 1;
              case 1:
                return o.trys.push([1, 4, , 5]), n = location.href, (r =
                  this.decodeState(t)) === n ? [3, 3] : (e["liff.hback"] ?
                    location.replace(Ne(r, {
                      "liff.hback": e["liff.hback"]
                    })) : location.replace(r), [4, new Promise((function () { }))]
                );
              case 2:
                o.sent(), o.label = 3;
              case 3:
                return [3, 5];
              case 4:
                if ((i = o.sent()).code === $) throw i;
                return R.debug(i), [3, 5];
              case 5:
                return [2]
            }
          }))
        }))
      }, e
    }());

    function ai(e, t) {
      return k(this, void 0, void 0, (function () {
        var n, r;
        return A(this, (function (i) {
          switch (i.label) {
            case 0:
              if (!e.liffId) throw Ce(Q,
                "liffId is necessary for liff.init()");
              return function (e) {
                window.__liffConfig = e
              }(e), !Je() && bt() && (function () {
                var e = qe();
                return ye("".concat(ne, ":").concat(oe.EXPIRES, ":").concat(
                  e.liffId))
              }() || Ht()), n = ke(window.location.search), !Tt() || Je() ? [
                3, 2
              ] : [4, ii()];
            case 1:
              i.sent(), i.label = 2;
            case 2:
              if (n.error && n.liffOAuth2Error) throw s = n.error, c = n.error_description
                .replace(/\+/g, " "), u = "".concat(s, ": ").concat(c), Ce($,
                  u);
              return o = n.code, a = dt(), Boolean(o && !bt() && a && a.codeVerifier) ? [
                4, ri(n.liffClientId)
              ] : [3, 4];
            case 3:
              i.sent(), i.label = 4;
            case 4:
              return Je() ? [4, ei(e)] : [3, 6];
            case 5:
              return i.sent(), [3, 8];
            case 6:
              return bt() ? [3, 8] : [4, ni()];
            case 7:
              i.sent(), i.label = 8;
            case 8:
              return [4, oi.invoke()];
            case 9:
              if (i.sent(), r = Xe()) try {
                Qt(location.href, r.endpointUrl)
              } catch (Ee) {
                R.warn(
                  "liff.init() was called with a current URL that is not related to the endpoint URL.\n"
                    .concat(location.href, " is not under ").concat(r.endpointUrl)
                )
              }
              return [4, t()];
            case 10:
              return i.sent(),
                function (e) {
                  var t = Fe(e);
                  if (t !== e) {
                    var n = je(t);
                    window.history.replaceState(history.state, "", n)
                  }
                }(window.location.href), [2]
          }
          var o, a, s, c, u
        }))
      }))
    }
    var si = function (e, t) {
      return new Promise((function (n, r) {
        if (e) {
          var i = document.createElement("script");
          i.type = "module", i.onload = function () {
            n()
          }, i.src = e, document.head.appendChild(i)
        } else r(Ce(Q, t))
      }))
    },
      ci = function (e) {
        var t =
          "https://static.line-scdn.net/lui/edge/versions/1.13.0/lui-alert.js";
        return t && e && (t = t.replace(/\d{1,2}\.\d{1,2}\.\d{1,3}/, e)), si(t,
          "LUI_ALERT_URL is not defined")
      },
      ui = function () {
        return k(void 0, void 0, void 0, (function () {
          var e;
          return A(this, (function (t) {
            switch (t.label) {
              case 0:
                return e = function () {
                  var e, t = document.querySelector(
                    'script[src*="luivendor.js"]');
                  if (t && (null === (e = t.src.match(
                    /\d{1,2}\.\d{1,2}\.\d{1,3}/g)) || void 0 === e ? void 0 :
                    e.length)) return t.src.match(
                      /\d{1,2}\.\d{1,2}\.\d{1,3}/g)[0]
                }(), e ? [3, 2] : [4, si(
                  "https://static.line-scdn.net/lui/edge/versions/1.13.0/luivendor.js",
                  "LUI_VENDOR_URL is not defined")];
              case 1:
                t.sent(), t.label = 2;
              case 2:
                return [4, ci(e)];
              case 3:
                return t.sent(), [4, (n = xe(6), new Promise((function () {
                  var e = document.createElement("div");
                  e.innerHTML = '<lui-alert id="'.concat("liffAlert",
                    "-").concat(n, '" shown title="').concat(Fr(
                      "alert.android.extBrowser.autoLoginWorkaround.title"
                    ), '" message="').concat(Fr(
                      "alert.android.extBrowser.autoLoginWorkaround.desc"
                    ), '" button="').concat(Fr(
                      "alert.android.extBrowser.autoLoginWorkaround.button.text"
                    ), '"></lui-alert>'), document.body.appendChild(e);
                  var t = document.getElementById("".concat("liffAlert",
                    "-").concat(n));
                  t && t.addEventListener("lui-button-click", (function () {
                    var e = window.open(Ne(window.location.href, {
                      liffIsEscapedFromApp: "true"
                    }), "_blank");
                    e && (e.location.href = Ne(window.location.href, {
                      liffIsEscapedFromApp: "true"
                    }), window.close())
                  }))
                })))];
              case 4:
                return t.sent(), [2]
            }
            var n
          }))
        }))
      },
      li = function (e) {
        try {
          return new URL(e).searchParams.get("lineAppVersion")
        } catch (t) {
          return null
        }
      };

    function fi() {
      return k(this, void 0, void 0, (function () {
        var e, t, n;
        return A(this, (function (r) {
          switch (r.label) {
            case 0:
              return (e = null !== (n = li(window.location.href)) && void 0 !==
                n ? n : li(window.document.referrer)) && ve(e, "13.10.0") >=
                0 || Je() || "android" !== Pt() || (t = ke(window.location.search))[
                un] || t.liffIsEscapedFromApp ? [2] : t.liffClientId &&
                  document.referrer.includes("access.".concat("line.me")) ? (
                window.location.href = Ne(window.location.href, {
                  liffIsEscapedFromApp: "true"
                }), [2]) : t.liffClientId && document.referrer.includes(
                  "android-app://") ? [4, ui()] : [3, 2];
            case 1:
              r.sent(), r.label = 2;
            case 2:
              return t.liffClientId && "" === document.referrer && 1 ===
                window.history.length ? [4, ui()] : [3, 4];
            case 3:
              r.sent(), r.label = 4;
            case 4:
              return !document.referrer.includes("liffClientId") ||
                document.referrer.includes("liffIsEscapedFromApp") ? [3, 6] : [
                4, ui()
              ];
            case 5:
              r.sent(), r.label = 6;
            case 6:
              return [2]
          }
        }))
      }))
    }
    var di = function (e) {
      function t() {
        var t = e.apply(this, F([], x(arguments), !1)) || this;
        return t.hooks = {
          before: new Pr,
          after: new Pr
        }, t.internalHooks = {
          beforeFinished: new Pr,
          beforeSuccess: new Pr,
          error: new Pr
        }, t
      }
      return O(t, e), Object.defineProperty(t.prototype, "name", {
        get: function () {
          return "init"
        },
        enumerable: !1,
        configurable: !0
      }), t.prototype.install = function (e) {
        var t = e.liff;
        return this.liffForWindow = t, this.init.bind(this)
      }, t.prototype.init = function (e, t, n) {
        return k(this, void 0, void 0, (function () {
          var r;
          return A(this, (function (i) {
            switch (i.label) {
              case 0:
                return [4, this.hooks.before.call()];
              case 1:
                i.sent(), o = this.liffForWindow, window && !window.liff &&
                  (window.liff = o), i.label = 2;
              case 2:
                return i.trys.push([2, 9, , 11]), [4, Promise.all([Wr(this
                  .liffForWindow), ai(e, this.internalHooks.beforeFinished
                    .call)])];
              case 3:
                return i.sent(),
                  function () {
                    var e;
                    Br("color-scheme", ((null == (e = Xe()) ? void 0 : e.menuColorSetting) || {
                      adaptableColorSchemes: ["light"]
                    }).adaptableColorSchemes.join(" "));
                    var t = window.matchMedia("(prefers-color-scheme: dark)");
                    Rr({
                      matches: null == t ? void 0 : t.matches,
                      media: null == t ? void 0 : t.media
                    }), t.addEventListener ? t.addEventListener("change",
                      Rr) : t.addListener && t.addListener(Rr)
                  }(), [4, this.internalHooks.beforeSuccess.call()];
              case 4:
                return i.sent(), !e.withLoginOnExternalBrowser || bt() ? [
                  3, 6
                ] : (Or(), [4, new Promise((function () { }))]);
              case 5:
                i.sent(), i.label = 6;
              case 6:
                return [4, fi()];
              case 7:
                return i.sent(), [4, this.hooks.after.call()];
              case 8:
                return i.sent(), "function" == typeof t && t(), N(), [3,
                  11
                ];
              case 9:
                return r = i.sent(), [4, this.internalHooks.error.call(r)];
              case 10:
                throw i.sent(), "function" == typeof n && n(r), r;
              case 11:
                return [2]
            }
            var o
          }))
        }))
      }, t
    }(H);

    function hi() {
      return {
        liffApp: "https://liff.".concat("line.me"),
        liffServer: "https://api.".concat("line.me"),
        miniApp: "https://miniapp.".concat("line.me")
      }
    } ! function (e) {
      function t() {
        return null !== e && e.apply(this, arguments) || this
      }
      O(t, e), Object.defineProperty(t.prototype, "name", {
        get: function () {
          return "getOrigins"
        },
        enumerable: !1,
        configurable: !0
      }), t.prototype.install = function () {
        return function () {
          return hi()
        }
      }
    }(H);

    function pi() {
      return navigator.language
    } ! function (e) {
      function t() {
        return null !== e && e.apply(this, arguments) || this
      }
      O(t, e), Object.defineProperty(t.prototype, "name", {
        get: function () {
          return "getLanguage"
        },
        enumerable: !1,
        configurable: !0
      }), t.prototype.install = function () {
        return function () {
          return pi()
        }
      }
    }(H);

    function vi() {
      var e = Et();
      if (!e || !Je() || "ios" !== Pt()) return navigator.language;
      if (ve(e, "14.11.0") >= 0) {
        var t = window.prompt("LIFF:GET_APP_LANGUAGE");
        if (t) return t
      }
      return navigator.language
    } ! function (e) {
      function t() {
        return null !== e && e.apply(this, arguments) || this
      }
      O(t, e), Object.defineProperty(t.prototype, "name", {
        get: function () {
          return "getAppLanguage"
        },
        enumerable: !1,
        configurable: !0
      }), t.prototype.install = function () {
        return function () {
          return vi()
        }
      }
    }(H);

    function wi(e) {
      return k(this, void 0, void 0, (function () {
        var t, n, r, i, o, a, s;
        return A(this, (function (c) {
          switch (c.label) {
            case 0:
              return function (e) {
                if (!de.includes(e)) throw Ce(z,
                  "Unexpected permission name.");
                var t = Xe();
                return !!(null == t ? void 0 : t.scope.includes(e))
              }(e) ? (t = ut()) ? [4, cn(t)] : [3, 2] : [2, {
                state: "unavailable"
              }];
            case 1:
              n = c.sent(), r = unescape(n.scope).split(" ");
              try {
                for (i = L(r), o = i.next(); !o.done; o = i.next())
                  if (o.value.includes(e)) return [2, {
                    state: "granted"
                  }]
              } catch (u) {
                a = {
                  error: u
                }
              } finally {
                try {
                  o && !o.done && (s = i.return) && s.call(i)
                } finally {
                  if (a) throw a.error
                }
              }
              return [2, {
                state: "prompt"
              }];
            case 2:
              throw Ce(q,
                "Need access_token for api call, Please login first")
          }
        }))
      }))
    }

    function mi() {
      var e, t, n = Xe();
      return !!n && "square_chat" !== n.type && (jt(
        "skipChannelVerificationScreen") || !Je() && (null === (t = null ===
          (e = n.availability) || void 0 === e ? void 0 : e.skipChannelVerificationScreen
        ) || void 0 === t ? void 0 : t.permission))
    }

    function bi() {
      var e = qe().liffId;
      if (e) return nn("".concat(sn("unauthorizedPermissions"), "?liffId=").concat(
        e), {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: "Bearer ".concat(ut())
        }
      });
      throw Ce(q, "liffId is required")
    }
    var gi, yi = Sr.on,
      Ii = Sr.off,
      Si = Sr.open,
      Ti = function () {
        function e(e, t) {
          var n = this;
          this.onSubmit = function (e) {
            return k(n, [e], void 0, (function (e) {
              var t = e.newAccessToken,
                n = e.ICA_ERROR;
              return A(this, (function (e) {
                return t ? this.resolve({
                  newAccessToken: t
                }) : n && this.reject(Ce(J, n)), this.teardown(), [2]
              }))
            }))
          }, this.onClose = function () {
            return k(n, void 0, void 0, (function () {
              return A(this, (function (e) {
                return this.reject(Ce(q, "user didn't allow the agreement")),
                  this.teardown(), [2]
              }))
            }))
          }, this.onCancel = function () {
            return k(n, void 0, void 0, (function () {
              return A(this, (function (e) {
                return this.reject(Ce(q, "user didn't allow the agreement")),
                  this.teardown(), [2]
              }))
            }))
          }, this.onError = function (e) {
            return k(n, void 0, void 0, (function () {
              return A(this, (function (t) {
                return this.reject(e), this.teardown(), [2]
              }))
            }))
          }, this.resolve = e, this.reject = t, this.setup()
        }
        return e.prototype.setup = function () {
          yi("submit", this.onSubmit), yi("close", this.onClose), yi("cancel",
            this.onCancel), yi("error", this.onError)
        }, e.prototype.teardown = function () {
          Ii("submit", this.onSubmit), Ii("close", this.onClose), Ii("cancel",
            this.onCancel), Ii("error", this.onError), gi = void 0
        }, e.prototype.open = function (e) {
          var t = qe().liffId;
          t ? Si({
            url: "".concat("https://liff.line.me/1656032314-Xgrw5Pmk"),
            appData: {
              liffId: t,
              channelId: Pe(t),
              accessToken: ut()
            },
            onBeforeTransition: e
          }).catch(this.reject) : this.reject(Ce(q, "liffId is required"))
        }, e
      }();

    function Ei() {
      return k(this, void 0, void 0, (function () {
        var e, t = this;
        return A(this, (function (n) {
          switch (n.label) {
            case 0:
              if (!mi()) throw Ce(X,
                "SkipChannelVerificationScreen is unavailable.");
              return gi && gi.teardown(), e = function () {
                return k(t, void 0, void 0, (function () {
                  var e;
                  return A(this, (function (t) {
                    switch (t.label) {
                      case 0:
                        return [4, bi()];
                      case 1:
                        if (e = t.sent(), (Je() ? e : e.filter((function (
                          e) {
                          return "chat_message.write" !== e
                        }))).length <= 0) throw Ce(X,
                          "All permissions have already been approved.");
                        return [2]
                    }
                  }))
                }))
              }, [4, new Promise((function (t, n) {
                (gi = new Ti(t, n)).open(e)
              }))];
            case 1:
              return lt(n.sent().newAccessToken), [2]
          }
        }))
      }))
    }

    function Ci() {
      return k(this, void 0, void 0, (function () {
        var e, t;
        return A(this, (function (n) {
          switch (n.label) {
            case 0:
              if (!(e = ut())) throw Ce(q,
                "Need access_token for api call, Please login first");
              return [4, cn(e)];
            case 1:
              return t = n.sent(), [2, decodeURIComponent(t.scope).split(
                " ").filter((function (e) {
                  return "" !== e
                }))]
          }
        }))
      }))
    }

    function Pi(e, t) {
      var n = this;
      return function () {
        for (var r = [], i = 0; i < arguments.length; i++) r[i] = arguments[i];
        return k(n, void 0, void 0, (function () {
          var n, i, o;
          return A(this, (function (a) {
            switch (a.label) {
              case 0:
                return n = (r.length > 0 ? r[r.length - 1] : {}).ignorePermissionCheck,
                  i = void 0 !== n && n, [4, wi(t)];
              case 1:
                if ("unavailable" !== (o = a.sent().state)) return [3, 2];
                throw Ce(X, "The permission is not in LIFF app scope.");
              case 2:
                return "prompt" !== o || !mi() || i || !Je() &&
                  "chat_message.write" === t ? [3, 4] : [4, Ei()];
              case 3:
                return a.sent(), [3, 5];
              case 4:
                i && r.pop(), a.label = 5;
              case 5:
                return [4, e.apply(void 0, F([], x(r), !1))];
              case 6:
                return [2, a.sent()]
            }
          }))
        }))
      }
    }
    var Oi = new (function (e) {
      function t() {
        return null !== e && e.apply(this, arguments) || this
      }
      return O(t, e), Object.defineProperty(t.prototype, "name", {
        get: function () {
          return "permission"
        },
        enumerable: !1,
        configurable: !0
      }), t.prototype.install = function () {
        return {
          query: wi,
          requestAll: Ei,
          getGrantedAll: Ci
        }
      }, t
    }(H));

    function _i() {
      return nn(sn("profile"))
    } ! function (e) {
      function t() {
        return null !== e && e.apply(this, arguments) || this
      }
      O(t, e), Object.defineProperty(t.prototype, "name", {
        get: function () {
          return "getProfile"
        },
        enumerable: !1,
        configurable: !0
      }), t.prototype.install = function () {
        return Pi(_i, "profile")
      }
    }(H);

    function ki(e) {
      if (! function (e) {
        if (!e || "object" != typeof e) return !1;
        var t = e,
          n = t.url,
          r = x([typeof n, typeof t.external], 2),
          i = r[0],
          o = r[1];
        return "string" === i && "" !== n && ("undefined" === o || "boolean" ===
          o)
      }(e)) throw Ce(z, "Invalid parameters for liff.openWindow()");
      var t = Et();
      if (Je())
        if (null !== t && "ios" === Pt() && ve(t, "9.19") >= 0 || !window._liff
          .postMessage) {
          var n = e.url,
            r = e.external,
            i = void 0 !== r && r;
          window.open(function (e, t) {
            var n, r, i, o, a, s, c, u, l;
            (function (e) {
              return -1 !== e.indexOf("#") && -1 !== e.indexOf("?") && e.indexOf(
                "#") < e.indexOf("?")
            })(e) || function (e) {
              return -1 === e.indexOf("?") && -1 !== e.indexOf("#")
            }(e) ? (c = (n = x(e.split("#"), 2))[0], u = (i = x((void 0 === (r =
              n[1]) ? "" : r).split("?"), 2))[0], l = i[1]) : (c = (o = x(e.split(
                "?"), 2))[0], l = (s = x((void 0 === (a = o[1]) ? "" : a).split(
                  "#"), 2))[0], u = s[1]);
            var f = function (e, t) {
              return e ? "&".concat(e.split("&").filter((function (e) {
                return -1 === e.indexOf("is_liff_external_open_window")
              })).join("&").concat("".concat(t ? "#".concat(t) : ""))) : "".concat(
                t ? "#".concat(t) : "")
            }(l, u);
            return "".concat(c, "?").concat("is_liff_external_open_window",
              "=").concat(!!t).concat(f)
          }(n, i))
        } else _n("openWindow", e);
      else window.open(e.url, "_blank")
    } ! function (e) {
      function t() {
        return null !== e && e.apply(this, arguments) || this
      }
      O(t, e), Object.defineProperty(t.prototype, "name", {
        get: function () {
          return "openWindow"
        },
        enumerable: !1,
        configurable: !0
      }), t.prototype.install = function () {
        return function (e) {
          return ki(e)
        }
      }
    }(H);
    var Ai = function (e) {
      return "object" == typeof e && null !== e && function (e) {
        return "string" == typeof e || e instanceof String
      }(e.type)
    };

    function Li(e) {
      return Promise.reject(Ce(z, e))
    }

    function xi(e) {
      if (! function (e) {
        return Array.isArray(e) && e.every(Ai)
      }(e)) return Li(
        "Parameter 'messages' must be an array of { type, ... }");
      var t = e.length;
      return t < 1 || t > 5 ? Li(
        "Number of messages should be in range 1 to ".concat(5, ".")) : nn(sn(
          "message"), {
          method: "POST",
          body: JSON.stringify({
            messages: e
          })
        }).catch(Fi)
    }
    var Fi = function (e) {
      if ("403" === e.code) {
        var t = "12.0.0" === Et(),
          n = "ios" === Pt(),
          r = We();
        t && (n || r) && window.alert(
          "LINEアプリをLINE 12.0.1以降にアップデートしてください。\nPlease update your LINE app to LINE 12.0.1 or later."
        )
      }
      throw e
    };
    ! function (e) {
      function t() {
        return null !== e && e.apply(this, arguments) || this
      }
      O(t, e), Object.defineProperty(t.prototype, "name", {
        get: function () {
          return "sendMessages"
        },
        enumerable: !1,
        configurable: !0
      }), t.prototype.install = function () {
        return Pi(xi, "chat_message.write")
      }
    }(H);

    function ji() {
      return nn(sn("friendship"))
    } ! function (e) {
      function t() {
        return null !== e && e.apply(this, arguments) || this
      }
      O(t, e), Object.defineProperty(t.prototype, "name", {
        get: function () {
          return "getFriendship"
        },
        enumerable: !1,
        configurable: !0
      }), t.prototype.install = function () {
        return Pi(ji, "profile")
      }
    }(H);

    function Ni() {
      return k(this, void 0, void 0, (function () {
        var e, t;
        return A(this, (function (n) {
          switch (n.label) {
            case 0:
              if (!bt()) return [3, 6];
              n.label = 1;
            case 1:
              return n.trys.push([1, 5, , 6]), (e = vt()) && e.sub ? [2, e.sub] : [
                3, 2
              ];
            case 2:
              return [4, _i()];
            case 3:
              if ((t = n.sent()) && t.userId) return [2, t.userId];
              n.label = 4;
            case 4:
              return [3, 6];
            case 5:
              return n.sent(), R.debug(
                "can't retrieve Mid/Uid because of something wrong"), [3, 6];
            case 6:
              return [2]
          }
        }))
      }))
    }

    function Ui() {
      return k(this, void 0, void 0, (function () {
        var e;
        return A(this, (function (t) {
          switch (t.label) {
            case 0:
              return [4, Ni()];
            case 1:
              return (e = t.sent()) && "u" === e.substring(0, 1) ? [2, e] : [
                2
              ]
          }
        }))
      }))
    }
    var Ri, Di = function (e) {
      function t() {
        var t = e.apply(this, F([], x(arguments), !1)) || this;
        return t.utsExtra = {
          isLiffSuccessful: !1,
          isLoggedIn: !1,
          id: "",
          version: ""
        }, t.injected = !1, t
      }
      return O(t, e), Object.defineProperty(t, "CUSTOMPLACEID_INIT", {
        get: function () {
          return "liff.init"
        },
        enumerable: !1,
        configurable: !0
      }), Object.defineProperty(t, "CUSTOMTYPE", {
        get: function () {
          return "liffSdk"
        },
        enumerable: !1,
        configurable: !0
      }), Object.defineProperty(t, "LiffUtsLoginStatus", {
        get: function () {
          return {
            isLoggedIn: 1,
            isLiffSuccessful: 2
          }
        },
        enumerable: !1,
        configurable: !0
      }), Object.defineProperty(t.prototype, "name", {
        get: function () {
          return "analytics"
        },
        enumerable: !1,
        configurable: !0
      }), t.prototype.install = function (e) {
        var t = e.liff,
          n = e.internalHooks;
        this.liffCore = t, n.init.beforeFinished(this.beforeInitFinished.bind(
          this)), n.init.beforeSuccess(this.beforeInitSuccess.bind(this)), n
            .init.error(this.initError.bind(this))
      }, t.prototype.createDeprecatedUtsProxy = function (e) {
        var t =
          "LIFF Analytics is deprecated and will be removed in a future version. Please migrate to alternative analytics solutions.";
        return new Proxy(e, {
          get: function (e, n) {
            var r = e[n];
            return "function" == typeof r ? function () {
              for (var i = [], o = 0; o < arguments.length; o++) i[o] =
                arguments[o];
              return R.warn("[LIFF Analytics] ".concat(t,
                " Called method: ").concat(String(n))), r.apply(e, i)
            } : r
          }
        })
      }, t.prototype.changeRatioToUTSFormat = function (e) {
        if (e && Number.isFinite(e)) return Math.round(100 * e)
      }, t.prototype.setExtra = function () {
        var e, n = this.utsExtra,
          r = n.isLiffSuccessful,
          i = n.isLoggedIn,
          o = n.id,
          a = n.version,
          s = (i ? t.LiffUtsLoginStatus.isLoggedIn : 0) | (r ? t.LiffUtsLoginStatus
            .isLiffSuccessful : 0);
        null === (e = this.uts) || void 0 === e || e.setExtra("liff", {
          id: o,
          loginStatus: s,
          version: a
        })
      }, t.prototype.assignUtsExtra = function (e) {
        Object.assign(this.utsExtra, e)
      }, t.prototype.setVersion = function (e) {
        this.assignUtsExtra({
          version: e
        }), R.debug("[LIFFUTS][SDK version] ".concat(e)), this.setExtra()
      }, t.prototype.setLiffId = function (e) {
        this.assignUtsExtra({
          id: e
        }), R.debug("[LIFFUTS][LIFFID] ".concat(e)), this.setExtra()
      }, t.prototype.setIsLoggedIn = function (e) {
        this.assignUtsExtra({
          isLoggedIn: e
        }), R.debug("[LIFFUTS][isLoggedIn] ".concat(e)), this.setExtra()
      }, t.prototype.sendLiffInit = function () {
        var e;
        R.debug("[LIFFUTS][sendCustom] liff.init"), null === (e = this.uts) ||
          void 0 === e || e.sendCustom({
            type: t.CUSTOMTYPE,
            params: {
              placeId: t.CUSTOMPLACEID_INIT
            }
          })
      }, t.prototype.setIsLiffSuccessful = function (e) {
        this.assignUtsExtra({
          isLiffSuccessful: e
        }), R.debug("[LIFFUTS][isLiffInitSuccessful] ".concat(e)), this.setExtra()
      }, t.prototype.prepareReferrer = function (e) {
        var t = {};
        Object.keys(e).forEach((function (n) {
          if (ce.includes(n)) {
            var r = e[n];
            "string" == typeof r && r && (t[n.replace(/^liff\.ref\./, "")] =
              r)
          }
        })), Object.keys(t).length > 0 && (this.referrer = t)
      }, t.prototype.beforeInitFinished = function () {
        return k(this, void 0, void 0, (function () {
          var e, t, n, r, i, o, a, s, c, u, l, f;
          return A(this, (function (d) {
            switch (d.label) {
              case 0:
                if (e = ke(window.location.search), this.prepareReferrer(e),
                  t = Xe(), !(n = null == t ? void 0 : t.utsTracking))
                  return [2];
                if (r = qe(), i = r.liffId, o = r.analytics, "auto" !== n.mode ||
                  !o) return [3, 6];
                R.warn(
                  "[LIFF Analytics] LIFF Analytics is deprecated and will be removed in a future version. Please migrate to alternative analytics solutions."
                ), R.debug("[LIFFUTS] ".concat((new Date).toUTCString())),
                  d.label = 1;
              case 1:
                return d.trys.push([1, 3, , 4]), a = this, [4, new Promise(
                  (function (e, t) {
                    var n = window.uts,
                      r = document.createElement("script");
                    r.type = "text/javascript", r.src =
                      "https://static.line-scdn.net/uts/edge/4.1.0/uts.js",
                      r.onload = function () {
                        var t = window.uts;
                        e(t), window.uts = n
                      }, r.onerror = function (e) {
                        t(e)
                      }, document.getElementsByTagName("head")[0].appendChild(
                        r)
                  }))];
              case 2:
                return a.uts = d.sent(), [3, 4];
              case 3:
                return s = d.sent(), R.debug(
                  "[LIFFUTS] cannot load UTS, reason: ".concat(s)), [2];
              case 4:
                return c = _(_({}, o.context), {
                  utsId: o.context.utsId,
                  appName: o.context.appName,
                  appEnv: o.context.appEnv || "release"
                }), u = _(_({
                  endpoint: "https://uts-front.line-apps.com"
                }, o.options), {
                  sampleRate: this.changeRatioToUTSFormat(n.sendRatio),
                  version: "current"
                }), this.uts.init(c, u), [4, Ui()];
              case 5:
                (l = d.sent()) && (R.debug("[LIFFUTS][mid] ".concat(l)),
                  this.uts.setMid(l)), (null == t ? void 0 : t.tid) && (R.debug(
                    "[LIFFUTS][tid] ".concat(t.tid)), this.uts.setTid(t.tid)),
                  this.referrer && (R.debug("liff.ref.referrer", this.referrer),
                    this.uts.setSessionParams(this.referrer)), i && this.setLiffId(
                      i), this.setIsLoggedIn(bt()), this.setVersion("2.27.3"),
                  f = Fe(location.href), R.debug("[LIFFUTS][url] ".concat(f)),
                  this.uts.setUrl(f), this.liffCore.analytics = this.createDeprecatedUtsProxy(
                    this.uts), this.injected = !0, d.label = 6;
              case 6:
                return [2]
            }
          }))
        }))
      }, t.prototype.beforeInitSuccess = function () {
        return this.injected && (this.setIsLiffSuccessful(!0), this.sendLiffInit()),
          Promise.resolve()
      }, t.prototype.initError = function () {
        return this.injected && (this.setIsLiffSuccessful(!1), this.sendLiffInit()),
          Promise.resolve()
      }, t
    }(H),
      Bi = function (e) {
        R.warn(
          "[LIFF Analytics] LIFF Analytics is deprecated and will be removed in a future version. Please migrate to alternative analytics solutions. Called function: sendShareTargetPicker"
        ), R.debug("[LIFFUTS][sendCustom] liff.shareTargetPicker"), e.sendCustom({
          type: "liffSdk",
          params: {
            placeId: "liff.shareTargetPicker"
          }
        })
      },
      Mi = function () {
        function e(e, t) {
          var n = this;
          this.resolve = e, this.reject = t, this.onSubmit = function (e) {
            var t = e.message;
            n.resolve({
              value: t
            }), n.destroy()
          }, this.onClose = function () {
            n.resolve({
              value: null
            }), n.destroy()
          }, this.onCancel = function () {
            n.resolve({
              value: null
            }), n.destroy()
          }, this.onError = function (e) {
            n.reject(e), n.destroy()
          }, this.start()
        }
        return e.prototype.start = function () {
          Sr.on("submit", this.onSubmit), Sr.on("close", this.onClose), Sr.on(
            "cancel", this.onCancel), Sr.on("error", this.onError)
        }, e.prototype.destroy = function () {
          Sr.off("submit", this.onSubmit), Sr.off("close", this.onClose), Sr.off(
            "cancel", this.onCancel), Sr.off("error", this.onError), Ri = void 0
        }, e
      }();

    function Wi() {
      return k(this, void 0, void 0, (function () {
        return A(this, (function (e) {
          return Ft.scanCodeV2(), Ri && Ri.destroy(), [2, new Promise((
            function (e, t) {
              Ri = new Mi(e, t), Sr.open({
                url: "https://liff.line.me/1656359117-jxmx5e11"
              }).catch((function (e) {
                null == Ri || Ri.destroy(), t(e)
              }))
            }))]
        }))
      }))
    }
    var Hi = new (function (e) {
      function t() {
        return null !== e && e.apply(this, arguments) || this
      }
      return O(t, e), Object.defineProperty(t.prototype, "name", {
        get: function () {
          return "scanCodeV2"
        },
        enumerable: !1,
        configurable: !0
      }), t.prototype.install = function () {
        return Wi
      }, t
    }(H)),
      Vi = {};

    function Gi(e, t) {
      var n = Vi,
        r = x(t.split("."), 1)[0],
        i = n[t];
      i && e.removeEventListener(r, i), n[t] = null
    }
    var Ki = !1,
      Ji = !1;

    function qi(e, t, n, r) {
      if (void 0 === n && (n = {}), "object" != typeof e || !e.postMessage)
        throw Ce(z, "target must be window object");
      if ("string" != typeof t) throw Ce(z, "keyname must be string");
      if ("object" != typeof n) throw Ce(z,
        "incorrect body format. It should be Object or Array comprised of Object"
      );
      if (!r) throw Ce(z,
        "serverEndPointUrl isn't passed. please fill up with proper url");
      if ("*" === r) throw new Error(
        "serverEndPointUrl doesn't allow to set '*'");
      var i = {
        name: t,
        body: n
      };
      e.postMessage(i, r)
    }

    function zi(e, t, n, r) {
      ! function (e, t, n, r) {
        Ki || (Ji = function () {
          var e = !1;
          try {
            var n = Object.defineProperty({}, "passive", {
              get: function () {
                return e = !0, !1
              }
            });
            window.addEventListener("test", n, n), window.removeEventListener(
              "test", n, n)
          } catch (t) {
            e = !1
          }
          return e
        }(), Ki = !0);
        var i = x(t.split("."), 1)[0];
        new Promise((function (o) {
          var a = function (i) {
            o(i), n && n(i), r && r.once && Gi(e, t)
          };
          ! function (e, t) {
            Vi[e] = t
          }(t, a), e.addEventListener(i, a, !!Ji && r)
        }))
      }(e, "message.".concat(t), function (e, t, n) {
        return function (r) {
          R.debug("messageReceive", r), r.origin === n && r.data.name === e &&
            t(r)
        }
      }(t, n, r))
    }
    var $i = function () {
      function e() {
        this.payloadToShareTargetPicker = null, this.popupWindow = null, this
          .doesWaitForSubwindowResult = !1
      }
      return e.getInstance = function () {
        return e.instance ? e.instance.reset() : e.instance = new e, e.instance
      }, e.prototype.init = function (e) {
        return k(this, void 0, void 0, (function () {
          var t, n;
          return A(this, (function (r) {
            switch (r.label) {
              case 0:
                return r.trys.push([0, 5, , 6]), this.liffId = e.referrer.liffId,
                  this.doesWaitForSubwindowResult = !(!e.options || !e.options
                    .waitForSubwindowResult), this.allowPostMessageOrigin =
                  this.initAllowPostMessageOrigin(), this.payloadToShareTargetPicker =
                  this.buildPayloadToShareTargetPicker(e), window.AbortController &&
                  (this.abortController = new window.AbortController), this
                    .prepareAnotherWindow(), [4, this.initOtt()];
              case 1:
                return r.sent(), this.initListener(), this.openAnotherWindow(),
                  this.doesWaitForSubwindowResult ? [4, this.pollingShareResult()] : [
                    3, 3
                  ];
              case 2:
                return t = r.sent(), this.finalize(), [2, t];
              case 3:
              case 6:
                return [2];
              case 4:
                return [3, 6];
              case 5:
                if (n = r.sent(), this.finalize(), "AbortError" !== n.name)
                  throw n;
                return [3, 6]
            }
          }))
        }))
      }, e.prototype.resetAllVariables = function () {
        this.liffId = "", this.allowPostMessageOrigin = "", this.payloadToShareTargetPicker =
          null, this.ott = "", this.popupWindow = null, this.timeoutIDForHealthCheck =
          null, this.abortController = null, this.internalError = null, this.doesWaitForSubwindowResult = !
          1
      }, e.prototype.reset = function () {
        this.finalize(), this.resetAllVariables()
      }, e.prototype.finalize = function () {
        var e, t;
        this.abortController && this.abortController.abort(), Je() || (e =
          this.timeoutIDForHealthCheck, t = this.popupWindow, Gi(window,
            "message.receivedHealthcheck"), e && clearTimeout(e), t && !t.closed &&
          t.close())
      }, e.prototype.buildPayloadToShareTargetPicker = function (e) {
        return {
          messages: e.messages,
          isMultiple: e.isMultiple,
          referrer: e.referrer
        }
      }, e.prototype.initAllowPostMessageOrigin = function (e) {
        return void 0 === e && (e = sn("shareTargetPicker")),
          function (e) {
            var t = e.match(/^(https?:\/\/.*?)\//);
            return t && t[1] || ""
          }(e)
      }, e.prototype.initOtt = function () {
        return k(this, void 0, void 0, (function () {
          var e, t, n;
          return A(this, (function (r) {
            switch (r.label) {
              case 0:
                return this.abortController && (e = this.abortController.signal),
                  t = "".concat(sn("shareTargetPickerOtt"), "/").concat(
                    this.liffId, "/ott"), n = this, [4, nn(t, {
                      method: "GET",
                      signal: e
                    }).then((function (e) {
                      return e.ott
                    }))];
              case 1:
                return n.ott = r.sent(), [2]
            }
          }))
        }))
      }, e.prototype.prepareAnotherWindow = function () {
        Je() || ("ios" !== Pt() || We() ? this.popupWindow = window.open("",
          "liffpopup",
          "width=480, height=640, menubar=no, toolbar=no, scrollbars=yes") :
          this.popupWindow = window.open())
      }, e.prototype.openAnotherWindow = function () {
        if (Je() && this.payloadToShareTargetPicker) e = this.liffId, t =
          this.ott, n = this.payloadToShareTargetPicker, r = {
            liffId: e,
            ott: t,
            data: JSON.stringify(n),
            closeModals: !1
          }, location.href = "".concat("line://picker", "?").concat(Ae(r));
        else {
          if (this.timeoutIDForHealthCheck = window.setTimeout(this.healthCheck
            .bind(this), 1e3), !this.popupWindow) throw Ce(Z);
          ! function (e, t, n) {
            var r = {
              liffId: t,
              ott: n
            };
            e.location.href = "".concat(sn("shareTargetPicker"), "?").concat(
              Ae(r))
          }(this.popupWindow, this.liffId, this.ott)
        }
        var e, t, n, r
      }, e.prototype.initListener = function () {
        var e, t;
        Je() || (e = this.onReceivedHealthcheck.bind(this), t = this.allowPostMessageOrigin,
          zi(window, "receivedHealthcheck", e, t))
      }, e.prototype.healthCheck = function () {
        return k(this, void 0, void 0, (function () {
          var e;
          return A(this, (function (t) {
            switch (t.label) {
              case 0:
                if (this.popupWindow && !this.popupWindow.closed) return [
                  3, 7
                ];
                if (!this.doesWaitForSubwindowResult) return [3, 5];
                t.label = 1;
              case 1:
                return t.trys.push([1, 3, , 4]), [4, this.onCanceled()];
              case 2:
                return t.sent(), [3, 4];
              case 3:
                return e = t.sent(), this.internalError = e, [3, 4];
              case 4:
                return [3, 6];
              case 5:
                this.finalize(), t.label = 6;
              case 6:
                return [3, 8];
              case 7:
                qi(this.popupWindow, "healthcheck", void 0, this.allowPostMessageOrigin),
                  this.timeoutIDForHealthCheck = window.setTimeout(this.healthCheck
                    .bind(this), 1e3), t.label = 8;
              case 8:
                return [2]
            }
          }))
        }))
      }, e.prototype.onReceivedHealthcheck = function () {
        if (!this.popupWindow || !this.payloadToShareTargetPicker) throw Ce(
          Z);
        qi(this.popupWindow, "ready", this.payloadToShareTargetPicker, this.allowPostMessageOrigin)
      }, e.prototype.onCanceled = function () {
        return k(this, void 0, void 0, (function () {
          var e, t;
          return A(this, (function (n) {
            switch (n.label) {
              case 0:
                if (Je() || !this.ott) throw new Error(
                  "need to call with ott in client");
                return this.abortController && (e = this.abortController.signal),
                  t = {
                    liffId: this.liffId,
                    ott: this.ott
                  }, [4, nn("".concat(sn("shareTargetPickerResult"), "?").concat(
                    Ae(t)), {
                    method: "POST",
                    signal: e,
                    headers: {
                      Accept: "application/json",
                      "Content-Type": "application/x-www-form-urlencoded"
                    },
                    body: "result=CANCEL"
                  })];
              case 1:
                return [2, "ok" === n.sent().status]
            }
          }))
        }))
      }, e.prototype.getShareResult = function () {
        return k(this, void 0, void 0, (function () {
          var e, t;
          return A(this, (function (n) {
            if (!this.ott) throw new Error(
              "need to call with ott in client");
            return this.abortController && (e = this.abortController.signal),
              t = {
                liffId: this.liffId,
                ott: this.ott
              }, R.debug("fetch: getShareResult"), [2, nn("".concat(sn(
                "shareTargetPickerResult"), "?").concat(Ae(t)), {
                method: "GET",
                headers: {
                  Accept: "application/json"
                },
                signal: e
              })]
          }))
        }))
      }, e.isPollingTimeOut = function (e, t) {
        return (t - e) / 6e4 >= 10
      }, e.prototype.pollingShareResult = function () {
        return k(this, void 0, void 0, (function () {
          var t, n;
          return A(this, (function (r) {
            switch (r.label) {
              case 0:
                t = Date.now(), r.label = 1;
              case 1:
                if (e.isPollingTimeOut(t, Date.now())) return [3, 4];
                if (this.internalError) throw this.internalError;
                return [4, this.getShareResult()];
              case 2:
                if ((n = r.sent()) && n.result) switch (n.result) {
                  case "SUCCESS":
                    return [2, {
                      status: "success"
                    }];
                  case "CANCEL":
                    return [2];
                  default:
                    throw new Error(n.resultDescription)
                }
                return [4, new Promise((function (e) {
                  setTimeout(e, 500)
                }))];
              case 3:
                return r.sent(), [3, 1];
              case 4:
                throw new Error("Timeout: not finished within ".concat(10,
                  "min"))
            }
          }))
        }))
      }, e
    }(),
      Xi = function (e) {
        function t() {
          var t = e.apply(this, F([], x(arguments), !1)) || this;
          return t.shareTargetPicker = function (e) {
            for (var n = [], r = 1; r < arguments.length; r++) n[r - 1] =
              arguments[r];
            return k(t, F([e], x(n), !1), void 0, (function (e, t) {
              var n, r, i, o, a, s, c;
              return void 0 === t && (t = {}), A(this, (function (u) {
                switch (u.label) {
                  case 0:
                    if (Ft.shareTargetPicker(), !e || !Array.isArray(e) || 0 ===
                      e.length) throw Ce(z, "no proper argument");
                    if (e.length > 5) throw Ce(z,
                      "exceed the limit of num of messages");
                    if (!(n = qe().liffId)) throw Ce(Q);
                    window.liff && (r = window.liff).analytics && Bi(r.analytics),
                      i = void 0 === t.isMultiple || t.isMultiple, u.label = 1;
                  case 1:
                    return u.trys.push([1, 3, , 4]), o = $i.getInstance(), a =
                      Et(), s = {
                        waitForSubwindowResult: !0
                      }, Je() && a && ve(a, "10.11.0") < 0 && (s.waitForSubwindowResult = !
                        1), [4, o.init({
                          messages: e,
                          isMultiple: i,
                          referrer: {
                            liffId: n,
                            url: location.origin
                          },
                          options: s
                        })];
                  case 2:
                    return [2, u.sent()];
                  case 3:
                    throw (c = u.sent()) instanceof Ee ? c : Ce(ee, c.message);
                  case 4:
                    return [2]
                }
              }))
            }))
          }, t
        }
        return O(t, e), Object.defineProperty(t.prototype, "name", {
          get: function () {
            return "shareTargetPicker"
          },
          enumerable: !1,
          configurable: !0
        }), t.prototype.install = function () {
          return this.shareTargetPicker
        }, t
      }(H),
      Qi = new Xi;

    function Yi(e, t) {
      return k(this, void 0, void 0, (function () {
        var n, r;
        return A(this, (function (i) {
          switch (i.label) {
            case 0:
              return n = sn("createShortcutOnHomeScreen"), (r = new URL(n))
                .searchParams.append("liffId", e), r.searchParams.append(
                  "url", t.url), t.description && r.searchParams.append(
                    "description", t.description), [4, nn(r.toString())];
            case 1:
              return [2, i.sent().shortcutPageUrl]
          }
        }))
      }))
    }

    function Zi(e) {
      if (Me(e)) throw Ce(z,
        "LINE URL scheme are not supported in the current environment.")
    }

    function eo(e, t) {
      return k(this, void 0, void 0, (function () {
        return A(this, (function (n) {
          switch (n.label) {
            case 0:
              return Je() ? [2] : [4, new Promise((function (e) {
                setTimeout(e, 1e3)
              }))];
            case 1:
              return n.sent(), "hidden" === document.visibilityState ? [2] :
                (Zi(t.url), [4, Yi(e, t)]);
            case 2:
              return ki({
                url: n.sent(),
                external: !0
              }), [2]
          }
        }))
      }))
    }

    function to(e, t) {
      return k(this, void 0, void 0, (function () {
        var n, r;
        return A(this, (function (i) {
          switch (i.label) {
            case 0:
              return n = {
                liffId: e,
                targetUrl: t.url,
                description: t.description
              }, r = "".concat("line://shortcut/liff", "?").concat(Ae(n)),
                location.href = r, [4, eo(e, t)];
            case 1:
              return i.sent(), [2]
          }
        }))
      }))
    }

    function no(e, t) {
      return k(this, void 0, void 0, (function () {
        return A(this, (function (n) {
          switch (n.label) {
            case 0:
              return Zi(t.url), [4, Yi(e, t)];
            case 1:
              return ki({
                url: n.sent(),
                external: !0
              }), [2]
          }
        }))
      }))
    }

    function ro(e) {
      var t;
      if (void 0 === e.url || null === e.url || "" === e.url) throw Ce(z,
        "no proper argument");
      var n = Xe();
      if (!(null === (t = null == n ? void 0 : n.availability.addToHomeLineScheme) ||
        void 0 === t ? void 0 : t.permission)) {
        if (Me(e.url)) throw Ce(X,
          "No permission to specify line schema in url.");
        if (e.description) throw Ce(X, "No permission to specify description.")
      }
      if (!Me(e.url)) {
        if (!n) throw Ce(X, "Could not get Context from server.");
        n.liffId !== De(e.url) && Qt(e.url, n.endpointUrl)
      }
    }

    function io(e) {
      return k(this, void 0, void 0, (function () {
        var t;
        return A(this, (function (n) {
          switch (n.label) {
            case 0:
              if (!(t = qe().liffId)) throw Ce($, "Invalid LIFF ID.");
              return "ios" === Pt() ? [4, no(t, e)] : [3, 2];
            case 1:
              return n.sent(), [3, 4];
            case 2:
              return [4, to(t, e)];
            case 3:
              n.sent(), n.label = 4;
            case 4:
              return [2]
          }
        }))
      }))
    }
    var oo = function (e) {
      function t() {
        return null !== e && e.apply(this, arguments) || this
      }
      return O(t, e), Object.defineProperty(t.prototype, "name", {
        get: function () {
          return "createShortcutOnHomeScreen"
        },
        enumerable: !1,
        configurable: !0
      }), t.prototype.install = function () {
        return function (e) {
          return function (e) {
            return k(this, void 0, void 0, (function () {
              return A(this, (function (t) {
                switch (t.label) {
                  case 0:
                    return ro(e), Ft.createShortcutOnHomeScreen(), [4, io(
                      e)];
                  case 1:
                    return t.sent(), [2]
                }
              }))
            }))
          }(e)
        }
      }, t
    }(H),
      ao = function (e) {
        function t() {
          return null !== e && e.apply(this, arguments) || this
        }
        return O(t, e), Object.defineProperty(t.prototype, "name", {
          get: function () {
            return "internalCreateShortcutOnHomeScreen"
          },
          enumerable: !1,
          configurable: !0
        }), t.prototype.install = function () {
          return function (e) {
            return function (e) {
              return k(this, void 0, void 0, (function () {
                return A(this, (function (t) {
                  switch (t.label) {
                    case 0:
                      return ro(e), Ft.internalCreateShortcutOnHomeScreen(), [
                        4, io(e)
                      ];
                    case 1:
                      return t.sent(), [2]
                  }
                }))
              }))
            }(e)
          }
        }, t
      }(H);

    function so(e) {
      return k(this, arguments, void 0, (function (e) {
        var t = e.productIds;
        return A(this, (function (e) {
          switch (e.label) {
            case 0:
              return [4, _n("iap.getPlatformProducts", {
                productIds: t
              }).catch((function (e) {
                if (e.code && e.description) throw Ce(e.code, e.description);
                throw Ce(J, "Failed to get platform products", {
                  cause: e
                })
              }))];
            case 1:
              return [2, e.sent().products]
          }
        }))
      }))
    }
    var co = function (e) {
      return k(void 0, [e], void 0, (function (e) {
        var t = e.productId,
          n = e.orderId;
        return A(this, (function (e) {
          switch (e.label) {
            case 0:
              if (!window.confirm("Proceed with a test in-app purchase?"))
                throw Ce("CANCELED", "Transaction was canceled.");
              return [4, nn(sn("iapVirtualConfirm"), {
                method: "POST",
                body: JSON.stringify({
                  productId: t,
                  orderId: n
                })
              })];
            case 1:
              return e.sent(), [2]
          }
        }))
      }))
    },
      uo = function (e) {
        return k(void 0, [e], void 0, (function (e) {
          var t, n = e.productId,
            r = e.orderId;
          return A(this, (function (e) {
            switch (e.label) {
              case 0:
                return (null == (t = Xe()) ? void 0 : t.isIapSandbox) ? [4,
                  co({
                    productId: n,
                    orderId: r
                  })
                ] : [3, 2];
              case 1:
              case 3:
                return e.sent(), [2];
              case 2:
                return [4, _n("iap.createPayment", {
                  productId: n,
                  orderId: r
                }).catch((function (e) {
                  if (e.code && e.description) throw Ce(e.code, e.description);
                  throw Ce(J, "Failed to get platform products", {
                    cause: e
                  })
                }))]
            }
          }))
        }))
      },
      lo = function (e) {
        function t() {
          return null !== e && e.apply(this, arguments) || this
        }
        return O(t, e), Object.defineProperty(t.prototype, "name", {
          get: function () {
            return "iap"
          },
          enumerable: !1,
          configurable: !0
        }), t.prototype.install = function () {
          var e = this;
          return {
            getPlatformProducts: function () {
              for (var t = [], n = 0; n < arguments.length; n++) t[n] =
                arguments[n];
              return k(e, void 0, void 0, (function () {
                return A(this, (function (e) {
                  return Ft.iap(), [2, so.apply(void 0, F([], x(t), !1))]
                }))
              }))
            },
            createPayment: function () {
              for (var t = [], n = 0; n < arguments.length; n++) t[n] =
                arguments[n];
              return k(e, void 0, void 0, (function () {
                return A(this, (function (e) {
                  return Ft.iap(), [2, uo.apply(void 0, F([], x(t), !1))]
                }))
              }))
            },
            requestConsentAgreement: function () {
              return k(e, void 0, void 0, (function () {
                return A(this, (function (e) {
                  return Ft.iap(), [2, k(void 0, void 0, void 0, (function () {
                    return A(this, (function (e) {
                      switch (e.label) {
                        case 0:
                          return [4, _n("iap.requestConsentAgreement").catch(
                            (function (e) {
                              if (e.code && e.description) throw Ce(e.code,
                                e.description);
                              throw Ce(J,
                                "Failed to request consent agreement", {
                                cause: e
                              })
                            }))];
                        case 1:
                          return e.sent(), [2]
                      }
                    }))
                  }))]
                }))
              }))
            }
          }
        }, t
      }(H),
      fo = Object.defineProperties({}, {
        getOS: {
          value: Pt,
          enumerable: !0,
          writable: !0
        },
        getVersion: {
          value: gt,
          enumerable: !0,
          writable: !0
        },
        getLanguage: {
          value: pi,
          enumerable: !0,
          writable: !0
        },
        getAppLanguage: {
          value: vi,
          enumerable: !0,
          writable: !0
        },
        getOrigins: {
          value: hi,
          enumerable: !0,
          writable: !0
        },
        isInClient: {
          value: Je,
          enumerable: !0,
          writable: !0
        },
        isLoggedIn: {
          value: bt,
          enumerable: !0,
          writable: !0
        },
        logout: {
          value: Ht,
          enumerable: !0,
          writable: !0
        },
        getAccessToken: {
          value: ut,
          enumerable: !0,
          writable: !0
        },
        getIDToken: {
          value: st,
          enumerable: !0,
          writable: !0
        },
        getDecodedIDToken: {
          value: vt,
          enumerable: !0,
          writable: !0
        },
        getContext: {
          value: Xe,
          enumerable: !0,
          writable: !0
        },
        openWindow: {
          value: ki,
          enumerable: !0,
          writable: !0
        },
        closeWindow: {
          value: kn,
          enumerable: !0,
          writable: !0
        },
        getFriendship: {
          value: Pi(ji, "profile"),
          enumerable: !0,
          writable: !0
        },
        getAId: {
          value: Ye,
          enumerable: !0,
          writable: !0
        },
        getProfilePlus: {
          value: et,
          enumerable: !0,
          writable: !0
        },
        getIsVideoAutoPlay: {
          value: Ze,
          enumerable: !0,
          writable: !0
        },
        getLineVersion: {
          value: Et,
          enumerable: !0,
          writable: !0
        },
        isApiAvailable: {
          value: jt,
          enumerable: !0,
          writable: !0
        },
        getProfile: {
          value: Pi(_i, "profile"),
          enumerable: !0,
          writable: !0
        },
        sendMessages: {
          value: Pi(xi, "chat_message.write"),
          enumerable: !0,
          writable: !0
        },
        subWindow: {
          value: Sr,
          enumerable: !0,
          writable: !0
        },
        ready: {
          value: K,
          enumerable: !0,
          writable: !0
        },
        id: {
          get: function () {
            return qe().liffId || null
          },
          enumerable: !0
        },
        _dispatchEvent: {
          value: function (e) {
            var t = {};
            try {
              t = JSON.parse(e)
            } catch (r) {
              throw Ce(z, r.message)
            }
            var n = function (e) {
              return new CustomEvent(te, {
                detail: e
              })
            }(t);
            R.debug("[client dispatchEvent to js]", {
              type: n.type,
              detail: n.detail
            }), window.dispatchEvent(n)
          },
          enumerable: !0,
          writable: !0
        },
        _call: {
          value: _n,
          enumerable: !0,
          writable: !0
        },
        _addListener: {
          value: Cn,
          enumerable: !0,
          writable: !0
        },
        _removeListener: {
          value: Pn,
          enumerable: !0,
          writable: !0
        },
        _postMessage: {
          value: On,
          enumerable: !0,
          writable: !0
        }
      }),
      ho = new W,
      po = new M(ho, fo),
      vo = new G(ho, po).install();
    [new G(ho, po), new _r, new di, new Di, Hi, Zt, St, Oi, Qi, jr, new Mt,
    new oo, new ao, new lo
    ].forEach((function (e) {
      vo.call(fo, e)
    }));
    const wo = fo
  })(), r = r.default
})()));
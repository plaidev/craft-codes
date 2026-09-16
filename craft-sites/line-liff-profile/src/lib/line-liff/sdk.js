/*! For license information please see sdk.js.LICENSE.txt */ !(function (e, t) {
  'object' == typeof exports && 'object' == typeof module
    ? (module.exports = t())
    : 'function' == typeof define && define.amd
      ? define('liff', [], t)
      : 'object' == typeof exports
        ? (exports.liff = t())
        : (e.liff = t());
})(self, () =>
  (() => {
    var e = {
        255: function (e, t) {
          var n, r, i;
          (r = []),
            void 0 ===
              (i =
                'function' ==
                typeof (n = function () {
                  var e = function e(t) {
                    function n(e, t) {
                      return (e >>> t) | (e << (32 - t));
                    }
                    for (
                      var r,
                        i,
                        o = Math.pow,
                        a = o(2, 32),
                        s = 'length',
                        c = '',
                        u = [],
                        l = 8 * t[s],
                        f = (e.h = e.h || []),
                        d = (e.k = e.k || []),
                        h = d[s],
                        p = {},
                        v = 2;
                      h < 64;
                      v++
                    )
                      if (!p[v]) {
                        for (r = 0; r < 313; r += v) p[r] = v;
                        (f[h] = (o(v, 0.5) * a) | 0), (d[h++] = (o(v, 1 / 3) * a) | 0);
                      }
                    for (t += 'ﾂ'; (t[s] % 64) - 56; ) t += '\0';
                    for (r = 0; r < t[s]; r++) {
                      if ((i = t.charCodeAt(r)) >> 8) return;
                      u[r >> 2] |= i << (((3 - r) % 4) * 8);
                    }
                    for (u[u[s]] = (l / a) | 0, u[u[s]] = l, i = 0; i < u[s]; ) {
                      var w = u.slice(i, (i += 16)),
                        b = f;
                      for (f = f.slice(0, 8), r = 0; r < 64; r++) {
                        var m = w[r - 15],
                          g = w[r - 2],
                          y = f[0],
                          I = f[4],
                          T =
                            f[7] +
                            (n(I, 6) ^ n(I, 11) ^ n(I, 25)) +
                            ((I & f[5]) ^ (~I & f[6])) +
                            d[r] +
                            (w[r] =
                              r < 16
                                ? w[r]
                                : (w[r - 16] +
                                    (n(m, 7) ^ n(m, 18) ^ (m >>> 3)) +
                                    w[r - 7] +
                                    (n(g, 17) ^ n(g, 19) ^ (g >>> 10))) |
                                  0);
                        (f = [
                          (T +
                            ((n(y, 2) ^ n(y, 13) ^ n(y, 22)) +
                              ((y & f[1]) ^ (y & f[2]) ^ (f[1] & f[2])))) |
                            0,
                        ].concat(f))[4] = (f[4] + T) | 0;
                      }
                      for (r = 0; r < 8; r++) f[r] = (f[r] + b[r]) | 0;
                    }
                    for (r = 0; r < 8; r++)
                      for (i = 3; i + 1; i--) {
                        var E = (f[r] >> (8 * i)) & 255;
                        c += (E < 16 ? 0 : '') + E.toString(16);
                      }
                    return c;
                  };
                  return (
                    (e.code =
                      'var sha256=function a(b){function c(a,b){return a>>>b|a<<32-b}for(var d,e,f=Math.pow,g=f(2,32),h="length",i="",j=[],k=8*b[h],l=a.h=a.h||[],m=a.k=a.k||[],n=m[h],o={},p=2;64>n;p++)if(!o[p]){for(d=0;313>d;d+=p)o[d]=p;l[n]=f(p,.5)*g|0,m[n++]=f(p,1/3)*g|0}for(b+="\\x80";b[h]%64-56;)b+="\\x00";for(d=0;d<b[h];d++){if(e=b.charCodeAt(d),e>>8)return;j[d>>2]|=e<<(3-d)%4*8}for(j[j[h]]=k/g|0,j[j[h]]=k,e=0;e<j[h];){var q=j.slice(e,e+=16),r=l;for(l=l.slice(0,8),d=0;64>d;d++){var s=q[d-15],t=q[d-2],u=l[0],v=l[4],w=l[7]+(c(v,6)^c(v,11)^c(v,25))+(v&l[5]^~v&l[6])+m[d]+(q[d]=16>d?q[d]:q[d-16]+(c(s,7)^c(s,18)^s>>>3)+q[d-7]+(c(t,17)^c(t,19)^t>>>10)|0),x=(c(u,2)^c(u,13)^c(u,22))+(u&l[1]^u&l[2]^l[1]&l[2]);l=[w+x|0].concat(l),l[4]=l[4]+w|0}for(d=0;8>d;d++)l[d]=l[d]+r[d]|0}for(d=0;8>d;d++)for(e=3;e+1;e--){var y=l[d]>>8*e&255;i+=(16>y?0:"")+y.toString(16)}return i};'),
                    e
                  );
                })
                  ? n.apply(t, r)
                  : n) || (e.exports = i);
        },
      },
      t = {};
    function n(r) {
      var i = t[r];
      if (void 0 !== i) return i.exports;
      var o = (t[r] = { exports: {} });
      return e[r].call(o.exports, o, o.exports, n), o.exports;
    }
    (n.n = e => {
      var t = e && e.__esModule ? () => e.default : () => e;
      return n.d(t, { a: t }), t;
    }),
      (n.d = (e, t) => {
        for (var r in t)
          n.o(t, r) && !n.o(e, r) && Object.defineProperty(e, r, { enumerable: !0, get: t[r] });
      }),
      (n.o = (e, t) => Object.prototype.hasOwnProperty.call(e, t));
    var r = {};
    return (
      (() => {
        'use strict';
        n.d(r, { default: () => Gi });
        var e =
            ('undefined' != typeof globalThis && globalThis) ||
            ('undefined' != typeof self && self) ||
            (void 0 !== e && e),
          t = 'URLSearchParams' in e,
          i = 'Symbol' in e && 'iterator' in Symbol,
          o =
            'FileReader' in e &&
            'Blob' in e &&
            (function () {
              try {
                return new Blob(), !0;
              } catch (e) {
                return !1;
              }
            })(),
          a = 'FormData' in e,
          s = 'ArrayBuffer' in e;
        if (s)
          var c = [
              '[object Int8Array]',
              '[object Uint8Array]',
              '[object Uint8ClampedArray]',
              '[object Int16Array]',
              '[object Uint16Array]',
              '[object Int32Array]',
              '[object Uint32Array]',
              '[object Float32Array]',
              '[object Float64Array]',
            ],
            u =
              ArrayBuffer.isView ||
              function (e) {
                return e && c.indexOf(Object.prototype.toString.call(e)) > -1;
              };
        function l(e) {
          if (
            ('string' != typeof e && (e = String(e)),
            /[^a-z0-9\-#$%&'*+.^_`|~!]/i.test(e) || '' === e)
          )
            throw new TypeError('Invalid character in header field name: "' + e + '"');
          return e.toLowerCase();
        }
        function f(e) {
          return 'string' != typeof e && (e = String(e)), e;
        }
        function d(e) {
          var t = {
            next: function () {
              var t = e.shift();
              return { done: void 0 === t, value: t };
            },
          };
          return (
            i &&
              (t[Symbol.iterator] = function () {
                return t;
              }),
            t
          );
        }
        function h(e) {
          (this.map = {}),
            e instanceof h
              ? e.forEach(function (e, t) {
                  this.append(t, e);
                }, this)
              : Array.isArray(e)
                ? e.forEach(function (e) {
                    this.append(e[0], e[1]);
                  }, this)
                : e &&
                  Object.getOwnPropertyNames(e).forEach(function (t) {
                    this.append(t, e[t]);
                  }, this);
        }
        function p(e) {
          if (e.bodyUsed) return Promise.reject(new TypeError('Already read'));
          e.bodyUsed = !0;
        }
        function v(e) {
          return new Promise(function (t, n) {
            (e.onload = function () {
              t(e.result);
            }),
              (e.onerror = function () {
                n(e.error);
              });
          });
        }
        function w(e) {
          var t = new FileReader(),
            n = v(t);
          return t.readAsArrayBuffer(e), n;
        }
        function b(e) {
          if (e.slice) return e.slice(0);
          var t = new Uint8Array(e.byteLength);
          return t.set(new Uint8Array(e)), t.buffer;
        }
        function m() {
          return (
            (this.bodyUsed = !1),
            (this._initBody = function (e) {
              var n;
              (this.bodyUsed = this.bodyUsed),
                (this._bodyInit = e),
                e
                  ? 'string' == typeof e
                    ? (this._bodyText = e)
                    : o && Blob.prototype.isPrototypeOf(e)
                      ? (this._bodyBlob = e)
                      : a && FormData.prototype.isPrototypeOf(e)
                        ? (this._bodyFormData = e)
                        : t && URLSearchParams.prototype.isPrototypeOf(e)
                          ? (this._bodyText = e.toString())
                          : s && o && (n = e) && DataView.prototype.isPrototypeOf(n)
                            ? ((this._bodyArrayBuffer = b(e.buffer)),
                              (this._bodyInit = new Blob([this._bodyArrayBuffer])))
                            : s && (ArrayBuffer.prototype.isPrototypeOf(e) || u(e))
                              ? (this._bodyArrayBuffer = b(e))
                              : (this._bodyText = e = Object.prototype.toString.call(e))
                  : (this._bodyText = ''),
                this.headers.get('content-type') ||
                  ('string' == typeof e
                    ? this.headers.set('content-type', 'text/plain;charset=UTF-8')
                    : this._bodyBlob && this._bodyBlob.type
                      ? this.headers.set('content-type', this._bodyBlob.type)
                      : t &&
                        URLSearchParams.prototype.isPrototypeOf(e) &&
                        this.headers.set(
                          'content-type',
                          'application/x-www-form-urlencoded;charset=UTF-8'
                        ));
            }),
            o &&
              ((this.blob = function () {
                var e = p(this);
                if (e) return e;
                if (this._bodyBlob) return Promise.resolve(this._bodyBlob);
                if (this._bodyArrayBuffer)
                  return Promise.resolve(new Blob([this._bodyArrayBuffer]));
                if (this._bodyFormData) throw new Error('could not read FormData body as blob');
                return Promise.resolve(new Blob([this._bodyText]));
              }),
              (this.arrayBuffer = function () {
                if (this._bodyArrayBuffer) {
                  var e = p(this);
                  return (
                    e ||
                    (ArrayBuffer.isView(this._bodyArrayBuffer)
                      ? Promise.resolve(
                          this._bodyArrayBuffer.buffer.slice(
                            this._bodyArrayBuffer.byteOffset,
                            this._bodyArrayBuffer.byteOffset + this._bodyArrayBuffer.byteLength
                          )
                        )
                      : Promise.resolve(this._bodyArrayBuffer))
                  );
                }
                return this.blob().then(w);
              })),
            (this.text = function () {
              var e,
                t,
                n,
                r = p(this);
              if (r) return r;
              if (this._bodyBlob)
                return (e = this._bodyBlob), (t = new FileReader()), (n = v(t)), t.readAsText(e), n;
              if (this._bodyArrayBuffer)
                return Promise.resolve(
                  (function (e) {
                    for (
                      var t = new Uint8Array(e), n = new Array(t.length), r = 0;
                      r < t.length;
                      r++
                    )
                      n[r] = String.fromCharCode(t[r]);
                    return n.join('');
                  })(this._bodyArrayBuffer)
                );
              if (this._bodyFormData) throw new Error('could not read FormData body as text');
              return Promise.resolve(this._bodyText);
            }),
            a &&
              (this.formData = function () {
                return this.text().then(I);
              }),
            (this.json = function () {
              return this.text().then(JSON.parse);
            }),
            this
          );
        }
        (h.prototype.append = function (e, t) {
          (e = l(e)), (t = f(t));
          var n = this.map[e];
          this.map[e] = n ? n + ', ' + t : t;
        }),
          (h.prototype.delete = function (e) {
            delete this.map[l(e)];
          }),
          (h.prototype.get = function (e) {
            return (e = l(e)), this.has(e) ? this.map[e] : null;
          }),
          (h.prototype.has = function (e) {
            return this.map.hasOwnProperty(l(e));
          }),
          (h.prototype.set = function (e, t) {
            this.map[l(e)] = f(t);
          }),
          (h.prototype.forEach = function (e, t) {
            for (var n in this.map) this.map.hasOwnProperty(n) && e.call(t, this.map[n], n, this);
          }),
          (h.prototype.keys = function () {
            var e = [];
            return (
              this.forEach(function (t, n) {
                e.push(n);
              }),
              d(e)
            );
          }),
          (h.prototype.values = function () {
            var e = [];
            return (
              this.forEach(function (t) {
                e.push(t);
              }),
              d(e)
            );
          }),
          (h.prototype.entries = function () {
            var e = [];
            return (
              this.forEach(function (t, n) {
                e.push([n, t]);
              }),
              d(e)
            );
          }),
          i && (h.prototype[Symbol.iterator] = h.prototype.entries);
        var g = ['DELETE', 'GET', 'HEAD', 'OPTIONS', 'POST', 'PUT'];
        function y(e, t) {
          if (!(this instanceof y))
            throw new TypeError(
              'Please use the "new" operator, this DOM object constructor cannot be called as a function.'
            );
          var n,
            r,
            i = (t = t || {}).body;
          if (e instanceof y) {
            if (e.bodyUsed) throw new TypeError('Already read');
            (this.url = e.url),
              (this.credentials = e.credentials),
              t.headers || (this.headers = new h(e.headers)),
              (this.method = e.method),
              (this.mode = e.mode),
              (this.signal = e.signal),
              i || null == e._bodyInit || ((i = e._bodyInit), (e.bodyUsed = !0));
          } else this.url = String(e);
          if (
            ((this.credentials = t.credentials || this.credentials || 'same-origin'),
            (!t.headers && this.headers) || (this.headers = new h(t.headers)),
            (this.method =
              ((n = t.method || this.method || 'GET'),
              (r = n.toUpperCase()),
              g.indexOf(r) > -1 ? r : n)),
            (this.mode = t.mode || this.mode || null),
            (this.signal = t.signal || this.signal),
            (this.referrer = null),
            ('GET' === this.method || 'HEAD' === this.method) && i)
          )
            throw new TypeError('Body not allowed for GET or HEAD requests');
          if (
            (this._initBody(i),
            !(
              ('GET' !== this.method && 'HEAD' !== this.method) ||
              ('no-store' !== t.cache && 'no-cache' !== t.cache)
            ))
          ) {
            var o = /([?&])_=[^&]*/;
            if (o.test(this.url)) this.url = this.url.replace(o, '$1_=' + new Date().getTime());
            else {
              this.url += (/\?/.test(this.url) ? '&' : '?') + '_=' + new Date().getTime();
            }
          }
        }
        function I(e) {
          var t = new FormData();
          return (
            e
              .trim()
              .split('&')
              .forEach(function (e) {
                if (e) {
                  var n = e.split('='),
                    r = n.shift().replace(/\+/g, ' '),
                    i = n.join('=').replace(/\+/g, ' ');
                  t.append(decodeURIComponent(r), decodeURIComponent(i));
                }
              }),
            t
          );
        }
        function T(e, t) {
          if (!(this instanceof T))
            throw new TypeError(
              'Please use the "new" operator, this DOM object constructor cannot be called as a function.'
            );
          t || (t = {}),
            (this.type = 'default'),
            (this.status = void 0 === t.status ? 200 : t.status),
            (this.ok = this.status >= 200 && this.status < 300),
            (this.statusText = void 0 === t.statusText ? '' : '' + t.statusText),
            (this.headers = new h(t.headers)),
            (this.url = t.url || ''),
            this._initBody(e);
        }
        (y.prototype.clone = function () {
          return new y(this, { body: this._bodyInit });
        }),
          m.call(y.prototype),
          m.call(T.prototype),
          (T.prototype.clone = function () {
            return new T(this._bodyInit, {
              status: this.status,
              statusText: this.statusText,
              headers: new h(this.headers),
              url: this.url,
            });
          }),
          (T.error = function () {
            var e = new T(null, { status: 0, statusText: '' });
            return (e.type = 'error'), e;
          });
        var E = [301, 302, 303, 307, 308];
        T.redirect = function (e, t) {
          if (-1 === E.indexOf(t)) throw new RangeError('Invalid status code');
          return new T(null, { status: t, headers: { location: e } });
        };
        var S = e.DOMException;
        try {
          new S();
        } catch (Ki) {
          ((S = function (e, t) {
            (this.message = e), (this.name = t);
            var n = Error(e);
            this.stack = n.stack;
          }).prototype = Object.create(Error.prototype)),
            (S.prototype.constructor = S);
        }
        function C(t, n) {
          return new Promise(function (r, i) {
            var a = new y(t, n);
            if (a.signal && a.signal.aborted) return i(new S('Aborted', 'AbortError'));
            var c = new XMLHttpRequest();
            function u() {
              c.abort();
            }
            (c.onload = function () {
              var e,
                t,
                n = {
                  status: c.status,
                  statusText: c.statusText,
                  headers:
                    ((e = c.getAllResponseHeaders() || ''),
                    (t = new h()),
                    e
                      .replace(/\r?\n[\t ]+/g, ' ')
                      .split('\r')
                      .map(function (e) {
                        return 0 === e.indexOf('\n') ? e.substr(1, e.length) : e;
                      })
                      .forEach(function (e) {
                        var n = e.split(':'),
                          r = n.shift().trim();
                        if (r) {
                          var i = n.join(':').trim();
                          t.append(r, i);
                        }
                      }),
                    t),
                };
              n.url = 'responseURL' in c ? c.responseURL : n.headers.get('X-Request-URL');
              var i = 'response' in c ? c.response : c.responseText;
              setTimeout(function () {
                r(new T(i, n));
              }, 0);
            }),
              (c.onerror = function () {
                setTimeout(function () {
                  i(new TypeError('Network request failed'));
                }, 0);
              }),
              (c.ontimeout = function () {
                setTimeout(function () {
                  i(new TypeError('Network request failed'));
                }, 0);
              }),
              (c.onabort = function () {
                setTimeout(function () {
                  i(new S('Aborted', 'AbortError'));
                }, 0);
              }),
              c.open(
                a.method,
                (function (t) {
                  try {
                    return '' === t && e.location.href ? e.location.href : t;
                  } catch (n) {
                    return t;
                  }
                })(a.url),
                !0
              ),
              'include' === a.credentials
                ? (c.withCredentials = !0)
                : 'omit' === a.credentials && (c.withCredentials = !1),
              'responseType' in c &&
                (o
                  ? (c.responseType = 'blob')
                  : s &&
                    a.headers.get('Content-Type') &&
                    -1 !== a.headers.get('Content-Type').indexOf('application/octet-stream') &&
                    (c.responseType = 'arraybuffer')),
              !n || 'object' != typeof n.headers || n.headers instanceof h
                ? a.headers.forEach(function (e, t) {
                    c.setRequestHeader(t, e);
                  })
                : Object.getOwnPropertyNames(n.headers).forEach(function (e) {
                    c.setRequestHeader(e, f(n.headers[e]));
                  }),
              a.signal &&
                (a.signal.addEventListener('abort', u),
                (c.onreadystatechange = function () {
                  4 === c.readyState && a.signal.removeEventListener('abort', u);
                })),
              c.send(void 0 === a._bodyInit ? null : a._bodyInit);
          });
        }
        (C.polyfill = !0),
          e.fetch || ((e.fetch = C), (e.Headers = h), (e.Request = y), (e.Response = T));
        var _ = function (e, t) {
          return (
            (_ =
              Object.setPrototypeOf ||
              ({ __proto__: [] } instanceof Array &&
                function (e, t) {
                  e.__proto__ = t;
                }) ||
              function (e, t) {
                for (var n in t) Object.prototype.hasOwnProperty.call(t, n) && (e[n] = t[n]);
              }),
            _(e, t)
          );
        };
        function O(e, t) {
          if ('function' != typeof t && null !== t)
            throw new TypeError(
              'Class extends value ' + String(t) + ' is not a constructor or null'
            );
          function n() {
            this.constructor = e;
          }
          _(e, t),
            (e.prototype = null === t ? Object.create(t) : ((n.prototype = t.prototype), new n()));
        }
        var k = function () {
          return (
            (k =
              Object.assign ||
              function (e) {
                for (var t, n = 1, r = arguments.length; n < r; n++)
                  for (var i in (t = arguments[n]))
                    Object.prototype.hasOwnProperty.call(t, i) && (e[i] = t[i]);
                return e;
              }),
            k.apply(this, arguments)
          );
        };
        function P(e, t, n, r) {
          return new (n || (n = Promise))(function (i, o) {
            function a(e) {
              try {
                c(r.next(e));
              } catch (t) {
                o(t);
              }
            }
            function s(e) {
              try {
                c(r.throw(e));
              } catch (t) {
                o(t);
              }
            }
            function c(e) {
              var t;
              e.done
                ? i(e.value)
                : ((t = e.value),
                  t instanceof n
                    ? t
                    : new n(function (e) {
                        e(t);
                      })).then(a, s);
            }
            c((r = r.apply(e, t || [])).next());
          });
        }
        function A(e, t) {
          var n,
            r,
            i,
            o,
            a = {
              label: 0,
              sent: function () {
                if (1 & i[0]) throw i[1];
                return i[1];
              },
              trys: [],
              ops: [],
            };
          return (
            (o = { next: s(0), throw: s(1), return: s(2) }),
            'function' == typeof Symbol &&
              (o[Symbol.iterator] = function () {
                return this;
              }),
            o
          );
          function s(o) {
            return function (s) {
              return (function (o) {
                if (n) throw new TypeError('Generator is already executing.');
                for (; a; )
                  try {
                    if (
                      ((n = 1),
                      r &&
                        (i =
                          2 & o[0]
                            ? r.return
                            : o[0]
                              ? r.throw || ((i = r.return) && i.call(r), 0)
                              : r.next) &&
                        !(i = i.call(r, o[1])).done)
                    )
                      return i;
                    switch (((r = 0), i && (o = [2 & o[0], i.value]), o[0])) {
                      case 0:
                      case 1:
                        i = o;
                        break;
                      case 4:
                        return a.label++, { value: o[1], done: !1 };
                      case 5:
                        a.label++, (r = o[1]), (o = [0]);
                        continue;
                      case 7:
                        (o = a.ops.pop()), a.trys.pop();
                        continue;
                      default:
                        if (
                          !((i = a.trys),
                          (i = i.length > 0 && i[i.length - 1]) || (6 !== o[0] && 2 !== o[0]))
                        ) {
                          a = 0;
                          continue;
                        }
                        if (3 === o[0] && (!i || (o[1] > i[0] && o[1] < i[3]))) {
                          a.label = o[1];
                          break;
                        }
                        if (6 === o[0] && a.label < i[1]) {
                          (a.label = i[1]), (i = o);
                          break;
                        }
                        if (i && a.label < i[2]) {
                          (a.label = i[2]), a.ops.push(o);
                          break;
                        }
                        i[2] && a.ops.pop(), a.trys.pop();
                        continue;
                    }
                    o = t.call(e, a);
                  } catch (s) {
                    (o = [6, s]), (r = 0);
                  } finally {
                    n = i = 0;
                  }
                if (5 & o[0]) throw o[1];
                return { value: o[0] ? o[1] : void 0, done: !0 };
              })([o, s]);
            };
          }
        }
        Object.create;
        function x(e) {
          var t = 'function' == typeof Symbol && Symbol.iterator,
            n = t && e[t],
            r = 0;
          if (n) return n.call(e);
          if (e && 'number' == typeof e.length)
            return {
              next: function () {
                return e && r >= e.length && (e = void 0), { value: e && e[r++], done: !e };
              },
            };
          throw new TypeError(t ? 'Object is not iterable.' : 'Symbol.iterator is not defined.');
        }
        function L(e, t) {
          var n = 'function' == typeof Symbol && e[Symbol.iterator];
          if (!n) return e;
          var r,
            i,
            o = n.call(e),
            a = [];
          try {
            for (; (void 0 === t || t-- > 0) && !(r = o.next()).done; ) a.push(r.value);
          } catch (s) {
            i = { error: s };
          } finally {
            try {
              r && !r.done && (n = o.return) && n.call(o);
            } finally {
              if (i) throw i.error;
            }
          }
          return a;
        }
        function j(e, t, n) {
          if (n || 2 === arguments.length)
            for (var r, i = 0, o = t.length; i < o; i++)
              (!r && i in t) || (r || (r = Array.prototype.slice.call(t, 0, i)), (r[i] = t[i]));
          return e.concat(r || Array.prototype.slice.call(t));
        }
        var F;
        Object.create;
        !(function (e) {
          (e[(e.DEBUG = 1)] = 'DEBUG'),
            (e[(e.INFO = 2)] = 'INFO'),
            (e[(e.WARN = 3)] = 'WARN'),
            (e[(e.ERROR = 4)] = 'ERROR');
        })(F || (F = {}));
        var N,
          U = (function () {
            function e(e) {
              void 0 === e && (e = F.INFO),
                (this.logLevel = e),
                (this._debug = console.debug),
                (this._info = console.info),
                (this._warn = console.warn),
                (this._error = console.error);
            }
            return (
              (e.prototype.debug = function () {
                for (var e = [], t = 0; t < arguments.length; t++) e[t] = arguments[t];
                this.logLevel <= F.DEBUG &&
                  (e.unshift('[DEBUG]'), this._debug.apply(this, j([], L(e), !1)));
              }),
              (e.prototype.info = function () {
                for (var e = [], t = 0; t < arguments.length; t++) e[t] = arguments[t];
                this.logLevel <= F.INFO &&
                  (e.unshift('[INFO]'), this._info.apply(this, j([], L(e), !1)));
              }),
              (e.prototype.warn = function () {
                for (var e = [], t = 0; t < arguments.length; t++) e[t] = arguments[t];
                this.logLevel <= F.WARN &&
                  (e.unshift('[WARN]'), this._warn.apply(this, j([], L(e), !1)));
              }),
              (e.prototype.error = function () {
                for (var e = [], t = 0; t < arguments.length; t++) e[t] = arguments[t];
                this.logLevel <= F.ERROR &&
                  (e.unshift('[ERROR]'), this._error.apply(this, j([], L(e), !1)));
              }),
              e
            );
          })(),
          R = new U(Number('3')),
          D = function (e, t) {
            (this._driver = e),
              (this.liff = t),
              (this.hooks = this._driver.hooks),
              (this.internalHooks = this._driver.internalHooks);
          },
          B = function (e, t) {
            (this._driver = e), (this.liff = t), (this.hooks = this._driver.hooks);
          },
          M = (function () {
            function e(e, t) {
              (this.pluginCtx = new B(e, t)), (this.moduleCtx = new D(e, t));
            }
            return (
              Object.defineProperty(e.prototype, 'pluginContext', {
                get: function () {
                  return this.pluginCtx;
                },
                enumerable: !1,
                configurable: !0,
              }),
              Object.defineProperty(e.prototype, 'moduleContext', {
                get: function () {
                  return this.moduleCtx;
                },
                enumerable: !1,
                configurable: !0,
              }),
              e
            );
          })(),
          W = (function () {
            function e() {
              (this.modules = new Map()), (this.hooks = {}), (this.internalHooks = {});
            }
            return (
              (e.prototype.addModule = function (e, t) {
                this.modules.set(e, t),
                  t.hooks &&
                    (this.hooks[e] = Object.entries(t.hooks).reduce(function (e, t) {
                      var n,
                        r = L(t, 2),
                        i = r[0],
                        o = r[1];
                      return k(k({}, e), (((n = {})[i] = o.on.bind(o)), n));
                    }, {})),
                  'internalHooks' in t &&
                    t.internalHooks &&
                    (this.internalHooks[e] = Object.entries(t.internalHooks).reduce(function (
                      e,
                      t
                    ) {
                      var n,
                        r = L(t, 2),
                        i = r[0],
                        o = r[1];
                      return k(k({}, e), (((n = {})[i] = o.on.bind(o)), n));
                    }, {}));
              }),
              (e.prototype.hasModule = function (e) {
                return this.modules.has(e);
              }),
              e
            );
          })(),
          H = function () {},
          V = function (e) {
            return e instanceof H;
          },
          G = (function (e) {
            function t(t, n, r) {
              var i = e.call(this) || this;
              return (i.driver = t), (i.contextHolder = n), (i.option = r), i;
            }
            return (
              O(t, e),
              (t.prototype.install = function () {
                return this.factory(this.driver, this.contextHolder);
              }),
              Object.defineProperty(t.prototype, 'name', {
                get: function () {
                  return 'use';
                },
                enumerable: !1,
                configurable: !0,
              }),
              Object.defineProperty(t.prototype, 'defaultOption', {
                get: function () {
                  return { namespacePrefix: '$' };
                },
                enumerable: !1,
                configurable: !0,
              }),
              (t.prototype.factory = function (e, t) {
                var n = Object.assign({}, this.defaultOption, this.option).namespacePrefix;
                return function (r, i) {
                  if (!r || 'function' != typeof r.install || 'string' != typeof r.name)
                    return (
                      R.warn(
                        'To install the plugin, you need to define the `name` property and the `install` method.'
                      ),
                      this
                    );
                  var o = V(r) ? r.name : ''.concat(n).concat(r.name);
                  if (e.hasModule(o)) return this;
                  var a = V(r)
                    ? r.install.call(r, t.moduleContext, i)
                    : r.install.call(r, t.pluginContext, i);
                  return (
                    this[''.concat(o)]
                      ? (R.warn(
                          'There is a duplicate plugin name. `'.concat(
                            o,
                            '` plugin namespace will be override.'
                          )
                        ),
                        (this[''.concat(o)] = a))
                      : void 0 !== a && (this[''.concat(o)] = a),
                    e.addModule(o, r),
                    this
                  );
                };
              }),
              t
            );
          })(H),
          K = new Promise(function (e) {
            N = e;
          }),
          J = 'UNKNOWN',
          q = 'UNAUTHORIZED',
          $ = 'INVALID_ARGUMENT',
          z = 'INIT_FAILED',
          X = 'FORBIDDEN',
          Q = 'INVALID_CONFIG',
          Y = 'INVALID_ID_TOKEN',
          Z = 'CREATE_SUBWINDOW_FAILED',
          ee = 'EXCEPTION_IN_SUBWINDOW',
          te = 'liffEvent',
          ne = 'LIFF_STORE',
          re = 'https://liff.'.concat('line.me', '/'),
          ie = {
            ACCESS_TOKEN: 'accessToken',
            ID_TOKEN: 'IDToken',
            DECODED_ID_TOKEN: 'decodedIDToken',
            FEATURE_TOKEN: 'featureToken',
            LOGIN_TMP: 'loginTmp',
            CONFIG: 'config',
            CONTEXT: 'context',
            EXPIRES: 'expires',
            RAW_CONTEXT: 'rawContext',
            CLIENT_ID: 'clientId',
            IS_SUBSEQUENT_LIFF_APP: 'isSubsequentLiffApp',
            MST_CHALLENGE: 'mstChallenge',
            MSIT: 'msit',
            MST: 'mst',
            MST_VERIFIER: 'mstVerifier',
            APP_DATA: 'appData',
          },
          oe = 'isInClient',
          ae = [
            'context_token',
            'feature_token',
            'access_token',
            'id_token',
            'client_id',
            'mst_verifier',
            'mst_challenge',
            'msit',
          ],
          se = [
            'liff.ref.source',
            'liff.ref.medium',
            'liff.ref.campaign',
            'liff.ref.term',
            'liff.ref.content',
          ],
          ce = { INIT: 'init', SUBMIT: 'submit', CANCEL: 'cancel', CLOSE: 'close', ERROR: 'error' },
          ue = 'liff.subwindow',
          le = 'healthCheck',
          fe = ['profile', 'chat_message.write', 'openid', 'email'];
        function de(e) {
          return window.atob(e.replace(/-/g, '+').replace(/_/g, '/'));
        }
        var he = {
          decode: de,
          encode: function (e) {
            return window.btoa(e).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
          },
          decodeUnicode: function (e) {
            var t = de(e)
              .split('')
              .map(function (e) {
                return '%' + ('00' + e.charCodeAt(0).toString(16)).slice(-2);
              })
              .join('');
            return decodeURIComponent(t);
          },
        };
        function pe(e, t) {
          if (e === t) return 0;
          for (
            var n = e.split('.'), r = t.split('.'), i = Math.max(n.length, r.length), o = 0;
            o < i;
            o++
          ) {
            n[o] || (n[o] = '0'), r[o] || (r[o] = '0');
            var a = parseInt(n[o]) - parseInt(r[o]);
            if (0 !== a) return a > 0 ? 1 : -1;
          }
          return 0;
        }
        function ve(e) {
          var t = e.replace('#', '').match(/.{2}/g) || [];
          if (4 !== t.length) return R.warn('convertArgbToRgba: Received invalid ARGB color'), '';
          var n = (function (e) {
              var t = we(e);
              return Math.round((t / 255) * 100) / 100;
            })(t[0]),
            r = we(t[1]),
            i = we(t[2]),
            o = we(t[3]);
          return 'rgba('.concat(r, ', ').concat(i, ', ').concat(o, ', ').concat(n, ')');
        }
        function we(e) {
          return parseInt(e, 16);
        }
        function be(e) {
          var t = e.replace('#', '').match(/.{2}/g) || [];
          if (3 !== t.length) return R.warn('convertArgbToRgba: Received invalid hex color'), '';
          var n = we(t[0]),
            r = we(t[1]),
            i = we(t[2]);
          return ''.concat(n, ', ').concat(r, ', ').concat(i);
        }
        function me(e) {
          for (var t = e.length, n = new ArrayBuffer(t), r = new Uint8Array(n), i = 0; i < t; i++)
            r[i] = e.charCodeAt(i);
          return n;
        }
        var ge = function (e) {
            var t = new RegExp('(?:(?:^|.*;\\s*)'.concat(e, '\\s*\\=\\s*([^;]*).*$)|^.*$'));
            return document.cookie.replace(t, '$1');
          },
          ye = function (e, t, n) {
            var r = e + '=' + t;
            if (n)
              for (var i in n) {
                var o = n[i] ? '='.concat(n[i]) : '';
                r += '; '.concat(i).concat(o);
              }
            R.debug('set cookie', r), (document.cookie = r);
          },
          Ie = function (e, t) {
            var n = ''.concat(e, '=; expires=Thu, 01 Jan 1970 00:00:00 GMT');
            if (t) for (var r in t) n += '; '.concat(r, '=').concat(t[r]);
            document.cookie = n;
          },
          Te = new Set(['400', '401', '403', '404', '429', '500']),
          Ee = (function (e) {
            function t(t, n) {
              var r = e.call(this, n) || this;
              return (r.code = t), r;
            }
            return O(t, e), t;
          })(Error);
        function Se(e, t) {
          return new Ee(e, t || '');
        }
        function Ce(e) {
          var t = e.match(/([^-]+)-[^-]+/);
          return t && t[1];
        }
        var _e = (function () {
            function e() {
              this.map = {};
            }
            return (
              (e.prototype.clear = function () {
                this.map = {};
              }),
              (e.prototype.getItem = function (e) {
                var t = this.map[e];
                return void 0 === t ? null : t;
              }),
              (e.prototype.setItem = function (e, t) {
                this.map[e] = t;
              }),
              (e.prototype.removeItem = function (e) {
                delete this.map[e];
              }),
              (e.prototype.key = function (e) {
                var t = Object.keys(this.map)[e];
                return void 0 === t ? null : t;
              }),
              Object.defineProperty(e.prototype, 'length', {
                get: function () {
                  return Object.keys(this.map).length;
                },
                enumerable: !1,
                configurable: !0,
              }),
              e
            );
          })(),
          Oe = function (e) {
            return e
              .replace(/^\?/, '')
              .replace(/^#\/?/, '')
              .split(/&+/)
              .filter(function (e) {
                return e.length > 0;
              })
              .reduce(function (e, t) {
                var n = L(t.split('=').map(decodeURIComponent), 2),
                  r = n[0],
                  i = n[1],
                  o = e[r];
                return (
                  Array.isArray(o)
                    ? o.push(i)
                    : Object.prototype.hasOwnProperty.call(e, r)
                      ? (e[r] = [o, i])
                      : (e[r] = i),
                  e
                );
              }, {});
          },
          ke = function (e) {
            return Object.keys(e)
              .map(function (t) {
                var n = e[t],
                  r = function (e) {
                    return void 0 !== e
                      ? ''.concat(encodeURIComponent(t), '=').concat(encodeURIComponent(e))
                      : encodeURIComponent(t);
                  };
                return Array.isArray(n)
                  ? n
                      .map(function (e) {
                        return r(e);
                      })
                      .join('&')
                  : r(n);
              })
              .join('&');
          },
          Pe = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
        function Ae(e) {
          for (var t = '', n = 0; n < e; n++)
            t +=
              Pe[
                Math.floor(
                  (window.crypto.getRandomValues(new Uint32Array(1))[0] / 4294967296) * Pe.length
                )
              ];
          return t;
        }
        function xe(e) {
          var t = new URL(e),
            n = t.hash
              .slice(1)
              .split('&')
              .filter(function (e) {
                return !ae.some(function (t) {
                  return e.includes(''.concat(t, '='));
                });
              })
              .join('&');
          return (t.hash = n), t.toString();
        }
        function Le(e) {
          var t,
            n,
            r = new URL(e);
          return r
            .toString()
            .replace(
              new RegExp(
                String.raw(
                  je ||
                    ((t = ['^', '']),
                    (n = ['^', '']),
                    Object.defineProperty
                      ? Object.defineProperty(t, 'raw', { value: n })
                      : (t.raw = n),
                    (je = t)),
                  r.origin
                )
              ),
              ''
            );
        }
        var je;
        function Fe(e, t) {
          if (!e) throw new Error('addParamsToUrl: invalid URL');
          var n = new URL(e);
          return (
            Object.entries(t).forEach(function (e) {
              var t = L(e, 2),
                r = t[0],
                i = t[1];
              n.searchParams.set(r, i);
            }),
            n.toString()
          );
        }
        function Ne(e) {
          var t,
            n = e.match(
              ((t = re.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
              new RegExp('^'.concat(t, '(\\d+-\\w+)')))
            );
          return n && n[1];
        }
        function Ue(e) {
          return void 0 === e && (e = window.navigator.userAgent), /ipad/.test(e.toLowerCase());
        }
        function Re(e) {
          return void 0 === e && (e = window.navigator.userAgent), /Line\/\d+\.\d+\.\d+/.test(e);
        }
        function De(e) {
          return (
            void 0 === e && (e = window.navigator.userAgent), /Line\/\d+\.\d+\.\d+ LIFF/.test(e)
          );
        }
        var Be = function () {
            return 'undefined' == typeof window;
          },
          Me = null;
        function We() {
          return (
            null === Me &&
              ((Me =
                De() ||
                (Re() && /[#|&]access_token=/.test(location.hash)) ||
                '1' === sessionStorage.getItem(''.concat(ne, ':').concat(oe))),
              sessionStorage.setItem(''.concat(ne, ':').concat(oe), Me ? '1' : '0')),
            !!Me
          );
        }
        !(function (e) {
          function t() {
            return (null !== e && e.apply(this, arguments)) || this;
          }
          O(t, e),
            Object.defineProperty(t.prototype, 'name', {
              get: function () {
                return 'isInClient';
              },
              enumerable: !1,
              configurable: !0,
            }),
            (t.prototype.install = function () {
              return function () {
                return We();
              };
            });
        })(H);
        function He() {
          var e;
          return null !== (e = window.__liffConfig) && void 0 !== e ? e : {};
        }
        function Ve(e) {
          return (function (e, t) {
            if (!t) throw Se(Q, 'liffId is necessary for liff.init()');
            var n = (We() ? sessionStorage : localStorage).getItem(
              ''.concat(ne, ':').concat(t, ':').concat(e)
            );
            try {
              return null === n ? null : JSON.parse(n);
            } catch (r) {
              return null;
            }
          })(e, He().liffId);
        }
        function Ge(e, t) {
          var n = He().liffId;
          if (!n) throw Se(Q, 'liffId is necessary for liff.init()');
          (We() ? sessionStorage : localStorage).setItem(
            ''.concat(ne, ':').concat(n, ':').concat(e),
            JSON.stringify(t)
          );
        }
        function Ke() {
          return Ve(ie.CONTEXT);
        }
        function Je(e) {
          Ge(ie.CONTEXT, e);
        }
        !(function (e) {
          function t() {
            return (null !== e && e.apply(this, arguments)) || this;
          }
          O(t, e),
            Object.defineProperty(t.prototype, 'name', {
              get: function () {
                return 'getContext';
              },
              enumerable: !1,
              configurable: !0,
            }),
            (t.prototype.install = function () {
              return function () {
                return Ke();
              };
            });
        })(H);
        function qe() {
          return ((Ke() || {}).d || {}).aId;
        }
        !(function (e) {
          function t() {
            return (null !== e && e.apply(this, arguments)) || this;
          }
          O(t, e),
            Object.defineProperty(t.prototype, 'name', {
              get: function () {
                return 'getAId';
              },
              enumerable: !1,
              configurable: !0,
            }),
            (t.prototype.install = function () {
              return function () {
                return qe();
              };
            });
        })(H);
        function $e() {
          return ((Ke() || {}).d || {}).autoplay || !1;
        }
        !(function (e) {
          function t() {
            return (null !== e && e.apply(this, arguments)) || this;
          }
          O(t, e),
            Object.defineProperty(t.prototype, 'name', {
              get: function () {
                return 'getIsVideoAutoPlay';
              },
              enumerable: !1,
              configurable: !0,
            }),
            (t.prototype.install = function () {
              return function () {
                return $e();
              };
            });
        })(H);
        function ze() {
          return (Ke() || {}).profilePlus;
        }
        !(function (e) {
          function t() {
            return (null !== e && e.apply(this, arguments)) || this;
          }
          O(t, e),
            Object.defineProperty(t.prototype, 'name', {
              get: function () {
                return 'getProfilePlus';
              },
              enumerable: !1,
              configurable: !0,
            }),
            (t.prototype.install = function () {
              return function () {
                return ze();
              };
            });
        })(H);
        function Xe(e) {
          Ge(ie.APP_DATA, e);
        }
        function Qe() {
          return Ve(ie.MST);
        }
        function Ye() {
          return Ve(ie.MST_CHALLENGE);
        }
        function Ze(e) {
          Ge(ie.CLIENT_ID, e);
        }
        function et() {
          return Ve(ie.FEATURE_TOKEN);
        }
        function tt(e) {
          Ge(ie.FEATURE_TOKEN, e);
        }
        function nt() {
          return Ve(ie.ID_TOKEN);
        }
        function rt(e) {
          Ge(ie.ID_TOKEN, e);
        }
        !(function (e) {
          function t() {
            return (null !== e && e.apply(this, arguments)) || this;
          }
          O(t, e),
            Object.defineProperty(t.prototype, 'name', {
              get: function () {
                return 'getIDToken';
              },
              enumerable: !1,
              configurable: !0,
            }),
            (t.prototype.install = function () {
              return function () {
                return nt();
              };
            });
        })(H);
        function it() {
          return Ve(ie.ACCESS_TOKEN);
        }
        function ot(e) {
          Ge(ie.ACCESS_TOKEN, e);
        }
        !(function (e) {
          function t() {
            return (null !== e && e.apply(this, arguments)) || this;
          }
          O(t, e),
            Object.defineProperty(t.prototype, 'name', {
              get: function () {
                return 'getAccessToken';
              },
              enumerable: !1,
              configurable: !0,
            }),
            (t.prototype.install = function () {
              return function () {
                return it();
              };
            });
        })(H);
        function at(e) {
          var t = He().liffId;
          if (!t) throw Se(Q, 'liffId is necessary for liff.init()');
          (We() ? sessionStorage : localStorage).removeItem(
            ''.concat(ne, ':').concat(t, ':').concat(e)
          );
        }
        function st() {
          return Ve(ie.LOGIN_TMP);
        }
        function ct() {
          at(ie.LOGIN_TMP);
        }
        function ut(e) {
          var t = He();
          ye(''.concat(ne, ':').concat(ie.EXPIRES, ':').concat(t.liffId), e.getTime(), {
            expires: e.toUTCString(),
            path: '/',
            secure: null,
          });
        }
        function lt() {
          return Ve(ie.DECODED_ID_TOKEN);
        }
        function ft(e) {
          Ge(ie.DECODED_ID_TOKEN, e);
        }
        !(function (e) {
          function t() {
            return (null !== e && e.apply(this, arguments)) || this;
          }
          O(t, e),
            Object.defineProperty(t.prototype, 'name', {
              get: function () {
                return 'getDecodedIDToken';
              },
              enumerable: !1,
              configurable: !0,
            }),
            (t.prototype.install = function () {
              return function () {
                return lt();
              };
            });
        })(H);
        function dt() {
          Object.keys(ie).forEach(function (e) {
            at(ie[e]);
          }),
            (function () {
              var e = He();
              Ie(''.concat(ne, ':').concat(ie.EXPIRES, ':').concat(e.liffId), { path: '/' });
            })();
        }
        function ht() {
          return !!it();
        }
        !(function (e) {
          function t() {
            return (null !== e && e.apply(this, arguments)) || this;
          }
          O(t, e),
            Object.defineProperty(t.prototype, 'name', {
              get: function () {
                return 'isLoggedIn';
              },
              enumerable: !1,
              configurable: !0,
            }),
            (t.prototype.install = function () {
              return function () {
                return ht();
              };
            });
        })(H);
        function pt() {
          return '2.22.3';
        }
        !(function (e) {
          function t() {
            return (null !== e && e.apply(this, arguments)) || this;
          }
          O(t, e),
            Object.defineProperty(t.prototype, 'name', {
              get: function () {
                return 'getVersion';
              },
              enumerable: !1,
              configurable: !0,
            }),
            (t.prototype.install = function () {
              return function () {
                return '2.22.3';
              };
            });
        })(H);
        var vt = (function () {
            function e() {}
            return (
              (e.prototype.invoke = function () {
                return (function (e) {
                  return (
                    void 0 === e && (e = window.navigator.userAgent), /LIFF\/SubWindow/.test(e)
                  );
                })();
              }),
              e
            );
          })(),
          wt = (function () {
            function e(e) {
              this.storage = e;
            }
            return (
              Object.defineProperty(e, 'IN_SUB_WINDOW_KEY', {
                get: function () {
                  return 'inSubWindow';
                },
                enumerable: !1,
                configurable: !0,
              }),
              (e.prototype.invoke = function () {
                return (
                  new URLSearchParams(window.location.search).has(ue) && this.setInSubWindow(!0),
                  !(!this.getInSubWindow() && !this.getSubWindowIdentifier())
                );
              }),
              (e.prototype.getInSubWindow = function () {
                var t = this.storage.getItem(
                  ''.concat(ne, ':').concat(this.getLiffId(), ':').concat(e.IN_SUB_WINDOW_KEY)
                );
                return null !== t && JSON.parse(t);
              }),
              (e.prototype.getSubWindowIdentifier = function () {
                var e,
                  t = 'liff.subwindow.identifier',
                  n = new URLSearchParams(window.location.search);
                return (
                  n.get(t) ||
                  (t,
                  (e = n.get('liff.state'))
                    ? new URLSearchParams(e).get('liff.subwindow.identifier')
                    : null) ||
                  null
                );
              }),
              (e.prototype.setInSubWindow = function (t) {
                this.storage.setItem(
                  ''.concat(ne, ':').concat(this.getLiffId(), ':').concat(e.IN_SUB_WINDOW_KEY),
                  String(t)
                );
              }),
              (e.prototype.getLiffId = function () {
                var e = He().liffId;
                if (!e) throw Se(Q, 'liffId is necessary for liff.init()');
                return e;
              }),
              e
            );
          })(),
          bt = new ((function (e) {
            function t() {
              var t = e.call(this) || this;
              return (
                Be()
                  ? (t.impl = {
                      invoke: function () {
                        return !1;
                      },
                    })
                  : We()
                    ? (t.impl = new vt())
                    : (t.impl = new wt(window.sessionStorage)),
                t
              );
            }
            return (
              O(t, e),
              Object.defineProperty(t.prototype, 'name', {
                get: function () {
                  return 'isSubWindow';
                },
                enumerable: !1,
                configurable: !0,
              }),
              (t.prototype.install = function () {
                return this.impl.invoke.bind(this.impl);
              }),
              t
            );
          })(H))(),
          mt = bt.install();
        function gt() {
          var e = navigator.userAgent.match(/Line\/\d+(\.\d+)*/i);
          return e ? e[0].slice(5) : null;
        }
        !(function (e) {
          function t() {
            return (null !== e && e.apply(this, arguments)) || this;
          }
          O(t, e),
            Object.defineProperty(t.prototype, 'name', {
              get: function () {
                return 'getLineVersion';
              },
              enumerable: !1,
              configurable: !0,
            }),
            (t.prototype.install = function () {
              return function () {
                return gt();
              };
            });
        })(H);
        function yt(e) {
          var t,
            n = Ke();
          return null === (t = null == n ? void 0 : n.availability) || void 0 === t ? void 0 : t[e];
        }
        function It(e, t) {
          var n = yt(e);
          if (!n || !n.permission)
            return {
              available: !1,
              error: { code: X, message: ''.concat(e, ' is not allowed in this LIFF app') },
            };
          var r = n.minVer,
            i = n.unsupportedFromVer;
          if (We()) {
            var o = (function (e, t) {
              var n = gt();
              return !!n && !(t && pe(n, t) > 0) && pe(n, e) >= 0;
            })(r, i);
            return o
              ? { available: !0 }
              : {
                  available: !1,
                  error: {
                    code: X,
                    message: ''.concat(e, ' is unavailable in this client version.'),
                  },
                };
          }
          return t
            ? { available: !0 }
            : {
                available: !1,
                error: { code: X, message: ''.concat(e, ' is not allowed in external browser') },
              };
        }
        var Tt = function () {
            return ht()
              ? !De() && Re()
                ? {
                    available: !1,
                    error: { code: X, message: 'Subwindow is not supported in this browser' },
                  }
                : mt()
                  ? {
                      available: !1,
                      error: { code: X, message: 'this api can be only called in parent window' },
                    }
                  : It('subwindowOpen', !0)
              : {
                  available: !1,
                  error: { code: q, message: 'Need access_token for api call, Please login first' },
                };
          },
          Et = [
            'subwindowOpen',
            'shareTargetPicker',
            'multipleLiffTransition',
            'scanCode',
            'scanCodeV2',
            'getAdvertisingId',
            'addToHomeScreen',
            'bluetoothLeFunction',
            'skipChannelVerificationScreen',
          ],
          St = {
            scanCode: function () {
              return It('scanCode');
            },
            getAdvertisingId: function () {
              return It('getAdvertisingId');
            },
            bluetoothLeFunction: function () {
              return It('bluetoothLeFunction');
            },
            shareTargetPicker: function () {
              return mt()
                ? {
                    available: !1,
                    error: { code: X, message: 'this api can be only called in parent window' },
                  }
                : ht()
                  ? It('shareTargetPicker', !0)
                  : {
                      available: !1,
                      error: {
                        code: q,
                        message: 'Need access_token for api call, Please login first',
                      },
                    };
            },
            multipleLiffTransition: function () {
              var e = yt('multipleLiffTransition');
              return e && e.permission
                ? We()
                  ? { available: !0 }
                  : {
                      available: !1,
                      error: {
                        code: X,
                        message: 'multipleLiffTransition is available only in the LINE App browser',
                      },
                    }
                : {
                    available: !1,
                    error: {
                      code: X,
                      message: 'multipleLiffTransition is not allowed in this LIFF app',
                    },
                  };
            },
            subwindowOpen: Tt,
            scanCodeV2: function () {
              if (!ht())
                return {
                  available: !1,
                  error: { code: q, message: 'Need access_token for api call, Please login first' },
                };
              var e = Tt();
              return e.available ? It('scanCodeV2', !0) : e;
            },
            addToHomeScreen: function () {
              return mt()
                ? {
                    available: !1,
                    error: { code: X, message: 'this api can be only called in parent window' },
                  }
                : It('addToHomeScreen');
            },
            skipChannelVerificationScreen: function () {
              var e = Ke();
              return e
                ? 'square_chat' === e.type
                  ? {
                      available: !1,
                      error: {
                        code: X,
                        message: 'skipChannelVerificationScreen is not allowed in OpenChat',
                      },
                    }
                  : It('skipChannelVerificationScreen')
                : { available: !1, error: { code: X, message: 'Context is not found' } };
            },
          },
          Ct = function (e) {
            return function () {
              var t = e();
              if (!t.available) throw Se(t.error.code, t.error.message);
            };
          },
          _t = {
            scanCode: Ct(St.scanCode),
            getAdvertisingId: Ct(St.getAdvertisingId),
            bluetoothLeFunction: Ct(St.bluetoothLeFunction),
            shareTargetPicker: Ct(St.shareTargetPicker),
            multipleLiffTransition: Ct(St.multipleLiffTransition),
            subwindowOpen: Ct(St.subwindowOpen),
            scanCodeV2: Ct(St.scanCodeV2),
            addToHomeScreen: Ct(St.addToHomeScreen),
            skipChannelVerificationScreen: Ct(St.skipChannelVerificationScreen),
          };
        function Ot(e) {
          if (
            !(function (e) {
              return Et.some(function (t) {
                return t === e;
              });
            })(e)
          )
            throw Se($, 'Unexpected API name.');
          var t = St[e];
          return !t || t().available;
        }
        !(function (e) {
          function t() {
            var t = (null !== e && e.apply(this, arguments)) || this;
            return (t.hooks = {}), t;
          }
          O(t, e),
            Object.defineProperty(t.prototype, 'name', {
              get: function () {
                return 'isApiAvailable';
              },
              enumerable: !1,
              configurable: !0,
            }),
            (t.prototype.install = function () {
              return function (e) {
                return Ot(e);
              };
            });
        })(H);
        var kt,
          Pt = (function () {
            function e() {}
            return (
              (e.prototype.invoke = function (e) {
                var t = _t[e];
                return !!t && (t(), !0);
              }),
              e
            );
          })(),
          At = (function () {
            function e(e) {
              this.liff = e;
            }
            return (
              (e.prototype.invoke = function (e) {
                return this.liff.checkFeature(e);
              }),
              e
            );
          })(),
          xt = (function () {
            function e(t) {
              pe('2.22.3', e.SDK_VERSION_SUPPORTING_NEW) >= 0
                ? (this.impl = new Pt())
                : (this.impl = new At(t));
            }
            return (
              Object.defineProperty(e, 'SDK_VERSION_SUPPORTING_NEW', {
                get: function () {
                  return '2.11.0';
                },
                enumerable: !1,
                configurable: !0,
              }),
              (e.prototype.invoke = function (e) {
                return this.impl.invoke(e);
              }),
              e
            );
          })();
        function Lt() {
          if (!kt) {
            var e = window.navigator.userAgent.toLowerCase();
            kt = /iphone|ipad|ipod/.test(e) ? 'ios' : /android/.test(e) ? 'android' : 'web';
          }
          return kt;
        }
        !(function (e) {
          function t() {
            return e.call(this) || this;
          }
          O(t, e),
            Object.defineProperty(t.prototype, 'name', {
              get: function () {
                return 'getOS';
              },
              enumerable: !1,
              configurable: !0,
            }),
            (t.prototype.install = function () {
              return function () {
                return Lt();
              };
            });
        })(H);
        var jt = function (e, t) {
          return (
            (jt =
              Object.setPrototypeOf ||
              ({ __proto__: [] } instanceof Array &&
                function (e, t) {
                  e.__proto__ = t;
                }) ||
              function (e, t) {
                for (var n in t) Object.prototype.hasOwnProperty.call(t, n) && (e[n] = t[n]);
              }),
            jt(e, t)
          );
        };
        var Ft = !1,
          Nt = (function (e) {
            function t() {
              return (null !== e && e.apply(this, arguments)) || this;
            }
            return (
              (function (e, t) {
                if ('function' != typeof t && null !== t)
                  throw new TypeError(
                    'Class extends value ' + String(t) + ' is not a constructor or null'
                  );
                function n() {
                  this.constructor = e;
                }
                jt(e, t),
                  (e.prototype =
                    null === t ? Object.create(t) : ((n.prototype = t.prototype), new n()));
              })(t, e),
              Object.defineProperty(t.prototype, 'name', {
                get: function () {
                  return '_legacyExtensionsEnabled';
                },
                enumerable: !1,
                configurable: !0,
              }),
              (t.prototype.install = function () {
                Ft = !0;
              }),
              t
            );
          })(H);
        function Ut() {
          return Ft
            ? (function () {
                return (function (e, t, n, r) {
                  return new (n || (n = Promise))(function (i, o) {
                    function a(e) {
                      try {
                        c(r.next(e));
                      } catch (t) {
                        o(t);
                      }
                    }
                    function s(e) {
                      try {
                        c(r.throw(e));
                      } catch (t) {
                        o(t);
                      }
                    }
                    function c(e) {
                      var t;
                      e.done
                        ? i(e.value)
                        : ((t = e.value),
                          t instanceof n
                            ? t
                            : new n(function (e) {
                                e(t);
                              })).then(a, s);
                    }
                    c((r = r.apply(e, t || [])).next());
                  });
                })(this, void 0, void 0, function () {
                  return (function (e, t) {
                    var n,
                      r,
                      i,
                      o,
                      a = {
                        label: 0,
                        sent: function () {
                          if (1 & i[0]) throw i[1];
                          return i[1];
                        },
                        trys: [],
                        ops: [],
                      };
                    return (
                      (o = { next: s(0), throw: s(1), return: s(2) }),
                      'function' == typeof Symbol &&
                        (o[Symbol.iterator] = function () {
                          return this;
                        }),
                      o
                    );
                    function s(o) {
                      return function (s) {
                        return (function (o) {
                          if (n) throw new TypeError('Generator is already executing.');
                          for (; a; )
                            try {
                              if (
                                ((n = 1),
                                r &&
                                  (i =
                                    2 & o[0]
                                      ? r.return
                                      : o[0]
                                        ? r.throw || ((i = r.return) && i.call(r), 0)
                                        : r.next) &&
                                  !(i = i.call(r, o[1])).done)
                              )
                                return i;
                              switch (((r = 0), i && (o = [2 & o[0], i.value]), o[0])) {
                                case 0:
                                case 1:
                                  i = o;
                                  break;
                                case 4:
                                  return a.label++, { value: o[1], done: !1 };
                                case 5:
                                  a.label++, (r = o[1]), (o = [0]);
                                  continue;
                                case 7:
                                  (o = a.ops.pop()), a.trys.pop();
                                  continue;
                                default:
                                  if (
                                    !(
                                      (i = (i = a.trys).length > 0 && i[i.length - 1]) ||
                                      (6 !== o[0] && 2 !== o[0])
                                    )
                                  ) {
                                    a = 0;
                                    continue;
                                  }
                                  if (3 === o[0] && (!i || (o[1] > i[0] && o[1] < i[3]))) {
                                    a.label = o[1];
                                    break;
                                  }
                                  if (6 === o[0] && a.label < i[1]) {
                                    (a.label = i[1]), (i = o);
                                    break;
                                  }
                                  if (i && a.label < i[2]) {
                                    (a.label = i[2]), a.ops.push(o);
                                    break;
                                  }
                                  i[2] && a.ops.pop(), a.trys.pop();
                                  continue;
                              }
                              o = t.call(e, a);
                            } catch (s) {
                              (o = [6, s]), (r = 0);
                            } finally {
                              n = i = 0;
                            }
                          if (5 & o[0]) throw o[1];
                          return { value: o[0] ? o[1] : void 0, done: !0 };
                        })([o, s]);
                      };
                    }
                  })(this, function (e) {
                    switch (e.label) {
                      case 0:
                        return [3, 2];
                      case 1:
                        return [2, e.sent().default];
                      case 2:
                        return [
                          2,
                          new Promise(function (e, t) {
                            var n = document.createElement('script'),
                              r = (function () {
                                var e;
                                return 'ios' === Lt()
                                  ? (e = gt()) && pe(e, '9.19.0') < 0
                                    ? 'https://static.line-scdn.net/liff/edge/2/ios-918-extensions_2_22_0.js'
                                    : 'https://static.line-scdn.net/liff/edge/2/ios-extensions_2_22_0.js'
                                  : 'https://static.line-scdn.net/liff/edge/2/non-ios-extensions_2_22_0.js';
                              })();
                            (n.onload = function () {
                              var n = window.liffClientExtension;
                              n
                                ? e(n)
                                : t(Se(z, 'Unable to load client features. (Extension is empty)'));
                            }),
                              (n.onerror = function () {
                                t(Se(z, 'Unable to load client features.'));
                              }),
                              (n.src = r),
                              (n.type = 'text/javascript'),
                              document.body.appendChild(n);
                          }),
                        ];
                    }
                  });
                });
              })()
            : Promise.resolve(void 0);
        }
        function Rt() {
          dt();
        }
        !(function (e) {
          function t() {
            return (null !== e && e.apply(this, arguments)) || this;
          }
          O(t, e),
            Object.defineProperty(t.prototype, 'name', {
              get: function () {
                return 'logout';
              },
              enumerable: !1,
              configurable: !0,
            }),
            (t.prototype.install = function () {
              return function () {
                return Rt();
              };
            });
        })(H);
        function Dt(e) {
          return P(this, void 0, void 0, function () {
            var t, n, r;
            return A(this, function (i) {
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
                  return (
                    (t = String(e.status)),
                    (n = Te.has(t) ? t : J),
                    [
                      4,
                      e.json().catch(function () {
                        throw Se(n, e.statusText);
                      }),
                    ]
                  );
                case 5:
                  throw Se((r = i.sent()).error || n, r.error_description || r.message);
              }
            });
          });
        }
        function Bt(e) {
          var t = (function (e) {
            if (e) return e;
            var t = it();
            if (!t) throw Se(q, 'Need access_token for api call, Please login first');
            return {
              'Content-Type': 'application/json',
              Accept: 'application/json',
              Authorization: 'Bearer '.concat(t),
            };
          })(e && e.headers);
          return k(k({}, e), { headers: t });
        }
        function Mt(e, t) {
          var n;
          try {
            n = Bt(t);
          } catch (r) {
            return Promise.reject(r);
          }
          return fetch(e, n).then(Dt);
        }
        function Wt(e, t) {
          var n;
          try {
            n = Bt(t);
          } catch (r) {
            return Promise.reject(r);
          }
          return fetch(e, n);
        }
        function Ht(e) {
          var t = e.subdomain,
            n = void 0 === t ? 'api' : t,
            r = e.pathname;
          return 'https://'.concat(n, '.').concat('line.me', '/').concat(r);
        }
        var Vt = {
          token: Ht({ pathname: 'oauth2/v2.1/token' }),
          certs: Ht({ pathname: 'oauth2/v2.1/certs' }),
          'openid-configuration': Ht({
            subdomain: 'access',
            pathname: '.well-known/openid-configuration',
          }),
          authorize: Ht({ subdomain: 'access', pathname: 'liff/v1/authorize' }),
          profile: Ht({ pathname: 'v2/profile' }),
          message: Ht({ pathname: 'message/v3/share' }),
          friendship: Ht({ pathname: 'friendship/v1/status' }),
          shareTargetPicker: Ht({
            subdomain: 'access',
            pathname: 'oauth2/v2.1/liff/shareTargetPicker',
          }),
          shareTargetPickerOtt: Ht({ pathname: 'liff/v2/apps' }),
          shareTargetPickerResult: Ht({
            subdomain: 'access',
            pathname: 'oauth2/v2.1/liff/shareTargetPicker/result',
          }),
          apps: Ht({ pathname: 'liff/v2/apps' }),
          subWindowGetMSIT: Ht({ pathname: 'liff/v2/sub/msit' }),
          subWindowGetMSTByMSIT: Ht({ pathname: 'liff/v2/sub/mst' }),
          subWindowSubscribe: Ht({ subdomain: 'liff', pathname: 'liff/v2/sub/waitResult' }),
          subWindowPost: Ht({ pathname: 'liff/v2/sub/result' }),
          subWindowGetAppData: Ht({ pathname: 'liff/v2/sub/appData' }),
          subWindowGetOrigin: function (e) {
            return Ht({ pathname: 'liff/v2/sub/'.concat(e, '/origin') });
          },
          accessTokenVerify: Ht({ pathname: 'oauth2/v2.1/verify' }),
          unauthorizedPermissions: Ht({
            subdomain: 'liff',
            pathname: 'liff/v2/incrementalAgreement/unauthorizedPermissions',
          }),
          permanentLink: Ht({ subdomain: 'liff', pathname: 'liff/v2/permanentLink' }),
        };
        function Gt(e) {
          return Vt[e];
        }
        function Kt(e) {
          return Mt(
            ''.concat(Gt('accessTokenVerify'), '?access_token=').concat(encodeURIComponent(e)),
            { headers: { 'Content-Type': 'application/json', Accept: 'application/json' } }
          );
        }
        var Jt = 'liff.subwindow.identifier',
          qt = 'liff.subwindow.cryptokey',
          $t = k(k({}, ce), {
            GET_DATA: 'getData',
            SET_DATA: 'setData',
            NOT_FOUND: 'notFound',
            TEARDOWN: 'teardown',
          }),
          zt = 'broadcast',
          Xt = 'command',
          Qt = 'main',
          Yt = 'sub',
          Zt = function (e) {
            return P(void 0, void 0, void 0, function () {
              var t;
              return A(this, function (n) {
                switch (n.label) {
                  case 0:
                    return (
                      n.trys.push([0, 2, , 3]),
                      [
                        4,
                        window.crypto.subtle.importKey(
                          'jwk',
                          { kty: 'oct', k: e, alg: 'A128GCM', ext: !0 },
                          { name: 'AES-GCM' },
                          !1,
                          ['encrypt', 'decrypt']
                        ),
                      ]
                    );
                  case 1:
                    return [2, n.sent()];
                  case 2:
                    throw ((t = n.sent()), Se(J, t));
                  case 3:
                    return [2];
                }
              });
            });
          },
          en = function (e, t, n) {
            return P(void 0, void 0, void 0, function () {
              var r, i, o, a;
              return A(this, function (s) {
                switch (s.label) {
                  case 0:
                    return s.trys.push([0, 3, , 4]), (r = new TextEncoder().encode(e)), [4, Zt(t)];
                  case 1:
                    return (
                      (i = s.sent()),
                      [
                        4,
                        window.crypto.subtle.encrypt(
                          { name: 'AES-GCM', iv: r },
                          i,
                          new TextEncoder().encode(n)
                        ),
                      ]
                    );
                  case 2:
                    return (
                      (o = s.sent()),
                      [
                        2,
                        btoa(
                          new Uint8Array(o).reduce(function (e, t) {
                            return e + String.fromCharCode(t);
                          }, '')
                        ),
                      ]
                    );
                  case 3:
                    throw ((a = s.sent()), Se(J, a));
                  case 4:
                    return [2];
                }
              });
            });
          },
          tn = function (e, t, n) {
            return P(void 0, void 0, void 0, function () {
              var r, i, o, a, s, c, u;
              return A(this, function (l) {
                switch (l.label) {
                  case 0:
                    return l.trys.push([0, 3, , 4]), (r = new TextEncoder().encode(e)), [4, Zt(t)];
                  case 1:
                    for (
                      i = l.sent(), o = atob(n), a = new Uint8Array(o.length), s = 0;
                      s < o.length;
                      s++
                    )
                      a[s] = o.charCodeAt(s);
                    return [
                      4,
                      window.crypto.subtle.decrypt({ name: 'AES-GCM', iv: r }, i, a.buffer),
                    ];
                  case 2:
                    return (c = l.sent()), [2, new TextDecoder().decode(new Uint8Array(c))];
                  case 3:
                    throw ((u = l.sent()), Se(J, u));
                  case 4:
                    return [2];
                }
              });
            });
          },
          nn = function (e) {
            return ''.concat(e.identifier, '-').concat(e.action, '-').concat(e.timestamp);
          },
          rn = function (e) {
            return Object.keys(ce)
              .map(function (e) {
                return ce[e];
              })
              .includes(e)
              ? zt
              : Xt;
          };
        function on() {
          var e = document.createElement('form');
          (e.method = 'POST'), (e.action = '$MESSAGE_HANDLER_URL');
          var t = document.createElement('input');
          (t.type = 'hidden'),
            (t.name = 'identifier'),
            (t.value = '$IDENTIFIER'),
            e.appendChild(t),
            document.body.appendChild(e),
            e.submit();
        }
        var an = function (e) {
          void 0 === e && (e = Qt);
          var t = this;
          (this.identification = { identifier: '', cryptoKey: '' }),
            (this.messageHandlerInstance = null),
            (this.listeners = new Map()),
            (this.sentMessages = []),
            (this.generateIdentification = function () {
              return P(t, void 0, void 0, function () {
                var e, t, n, r, i;
                return A(this, function (o) {
                  switch (o.label) {
                    case 0:
                      return (
                        (e = new URLSearchParams(window.location.search)),
                        (t = function (t) {
                          var n = e.get('liff.state');
                          return n ? new URLSearchParams(n).get(t) : null;
                        }),
                        (n = this),
                        (i = {
                          identifier:
                            this.windowType === Qt
                              ? Ae(12)
                              : e.get('liff.subwindow.identifier') ||
                                t('liff.subwindow.identifier') ||
                                '',
                        }),
                        this.windowType !== Qt
                          ? [3, 2]
                          : [
                              4,
                              P(void 0, void 0, void 0, function () {
                                var e, t, n;
                                return A(this, function (r) {
                                  switch (r.label) {
                                    case 0:
                                      return (
                                        r.trys.push([0, 3, , 4]),
                                        [
                                          4,
                                          window.crypto.subtle.generateKey(
                                            { name: 'AES-GCM', length: 128 },
                                            !0,
                                            ['encrypt', 'decrypt']
                                          ),
                                        ]
                                      );
                                    case 1:
                                      return (
                                        (e = r.sent()),
                                        [4, window.crypto.subtle.exportKey('jwk', e)]
                                      );
                                    case 2:
                                      if (!(t = r.sent()) || !t.k)
                                        throw Se(J, 'failed to generate key');
                                      return [2, t.k];
                                    case 3:
                                      throw ((n = r.sent()), Se(J, n));
                                    case 4:
                                      return [2];
                                  }
                                });
                              }),
                            ]
                      );
                    case 1:
                      return (r = o.sent()), [3, 3];
                    case 2:
                      (r = e.get(qt) || t(qt) || ''), (o.label = 3);
                    case 3:
                      return (n.identification = ((i.cryptoKey = r), i)), [2];
                  }
                });
              });
            }),
            (this.hasIdentification = function () {
              var e = t.identification,
                n = e.identifier,
                r = e.cryptoKey;
              return 'string' == typeof n && 'string' == typeof r && n.length > 0 && r.length > 0;
            }),
            (this.isReady = function () {
              return t.hasIdentification() && !!t.messageHandlerInstance;
            }),
            (this.setup = function () {
              return P(t, void 0, void 0, function () {
                var e,
                  t,
                  n,
                  r,
                  i,
                  o = this;
                return A(this, function (a) {
                  switch (a.label) {
                    case 0:
                      return this.messageHandlerInstance ? [2] : [4, this.generateIdentification()];
                    case 1:
                      if ((a.sent(), !(e = this.identification.identifier))) return [2];
                      if (((t = /^[a-zA-Z0-9]+$/gm), !e.match(t)))
                        throw Se(J, 'Invalid identifier');
                      return (
                        ((n = document.createElement('iframe')).style.display = 'none'),
                        (n.src = 'about:blank'),
                        document.body.appendChild(n),
                        null === (i = null == n ? void 0 : n.contentWindow) ||
                          void 0 === i ||
                          i.window.eval(
                            '('.concat(
                              on
                                .toString()
                                .replace(
                                  '$MESSAGE_HANDLER_URL',
                                  ''.concat(
                                    'https://liff-subwindow.line.me/liff/v2/sub/messageHandler'
                                  )
                                )
                                .replace('$IDENTIFIER', e.split("'")[0]),
                              ')()'
                            )
                          ),
                        (r = 'iframe-'.concat(e, '-ready')),
                        [
                          4,
                          new Promise(function (e) {
                            var t = function (i) {
                              i.data[r] &&
                                ((o.messageHandlerInstance = n),
                                window.addEventListener('message', o.proxyToListeners),
                                e(),
                                document.removeEventListener('message', t));
                            };
                            window.addEventListener('message', t);
                          }),
                        ]
                      );
                    case 2:
                      return [2, a.sent()];
                  }
                });
              });
            }),
            (this.teardown = function () {
              return P(t, void 0, void 0, function () {
                var e, t;
                return A(this, function (n) {
                  switch (n.label) {
                    case 0:
                      return this.isReady() ? [4, this.send({ eventName: $t.TEARDOWN })] : [3, 2];
                    case 1:
                      n.sent(),
                        window.removeEventListener('message', this.proxyToListeners),
                        this.listeners.clear(),
                        null ===
                          (t =
                            null === (e = this.messageHandlerInstance) || void 0 === e
                              ? void 0
                              : e.parentNode) ||
                          void 0 === t ||
                          t.removeChild(this.messageHandlerInstance),
                        (this.messageHandlerInstance = null),
                        (n.label = 2);
                    case 2:
                      return [2];
                  }
                });
              });
            }),
            (this.listen = function (e) {
              t.listeners.set(e, e);
            }),
            (this.listenRepliedEvent = function (e, n) {
              var r = function (i) {
                i.replyTarget &&
                  (function (e, t) {
                    return nn(e) === nn(t);
                  })(i.replyTarget, e) &&
                  (n(i), t.listeners.delete(r));
              };
              t.listeners.set(r, r);
            }),
            (this.send = function (e) {
              return P(t, void 0, void 0, function () {
                var t,
                  n,
                  r,
                  i,
                  o = this;
                return A(this, function (a) {
                  switch (a.label) {
                    case 0:
                      if (!this.isReady()) throw Se('message bus is not ready to send message');
                      return (
                        (n = {
                          action: rn(e.eventName),
                          identifier: this.identification.identifier || '',
                          timestamp: new Date().getTime(),
                        }),
                        [4, this.getEncryptedContext(e)]
                      );
                    case 1:
                      return (
                        (n.context = a.sent()),
                        (t = n),
                        null ===
                          (i =
                            null === (r = this.messageHandlerInstance) || void 0 === r
                              ? void 0
                              : r.contentWindow) ||
                          void 0 === i ||
                          i.postMessage({ messageBusEvent: t }, '*'),
                        this.sentMessages.push(nn(t)),
                        [
                          4,
                          new Promise(function (e) {
                            o.listenRepliedEvent(t, function (t) {
                              e(t.context);
                            });
                          }),
                        ]
                      );
                    case 2:
                      return [2, a.sent()];
                  }
                });
              });
            }),
            (this.reply = function (e, n) {
              return P(t, void 0, void 0, function () {
                var t, r, i, o;
                return A(this, function (a) {
                  switch (a.label) {
                    case 0:
                      if (!this.isReady()) throw Se('message bus is not ready to send message');
                      if (!e.identifier || !e.timestamp) throw Se(J, 'target message is not valid');
                      return (r = { action: zt }), [4, this.getEncryptedContext(n)];
                    case 1:
                      return (
                        (r.context = a.sent()),
                        (r.identifier = this.identification.identifier || ''),
                        (r.timestamp = new Date().getTime()),
                        (r.replyTarget = {
                          action: e.action,
                          identifier: e.identifier,
                          timestamp: e.timestamp,
                        }),
                        (t = r),
                        null ===
                          (o =
                            null === (i = this.messageHandlerInstance) || void 0 === i
                              ? void 0
                              : i.contentWindow) ||
                          void 0 === o ||
                          o.postMessage({ messageBusEvent: t }, '*'),
                        this.sentMessages.push(nn(t)),
                        [2]
                      );
                  }
                });
              });
            }),
            (this.setData = function (e, n) {
              void 0 === e && (e = 'appData'), t.send({ eventName: $t.SET_DATA, key: e, data: n });
            }),
            (this.getData = function (e) {
              return (
                void 0 === e && (e = 'appData'),
                P(t, void 0, void 0, function () {
                  return A(this, function (t) {
                    switch (t.label) {
                      case 0:
                        return [4, this.send({ eventName: $t.GET_DATA, key: e })];
                      case 1:
                        return [2, t.sent()];
                    }
                  });
                })
              );
            }),
            (this.proxyToListeners = function (e) {
              return P(t, void 0, void 0, function () {
                var t,
                  n = this;
                return A(this, function (r) {
                  return (t = e.data.messageBusEvent)
                    ? (this.sentMessages.includes(nn(t)) ||
                        t.identifier !== this.identification.identifier ||
                        (t.action !== zt && !t.replyTarget) ||
                        this.listeners.forEach(function (e) {
                          return P(n, void 0, void 0, function () {
                            var n, r, i;
                            return A(this, function (o) {
                              switch (o.label) {
                                case 0:
                                  return (
                                    (n = e),
                                    (r = [k({}, t)]),
                                    (i = {}),
                                    [4, this.getDecryptedContext(t.context)]
                                  );
                                case 1:
                                  return (
                                    n.apply(void 0, [
                                      k.apply(void 0, r.concat([((i.context = o.sent()), i)])),
                                    ]),
                                    [2]
                                  );
                              }
                            });
                          });
                        }),
                      [2])
                    : [2];
                });
              });
            }),
            (this.getEncryptedContext = function (e) {
              return P(t, void 0, void 0, function () {
                var t, n, r, i, o, a, s;
                return A(this, function (c) {
                  switch (c.label) {
                    case 0:
                      return (
                        (t = this.identification),
                        (n = t.identifier),
                        (r = t.cryptoKey),
                        (o = (i = JSON).stringify),
                        (s = { eventName: e.eventName, key: e.key ? e.key : void 0 }),
                        e.data ? [4, en(n, r, JSON.stringify(e.data))] : [3, 2]
                      );
                    case 1:
                      return (a = c.sent()), [3, 3];
                    case 2:
                      (a = void 0), (c.label = 3);
                    case 3:
                      return [2, o.apply(i, [((s.data = a), s)])];
                  }
                });
              });
            }),
            (this.getDecryptedContext = function (e) {
              return P(t, void 0, void 0, function () {
                var t, n, r, i, o, a, s, c;
                return A(this, function (u) {
                  switch (u.label) {
                    case 0:
                      return (
                        (t = this.identification),
                        (n = t.identifier),
                        (r = t.cryptoKey),
                        (i = JSON.parse(e)).data && 'string' == typeof i.data
                          ? ((c = (s = JSON).parse), [4, tn(n, r, i.data)])
                          : [3, 2]
                      );
                    case 1:
                      return (a = c.apply(s, [u.sent()])), [3, 3];
                    case 2:
                      (a = void 0), (u.label = 3);
                    case 3:
                      return (o = a), [2, k(k({}, i), { data: o })];
                  }
                });
              });
            }),
            (this.windowType = e);
        };
        !(function () {
          if ('undefined' != typeof window && 'function' != typeof window.CustomEvent) {
            function e(e, t) {
              var n = t || {},
                r = n.bubbles,
                i = void 0 !== r && r,
                o = n.cancelable,
                a = void 0 !== o && o,
                s = n.detail,
                c = void 0 === s ? void 0 : s,
                u = document.createEvent('CustomEvent');
              return u.initCustomEvent(e, i, a, c), u;
            }
            (e.prototype = Event.prototype), (window.CustomEvent = e);
          }
        })();
        var sn = {},
          cn = !1;
        function un(e, t) {
          cn ||
            ((cn = !0),
            window.addEventListener(te, function (e) {
              e &&
                e.detail &&
                e.detail.type &&
                sn[e.detail.type] &&
                sn[e.detail.type].forEach(function (t) {
                  return t(e);
                });
            })),
            sn[e] ? sn[e].push(t) : (sn[e] = [t]);
        }
        function ln(e, t) {
          var n = sn[e];
          if (n && Array.isArray(n)) {
            var r = n.indexOf(t);
            r >= 0 && n.splice(r, 1);
          }
        }
        function fn(e, t, n) {
          void 0 === t && (t = {}), void 0 === n && (n = '');
          var r = et();
          if (!r) throw Se(X, 'Invalid featureToken for client features');
          if (!window._liff || !window._liff.postMessage)
            throw Se($, 'postMessage is not available from client');
          R.debug('[js postMessage to client]', e, n, t),
            window._liff.postMessage(e, r, n, JSON.stringify(t));
        }
        function dn(e, t, n) {
          return (
            void 0 === t && (t = {}),
            void 0 === n && (n = { once: !0 }),
            et()
              ? ((n = k({ callbackId: Ae(12), once: !0 }, n)),
                new Promise(function (r, i) {
                  var o = function (t) {
                    if (t && t.detail) {
                      var a = t.detail.callbackId === n.callbackId,
                        s = 'string' != typeof t.detail.callbackId;
                      (a || s) &&
                        (n.once && ln(e, o),
                        R.debug('[callback detail]', t.detail),
                        t.detail.error
                          ? i(t.detail.error)
                          : t.detail.data
                            ? r(t.detail.data)
                            : i(t.detail));
                    }
                    i();
                  };
                  un(e, o), fn(e, t, n.callbackId);
                }))
              : Promise.reject(Se(X, 'Invalid featureToken for client features'))
          );
        }
        function hn() {
          var e = gt();
          null !== e &&
          (('ios' === Lt() && pe(e, '9.19') >= 0) || ('android' === Lt() && pe(e, '11.6.0') >= 0))
            ? (location.href = 'liff://close')
            : window._liff && window._liff.postMessage
              ? null !== e && pe(e, '10.15.0') >= 0
                ? 'ios' === Lt()
                  ? window._liff.postMessage('closeWindow', '')
                  : window._liff.postMessage('closeWindow', '', '', '')
                : dn('closeWindow')
              : window.close();
        }
        !(function (e) {
          function t() {
            return (null !== e && e.apply(this, arguments)) || this;
          }
          O(t, e),
            Object.defineProperty(t.prototype, 'name', {
              get: function () {
                return 'closeWindow';
              },
              enumerable: !1,
              configurable: !0,
            }),
            (t.prototype.install = function () {
              return function () {
                return hn();
              };
            });
        })(H);
        function pn(e) {
          return Mt(Gt('subWindowGetOrigin')(e));
        }
        var vn = {};
        function wn(e, t) {
          e &&
            vn[e] &&
            vn[e].forEach(function (e) {
              e(t);
            });
        }
        function bn(e, t) {
          vn[e] || (vn[e] = []), vn[e].push(t);
        }
        function mn(e, t) {
          if (vn[e]) {
            var n = vn[e].indexOf(t);
            n >= 0 && vn[e].splice(n, 1);
          }
        }
        var gn,
          yn,
          In,
          Tn,
          En,
          Sn = (function () {
            function e(e) {
              this.storage = e;
            }
            return (
              (e.prototype.getItem = function (e) {
                return this.storage.getItem(''.concat(this.getKeyPrefix(), ':').concat(e));
              }),
              (e.prototype.setItem = function (e, t) {
                this.storage.setItem(''.concat(this.getKeyPrefix(), ':').concat(e), t);
              }),
              (e.prototype.removeItem = function (e) {
                this.storage.removeItem(''.concat(this.getKeyPrefix(), ':').concat(e));
              }),
              (e.prototype.clear = function () {
                this.storage.clear();
              }),
              (e.prototype.getKeyPrefix = function () {
                return ''.concat(ne, ':').concat(this.getLiffId());
              }),
              (e.prototype.getLiffId = function () {
                var e = He().liffId;
                if (!e) throw Se(Q, 'liffId is necessary for liff.init()');
                return e;
              }),
              e
            );
          })(),
          Cn = new Sn(new _e());
        function _n() {
          var e = Cn.getItem('subWindowStatusUpdated');
          return null !== e && JSON.parse(e);
        }
        function On(e) {
          Cn.setItem('subWindowStatusUpdated', String(e));
        }
        function kn(e) {
          gn = e;
        }
        function Pn() {
          return gn;
        }
        function An() {
          return In;
        }
        function xn() {
          return Tn;
        }
        function Ln(e) {
          return (
            void 0 === e && (e = Qt),
            P(this, void 0, void 0, function () {
              return A(this, function (t) {
                switch (t.label) {
                  case 0:
                    return [4, (En = new an(e)).setup()];
                  case 1:
                    return t.sent(), [2, En];
                }
              });
            })
          );
        }
        function jn() {
          return En;
        }
        var Fn = new _e(),
          Nn = new Sn(Be() ? Fn : window.sessionStorage);
        function Un() {
          return Nn.getItem('mainWindowOrigin');
        }
        function Rn(e, t) {
          return (
            void 0 === t && (t = {}),
            P(this, void 0, void 0, function () {
              var n, r, i, o, a, s, c, u;
              return A(this, function (l) {
                switch (l.label) {
                  case 0:
                    if (null == (n = jn()) ? void 0 : n.isReady()) return [3, 5];
                    if (
                      ((r = JSON.stringify(t)),
                      (i = He().liffId),
                      (o = Un()),
                      !window.opener || !o || !i)
                    )
                      throw Se(ee);
                    (a = !1), (l.label = 1);
                  case 1:
                    return l.trys.push([1, 3, , 4]), [4, pn(i)];
                  case 2:
                    return (s = l.sent()), (a = s.subwindowCommonModule), [3, 4];
                  case 3:
                    throw ((c = l.sent()), R.debug(c), Se(ee));
                  case 4:
                    return (
                      (u = a ? o : location.origin),
                      [
                        2,
                        new Promise(function (t) {
                          window.addEventListener('message', function n(i) {
                            (function (e) {
                              return !(
                                !e.data ||
                                'string' != typeof e.data.type ||
                                ![ce.SUBMIT, ce.CANCEL].includes(e.data.type)
                              );
                            })(i) &&
                              (window.removeEventListener('message', n),
                              t({ status: e, result: r }));
                          }),
                            window.opener.postMessage({ status: e, result: r }, u);
                        }),
                      ]
                    );
                  case 5:
                    return (
                      n.send({ eventName: e, data: t }),
                      [
                        4,
                        new Promise(function (e) {
                          setTimeout(e, 500);
                        }),
                      ]
                    );
                  case 6:
                    return l.sent(), [2, { status: e, result: JSON.stringify(t) }];
                }
              });
            })
          );
        }
        function Dn(e) {
          var t,
            n = xn();
          if (e.origin === n) {
            var r = e.data;
            if (r) {
              var i,
                o = r.status,
                a = r.result;
              try {
                i = JSON.parse(a || '{}');
              } catch (H) {
                i = {};
              }
              switch (o) {
                case le:
                  window.clearInterval(An()), Hn();
                  break;
                case ce.CANCEL:
                case ce.SUBMIT:
                  On(!0),
                    window.clearInterval(An()),
                    window.removeEventListener('message', Dn),
                    wn(o, i),
                    null === (t = Pn()) || void 0 === t || t.postMessage({ type: o }, xn());
                  break;
                default:
                  R.debug('unexpected message');
              }
            }
          }
        }
        var Bn = function (e) {
          return P(void 0, void 0, void 0, function () {
            var t, n, r, i;
            return A(this, function (o) {
              if (_n()) return [2];
              switch (((t = e.context), (n = t.eventName), (r = t.data), (i = jn()), n)) {
                case ce.INIT:
                  Wn(!r.hasOpener);
                  break;
                case ce.CANCEL:
                case ce.SUBMIT:
                  On(!0), wn(n, r), null == i || i.reply(e, { eventName: n });
                  break;
                case ce.CLOSE:
                  !1 === _n() && (On(!0), wn(ce.CLOSE, {})), Hn();
              }
              return [2];
            });
          });
        };
        function Mn() {
          window.clearInterval(yn),
            window.clearInterval(An()),
            window.removeEventListener('message', Dn);
        }
        function Wn(e) {
          if ((void 0 === e && (e = !1), Mn(), On(!1), e)) {
            var t = Pn();
            t && (t.close(), kn(null));
          }
        }
        function Hn() {
          return P(this, void 0, void 0, function () {
            var e;
            return A(this, function (t) {
              switch (t.label) {
                case 0:
                  return (e = jn()) ? [4, e.teardown()] : [3, 2];
                case 1:
                  t.sent(), (t.label = 2);
                case 2:
                  return [2];
              }
            });
          });
        }
        var Vn = null;
        function Gn(e) {
          return P(this, void 0, void 0, function () {
            var t,
              n,
              r,
              i,
              o,
              a,
              s,
              c,
              u,
              l,
              f,
              d,
              h,
              p,
              v = this;
            return A(this, function (w) {
              switch (w.label) {
                case 0:
                  if (
                    ((t = e.msit),
                    (n = e.mstChallenge),
                    (r = e.reconnectCount),
                    (i = void 0 === r ? 0 : r),
                    (o = function () {
                      return P(v, void 0, void 0, function () {
                        return A(this, function (r) {
                          switch (r.label) {
                            case 0:
                              return [
                                4,
                                (1e3,
                                new Promise(function (e) {
                                  return setTimeout(e, 1e3);
                                })),
                              ];
                            case 1:
                              return (
                                r.sent(),
                                [
                                  4,
                                  Gn({
                                    msit: t,
                                    mstChallenge: n,
                                    onSuccess: e.onSuccess,
                                    onError: e.onError,
                                    reconnectCount: i + 1,
                                  }),
                                ]
                              );
                            case 2:
                              return r.sent(), [2];
                          }
                        });
                      });
                    }),
                    (a = function () {
                      for (var t = [], n = 0; n < arguments.length; n++) t[n] = arguments[n];
                      (Vn = null), e.onSuccess.apply(e, j([], L(t), !1));
                    }),
                    (s = function () {
                      for (var t = [], n = 0; n < arguments.length; n++) t[n] = arguments[n];
                      (Vn = null), e.onError.apply(e, j([], L(t), !1));
                    }),
                    (c = Date.now()),
                    null === Vn && (Vn = c),
                    (u = c - Vn),
                    i >= 10 || u > 6e5)
                  )
                    return s(Se(J, 'Failed to connect')), [2];
                  w.label = 1;
                case 1:
                  return (
                    w.trys.push([1, 3, , 5]),
                    [
                      4,
                      Wt(Gt('subWindowSubscribe'), {
                        method: 'POST',
                        body: JSON.stringify({ msit: t, mstChallenge: n }),
                      }),
                    ]
                  );
                case 2:
                  return (l = w.sent()), [3, 5];
                case 3:
                  return w.sent(), [4, o()];
                case 4:
                  return w.sent(), [2];
                case 5:
                  return l.status >= 500 ? [4, o()] : [3, 7];
                case 6:
                  return w.sent(), [3, 17];
                case 7:
                  return l.status >= 400 && 500 > l.status ? [4, Kn(l)] : [3, 9];
                case 8:
                  return (
                    (d = w.sent()),
                    (f = d ? Se($, d.errorDetail) : Se(J, 'Some error happened in the server')),
                    s(f),
                    [3, 17]
                  );
                case 9:
                  return 200 !== l.status ? [3, 16] : [4, Kn(l)];
                case 10:
                  if (!(d = w.sent())) return s(Se(J, 'Some error happened in the server')), [2];
                  switch (((h = d.status), (p = d.result), h)) {
                    case ce.ERROR:
                      return [3, 11];
                    case ce.CLOSE:
                    case ce.CANCEL:
                    case ce.SUBMIT:
                      return [3, 13];
                  }
                  return [3, 14];
                case 11:
                  return [4, o()];
                case 12:
                  return w.sent(), [3, 15];
                case 13:
                  return a(h, p), [3, 15];
                case 14:
                  s(Se(J, 'Some error happened in the server')), (w.label = 15);
                case 15:
                  return [3, 17];
                case 16:
                  s(Se(J, 'Some error happened in the server')), (w.label = 17);
                case 17:
                  return [2];
              }
            });
          });
        }
        function Kn(e) {
          return P(this, void 0, void 0, function () {
            return A(this, function (t) {
              switch (t.label) {
                case 0:
                  return t.trys.push([0, 2, , 3]), [4, e.json()];
                case 1:
                  return [2, t.sent()];
                case 2:
                  return t.sent(), [2, null];
                case 3:
                  return [2];
              }
            });
          });
        }
        function Jn(e) {
          var t = {};
          return (
            Object.keys(e).forEach(function (n) {
              'closeButtonColor' === n
                ? 'white' === e[n]
                  ? (t[n] = '#ffffff')
                  : (t[n] = '#000000')
                : (t[n] = e[n]);
            }),
            t
          );
        }
        var qn = {
          height: 'full',
          closeButtonPosition: 'right',
          closeButtonColor: 'black',
          closeButtonLabel: '',
        };
        function $n(e) {
          var t = e.appData,
            n = e.native,
            r = He().liffId,
            i = Ye(),
            o = Ne(e.url);
          if (!r) return Promise.reject(Se(q, 'liffId is invalid'));
          if (!i) return Promise.reject(Se(q, 'mst_challenge is invalid'));
          if (!o) return Promise.reject(Se($, 'params.url must be liff url'));
          var a = Object.assign({}, qn, n);
          return (function (e) {
            var t = e.mainLiffId,
              n = e.subLiffId,
              r = e.mstChallenge,
              i = e.appData,
              o = e.view;
            return t && r
              ? Mt(Gt('subWindowGetMSIT'), {
                  method: 'POST',
                  body: JSON.stringify({
                    mainLiffId: t,
                    subLiffId: n,
                    mstChallenge: r,
                    appData: i,
                    view: o,
                  }),
                })
              : Promise.reject(Se($, 'no proper argument'));
          })({ mainLiffId: r, subLiffId: o, mstChallenge: i, appData: t, view: Jn(a) })
            .then(function (e) {
              var t = e.msit;
              return (
                Gn({
                  msit: t,
                  mstChallenge: i,
                  onSuccess: function (e, t) {
                    wn(e, t);
                  },
                  onError: function (e) {
                    wn(ce.ERROR, e);
                  },
                }),
                t
              );
            })
            .then(function (t) {
              return (function (e, t) {
                var n;
                return P(this, void 0, void 0, function () {
                  var r, i;
                  return A(this, function (o) {
                    switch (o.label) {
                      case 0:
                        return (
                          (r = e.url),
                          (i = new URLSearchParams()).set('msit', t),
                          [
                            4,
                            null === (n = e.onBeforeTransition) || void 0 === n
                              ? void 0
                              : n.call(e),
                          ]
                        );
                      case 1:
                        return (
                          o.sent(),
                          (location.href = ''
                            .concat('liff://subwindow', '?url=')
                            .concat(encodeURIComponent(r), '&')
                            .concat(i.toString())),
                          [2]
                        );
                    }
                  });
                });
              })(e, t);
            });
        }
        function zn(e) {
          return (
            _t.subwindowOpen(),
            We()
              ? $n(e)
              : (function (e) {
                  var t;
                  return P(this, void 0, void 0, function () {
                    var n, r, i, o, a, s, c, u, l, f, d;
                    return A(this, function (h) {
                      switch (h.label) {
                        case 0:
                          return (n = Ne(e.url))
                            ? (Wn(!0), [4, Hn()])
                            : [2, Promise.reject(Se($, 'params.url must be liff url'))];
                        case 1:
                          return (
                            h.sent(),
                            kn(
                              'ios' !== Lt() || Ue()
                                ? window.open(
                                    '',
                                    'liffsubwindow',
                                    'width=480, height=640, menubar=no, toolbar=no, scrollbars=yes'
                                  )
                                : window.open()
                            ),
                            (r = e.url),
                            (i = e.appData),
                            (o = new URL(r)).searchParams.append(ue, 'true'),
                            [4, Ln()]
                          );
                        case 2:
                          return (
                            (a = h.sent()),
                            o.searchParams.append(Jt, a.identification.identifier),
                            o.searchParams.append(qt, a.identification.cryptoKey),
                            (o.hostname = (function (e) {
                              var t = L(e.split('.')),
                                n = t[0],
                                r = t.slice(1);
                              return j([''.concat(n, '-ext')], L(r), !1).join('.');
                            })(o.hostname)),
                            (s = o.toString()),
                            [4, pn(n)]
                          );
                        case 3:
                          if (
                            ((c = h.sent()),
                            (u = c.origin),
                            (l = c.subwindowCommonModule),
                            !(f = Pn()))
                          )
                            throw Se(Z);
                          if (!l) return f.close(), [2];
                          !(function (e) {
                            Tn = e;
                          })(u),
                            a.listen(Bn),
                            a.setData('appData', i),
                            window.addEventListener('message', Dn),
                            (h.label = 4);
                        case 4:
                          return (
                            h.trys.push([4, 6, , 7]),
                            [
                              4,
                              null === (t = e.onBeforeTransition) || void 0 === t
                                ? void 0
                                : t.call(e),
                            ]
                          );
                        case 5:
                          return h.sent(), [3, 7];
                        case 6:
                          throw ((d = h.sent()), f.close(), d);
                        case 7:
                          return (
                            (f.location.href = s),
                            (p = (function (e, t) {
                              var n = Pn(),
                                r = { type: le };
                              return (
                                t && (r.message = JSON.stringify(t)),
                                window.setInterval(function () {
                                  null == n || n.postMessage(r, e);
                                }, 100)
                              );
                            })(u, i)),
                            (In = p),
                            (function (e) {
                              yn = e;
                            })(
                              window.setInterval(function () {
                                var e = Pn();
                                e &&
                                  e.closed &&
                                  (Mn(), kn(null), !1 === _n() && (On(!0), wn(ce.CLOSE, {})));
                              }, 100)
                            ),
                            [2]
                          );
                      }
                      var p;
                    });
                  });
                })(e)
          );
        }
        function Xn(e) {
          if (!e.mst || !e.status) return Promise.reject(Se($, 'no proper argument'));
          var t = JSON.stringify(e);
          return Mt(Gt('subWindowPost'), { method: 'POST', body: t });
        }
        function Qn() {
          if (!mt()) throw Se(q, 'this api can be only called in child window');
        }
        function Yn(e) {
          return (
            void 0 === e && (e = {}),
            Qn(),
            We()
              ? (function (e) {
                  return (
                    void 0 === e && (e = {}),
                    P(this, void 0, void 0, function () {
                      var t, n;
                      return A(this, function (r) {
                        switch (r.label) {
                          case 0:
                            return (t = Qe())
                              ? [4, Xn({ mst: t, status: ce.CANCEL, result: e })]
                              : [2, Promise.reject(Se(q, 'mst is invalid'))];
                          case 1:
                            return (n = r.sent()), On(!0), [2, n];
                        }
                      });
                    })
                  );
                })(e)
              : (function (e) {
                  return void 0 === e && (e = {}), Rn(ce.CANCEL, e);
                })(e)
          );
        }
        function Zn(e) {
          return (
            void 0 === e && (e = {}),
            Qn(),
            We()
              ? (function (e) {
                  return (
                    void 0 === e && (e = {}),
                    P(this, void 0, void 0, function () {
                      var t, n;
                      return A(this, function (r) {
                        switch (r.label) {
                          case 0:
                            return (t = Qe())
                              ? [4, Xn({ mst: t, status: ce.SUBMIT, result: e })]
                              : [2, Promise.reject(Se(q, 'mst is invalid'))];
                          case 1:
                            return (n = r.sent()), On(!0), [2, n];
                        }
                      });
                    })
                  );
                })(e)
              : (function (e) {
                  return void 0 === e && (e = {}), Rn(ce.SUBMIT, e);
                })(e)
          );
        }
        function er() {
          return (
            Qn(),
            We()
              ? (function () {
                  return P(this, void 0, void 0, function () {
                    var e;
                    return A(this, function (t) {
                      switch (t.label) {
                        case 0:
                          return !1 !== _n()
                            ? [3, 2]
                            : (e = Qe())
                              ? [4, Xn({ mst: e, status: ce.CLOSE, result: {} })]
                              : [2, Promise.reject(Se(q, 'mst is invalid'))];
                        case 1:
                          t.sent(), (t.label = 2);
                        case 2:
                          return hn(), [2];
                      }
                    });
                  });
                })()
              : (function () {
                  return P(this, void 0, void 0, function () {
                    var e;
                    return A(this, function (t) {
                      return (null == (e = jn()) ? void 0 : e.isReady())
                        ? (e.send({ eventName: ce.CLOSE }),
                          [
                            2,
                            new Promise(function (e) {
                              setTimeout(function () {
                                hn(), e();
                              }, 100);
                            }),
                          ])
                        : (hn(), [2, Promise.resolve()]);
                    });
                  });
                })()
          );
        }
        function tr() {
          return (
            Qn(),
            (function () {
              var e,
                t = Ve(ie.APP_DATA);
              try {
                e = t ? JSON.parse(t) : {};
              } catch (n) {
                e = {};
              }
              return Promise.resolve(e);
            })()
          );
        }
        function nr(e) {
          var t = e.msit,
            n = e.mstVerifier;
          return t && n
            ? Mt(Gt('subWindowGetMSTByMSIT'), {
                method: 'POST',
                body: JSON.stringify({ msit: t, mstVerifier: n }),
              })
            : Promise.reject(Se($, 'no proper argument'));
        }
        function rr(e) {
          var t = e.mst;
          return t
            ? Mt(Gt('subWindowGetAppData'), { method: 'POST', body: JSON.stringify({ mst: t }) })
            : Promise.reject(Se($, 'no proper argument'));
        }
        var ir,
          or = { on: bn, off: mn, open: zn, cancel: Yn, submit: Zn, close: er, getAppData: tr },
          ar =
            ((function (e) {
              function t() {
                return (null !== e && e.apply(this, arguments)) || this;
              }
              O(t, e),
                Object.defineProperty(t.prototype, 'name', {
                  get: function () {
                    return 'subWindow';
                  },
                  enumerable: !1,
                  configurable: !0,
                }),
                (t.prototype.install = function () {
                  var e = this;
                  return {
                    on: bn.bind(this),
                    off: mn.bind(this),
                    open: function (t) {
                      return zn.call(e, k(k({}, t), { onBeforeTransition: void 0 }));
                    },
                    cancel: Yn.bind(this),
                    submit: Zn.bind(this),
                    close: er.bind(this),
                    getAppData: tr.bind(this),
                  };
                });
            })(H),
            n(255)),
          sr = n.n(ar),
          cr = function () {
            var e = this;
            (this.type = 'sync'),
              (this.fns = new Set()),
              (this.on = function (t) {
                e.fns.add(t);
              }),
              (this.call = function () {
                for (var t, n, r = [], i = 0; i < arguments.length; i++) r[i] = arguments[i];
                try {
                  for (var o = x(e.fns), a = o.next(); !a.done; a = o.next()) {
                    var s = a.value;
                    s.apply(void 0, j([], L(r), !1));
                  }
                } catch (W) {
                  t = { error: W };
                } finally {
                  try {
                    a && !a.done && (n = o.return) && n.call(o);
                  } finally {
                    if (t) throw t.error;
                  }
                }
              });
          },
          ur = function () {
            var e = this;
            (this.type = 'async'),
              (this.fns = new Set()),
              (this.on = function (t) {
                e.fns.add(t);
              }),
              (this.call = function () {
                for (var t = [], n = 0; n < arguments.length; n++) t[n] = arguments[n];
                return P(e, void 0, void 0, function () {
                  var e, n, r, i, o, a;
                  return A(this, function (s) {
                    switch (s.label) {
                      case 0:
                        e = [];
                        try {
                          for (n = x(this.fns), r = n.next(); !r.done; r = n.next())
                            (i = r.value), e.push(i.apply(void 0, j([], L(t), !1)));
                        } catch (W) {
                          o = { error: W };
                        } finally {
                          try {
                            r && !r.done && (a = n.return) && a.call(n);
                          } finally {
                            if (o) throw o.error;
                          }
                        }
                        return [4, Promise.all(e)];
                      case 1:
                        return s.sent(), [2];
                    }
                  });
                });
              });
          },
          lr = function (e) {
            var t,
              n = Ae(43),
              r = (function (e) {
                var t = '';
                return (
                  e
                    .replace(/\r|\n/g, '')
                    .replace(/([\da-fA-F]{2}) ?/g, '0x$1 ')
                    .replace(/ +$/, '')
                    .split(' ')
                    .forEach(function (e) {
                      t += String.fromCharCode(parseInt(e));
                    }),
                  window.btoa(t)
                );
              })(sr()(n))
                .replace(/\+/g, '-')
                .replace(/\//g, '_')
                .replace(/=/g, ''),
              i = He();
            if (!i || !i.liffId) throw Se(Q, 'You need to define `liffId` for liff.login()');
            var o = {
              app_id: i.liffId,
              state: Ae(12),
              response_type: 'code',
              code_challenge_method: 'S256',
              code_challenge: r,
              liff_sdk_version: '2.22.3',
            };
            e && e.redirectUri && (o.redirect_uri = e.redirectUri),
              mt() &&
                !We() &&
                ((null === (t = jn()) || void 0 === t ? void 0 : t.isReady())
                  ? (o.redirect_uri = window.location.href)
                  : (o.disable_auto_login = 'true')),
              (function (e) {
                Ge(ie.LOGIN_TMP, e);
              })({ codeVerifier: n });
            var a = Gt('authorize') + '?' + ke(o);
            R.debug('[Redirect] '.concat(a)), (window.location.href = a);
          },
          fr = (function (e) {
            function t() {
              var t = (null !== e && e.apply(this, arguments)) || this;
              return (t.hooks = { before: new cr() }), t;
            }
            return (
              O(t, e),
              Object.defineProperty(t.prototype, 'name', {
                get: function () {
                  return 'login';
                },
                enumerable: !1,
                configurable: !0,
              }),
              (t.prototype.install = function () {
                return this._login.bind(this);
              }),
              (t.prototype._login = function (e) {
                this.hooks.before.call(e), lr(e);
              }),
              t
            );
          })(H),
          dr =
            'undefined' == typeof navigator
              ? 'en'
              : null !== (ir = navigator.language) && void 0 !== ir
                ? ir
                : 'en',
          hr = null;
        function pr(e) {
          return P(this, void 0, void 0, function () {
            return A(this, function (t) {
              switch (t.label) {
                case 0:
                  return (dr = e), [4, vr()];
                case 1:
                  return t.sent(), [2];
              }
            });
          });
        }
        function vr() {
          return P(this, void 0, void 0, function () {
            var e, t;
            return A(this, function (n) {
              switch (n.label) {
                case 0:
                  return [
                    4,
                    Mt(''.concat('https://liffsdk.line-scdn.net/xlt/manifest.json'), {
                      method: 'GET',
                      headers: { Accept: 'application/json' },
                    }),
                  ];
                case 1:
                  return (
                    (e = n.sent()),
                    (t = ''.concat(dr)),
                    !e.languages[t] && dr.includes('-') && (t = dr.split('-')[0]),
                    e.languages[t] || (t = 'en'),
                    [
                      4,
                      Mt(
                        ''.concat('https://liffsdk.line-scdn.net/xlt', '/').concat(e.languages[t]),
                        { method: 'GET', headers: { Accept: 'application/json' } }
                      ),
                    ]
                  );
                case 2:
                  return (hr = n.sent()), [2];
              }
            });
          });
        }
        function wr(e) {
          if (null === hr) throw Se(z, 'please call xlt after liff.init');
          return hr[e];
        }
        var br = new ((function (e) {
            function t() {
              return (null !== e && e.apply(this, arguments)) || this;
            }
            return (
              O(t, e),
              Object.defineProperty(t.prototype, 'name', {
                get: function () {
                  return 'i18n';
                },
                enumerable: !1,
                configurable: !0,
              }),
              (t.prototype.install = function (e) {
                return (
                  e.internalHooks.init.beforeFinished(this.beforeInitFinished.bind(this)),
                  { setLang: pr }
                );
              }),
              (t.prototype.beforeInitFinished = function () {
                return P(this, void 0, void 0, function () {
                  return A(this, function (e) {
                    switch (e.label) {
                      case 0:
                        return [4, vr()];
                      case 1:
                        return e.sent(), [2];
                    }
                  });
                });
              }),
              t
            );
          })(H))(),
          mr = {
            iconColor: '#111111',
            statusBarColor: 'BLACK',
            titleTextColor: '#111111',
            titleSubtextColor: '#B7B7B7',
            titleButtonColor: '#111111',
            titleBackgroundColor: '#FFFFFF',
            progressBarColor: '#06C755',
            progressBackgroundColor: '#FFFFFF',
            titleButtonAreaBackgroundColor: '#1FFFFFFF',
            titleButtonAreaBorderColor: '#26000000',
            baseBackgroundColor: '#FFFFFF',
            baseTextColor: '#000000',
            lightButtonBorderColor: 'rgba(0, 0, 0, 0.15)',
          },
          gr = {
            iconColor: '#FFFFFF',
            statusBarColor: 'WHITE',
            titleTextColor: '#FFFFFF',
            titleSubtextColor: '#949494',
            titleButtonColor: '#FFFFFF',
            titleBackgroundColor: '#111111',
            progressBarColor: '#06C755',
            progressBackgroundColor: '#111111',
            titleButtonAreaBackgroundColor: '#1FFFFFFF',
            titleButtonAreaBorderColor: '#26000000',
            baseBackgroundColor: '#000000',
            baseTextColor: '#FFFFFF',
            lightButtonBorderColor: 'rgba(255, 255, 255, 0.5)',
          };
        function yr(e) {
          var t = Ke(),
            n = (null == t ? void 0 : t.menuColorSetting) || {
              adaptableColorSchemes: ['light'],
              lightModeColor: mr,
              darkModeColor: gr,
            },
            r = n.adaptableColorSchemes,
            i = n.lightModeColor,
            o = n.darkModeColor,
            a = r.includes('dark');
          e.matches && a ? Ir(k(k({}, gr), o)) : Ir(k(k({}, mr), i));
        }
        function Ir(e) {
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
          Tr('--liff-base-background-color', f),
            Tr('--liff-base-text-color', d),
            Tr('--liff-base-background-rgb-color', be(f)),
            Tr('--liff-base-text-rgb-color', be(d)),
            Tr('--liff-light-button-border-color', h),
            Tr('--liff-title-text-color', r),
            Tr('--liff-title-background-color', a),
            Tr('--liff-title-button-color', o),
            Tr('--liff-icon-color', t),
            Tr('--liff-status-bar-color', n),
            Tr('--liff-title-subtext-color', i),
            Tr('--liff-progress-bar-color', s),
            Tr('--liff-progress-background-color', c),
            Tr('--liff-title-button-area-background-color', ve(u)),
            Tr('--liff-title-button-area-border-color', ve(l));
        }
        function Tr(e, t) {
          document.documentElement.style.setProperty(e, t);
        }
        var Er = {
          addToHomeScreen: function (e) {
            if (!new xt(e).invoke('addToHomeScreen'))
              throw Se(X, 'No permission for liff.addToHomeScreen()');
          },
          scanCode: function (e) {
            if (!new xt(e).invoke('scanCode'))
              return Promise.reject(Se(X, 'No permission for liff.scanCode()'));
          },
          getAdvertisingId: function (e) {
            if (!new xt(e).invoke('getAdvertisingId'))
              return Promise.reject(Se(X, 'No permission for liff.getAdvertisingId()'));
          },
          initPlugins: function () {},
        };
        function Sr(e) {
          return P(this, void 0, void 0, function () {
            var t;
            return A(this, function (n) {
              switch (n.label) {
                case 0:
                  return [4, Ut()];
                case 1:
                  return (t = n.sent()) ? (t.install(e, Er), [2]) : [2];
              }
            });
          });
        }
        function Cr() {
          return P(this, void 0, void 0, function () {
            return A(this, function (e) {
              switch (e.label) {
                case 0:
                  return [4, Mt(Gt('certs'))];
                case 1:
                  return [2, e.sent()];
              }
            });
          });
        }
        function _r(e, t, n) {
          return P(this, void 0, void 0, function () {
            var r;
            return A(this, function (i) {
              switch (i.label) {
                case 0:
                  return [
                    4,
                    crypto.subtle.importKey('jwk', e, { name: 'ECDSA', namedCurve: 'P-256' }, !1, [
                      'verify',
                    ]),
                  ];
                case 1:
                  return (
                    (r = i.sent()),
                    [4, crypto.subtle.verify({ name: 'ECDSA', hash: { name: 'SHA-256' } }, r, n, t)]
                  );
                case 2:
                  return [2, i.sent()];
              }
            });
          });
        }
        function Or(e, t) {
          return P(this, void 0, void 0, function () {
            var n, r, i, o, a, s, c, u, l, f, d, h, p, v, w, b;
            return A(this, function (m) {
              switch (m.label) {
                case 0:
                  return (
                    (n = e.split('.')),
                    (r = L(n, 3)),
                    (i = r[0]),
                    (o = r[1]),
                    (a = r[2]),
                    (s = JSON.parse(he.decode(i))),
                    (c = JSON.parse(he.decodeUnicode(o))),
                    (u = me(he.decode(a))),
                    (l = me(''.concat(i, '.').concat(o))),
                    [4, Cr()]
                  );
                case 1:
                  if (
                    ((f = m.sent()),
                    !(d = f.keys.find(function (e) {
                      return e.kid === s.kid;
                    })))
                  )
                    return [3, 6];
                  if ((delete d.alg, 'ES256' !== s.alg))
                    throw Se(Y, 'Invalid "alg" value in ID_TOKEN');
                  (h = void 0), (m.label = 2);
                case 2:
                  return m.trys.push([2, 4, , 5]), [4, _r(d, l, u)];
                case 3:
                  return (h = m.sent()), [3, 5];
                case 4:
                  throw (
                    ((p = m.sent()),
                    Se(Y, ''.concat('Failed to use Crypto API to verify ID_TOKEN', ': ').concat(p)))
                  );
                case 5:
                  if (h) {
                    if (
                      ((v = c.iss !== 'https://access.'.concat('line.me')),
                      (w = c.aud !== t),
                      (b = 1e3 * c.exp < Date.now()),
                      v)
                    )
                      throw Se(Y, 'Invalid "iss" value in ID_TOKEN');
                    if (w) throw Se(Y, 'Invalid "aud" value in ID_TOKEN');
                    if (b) throw Se(Y, 'Invalid "exp" value in ID_TOKEN');
                    return [2, c];
                  }
                  throw Se(Y, 'Invalid signature in ID_TOKEN');
                case 6:
                  throw Se(Y, 'Invalid "kid" value in ID_TOKEN');
                case 7:
                  return [2];
              }
            });
          });
        }
        function kr(e) {
          var t = e.split('.');
          if (t[1])
            try {
              var n = t[1].replace(/-/g, '+').replace(/_/g, '/');
              return JSON.parse(window.atob(n));
            } catch (r) {
              return null;
            }
          return null;
        }
        function Pr(e) {
          var t = e.pathname,
            n = e.query,
            r = n ? '?'.concat(ke(n)) : '',
            i = ''.concat('liff://').concat(t).concat(r);
          location.href = i;
        }
        var Ar = null;
        function xr() {
          'boolean' == typeof Ar && R.warn('liff.init is not expected to be called more than once'),
            (Ar =
              !!Boolean(Ve(ie.IS_SUBSEQUENT_LIFF_APP)) ||
              (!(!We() || Oe(window.location.hash).feature_token || et()) &&
                ((function (e) {
                  Ge(ie.IS_SUBSEQUENT_LIFF_APP, e);
                })(!0),
                !0)));
        }
        function Lr() {
          return Boolean(Ar);
        }
        function jr(e, t) {
          return P(this, void 0, void 0, function () {
            var n;
            return A(this, function (r) {
              switch (r.label) {
                case 0:
                  return (n = Qe())
                    ? [2, n]
                    : e && t
                      ? [4, nr({ msit: e, mstVerifier: t })]
                      : [3, 2];
                case 1:
                  return [2, r.sent().mst];
                case 2:
                  return [2, null];
              }
            });
          });
        }
        function Fr(e) {
          return Mt(''.concat(Gt('apps'), '/').concat(e, '/featureToken'));
        }
        function Nr(e) {
          return P(this, void 0, void 0, function () {
            var t, n, r, i;
            return A(this, function (o) {
              switch (o.label) {
                case 0:
                  return (
                    (t = Oe(window.location.hash)),
                    (n = (function (e) {
                      for (var t, n, r = [], i = 1; i < arguments.length; i++)
                        r[i - 1] = arguments[i];
                      var o = function (t) {
                        Object.keys(t)
                          .filter(function (e) {
                            return null !== t[e] && void 0 !== t[e];
                          })
                          .forEach(function (n) {
                            e[n] = t[n];
                          });
                      };
                      try {
                        for (var a = x(r), s = a.next(); !s.done; s = a.next()) o(s.value);
                      } catch (V) {
                        t = { error: V };
                      } finally {
                        try {
                          s && !s.done && (n = a.return) && n.call(a);
                        } finally {
                          if (t) throw t.error;
                        }
                      }
                      return e;
                    })(
                      {
                        access_token: it(),
                        context_token: Ve(ie.RAW_CONTEXT),
                        feature_token: et(),
                        id_token: nt(),
                        client_id: Ve(ie.CLIENT_ID),
                        mst_challenge: Ye(),
                        mst_verifier: Ve(ie.MST_VERIFIER),
                        msit: Ve(ie.MSIT),
                      },
                      t
                    )),
                    Lr() ? (ht() ? [4, Fr(e)] : [3, 2]) : [3, 3]
                  );
                case 1:
                  (r = o.sent().featureToken),
                    n.feature_token || (n.feature_token = r),
                    (o.label = 2);
                case 2:
                  (i = Ce(e)) && (n.client_id = i), (o.label = 3);
                case 3:
                  return [2, n];
              }
            });
          });
        }
        function Ur(e) {
          if (e.persisted && Ot('multipleLiffTransition'))
            if ('ios' === Lt()) window.location.reload();
            else {
              var t = He().liffId,
                n = et();
              if (!t) throw Se(z, 'Invalid LIFF ID.');
              if (!n) throw Se(X, 'Invalid featureToken for client features');
              Pr({ pathname: 'app/'.concat(t), query: { feature_token: n } });
            }
        }
        function Rr(e) {
          var t, n;
          return P(this, void 0, void 0, function () {
            var r, i, o, a, s, c, u, l, f, d, h, p, v, w, b, m, g;
            return A(this, function (y) {
              switch (y.label) {
                case 0:
                  return [
                    4,
                    new Promise(function (e) {
                      var t = gt();
                      if (!t || pe(t, '9.5.0') < 0) e();
                      else if (window._liff && window._liff.features) e();
                      else {
                        R.debug('cannot find window._liff.features, listen to ready event');
                        var n = function () {
                          R.debug('ready event is fired'), ln('ready', n), e();
                        };
                        un('ready', n);
                      }
                    }),
                  ];
                case 1:
                  return y.sent(), xr(), [4, Nr(e.liffId)];
                case 2:
                  if (
                    ((r = y.sent()),
                    (i = r.access_token),
                    (o = r.context_token),
                    (a = r.feature_token),
                    (s = r.id_token),
                    (c = r.client_id),
                    (u = r.mst_verifier),
                    (l = r.mst_challenge),
                    (f = r.msit),
                    o)
                  ) {
                    if ('string' != typeof o)
                      throw Se(
                        z,
                        'Cannot get context token, perhaps there is an incorrect parameter in permanent link'
                      );
                    Je(kr(o));
                  }
                  if (
                    void 0 !== (null === (t = Ke()) || void 0 === t ? void 0 : t.liffId) &&
                    (null === (n = Ke()) || void 0 === n ? void 0 : n.liffId) !== e.liffId
                  )
                    throw Se(z, 'Invalid LIFF ID');
                  return (
                    !mt() &&
                      a &&
                      ((function (e, t) {
                        Ot('multipleLiffTransition') &&
                          Pr({ pathname: 'app/'.concat(e), query: { feature_token: t } });
                      })(e.liffId, a),
                      Lr() && tt(a)),
                    l &&
                      (function (e) {
                        Ge(ie.MST_CHALLENGE, e);
                      })(l),
                    u &&
                      (function (e) {
                        Ge(ie.MST_VERIFIER, e);
                      })(u),
                    c && Ze(c),
                    f &&
                      (function (e) {
                        Ge(ie.MSIT, e);
                      })(f),
                    window.addEventListener('pageshow', Ur),
                    ht() || (a && i)
                      ? [3, 5]
                      : Lr()
                        ? ((d = Fe(location.href, { 'liff.hback': '2' })),
                          lr({ redirectUri: d }),
                          [4, new Promise(function () {})])
                        : [3, 4]
                  );
                case 3:
                  y.sent(), (y.label = 4);
                case 4:
                  throw (lr(), Se(z, 'Failed to parse feature_token or access_token'));
                case 5:
                  return i && a ? [4, Kt(i)] : [3, 7];
                case 6:
                  if (
                    ((h = y.sent()),
                    (p = h.client_id),
                    (v = h.expires_in),
                    (w = Ce(e.liffId)),
                    p !== w)
                  )
                    throw (lr(), Se(z, 'Failed to verify access_token'));
                  tt(a), ut(new Date(Date.now() + 1e3 * v)), ot(i), (y.label = 7);
                case 7:
                  return [4, jr(f, u)];
                case 8:
                  return (b = y.sent())
                    ? ((function (e) {
                        Ge(ie.MST, e);
                      })(b),
                      [4, rr({ mst: b })])
                    : [3, 10];
                case 9:
                  (m = y.sent().data) && Xe(JSON.stringify(m)), (y.label = 10);
                case 10:
                  return s && !nt() && rt(s), s && c && !lt() ? [4, Or(s, c)] : [3, 12];
                case 11:
                  (g = y.sent()) && ft(g), (y.label = 12);
                case 12:
                  return [2];
              }
            });
          });
        }
        function Dr(e) {
          return P(this, void 0, void 0, function () {
            var t, n, r, i, o, a, s;
            return A(this, function (c) {
              switch (c.label) {
                case 0:
                  return (
                    (t = Gt('apps')),
                    (n = ''.concat(t, '/').concat(e, '/contextToken')),
                    (r = it()),
                    (i = { 'Content-Type': 'application/json', Accept: 'application/json' }),
                    r && (i.Authorization = 'Bearer '.concat(r)),
                    [4, Mt(n, { headers: i })]
                  );
                case 1:
                  if (((o = c.sent()), !(a = o.contextToken)))
                    throw Se(z, 'Can not get context from server.');
                  if (!(s = kr(a))) throw Se(z, 'Invalid context token.');
                  return [2, s];
              }
            });
          });
        }
        function Br() {
          return P(this, void 0, void 0, function () {
            var e;
            return A(this, function (t) {
              switch (t.label) {
                case 0:
                  if (!(e = He().liffId)) throw Se(z, 'Invalid LIFF ID.');
                  return [4, Dr(e)];
                case 1:
                  return Je(t.sent()), [2];
              }
            });
          });
        }
        function Mr(e) {
          return P(this, void 0, void 0, function () {
            var t,
              n,
              r,
              i = this;
            return A(this, function (o) {
              switch (o.label) {
                case 0:
                  (t = function () {
                    return P(i, void 0, void 0, function () {
                      var t, n, r, i, o, a;
                      return A(this, function (s) {
                        switch (s.label) {
                          case 0:
                            return [
                              4,
                              ((c = He()),
                              (u = Oe(window.location.search)),
                              (l = st()),
                              (f = {
                                grant_type: 'authorization_code',
                                client_id: u.liffClientId,
                                appId: c.liffId,
                                code: u.code,
                                code_verifier: l.codeVerifier,
                                redirect_uri: c.redirectUri || u.liffRedirectUri,
                                id_token_key_type: 'JWK',
                              }),
                              (d = ke(f)),
                              Mt(Gt('token'), {
                                method: 'POST',
                                headers: {
                                  'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
                                },
                                body: d,
                              })),
                            ];
                          case 1:
                            return (
                              (t = s.sent()),
                              (n = t.access_token),
                              (r = t.id_token),
                              (i = t.expires_in),
                              Ze(e),
                              ot(n),
                              ut(new Date(Date.now() + 1e3 * i)),
                              ct(),
                              r ? (rt(r), [4, Or(r, e)]) : [3, 3]
                            );
                          case 2:
                            (o = s.sent()) && ft(o), (s.label = 3);
                          case 3:
                            return (a = Oe(location.hash).context_token)
                              ? (Je(kr(a)), [3, 6])
                              : [3, 4];
                          case 4:
                            return [4, Br()];
                          case 5:
                            s.sent(), (s.label = 6);
                          case 6:
                            return [2];
                        }
                        var c, u, l, f, d;
                      });
                    });
                  }),
                    (o.label = 1);
                case 1:
                  return o.trys.push([1, 3, , 4]), [4, t()];
                case 2:
                  return o.sent(), [3, 4];
                case 3:
                  throw ((n = o.sent()), (r = n), ct(), r);
                case 4:
                  return [2];
              }
            });
          });
        }
        function Wr() {
          return P(this, void 0, void 0, function () {
            var e,
              t,
              n,
              r,
              i,
              o,
              a = this;
            return A(this, function (s) {
              switch (s.label) {
                case 0:
                  return (t = jn()) ? [3, 2] : [4, Ln(Yt)];
                case 1:
                  (t = s.sent()), (s.label = 2);
                case 2:
                  return (e = t).isReady() ? ((n = Ae(8)), [4, e.getData('appData')]) : [3, 8];
                case 3:
                  return (
                    (r = s.sent()),
                    (i = r.eventName),
                    (o = r.data),
                    i !== $t.NOT_FOUND ? [3, 6] : [4, e.teardown()]
                  );
                case 4:
                  return s.sent(), [4, Wr()];
                case 5:
                  return [2, s.sent()];
                case 6:
                  o && Xe(JSON.stringify(o)), (s.label = 7);
                case 7:
                  return (
                    e.listen(function (t) {
                      return P(a, void 0, void 0, function () {
                        var r, i;
                        return A(this, function (o) {
                          return (
                            (r = t.context),
                            (i = r.data),
                            r.eventName === ce.INIT &&
                              (null == i ? void 0 : i.subWindowId) !== n &&
                              hn(),
                            (r.eventName !== ce.CANCEL && r.eventName !== ce.SUBMIT) ||
                              e.teardown(),
                            [2]
                          );
                        });
                      });
                    }),
                    ht() &&
                      e.send({
                        eventName: ce.INIT,
                        data: { subWindowId: n, hasOpener: !!window.opener },
                      }),
                    [3, 10]
                  );
                case 8:
                  return Un()
                    ? [3, 10]
                    : [
                        4,
                        new Promise(function (e) {
                          window.addEventListener(
                            'message',
                            (function (e) {
                              return function t(n) {
                                var r = n.data,
                                  i = n.source,
                                  o = n.origin;
                                if (r) {
                                  var a = r.type,
                                    s = r.message;
                                  a === le &&
                                    (window.removeEventListener('message', t),
                                    s && Xe(s),
                                    (function (e) {
                                      Nn.setItem('mainWindowOrigin', e);
                                    })(o),
                                    i && i.postMessage && i.postMessage({ status: le }, o),
                                    e());
                                }
                              };
                            })(e)
                          );
                        }),
                      ];
                case 9:
                  return [2, s.sent()];
                case 10:
                  return [2];
              }
            });
          });
        }
        var Hr = new ((function () {
          function e() {
            var e = this;
            (this.getAndValidateContext = function () {
              var e = Ke();
              if (!e) throw Se(z, 'Could not get Context from server.');
              if (!e.endpointUrl) throw Se(z, 'Could not get endpointUrl from server.');
              if (!e.permanentLinkPattern)
                throw Se(z, 'Could not get permanentLinkPattern from server.');
              return e;
            }),
              (this.decodeState = function (t) {
                var n = e.getAndValidateContext();
                t = t.replace(/\n/g, '%0D%0A');
                var r =
                    (!n.endpointUrl.startsWith('/?') && n.endpointUrl.includes('/?')) ||
                    (!n.endpointUrl.startsWith('/#') && n.endpointUrl.includes('/#')) ||
                    n.endpointUrl.endsWith('/') ||
                    (!t.startsWith('/?') && t.includes('/?')) ||
                    (!t.startsWith('/#') && t.includes('/#')) ||
                    t.endsWith('/'),
                  i = new URL(n.endpointUrl),
                  o = i.origin,
                  a = i.pathname,
                  s = i.search,
                  c = new URL(''.concat(o).concat(e.attachSlashAtStart(t))),
                  u = c.pathname,
                  l = c.search,
                  f = c.hash,
                  d = ''.concat(s).concat(s ? l.replace(/\?/g, '&') : l),
                  h = ''.concat(a).concat(e.attachSlashAtStart(u)).replace('//', '/');
                return (
                  (h = e.attachSlashAtStart(''.concat(h))).endsWith('/') &&
                    !r &&
                    (h = h.substring(0, h.length - 1)),
                  ''
                    .concat(o)
                    .concat(h)
                    .concat(d)
                    .concat(f)
                    .replace(/%0D%0A/g, '\n')
                );
              });
          }
          return (
            (e.prototype.attachSlashAtStart = function (e) {
              return ''.concat(e && e.length > 0 && !e.startsWith('/') ? '/' : '').concat(e);
            }),
            (e.prototype.invoke = function () {
              return P(this, void 0, void 0, function () {
                var e, t, n, r, i;
                return A(this, function (o) {
                  switch (o.label) {
                    case 0:
                      if (
                        ((e = Oe(window.location.search)), 'string' != typeof (t = e['liff.state']))
                      )
                        return [2];
                      o.label = 1;
                    case 1:
                      return (
                        o.trys.push([1, 4, , 5]),
                        (n = location.href),
                        (r = this.decodeState(t)) === n
                          ? [3, 3]
                          : (e['liff.hback']
                              ? location.replace(Fe(r, { 'liff.hback': e['liff.hback'] }))
                              : location.replace(r),
                            [4, new Promise(function () {})])
                      );
                    case 2:
                      o.sent(), (o.label = 3);
                    case 3:
                      return [3, 5];
                    case 4:
                      if ((i = o.sent()).code === z) throw i;
                      return R.debug(i), [3, 5];
                    case 5:
                      return [2];
                  }
                });
              });
            }),
            e
          );
        })())();
        function Vr(e, t) {
          return P(this, void 0, void 0, function () {
            var n;
            return A(this, function (r) {
              switch (r.label) {
                case 0:
                  if (!e.liffId) throw Se(Q, 'liffId is necessary for liff.init()');
                  return (
                    (function (e) {
                      window.__liffConfig = e;
                    })(e),
                    !We() &&
                      ht() &&
                      ((function () {
                        var e = He();
                        return ge(''.concat(ne, ':').concat(ie.EXPIRES, ':').concat(e.liffId));
                      })() ||
                        Rt()),
                    (n = Oe(window.location.search)),
                    !mt() || We() ? [3, 2] : [4, Wr()]
                  );
                case 1:
                  r.sent(), (r.label = 2);
                case 2:
                  if (n.error && n.liffOAuth2Error)
                    throw (
                      ((a = n.error),
                      (s = n.error_description.replace(/\+/g, ' ')),
                      (c = ''.concat(a, ': ').concat(s)),
                      Se(z, c))
                    );
                  return (
                    (i = n.code),
                    (o = st()),
                    Boolean(i && !ht() && o && o.codeVerifier) ? [4, Mr(n.liffClientId)] : [3, 4]
                  );
                case 3:
                  r.sent(), (r.label = 4);
                case 4:
                  return We() ? [4, Rr(e)] : [3, 6];
                case 5:
                  return r.sent(), [3, 8];
                case 6:
                  return ht() ? [3, 8] : [4, Br()];
                case 7:
                  r.sent(), (r.label = 8);
                case 8:
                  return [4, Hr.invoke()];
                case 9:
                  return r.sent(), [4, t()];
                case 10:
                  return (
                    r.sent(),
                    (function (e) {
                      var t = Le(xe(e));
                      window.history.replaceState(history.state, '', t);
                    })(window.location.href),
                    [2]
                  );
              }
              var i, o, a, s, c;
            });
          });
        }
        var Gr = function (e, t) {
            return new Promise(function (n, r) {
              if (e) {
                var i = document.createElement('script');
                (i.type = 'module'),
                  (i.onload = function () {
                    n();
                  }),
                  (i.src = e),
                  document.head.appendChild(i);
              } else r(Se(Q, t));
            });
          },
          Kr = function (e) {
            var t = 'https://static.line-scdn.net/lui/edge/versions/1.13.0/lui-alert.js';
            return (
              t && e && (t = t.replace(/\d{1,2}\.\d{1,2}\.\d{1,3}/, e)),
              Gr(t, 'LUI_ALERT_URL is not defined')
            );
          },
          Jr = function () {
            return P(void 0, void 0, void 0, function () {
              var e;
              return A(this, function (t) {
                switch (t.label) {
                  case 0:
                    return (
                      (e = (function () {
                        var e,
                          t = document.querySelector('script[src*="luivendor.js"]');
                        if (
                          t &&
                          (null === (e = t.src.match(/\d{1,2}\.\d{1,2}\.\d{1,3}/g)) || void 0 === e
                            ? void 0
                            : e.length)
                        )
                          return t.src.match(/\d{1,2}\.\d{1,2}\.\d{1,3}/g)[0];
                      })()),
                      e
                        ? [3, 2]
                        : [
                            4,
                            Gr(
                              'https://static.line-scdn.net/lui/edge/versions/1.13.0/luivendor.js',
                              'LUI_VENDOR_URL is not defined'
                            ),
                          ]
                    );
                  case 1:
                    t.sent(), (t.label = 2);
                  case 2:
                    return [4, Kr(e)];
                  case 3:
                    return (
                      t.sent(),
                      [
                        4,
                        ((n = Ae(6)),
                        new Promise(function () {
                          var e = document.createElement('div');
                          (e.innerHTML = '<lui-alert id="'
                            .concat('liffAlert', '-')
                            .concat(n, '" shown title="')
                            .concat(
                              wr('alert.android.extBrowser.autoLoginWorkaround.title'),
                              '" message="'
                            )
                            .concat(
                              wr('alert.android.extBrowser.autoLoginWorkaround.desc'),
                              '" button="'
                            )
                            .concat(
                              wr('alert.android.extBrowser.autoLoginWorkaround.button.text'),
                              '"></lui-alert>'
                            )),
                            document.body.appendChild(e);
                          var t = document.getElementById(''.concat('liffAlert', '-').concat(n));
                          t &&
                            t.addEventListener('lui-button-click', function () {
                              var e = window.open(
                                Fe(window.location.href, { liffIsEscapedFromApp: 'true' }),
                                '_blank'
                              );
                              e &&
                                ((e.location.href = Fe(window.location.href, {
                                  liffIsEscapedFromApp: 'true',
                                })),
                                window.close());
                            });
                        })),
                      ]
                    );
                  case 4:
                    return t.sent(), [2];
                }
                var n;
              });
            });
          },
          qr = function (e) {
            try {
              return new URL(e).searchParams.get('lineAppVersion');
            } catch (t) {
              return null;
            }
          };
        function $r() {
          var e;
          return P(this, void 0, void 0, function () {
            var t, n;
            return A(this, function (r) {
              switch (r.label) {
                case 0:
                  return ((t =
                    null !== (e = qr(window.location.href)) && void 0 !== e
                      ? e
                      : qr(window.document.referrer)) &&
                    pe(t, '13.10.0') >= 0) ||
                    We() ||
                    'android' !== Lt() ||
                    (n = Oe(window.location.search))[Jt] ||
                    n.liffIsEscapedFromApp
                    ? [2]
                    : n.liffClientId && document.referrer.includes('access.'.concat('line.me'))
                      ? ((window.location.href = Fe(window.location.href, {
                          liffIsEscapedFromApp: 'true',
                        })),
                        [2])
                      : n.liffClientId && document.referrer.includes('android-app://')
                        ? [4, Jr()]
                        : [3, 2];
                case 1:
                  r.sent(), (r.label = 2);
                case 2:
                  return n.liffClientId && '' === document.referrer && 1 === window.history.length
                    ? [4, Jr()]
                    : [3, 4];
                case 3:
                  r.sent(), (r.label = 4);
                case 4:
                  return !document.referrer.includes('liffClientId') ||
                    document.referrer.includes('liffIsEscapedFromApp')
                    ? [3, 6]
                    : [4, Jr()];
                case 5:
                  r.sent(), (r.label = 6);
                case 6:
                  return [2];
              }
            });
          });
        }
        var zr = (function (e) {
          function t() {
            var t = (null !== e && e.apply(this, arguments)) || this;
            return (
              (t.hooks = { before: new ur(), after: new ur() }),
              (t.internalHooks = {
                beforeFinished: new ur(),
                beforeSuccess: new ur(),
                error: new ur(),
              }),
              t
            );
          }
          return (
            O(t, e),
            Object.defineProperty(t.prototype, 'name', {
              get: function () {
                return 'init';
              },
              enumerable: !1,
              configurable: !0,
            }),
            (t.prototype.install = function (e) {
              var t = e.liff;
              return (this.liffForWindow = t), this.init.bind(this);
            }),
            (t.prototype.init = function (e, t, n) {
              return P(this, void 0, void 0, function () {
                var r;
                return A(this, function (i) {
                  switch (i.label) {
                    case 0:
                      return [4, this.hooks.before.call()];
                    case 1:
                      i.sent(),
                        (o = this.liffForWindow),
                        window && !window.liff && (window.liff = o),
                        (i.label = 2);
                    case 2:
                      return (
                        i.trys.push([2, 9, , 11]),
                        [
                          4,
                          Promise.all([
                            Sr(this.liffForWindow),
                            Vr(e, this.internalHooks.beforeFinished.call),
                          ]),
                        ]
                      );
                    case 3:
                      return (
                        i.sent(),
                        (function () {
                          var e;
                          Tr(
                            'color-scheme',
                            (
                              (null == (e = Ke()) ? void 0 : e.menuColorSetting) || {
                                adaptableColorSchemes: ['light'],
                              }
                            ).adaptableColorSchemes.join(' ')
                          );
                          var t = window.matchMedia('(prefers-color-scheme: dark)');
                          yr({
                            matches: null == t ? void 0 : t.matches,
                            media: null == t ? void 0 : t.media,
                          }),
                            t.addEventListener
                              ? t.addEventListener('change', yr)
                              : t.addListener && t.addListener(yr);
                        })(),
                        [4, this.internalHooks.beforeSuccess.call()]
                      );
                    case 4:
                      return (
                        i.sent(),
                        !e.withLoginOnExternalBrowser || ht()
                          ? [3, 6]
                          : (lr(), [4, new Promise(function () {})])
                      );
                    case 5:
                      i.sent(), (i.label = 6);
                    case 6:
                      return [4, $r()];
                    case 7:
                      return i.sent(), [4, this.hooks.after.call()];
                    case 8:
                      return i.sent(), 'function' == typeof t && t(), N(), [3, 11];
                    case 9:
                      return (r = i.sent()), [4, this.internalHooks.error.call(r)];
                    case 10:
                      throw (i.sent(), 'function' == typeof n && n(r), r);
                    case 11:
                      return [2];
                  }
                  var o;
                });
              });
            }),
            t
          );
        })(H);
        function Xr() {
          return navigator.language;
        }
        !(function (e) {
          function t() {
            return (null !== e && e.apply(this, arguments)) || this;
          }
          O(t, e),
            Object.defineProperty(t.prototype, 'name', {
              get: function () {
                return 'getLanguage';
              },
              enumerable: !1,
              configurable: !0,
            }),
            (t.prototype.install = function () {
              return function () {
                return Xr();
              };
            });
        })(H);
        function Qr(e) {
          return P(this, void 0, void 0, function () {
            var t, n, r, i, o, a, s;
            return A(this, function (c) {
              switch (c.label) {
                case 0:
                  return (function (e) {
                    if (!fe.includes(e)) throw Se($, 'Unexpected permission name.');
                    var t = Ke();
                    return !!(null == t ? void 0 : t.scope.includes(e));
                  })(e)
                    ? (t = it())
                      ? [4, Kt(t)]
                      : [3, 2]
                    : [2, { state: 'unavailable' }];
                case 1:
                  (n = c.sent()), (r = unescape(n.scope).split(' '));
                  try {
                    for (i = x(r), o = i.next(); !o.done; o = i.next())
                      if (o.value.includes(e)) return [2, { state: 'granted' }];
                  } catch (u) {
                    a = { error: u };
                  } finally {
                    try {
                      o && !o.done && (s = i.return) && s.call(i);
                    } finally {
                      if (a) throw a.error;
                    }
                  }
                  return [2, { state: 'prompt' }];
                case 2:
                  throw Se(q, 'LiffId is not found.');
              }
            });
          });
        }
        function Yr() {
          var e,
            t,
            n = Ke();
          return (
            !!n &&
            'square_chat' !== n.type &&
            (Ot('skipChannelVerificationScreen') ||
              (!We() &&
                (null ===
                  (t =
                    null === (e = n.availability) || void 0 === e
                      ? void 0
                      : e.skipChannelVerificationScreen) || void 0 === t
                  ? void 0
                  : t.permission)))
          );
        }
        function Zr() {
          var e = He().liffId;
          if (e)
            return Mt(''.concat(Gt('unauthorizedPermissions'), '?liffId=').concat(e), {
              headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                Authorization: 'Bearer '.concat(it()),
              },
            });
          throw Se(q, 'liffId is required');
        }
        var ei,
          ti = or.on,
          ni = or.off,
          ri = or.open,
          ii = (function () {
            function e(e, t) {
              var n = this;
              (this.onSubmit = function (e) {
                var t = e.newAccessToken,
                  r = e.ICA_ERROR;
                return P(n, void 0, void 0, function () {
                  return A(this, function (e) {
                    return (
                      t ? this.resolve({ newAccessToken: t }) : r && this.reject(Se(J, r)),
                      this.teardown(),
                      [2]
                    );
                  });
                });
              }),
                (this.onClose = function () {
                  return P(n, void 0, void 0, function () {
                    return A(this, function (e) {
                      return (
                        this.reject(Se(q, "user didn't allow the agreement")), this.teardown(), [2]
                      );
                    });
                  });
                }),
                (this.onCancel = function () {
                  return P(n, void 0, void 0, function () {
                    return A(this, function (e) {
                      return (
                        this.reject(Se(q, "user didn't allow the agreement")), this.teardown(), [2]
                      );
                    });
                  });
                }),
                (this.onError = function (e) {
                  return P(n, void 0, void 0, function () {
                    return A(this, function (t) {
                      return this.reject(e), this.teardown(), [2];
                    });
                  });
                }),
                (this.resolve = e),
                (this.reject = t),
                this.setup();
            }
            return (
              (e.prototype.setup = function () {
                ti('submit', this.onSubmit),
                  ti('close', this.onClose),
                  ti('cancel', this.onCancel),
                  ti('error', this.onError);
              }),
              (e.prototype.teardown = function () {
                ni('submit', this.onSubmit),
                  ni('close', this.onClose),
                  ni('cancel', this.onCancel),
                  ni('error', this.onError),
                  (ei = void 0);
              }),
              (e.prototype.open = function (e) {
                var t = He().liffId;
                t
                  ? ri({
                      url: ''.concat('https://liff.line.me/1656032314-Xgrw5Pmk'),
                      appData: { liffId: t, channelId: Ce(t), accessToken: it() },
                      onBeforeTransition: e,
                    }).catch(this.reject)
                  : this.reject(Se(q, 'liffId is required'));
              }),
              e
            );
          })();
        function oi() {
          return P(this, void 0, void 0, function () {
            var e,
              t = this;
            return A(this, function (n) {
              switch (n.label) {
                case 0:
                  if (!Yr()) throw Se(X, 'SkipChannelVerificationScreen is unavailable.');
                  return (
                    ei && ei.teardown(),
                    (e = function () {
                      return P(t, void 0, void 0, function () {
                        var e;
                        return A(this, function (t) {
                          switch (t.label) {
                            case 0:
                              return [4, Zr()];
                            case 1:
                              if (
                                ((e = t.sent()),
                                (We()
                                  ? e
                                  : e.filter(function (e) {
                                      return 'chat_message.write' !== e;
                                    })
                                ).length <= 0)
                              )
                                throw Se(X, 'All permissions have already been approved.');
                              return [2];
                          }
                        });
                      });
                    }),
                    [
                      4,
                      new Promise(function (t, n) {
                        (ei = new ii(t, n)).open(e);
                      }),
                    ]
                  );
                case 1:
                  return ot(n.sent().newAccessToken), [2];
              }
            });
          });
        }
        function ai(e, t) {
          var n = this;
          return function () {
            for (var r = [], i = 0; i < arguments.length; i++) r[i] = arguments[i];
            return P(n, void 0, void 0, function () {
              var n, i, o;
              return A(this, function (a) {
                switch (a.label) {
                  case 0:
                    return (
                      (n = (r.length > 0 ? r[r.length - 1] : {}).ignorePermissionCheck),
                      (i = void 0 !== n && n),
                      [4, Qr(t)]
                    );
                  case 1:
                    if ('unavailable' !== (o = a.sent().state)) return [3, 2];
                    throw Se(X, 'The permission is not in LIFF app scope.');
                  case 2:
                    return 'prompt' !== o || !Yr() || i || (!We() && 'chat_message.write' === t)
                      ? [3, 4]
                      : [4, oi()];
                  case 3:
                    return a.sent(), [3, 5];
                  case 4:
                    i && r.pop(), (a.label = 5);
                  case 5:
                    return [4, e.apply(void 0, j([], L(r), !1))];
                  case 6:
                    return [2, a.sent()];
                }
              });
            });
          };
        }
        var si = new ((function (e) {
          function t() {
            return (null !== e && e.apply(this, arguments)) || this;
          }
          return (
            O(t, e),
            Object.defineProperty(t.prototype, 'name', {
              get: function () {
                return 'permission';
              },
              enumerable: !1,
              configurable: !0,
            }),
            (t.prototype.install = function () {
              return { query: Qr, requestAll: oi };
            }),
            t
          );
        })(H))();
        function ci() {
          return Mt(Gt('profile'));
        }
        !(function (e) {
          function t() {
            return (null !== e && e.apply(this, arguments)) || this;
          }
          O(t, e),
            Object.defineProperty(t.prototype, 'name', {
              get: function () {
                return 'getProfile';
              },
              enumerable: !1,
              configurable: !0,
            }),
            (t.prototype.install = function () {
              return ai(ci, 'profile');
            });
        })(H);
        function ui(e) {
          if (
            !(function (e) {
              if (!e || 'object' != typeof e) return !1;
              var t = e,
                n = t.url,
                r = L([typeof n, typeof t.external], 2),
                i = r[0],
                o = r[1];
              return 'string' === i && '' !== n && ('undefined' === o || 'boolean' === o);
            })(e)
          )
            throw Se($, 'Invalid parameters for liff.openWindow()');
          var t = gt();
          if (We())
            if ((null !== t && 'ios' === Lt() && pe(t, '9.19') >= 0) || !window._liff.postMessage) {
              var n = e.url,
                r = e.external,
                i = void 0 !== r && r;
              window.open(
                (function (e, t) {
                  var n, r, i, o, a, s, c, u, l;
                  (function (e) {
                    return (
                      -1 !== e.indexOf('#') &&
                      -1 !== e.indexOf('?') &&
                      e.indexOf('#') < e.indexOf('?')
                    );
                  })(e) ||
                  (function (e) {
                    return -1 === e.indexOf('?') && -1 !== e.indexOf('#');
                  })(e)
                    ? ((c = (n = L(e.split('#'), 2))[0]),
                      (u = (i = L((void 0 === (r = n[1]) ? '' : r).split('?'), 2))[0]),
                      (l = i[1]))
                    : ((c = (o = L(e.split('?'), 2))[0]),
                      (l = (s = L((void 0 === (a = o[1]) ? '' : a).split('#'), 2))[0]),
                      (u = s[1]));
                  var f = (function (e, t) {
                    return e
                      ? '&'.concat(
                          e
                            .split('&')
                            .filter(function (e) {
                              return -1 === e.indexOf('is_liff_external_open_window');
                            })
                            .join('&')
                            .concat(''.concat(t ? '#'.concat(t) : ''))
                        )
                      : ''.concat(t ? '#'.concat(t) : '');
                  })(l, u);
                  return ''
                    .concat(c, '?')
                    .concat('is_liff_external_open_window', '=')
                    .concat(!!t)
                    .concat(f);
                })(n, i)
              );
            } else dn('openWindow', e);
          else window.open(e.url, '_blank');
        }
        !(function (e) {
          function t() {
            return (null !== e && e.apply(this, arguments)) || this;
          }
          O(t, e),
            Object.defineProperty(t.prototype, 'name', {
              get: function () {
                return 'openWindow';
              },
              enumerable: !1,
              configurable: !0,
            }),
            (t.prototype.install = function () {
              return function (e) {
                return ui(e);
              };
            });
        })(H);
        var li = function (e) {
          return (
            'object' == typeof e &&
            null !== e &&
            (function (e) {
              return 'string' == typeof e || e instanceof String;
            })(e.type)
          );
        };
        function fi(e) {
          return Promise.reject(Se($, e));
        }
        function di(e) {
          if (
            !(function (e) {
              return Array.isArray(e) && e.every(li);
            })(e)
          )
            return fi("Parameter 'messages' must be an array of { type, ... }");
          var t = e.length;
          return t < 1 || t > 5
            ? fi('Number of messages should be in range 1 to '.concat(5, '.'))
            : Mt(Gt('message'), { method: 'POST', body: JSON.stringify({ messages: e }) }).catch(
                hi
              );
        }
        var hi = function (e) {
          if ('403' === e.code) {
            var t = '12.0.0' === gt(),
              n = 'ios' === Lt(),
              r = Ue();
            t &&
              (n || r) &&
              window.alert(
                'LINE繧｢繝励Μ繧鱈INE 12.0.1莉･髯阪↓繧｢繝��繝��繝医＠縺ｦ縺上□縺輔＞縲�\nPlease update your LINE app to LINE 12.0.1 or later.'
              );
          }
          throw e;
        };
        !(function (e) {
          function t() {
            return (null !== e && e.apply(this, arguments)) || this;
          }
          O(t, e),
            Object.defineProperty(t.prototype, 'name', {
              get: function () {
                return 'sendMessages';
              },
              enumerable: !1,
              configurable: !0,
            }),
            (t.prototype.install = function () {
              return ai(di, 'chat_message.write');
            });
        })(H);
        function pi() {
          return Mt(Gt('friendship'));
        }
        !(function (e) {
          function t() {
            return (null !== e && e.apply(this, arguments)) || this;
          }
          O(t, e),
            Object.defineProperty(t.prototype, 'name', {
              get: function () {
                return 'getFriendship';
              },
              enumerable: !1,
              configurable: !0,
            }),
            (t.prototype.install = function () {
              return ai(pi, 'profile');
            });
        })(H);
        function vi() {
          return P(this, void 0, void 0, function () {
            var e, t;
            return A(this, function (n) {
              switch (n.label) {
                case 0:
                  if (!ht()) return [3, 6];
                  n.label = 1;
                case 1:
                  return n.trys.push([1, 5, , 6]), (e = lt()) && e.sub ? [2, e.sub] : [3, 2];
                case 2:
                  return [4, ci()];
                case 3:
                  if ((t = n.sent()) && t.userId) return [2, t.userId];
                  n.label = 4;
                case 4:
                  return [3, 6];
                case 5:
                  return (
                    n.sent(), R.debug("can't retrieve Mid/Uid because of something wrong"), [3, 6]
                  );
                case 6:
                  return [2];
              }
            });
          });
        }
        function wi() {
          return P(this, void 0, void 0, function () {
            var e;
            return A(this, function (t) {
              switch (t.label) {
                case 0:
                  return [4, vi()];
                case 1:
                  return (e = t.sent()) && 'u' === e.substring(0, 1) ? [2, e] : [2];
              }
            });
          });
        }
        var bi,
          mi = (function (e) {
            function t() {
              var t = (null !== e && e.apply(this, arguments)) || this;
              return (
                (t.utsExtra = { isLiffSuccessful: !1, isLoggedIn: !1, id: '', version: '' }),
                (t.injected = !1),
                t
              );
            }
            return (
              O(t, e),
              Object.defineProperty(t, 'CUSTOMPLACEID_INIT', {
                get: function () {
                  return 'liff.init';
                },
                enumerable: !1,
                configurable: !0,
              }),
              Object.defineProperty(t, 'CUSTOMTYPE', {
                get: function () {
                  return 'liffSdk';
                },
                enumerable: !1,
                configurable: !0,
              }),
              Object.defineProperty(t, 'LiffUtsLoginStatus', {
                get: function () {
                  return { isLoggedIn: 1, isLiffSuccessful: 2 };
                },
                enumerable: !1,
                configurable: !0,
              }),
              Object.defineProperty(t.prototype, 'name', {
                get: function () {
                  return 'analytics';
                },
                enumerable: !1,
                configurable: !0,
              }),
              (t.prototype.install = function (e) {
                var t = e.liff,
                  n = e.internalHooks;
                (this.liffCore = t),
                  n.init.beforeFinished(this.beforeInitFinished.bind(this)),
                  n.init.beforeSuccess(this.beforeInitSuccess.bind(this)),
                  n.init.error(this.initError.bind(this));
              }),
              (t.prototype.changeRatioToUTSFormat = function (e) {
                if (e && Number.isFinite(e)) return Math.round(100 * e);
              }),
              (t.prototype.setExtra = function () {
                var e,
                  n = this.utsExtra,
                  r = n.isLiffSuccessful,
                  i = n.isLoggedIn,
                  o = n.id,
                  a = n.version,
                  s =
                    (i ? t.LiffUtsLoginStatus.isLoggedIn : 0) |
                    (r ? t.LiffUtsLoginStatus.isLiffSuccessful : 0);
                null === (e = this.uts) ||
                  void 0 === e ||
                  e.setExtra('liff', { id: o, loginStatus: s, version: a });
              }),
              (t.prototype.assignUtsExtra = function (e) {
                Object.assign(this.utsExtra, e);
              }),
              (t.prototype.setVersion = function (e) {
                this.assignUtsExtra({ version: e }),
                  R.debug('[LIFFUTS][SDK version] '.concat(e)),
                  this.setExtra();
              }),
              (t.prototype.setLiffId = function (e) {
                this.assignUtsExtra({ id: e }),
                  R.debug('[LIFFUTS][LIFFID] '.concat(e)),
                  this.setExtra();
              }),
              (t.prototype.setIsLoggedIn = function (e) {
                this.assignUtsExtra({ isLoggedIn: e }),
                  R.debug('[LIFFUTS][isLoggedIn] '.concat(e)),
                  this.setExtra();
              }),
              (t.prototype.sendLiffInit = function () {
                var e;
                R.debug('[LIFFUTS][sendCustom] liff.init'),
                  null === (e = this.uts) ||
                    void 0 === e ||
                    e.sendCustom({ type: t.CUSTOMTYPE, params: { placeId: t.CUSTOMPLACEID_INIT } });
              }),
              (t.prototype.setIsLiffSuccessful = function (e) {
                this.assignUtsExtra({ isLiffSuccessful: e }),
                  R.debug('[LIFFUTS][isLiffInitSuccessful] '.concat(e)),
                  this.setExtra();
              }),
              (t.prototype.prepareReferrer = function (e) {
                var t = {};
                Object.keys(e).forEach(function (n) {
                  if (se.includes(n)) {
                    var r = e[n];
                    'string' == typeof r && r && (t[n.replace(/^liff\.ref\./, '')] = r);
                  }
                }),
                  Object.keys(t).length > 0 && (this.referrer = t);
              }),
              (t.prototype.beforeInitFinished = function () {
                return P(this, void 0, void 0, function () {
                  var e, t, n, r, i, o, a, s, c, u, l, f;
                  return A(this, function (d) {
                    switch (d.label) {
                      case 0:
                        if (
                          ((e = Oe(window.location.search)),
                          this.prepareReferrer(e),
                          (t = Ke()),
                          !(n = null == t ? void 0 : t.utsTracking))
                        )
                          return [2];
                        if (
                          ((r = He()), (i = r.liffId), (o = r.analytics), 'auto' !== n.mode || !o)
                        )
                          return [3, 6];
                        R.debug('[LIFFUTS] '.concat(new Date().toUTCString())), (d.label = 1);
                      case 1:
                        return (
                          d.trys.push([1, 3, , 4]),
                          (a = this),
                          [
                            4,
                            new Promise(function (e, t) {
                              var n = window.uts,
                                r = document.createElement('script');
                              (r.type = 'text/javascript'),
                                (r.src = 'https://static.line-scdn.net/uts/edge/4.1.0/uts.js'),
                                (r.onload = function () {
                                  var t = window.uts;
                                  e(t), (window.uts = n);
                                }),
                                (r.onerror = function (e) {
                                  t(e);
                                }),
                                document.getElementsByTagName('head')[0].appendChild(r);
                            }),
                          ]
                        );
                      case 2:
                        return (a.uts = d.sent()), [3, 4];
                      case 3:
                        return (
                          (s = d.sent()),
                          R.debug('[LIFFUTS] cannot load UTS, reason: '.concat(s)),
                          [2]
                        );
                      case 4:
                        return (
                          (c = k(k({}, o.context), {
                            utsId: o.context.utsId,
                            appName: o.context.appName,
                            appEnv: o.context.appEnv || 'release',
                          })),
                          (u = k(k({ endpoint: 'https://uts-front.line-apps.com' }, o.options), {
                            sampleRate: this.changeRatioToUTSFormat(n.sendRatio),
                            version: 'current',
                          })),
                          this.uts.init(c, u),
                          [4, wi()]
                        );
                      case 5:
                        (l = d.sent()) &&
                          (R.debug('[LIFFUTS][mid] '.concat(l)), this.uts.setMid(l)),
                          (null == t ? void 0 : t.tid) &&
                            (R.debug('[LIFFUTS][tid] '.concat(t.tid)), this.uts.setTid(t.tid)),
                          this.referrer &&
                            (R.debug('liff.ref.referrer', this.referrer),
                            this.uts.setSessionParams(this.referrer)),
                          i && this.setLiffId(i),
                          this.setIsLoggedIn(ht()),
                          this.setVersion('2.22.3'),
                          (f = xe(location.href)),
                          R.debug('[LIFFUTS][url] '.concat(f)),
                          this.uts.setUrl(f),
                          (this.liffCore.analytics = this.uts),
                          (this.injected = !0),
                          (d.label = 6);
                      case 6:
                        return [2];
                    }
                  });
                });
              }),
              (t.prototype.beforeInitSuccess = function () {
                return (
                  this.injected && (this.setIsLiffSuccessful(!0), this.sendLiffInit()),
                  Promise.resolve()
                );
              }),
              (t.prototype.initError = function () {
                return (
                  this.injected && (this.setIsLiffSuccessful(!1), this.sendLiffInit()),
                  Promise.resolve()
                );
              }),
              t
            );
          })(H),
          gi = function (e) {
            R.debug('[LIFFUTS][sendCustom] liff.shareTargetPicker'),
              e.sendCustom({ type: 'liffSdk', params: { placeId: 'liff.shareTargetPicker' } });
          },
          yi =
            /([\x90\x9D\x81\x8D\x8F<"{|}>\\^`窶懌ｺ窶樞｢窶塲ｽﾅ�窶ｦ窶吮版ｾ窶凪倪昶｡邃｢窶ｰﾅ椎｡ﾅｸ窶ｹﾅ凪�ﾂ･ﾂｿﾂｩﾃ｡ﾃ�ｽﾃ催偲ｰﾃｴ]|\n|.*#.*#|%(?![0-9A-Fa-f]{2})[^%]{0,2})/,
          Ii = function (e) {
            if (yi.test(e)) throw Se($, 'invalid URL.');
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
                .replace(/(?:^|;|&)([^;&]*)[;&]*(?=($|;|&))/g, '$1&')
                .replace(/&+$/g, '')
                .replace(/^\?&/, '?'),
            };
          },
          Ti = function (e) {
            return e
              .substring(1)
              .split('&')
              .filter(function (e) {
                return !/^liff\./.test(e) && Boolean(e);
              });
          },
          Ei = function (e, t) {
            var n = e.substring(t.length);
            return '/' === n ? '' : (n.length > 0 && '/' !== n[0] && (n = '/' + n), n);
          },
          Si = function (e, t) {
            var n,
              r,
              i,
              o = (function (e, t) {
                for (var n = j([], L(e), !1), r = 0; r < t.length; r++) {
                  var i = t[r],
                    o = n.indexOf(i);
                  o > -1 && n.splice(o, 1);
                }
                return n;
              })(
                ((n = Ti(e).join('&')),
                (r = new URLSearchParams(n).toString().split('&')),
                (i = n.split('&')),
                r.map(function (e, t) {
                  return e.endsWith('=') && !i[t].endsWith('=') ? e.slice(0, -1) : e;
                })),
                Ti(t)
              ).join('&');
            return '' !== o ? '?'.concat(o) : '';
          },
          Ci = function (e) {
            var t = new RegExp('^'.concat(ae.join('|'))),
              n = e
                .substring(1)
                .split('&')
                .filter(function (e) {
                  return !t.test(e) && Boolean(e);
                })
                .join('&');
            return n ? '#'.concat(n) : '';
          },
          _i = (function (e) {
            function t() {
              var t = (null !== e && e.apply(this, arguments)) || this;
              return (
                (t.extraParams = ''),
                (t.getAndValidateContext = function () {
                  var e = Ke();
                  if (!e) throw Se(z, 'Could not get Context from server.');
                  if (!e.endpointUrl) throw Se(z, 'Could not get endpointUrl from server.');
                  if (!e.permanentLinkPattern)
                    throw Se(z, 'Could not get permanentLinkPattern from server.');
                  return e;
                }),
                (t.createUrl = function () {
                  var e = t.getAndValidateContext(),
                    n = window.location,
                    r = n.pathname,
                    i = n.search,
                    o = n.hash,
                    a = n.origin,
                    s = new URL(e.endpointUrl);
                  if (s.origin !== a || !t.isAncestor(s.pathname, r))
                    throw Se(Q, 'Current page is not under entrypoint.');
                  var c = r.substring(s.pathname.length);
                  c.length > 0 && '/' !== c[0] && (c = '/' + c);
                  var u = new RegExp('^'.concat(ae.join('|'))),
                    l = o
                      .substring(1)
                      .split('&')
                      .filter(function (e) {
                        return !u.test(e) && Boolean(e);
                      })
                      .join('&'),
                    f = l === s.hash.substring(1) ? '' : l,
                    d = function (e) {
                      return e
                        .substring(1)
                        .split('&')
                        .filter(function (e) {
                          return !/liff\.state/.test(e) && Boolean(e);
                        });
                    },
                    h = d(i),
                    p = d(s.search);
                  t.extraParams && h.push(t.extraParams);
                  for (var v = 0; v < p.length; v++) {
                    var w = p[v],
                      b = h.indexOf(w);
                    b > -1 && h.splice(b, 1);
                  }
                  var m = h.join('&'),
                    g = ''
                      .concat(c)
                      .concat('' !== m ? '?'.concat(m) : '')
                      .concat(f ? '#'.concat(f) : '');
                  return ''.concat(re).concat(He().liffId).concat(g);
                }),
                (t.createUrlBy = function (e) {
                  return P(t, void 0, void 0, function () {
                    var t, n, r, i;
                    return A(this, function (o) {
                      if (!(t = He().liffId)) throw Se(z, 'Should run after liff init.');
                      if (
                        ((n = this.getAndValidateContext()),
                        (r = Ii(e)),
                        (i = new URL(n.endpointUrl)),
                        r.username !== i.username || r.password !== i.password)
                      )
                        throw Se($, 'invalid URL.');
                      if (i.origin !== r.origin || !this.isAncestor(i.pathname, r.pathname))
                        throw Se($, 'invalid URL.');
                      return [
                        2,
                        re.concat(
                          t,
                          Ei(r.pathname, i.pathname),
                          Si(r.search, i.search),
                          Ci(r.hash)
                        ),
                      ];
                    });
                  });
                }),
                (t.setExtraQueryParam = function (e) {
                  t.extraParams = e;
                }),
                (t.isAncestor = function (e, t) {
                  return (
                    0 === t.indexOf(e) &&
                    (e.endsWith('/') && (e = e.substring(0, e.length - 1)),
                    void 0 === t[e.length] || '/' === t[e.length])
                  );
                }),
                (t.install = function () {
                  return {
                    createUrl: t.createUrl,
                    createUrlBy: t.createUrlBy,
                    setExtraQueryParam: t.setExtraQueryParam,
                  };
                }),
                t
              );
            }
            return (
              O(t, e),
              Object.defineProperty(t.prototype, 'name', {
                get: function () {
                  return 'permanentLink';
                },
                enumerable: !1,
                configurable: !0,
              }),
              t
            );
          })(H),
          Oi = new _i(),
          ki = (function () {
            function e(e, t) {
              var n = this;
              (this.resolve = e),
                (this.reject = t),
                (this.onSubmit = function (e) {
                  var t = e.message;
                  n.resolve({ value: t }), n.destroy();
                }),
                (this.onClose = function () {
                  n.resolve({ value: null }), n.destroy();
                }),
                (this.onCancel = function () {
                  n.resolve({ value: null }), n.destroy();
                }),
                (this.onError = function (e) {
                  n.reject(e), n.destroy();
                }),
                this.start();
            }
            return (
              (e.prototype.start = function () {
                or.on('submit', this.onSubmit),
                  or.on('close', this.onClose),
                  or.on('cancel', this.onCancel),
                  or.on('error', this.onError);
              }),
              (e.prototype.destroy = function () {
                or.off('submit', this.onSubmit),
                  or.off('close', this.onClose),
                  or.off('cancel', this.onCancel),
                  or.off('error', this.onError),
                  (bi = void 0);
              }),
              e
            );
          })();
        function Pi() {
          return P(this, void 0, void 0, function () {
            return A(this, function (e) {
              return (
                _t.scanCodeV2(),
                bi && bi.destroy(),
                [
                  2,
                  new Promise(function (e, t) {
                    (bi = new ki(e, t)),
                      or
                        .open({ url: 'https://liff.line.me/1656359117-jxmx5e11' })
                        .catch(function (e) {
                          null == bi || bi.destroy(), t(e);
                        });
                  }),
                ]
              );
            });
          });
        }
        var Ai = new ((function (e) {
            function t() {
              return (null !== e && e.apply(this, arguments)) || this;
            }
            return (
              O(t, e),
              Object.defineProperty(t.prototype, 'name', {
                get: function () {
                  return 'scanCodeV2';
                },
                enumerable: !1,
                configurable: !0,
              }),
              (t.prototype.install = function () {
                return Pi;
              }),
              t
            );
          })(H))(),
          xi = {};
        function Li(e, t) {
          var n = xi,
            r = L(t.split('.'), 1)[0],
            i = n[t];
          i && e.removeEventListener(r, i), (n[t] = null);
        }
        var ji = !1,
          Fi = !1;
        function Ni(e, t, n, r) {
          if ((void 0 === n && (n = {}), 'object' != typeof e || !e.postMessage))
            throw Se($, 'target must be window object');
          if ('string' != typeof t) throw Se($, 'keyname must be string');
          if ('object' != typeof n)
            throw Se($, 'incorrect body format. It should be Object or Array comprised of Object');
          if (!r) throw Se($, "serverEndPointUrl isn't passed. please fill up with proper url");
          if ('*' === r) throw new Error("serverEndPointUrl doesn't allow to set '*'");
          var i = { name: t, body: n };
          e.postMessage(i, r);
        }
        function Ui(e, t, n, r) {
          !(function (e, t, n, r) {
            ji ||
              ((Fi = (function () {
                var e = !1;
                try {
                  var n = Object.defineProperty({}, 'passive', {
                    get: function () {
                      return (e = !0), !1;
                    },
                  });
                  window.addEventListener('test', n, n), window.removeEventListener('test', n, n);
                } catch (t) {
                  e = !1;
                }
                return e;
              })()),
              (ji = !0));
            var i = L(t.split('.'), 1)[0];
            new Promise(function (o) {
              var a = function (i) {
                o(i), n && n(i), r && r.once && Li(e, t);
              };
              !(function (e, t) {
                xi[e] = t;
              })(t, a),
                e.addEventListener(i, a, !!Fi && r);
            });
          })(
            e,
            'message.'.concat(t),
            (function (e, t, n) {
              return function (r) {
                R.debug('messageReceive', r), r.origin === n && r.data.name === e && t(r);
              };
            })(t, n, r)
          );
        }
        var Ri = (function () {
            function e() {
              (this.payloadToShareTargetPicker = null),
                (this.popupWindow = null),
                (this.doesWaitForSubwindowResult = !1);
            }
            return (
              (e.getInstance = function () {
                return e.instance ? e.instance.reset() : (e.instance = new e()), e.instance;
              }),
              (e.prototype.init = function (e) {
                return P(this, void 0, void 0, function () {
                  var t, n;
                  return A(this, function (r) {
                    switch (r.label) {
                      case 0:
                        return (
                          r.trys.push([0, 5, , 6]),
                          (this.liffId = e.referrer.liffId),
                          (this.doesWaitForSubwindowResult = !(
                            !e.options || !e.options.waitForSubwindowResult
                          )),
                          (this.allowPostMessageOrigin = this.initAllowPostMessageOrigin()),
                          (this.payloadToShareTargetPicker =
                            this.buildPayloadToShareTargetPicker(e)),
                          window.AbortController &&
                            (this.abortController = new window.AbortController()),
                          this.prepareAnotherWindow(),
                          [4, this.initOtt()]
                        );
                      case 1:
                        return (
                          r.sent(),
                          this.initListener(),
                          this.openAnotherWindow(),
                          this.doesWaitForSubwindowResult ? [4, this.pollingShareResult()] : [3, 3]
                        );
                      case 2:
                        return (t = r.sent()), this.finalize(), [2, t];
                      case 3:
                      case 6:
                        return [2];
                      case 4:
                        return [3, 6];
                      case 5:
                        if (((n = r.sent()), this.finalize(), 'AbortError' !== n.name)) throw n;
                        return [3, 6];
                    }
                  });
                });
              }),
              (e.prototype.resetAllVariables = function () {
                (this.liffId = ''),
                  (this.allowPostMessageOrigin = ''),
                  (this.payloadToShareTargetPicker = null),
                  (this.ott = ''),
                  (this.popupWindow = null),
                  (this.timeoutIDForHealthCheck = null),
                  (this.abortController = null),
                  (this.internalError = null),
                  (this.doesWaitForSubwindowResult = !1);
              }),
              (e.prototype.reset = function () {
                this.finalize(), this.resetAllVariables();
              }),
              (e.prototype.finalize = function () {
                var e, t;
                this.abortController && this.abortController.abort(),
                  We() ||
                    ((e = this.timeoutIDForHealthCheck),
                    (t = this.popupWindow),
                    Li(window, 'message.receivedHealthcheck'),
                    e && clearTimeout(e),
                    t && !t.closed && t.close());
              }),
              (e.prototype.buildPayloadToShareTargetPicker = function (e) {
                return { messages: e.messages, isMultiple: e.isMultiple, referrer: e.referrer };
              }),
              (e.prototype.initAllowPostMessageOrigin = function (e) {
                return (
                  void 0 === e && (e = Gt('shareTargetPicker')),
                  (function (e) {
                    var t = e.match(/^(https?:\/\/.*?)\//);
                    return (t && t[1]) || '';
                  })(e)
                );
              }),
              (e.prototype.initOtt = function () {
                return P(this, void 0, void 0, function () {
                  var e, t, n;
                  return A(this, function (r) {
                    switch (r.label) {
                      case 0:
                        return (
                          this.abortController && (e = this.abortController.signal),
                          (t = ''
                            .concat(Gt('shareTargetPickerOtt'), '/')
                            .concat(this.liffId, '/ott')),
                          (n = this),
                          [
                            4,
                            Mt(t, { method: 'GET', signal: e }).then(function (e) {
                              return e.ott;
                            }),
                          ]
                        );
                      case 1:
                        return (n.ott = r.sent()), [2];
                    }
                  });
                });
              }),
              (e.prototype.prepareAnotherWindow = function () {
                We() ||
                  ('ios' !== Lt() || Ue()
                    ? (this.popupWindow = window.open(
                        '',
                        'liffpopup',
                        'width=480, height=640, menubar=no, toolbar=no, scrollbars=yes'
                      ))
                    : (this.popupWindow = window.open()));
              }),
              (e.prototype.openAnotherWindow = function () {
                if (We() && this.payloadToShareTargetPicker)
                  (e = this.liffId),
                    (t = this.ott),
                    (n = this.payloadToShareTargetPicker),
                    (r = { liffId: e, ott: t, data: JSON.stringify(n), closeModals: !1 }),
                    (location.href = ''.concat('line://picker', '?').concat(ke(r)));
                else {
                  if (
                    ((this.timeoutIDForHealthCheck = window.setTimeout(
                      this.healthCheck.bind(this),
                      1e3
                    )),
                    !this.popupWindow)
                  )
                    throw Se(Z);
                  !(function (e, t, n) {
                    var r = { liffId: t, ott: n };
                    e.location.href = ''.concat(Gt('shareTargetPicker'), '?').concat(ke(r));
                  })(this.popupWindow, this.liffId, this.ott);
                }
                var e, t, n, r;
              }),
              (e.prototype.initListener = function () {
                var e, t;
                We() ||
                  ((e = this.onReceivedHealthcheck.bind(this)),
                  (t = this.allowPostMessageOrigin),
                  Ui(window, 'receivedHealthcheck', e, t));
              }),
              (e.prototype.healthCheck = function () {
                return P(this, void 0, void 0, function () {
                  var e;
                  return A(this, function (t) {
                    switch (t.label) {
                      case 0:
                        if (this.popupWindow && !this.popupWindow.closed) return [3, 7];
                        if (!this.doesWaitForSubwindowResult) return [3, 5];
                        t.label = 1;
                      case 1:
                        return t.trys.push([1, 3, , 4]), [4, this.onCanceled()];
                      case 2:
                        return t.sent(), [3, 4];
                      case 3:
                        return (e = t.sent()), (this.internalError = e), [3, 4];
                      case 4:
                        return [3, 6];
                      case 5:
                        this.finalize(), (t.label = 6);
                      case 6:
                        return [3, 8];
                      case 7:
                        Ni(this.popupWindow, 'healthcheck', void 0, this.allowPostMessageOrigin),
                          (this.timeoutIDForHealthCheck = window.setTimeout(
                            this.healthCheck.bind(this),
                            1e3
                          )),
                          (t.label = 8);
                      case 8:
                        return [2];
                    }
                  });
                });
              }),
              (e.prototype.onReceivedHealthcheck = function () {
                if (!this.popupWindow || !this.payloadToShareTargetPicker) throw Se(Z);
                Ni(
                  this.popupWindow,
                  'ready',
                  this.payloadToShareTargetPicker,
                  this.allowPostMessageOrigin
                );
              }),
              (e.prototype.onCanceled = function () {
                return P(this, void 0, void 0, function () {
                  var e, t;
                  return A(this, function (n) {
                    switch (n.label) {
                      case 0:
                        if (We() || !this.ott) throw new Error('need to call with ott in client');
                        return (
                          this.abortController && (e = this.abortController.signal),
                          (t = { liffId: this.liffId, ott: this.ott }),
                          [
                            4,
                            Mt(''.concat(Gt('shareTargetPickerResult'), '?').concat(ke(t)), {
                              method: 'POST',
                              signal: e,
                              headers: {
                                Accept: 'application/json',
                                'Content-Type': 'application/x-www-form-urlencoded',
                              },
                              body: 'result=CANCEL',
                            }),
                          ]
                        );
                      case 1:
                        return [2, 'ok' === n.sent().status];
                    }
                  });
                });
              }),
              (e.prototype.getShareResult = function () {
                return P(this, void 0, void 0, function () {
                  var e, t;
                  return A(this, function (n) {
                    if (!this.ott) throw new Error('need to call with ott in client');
                    return (
                      this.abortController && (e = this.abortController.signal),
                      (t = { liffId: this.liffId, ott: this.ott }),
                      R.debug('fetch: getShareResult'),
                      [
                        2,
                        Mt(''.concat(Gt('shareTargetPickerResult'), '?').concat(ke(t)), {
                          method: 'GET',
                          headers: { Accept: 'application/json' },
                          signal: e,
                        }),
                      ]
                    );
                  });
                });
              }),
              (e.isPollingTimeOut = function (e, t) {
                return (t - e) / 6e4 >= 10;
              }),
              (e.prototype.pollingShareResult = function () {
                return P(this, void 0, void 0, function () {
                  var t, n;
                  return A(this, function (r) {
                    switch (r.label) {
                      case 0:
                        (t = Date.now()), (r.label = 1);
                      case 1:
                        if (e.isPollingTimeOut(t, Date.now())) return [3, 4];
                        if (this.internalError) throw this.internalError;
                        return [4, this.getShareResult()];
                      case 2:
                        if ((n = r.sent()) && n.result)
                          switch (n.result) {
                            case 'SUCCESS':
                              return [2, { status: 'success' }];
                            case 'CANCEL':
                              return [2];
                            default:
                              throw new Error(n.resultDescription);
                          }
                        return [
                          4,
                          new Promise(function (e) {
                            setTimeout(e, 500);
                          }),
                        ];
                      case 3:
                        return r.sent(), [3, 1];
                      case 4:
                        throw new Error('Timeout: not finished within '.concat(10, 'min'));
                    }
                  });
                });
              }),
              e
            );
          })(),
          Di = (function (e) {
            function t() {
              var t = (null !== e && e.apply(this, arguments)) || this;
              return (
                (t.shareTargetPicker = function (e, n) {
                  return (
                    void 0 === n && (n = {}),
                    P(t, void 0, void 0, function () {
                      var t, r, i, o, a, s, c;
                      return A(this, function (u) {
                        switch (u.label) {
                          case 0:
                            if ((_t.shareTargetPicker(), !e || !Array.isArray(e) || 0 === e.length))
                              throw Se($, 'no proper argument');
                            if (e.length > 5) throw Se($, 'exceed the limit of num of messages');
                            if (!(t = He().liffId)) throw Se(Q);
                            window.liff && (r = window.liff).analytics && gi(r.analytics),
                              (i = void 0 === n.isMultiple || n.isMultiple),
                              (u.label = 1);
                          case 1:
                            return (
                              u.trys.push([1, 3, , 4]),
                              (o = Ri.getInstance()),
                              (a = gt()),
                              (s = { waitForSubwindowResult: !0 }),
                              We() && a && pe(a, '10.11.0') < 0 && (s.waitForSubwindowResult = !1),
                              [
                                4,
                                o.init({
                                  messages: e,
                                  isMultiple: i,
                                  referrer: { liffId: t, url: location.origin },
                                  options: s,
                                }),
                              ]
                            );
                          case 2:
                            return [2, u.sent()];
                          case 3:
                            throw (c = u.sent()) instanceof Ee ? c : Se(ee, c.message);
                          case 4:
                            return [2];
                        }
                      });
                    })
                  );
                }),
                t
              );
            }
            return (
              O(t, e),
              Object.defineProperty(t.prototype, 'name', {
                get: function () {
                  return 'shareTargetPicker';
                },
                enumerable: !1,
                configurable: !0,
              }),
              (t.prototype.install = function () {
                return this.shareTargetPicker;
              }),
              t
            );
          })(H),
          Bi = new Di(),
          Mi = Object.defineProperties(
            {},
            {
              getOS: { value: Lt, enumerable: !0, writable: !0 },
              getVersion: { value: pt, enumerable: !0, writable: !0 },
              getLanguage: { value: Xr, enumerable: !0, writable: !0 },
              isInClient: { value: We, enumerable: !0, writable: !0 },
              isLoggedIn: { value: ht, enumerable: !0, writable: !0 },
              logout: { value: Rt, enumerable: !0, writable: !0 },
              getAccessToken: { value: it, enumerable: !0, writable: !0 },
              getIDToken: { value: nt, enumerable: !0, writable: !0 },
              getDecodedIDToken: { value: lt, enumerable: !0, writable: !0 },
              getContext: { value: Ke, enumerable: !0, writable: !0 },
              openWindow: { value: ui, enumerable: !0, writable: !0 },
              closeWindow: { value: hn, enumerable: !0, writable: !0 },
              getFriendship: { value: ai(pi, 'profile'), enumerable: !0, writable: !0 },
              getAId: { value: qe, enumerable: !0, writable: !0 },
              getProfilePlus: { value: ze, enumerable: !0, writable: !0 },
              getIsVideoAutoPlay: { value: $e, enumerable: !0, writable: !0 },
              getLineVersion: { value: gt, enumerable: !0, writable: !0 },
              isApiAvailable: { value: Ot, enumerable: !0, writable: !0 },
              getProfile: { value: ai(ci, 'profile'), enumerable: !0, writable: !0 },
              sendMessages: { value: ai(di, 'chat_message.write'), enumerable: !0, writable: !0 },
              subWindow: { value: or, enumerable: !0, writable: !0 },
              ready: { value: K, enumerable: !0, writable: !0 },
              id: {
                get: function () {
                  return He().liffId || null;
                },
                enumerable: !0,
              },
              _dispatchEvent: {
                value: function (e) {
                  var t = {};
                  try {
                    t = JSON.parse(e);
                  } catch (r) {
                    throw Se($, r.message);
                  }
                  var n = (function (e) {
                    return new CustomEvent(te, { detail: e });
                  })(t);
                  R.debug('[client dispatchEvent to js]', { type: n.type, detail: n.detail }),
                    window.dispatchEvent(n);
                },
                enumerable: !0,
                writable: !0,
              },
              _call: { value: dn, enumerable: !0, writable: !0 },
              _addListener: { value: un, enumerable: !0, writable: !0 },
              _removeListener: { value: ln, enumerable: !0, writable: !0 },
              _postMessage: { value: fn, enumerable: !0, writable: !0 },
            }
          ),
          Wi = new W(),
          Hi = new M(Wi, Mi),
          Vi = new G(Wi, Hi).install();
        [new G(Wi, Hi), new fr(), new zr(), new mi(), Ai, Oi, bt, si, Bi, br, new Nt()].forEach(
          function (e) {
            Vi.call(Mi, e);
          }
        );
        const Gi = Mi;
      })(),
      (r = r.default)
    );
  })()
);

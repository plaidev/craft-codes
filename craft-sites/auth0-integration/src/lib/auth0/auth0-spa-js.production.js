!(function (t, e) {
  'object' == typeof exports && 'undefined' != typeof module
    ? (module.exports = e())
    : 'function' == typeof define && define.amd
      ? define(e)
      : ((t = t || self).createAuth0Client = e());
})(this, function () {
  'use strict';
  var t = function (e, n) {
    return (t =
      Object.setPrototypeOf ||
      ({ __proto__: [] } instanceof Array &&
        function (t, e) {
          t.__proto__ = e;
        }) ||
      function (t, e) {
        for (var n in e) e.hasOwnProperty(n) && (t[n] = e[n]);
      })(e, n);
  };
  var e = function () {
    return (e =
      Object.assign ||
      function (t) {
        for (var e, n = 1, r = arguments.length; n < r; n++)
          for (var o in (e = arguments[n]))
            Object.prototype.hasOwnProperty.call(e, o) && (t[o] = e[o]);
        return t;
      }).apply(this, arguments);
  };
  function n(t, e) {
    var n = {};
    for (var r in t)
      Object.prototype.hasOwnProperty.call(t, r) && e.indexOf(r) < 0 && (n[r] = t[r]);
    if (null != t && 'function' == typeof Object.getOwnPropertySymbols) {
      var o = 0;
      for (r = Object.getOwnPropertySymbols(t); o < r.length; o++)
        e.indexOf(r[o]) < 0 &&
          Object.prototype.propertyIsEnumerable.call(t, r[o]) &&
          (n[r[o]] = t[r[o]]);
    }
    return n;
  }
  function r(t, e, n, r) {
    return new (n || (n = Promise))(function (o, i) {
      function c(t) {
        try {
          u(r.next(t));
        } catch (t) {
          i(t);
        }
      }
      function a(t) {
        try {
          u(r.throw(t));
        } catch (t) {
          i(t);
        }
      }
      function u(t) {
        t.done
          ? o(t.value)
          : new n(function (e) {
              e(t.value);
            }).then(c, a);
      }
      u((r = r.apply(t, e || [])).next());
    });
  }
  function o(t, e) {
    var n,
      r,
      o,
      i,
      c = {
        label: 0,
        sent: function () {
          if (1 & o[0]) throw o[1];
          return o[1];
        },
        trys: [],
        ops: [],
      };
    return (
      (i = { next: a(0), throw: a(1), return: a(2) }),
      'function' == typeof Symbol &&
        (i[Symbol.iterator] = function () {
          return this;
        }),
      i
    );
    function a(i) {
      return function (a) {
        return (function (i) {
          if (n) throw new TypeError('Generator is already executing.');
          for (; c; )
            try {
              if (
                ((n = 1),
                r &&
                  (o =
                    2 & i[0]
                      ? r.return
                      : i[0]
                        ? r.throw || ((o = r.return) && o.call(r), 0)
                        : r.next) &&
                  !(o = o.call(r, i[1])).done)
              )
                return o;
              switch (((r = 0), o && (i = [2 & i[0], o.value]), i[0])) {
                case 0:
                case 1:
                  o = i;
                  break;
                case 4:
                  return c.label++, { value: i[1], done: !1 };
                case 5:
                  c.label++, (r = i[1]), (i = [0]);
                  continue;
                case 7:
                  (i = c.ops.pop()), c.trys.pop();
                  continue;
                default:
                  if (
                    !(o = (o = c.trys).length > 0 && o[o.length - 1]) &&
                    (6 === i[0] || 2 === i[0])
                  ) {
                    c = 0;
                    continue;
                  }
                  if (3 === i[0] && (!o || (i[1] > o[0] && i[1] < o[3]))) {
                    c.label = i[1];
                    break;
                  }
                  if (6 === i[0] && c.label < o[1]) {
                    (c.label = o[1]), (o = i);
                    break;
                  }
                  if (o && c.label < o[2]) {
                    (c.label = o[2]), c.ops.push(i);
                    break;
                  }
                  o[2] && c.ops.pop(), c.trys.pop();
                  continue;
              }
              i = e.call(t, c);
            } catch (t) {
              (i = [6, t]), (r = 0);
            } finally {
              n = o = 0;
            }
          if (5 & i[0]) throw i[1];
          return { value: i[0] ? i[1] : void 0, done: !0 };
        })([i, a]);
      };
    }
  }
  var i =
    'undefined' != typeof globalThis
      ? globalThis
      : 'undefined' != typeof window
        ? window
        : 'undefined' != typeof global
          ? global
          : 'undefined' != typeof self
            ? self
            : {};
  function c(t, e) {
    return t((e = { exports: {} }), e.exports), e.exports;
  }
  var a,
    u,
    s,
    f = 'object',
    l = function (t) {
      return t && t.Math == Math && t;
    },
    p =
      l(typeof globalThis == f && globalThis) ||
      l(typeof window == f && window) ||
      l(typeof self == f && self) ||
      l(typeof i == f && i) ||
      Function('return this')(),
    d = function (t) {
      try {
        return !!t();
      } catch (t) {
        return !0;
      }
    },
    h = !d(function () {
      return (
        7 !=
        Object.defineProperty({}, 'a', {
          get: function () {
            return 7;
          },
        }).a
      );
    }),
    y = {}.propertyIsEnumerable,
    v = Object.getOwnPropertyDescriptor,
    w = {
      f:
        v && !y.call({ 1: 2 }, 1)
          ? function (t) {
              var e = v(this, t);
              return !!e && e.enumerable;
            }
          : y,
    },
    g = function (t, e) {
      return { enumerable: !(1 & t), configurable: !(2 & t), writable: !(4 & t), value: e };
    },
    m = {}.toString,
    _ = function (t) {
      return m.call(t).slice(8, -1);
    },
    b = ''.split,
    O = d(function () {
      return !Object('z').propertyIsEnumerable(0);
    })
      ? function (t) {
          return 'String' == _(t) ? b.call(t, '') : Object(t);
        }
      : Object,
    E = function (t) {
      if (null == t) throw TypeError("Can't call method on " + t);
      return t;
    },
    T = function (t) {
      return O(E(t));
    },
    S = function (t) {
      return 'object' == typeof t ? null !== t : 'function' == typeof t;
    },
    j = function (t, e) {
      if (!S(t)) return t;
      var n, r;
      if (e && 'function' == typeof (n = t.toString) && !S((r = n.call(t)))) return r;
      if ('function' == typeof (n = t.valueOf) && !S((r = n.call(t)))) return r;
      if (!e && 'function' == typeof (n = t.toString) && !S((r = n.call(t)))) return r;
      throw TypeError("Can't convert object to primitive value");
    },
    A = {}.hasOwnProperty,
    P = function (t, e) {
      return A.call(t, e);
    },
    x = p.document,
    U = S(x) && S(x.createElement),
    C = function (t) {
      return U ? x.createElement(t) : {};
    },
    k =
      !h &&
      !d(function () {
        return (
          7 !=
          Object.defineProperty(C('div'), 'a', {
            get: function () {
              return 7;
            },
          }).a
        );
      }),
    I = Object.getOwnPropertyDescriptor,
    F = {
      f: h
        ? I
        : function (t, e) {
            if (((t = T(t)), (e = j(e, !0)), k))
              try {
                return I(t, e);
              } catch (t) {}
            if (P(t, e)) return g(!w.f.call(t, e), t[e]);
          },
    },
    R = function (t) {
      if (!S(t)) throw TypeError(String(t) + ' is not an object');
      return t;
    },
    D = Object.defineProperty,
    L = {
      f: h
        ? D
        : function (t, e, n) {
            if ((R(t), (e = j(e, !0)), R(n), k))
              try {
                return D(t, e, n);
              } catch (t) {}
            if ('get' in n || 'set' in n) throw TypeError('Accessors not supported');
            return 'value' in n && (t[e] = n.value), t;
          },
    },
    M = h
      ? function (t, e, n) {
          return L.f(t, e, g(1, n));
        }
      : function (t, e, n) {
          return (t[e] = n), t;
        },
    z = function (t, e) {
      try {
        M(p, t, e);
      } catch (n) {
        p[t] = e;
      }
      return e;
    },
    N = c(function (t) {
      var e = p['__core-js_shared__'] || z('__core-js_shared__', {});
      (t.exports = function (t, n) {
        return e[t] || (e[t] = void 0 !== n ? n : {});
      })('versions', []).push({
        version: '3.2.1',
        mode: 'global',
        copyright: 'ﾂｩ 2019 Denis Pushkarev (zloirock.ru)',
      });
    }),
    B = N('native-function-to-string', Function.toString),
    W = p.WeakMap,
    q = 'function' == typeof W && /native code/.test(B.call(W)),
    G = 0,
    J = Math.random(),
    H = function (t) {
      return 'Symbol(' + String(void 0 === t ? '' : t) + ')_' + (++G + J).toString(36);
    },
    Y = N('keys'),
    V = function (t) {
      return Y[t] || (Y[t] = H(t));
    },
    K = {},
    Q = p.WeakMap;
  if (q) {
    var X = new Q(),
      Z = X.get,
      $ = X.has,
      tt = X.set;
    (a = function (t, e) {
      return tt.call(X, t, e), e;
    }),
      (u = function (t) {
        return Z.call(X, t) || {};
      }),
      (s = function (t) {
        return $.call(X, t);
      });
  } else {
    var et = V('state');
    (K[et] = !0),
      (a = function (t, e) {
        return M(t, et, e), e;
      }),
      (u = function (t) {
        return P(t, et) ? t[et] : {};
      }),
      (s = function (t) {
        return P(t, et);
      });
  }
  var nt = {
      set: a,
      get: u,
      has: s,
      enforce: function (t) {
        return s(t) ? u(t) : a(t, {});
      },
      getterFor: function (t) {
        return function (e) {
          var n;
          if (!S(e) || (n = u(e)).type !== t)
            throw TypeError('Incompatible receiver, ' + t + ' required');
          return n;
        };
      },
    },
    rt = c(function (t) {
      var e = nt.get,
        n = nt.enforce,
        r = String(B).split('toString');
      N('inspectSource', function (t) {
        return B.call(t);
      }),
        (t.exports = function (t, e, o, i) {
          var c = !!i && !!i.unsafe,
            a = !!i && !!i.enumerable,
            u = !!i && !!i.noTargetGet;
          'function' == typeof o &&
            ('string' != typeof e || P(o, 'name') || M(o, 'name', e),
            (n(o).source = r.join('string' == typeof e ? e : ''))),
            t !== p
              ? (c ? !u && t[e] && (a = !0) : delete t[e], a ? (t[e] = o) : M(t, e, o))
              : a
                ? (t[e] = o)
                : z(e, o);
        })(Function.prototype, 'toString', function () {
          return ('function' == typeof this && e(this).source) || B.call(this);
        });
    }),
    ot = p,
    it = function (t) {
      return 'function' == typeof t ? t : void 0;
    },
    ct = function (t, e) {
      return arguments.length < 2
        ? it(ot[t]) || it(p[t])
        : (ot[t] && ot[t][e]) || (p[t] && p[t][e]);
    },
    at = Math.ceil,
    ut = Math.floor,
    st = function (t) {
      return isNaN((t = +t)) ? 0 : (t > 0 ? ut : at)(t);
    },
    ft = Math.min,
    lt = function (t) {
      return t > 0 ? ft(st(t), 9007199254740991) : 0;
    },
    pt = Math.max,
    dt = Math.min,
    ht = function (t) {
      return function (e, n, r) {
        var o,
          i = T(e),
          c = lt(i.length),
          a = (function (t, e) {
            var n = st(t);
            return n < 0 ? pt(n + e, 0) : dt(n, e);
          })(r, c);
        if (t && n != n) {
          for (; c > a; ) if ((o = i[a++]) != o) return !0;
        } else for (; c > a; a++) if ((t || a in i) && i[a] === n) return t || a || 0;
        return !t && -1;
      };
    },
    yt = { includes: ht(!0), indexOf: ht(!1) },
    vt = yt.indexOf,
    wt = function (t, e) {
      var n,
        r = T(t),
        o = 0,
        i = [];
      for (n in r) !P(K, n) && P(r, n) && i.push(n);
      for (; e.length > o; ) P(r, (n = e[o++])) && (~vt(i, n) || i.push(n));
      return i;
    },
    gt = [
      'constructor',
      'hasOwnProperty',
      'isPrototypeOf',
      'propertyIsEnumerable',
      'toLocaleString',
      'toString',
      'valueOf',
    ],
    mt = gt.concat('length', 'prototype'),
    _t = {
      f:
        Object.getOwnPropertyNames ||
        function (t) {
          return wt(t, mt);
        },
    },
    bt = { f: Object.getOwnPropertySymbols },
    Ot =
      ct('Reflect', 'ownKeys') ||
      function (t) {
        var e = _t.f(R(t)),
          n = bt.f;
        return n ? e.concat(n(t)) : e;
      },
    Et = function (t, e) {
      for (var n = Ot(e), r = L.f, o = F.f, i = 0; i < n.length; i++) {
        var c = n[i];
        P(t, c) || r(t, c, o(e, c));
      }
    },
    Tt = /#|\.prototype\./,
    St = function (t, e) {
      var n = At[jt(t)];
      return n == xt || (n != Pt && ('function' == typeof e ? d(e) : !!e));
    },
    jt = (St.normalize = function (t) {
      return String(t).replace(Tt, '.').toLowerCase();
    }),
    At = (St.data = {}),
    Pt = (St.NATIVE = 'N'),
    xt = (St.POLYFILL = 'P'),
    Ut = St,
    Ct = F.f,
    kt = function (t, e) {
      var n,
        r,
        o,
        i,
        c,
        a = t.target,
        u = t.global,
        s = t.stat;
      if ((n = u ? p : s ? p[a] || z(a, {}) : (p[a] || {}).prototype))
        for (r in e) {
          if (
            ((i = e[r]),
            (o = t.noTargetGet ? (c = Ct(n, r)) && c.value : n[r]),
            !Ut(u ? r : a + (s ? '.' : '#') + r, t.forced) && void 0 !== o)
          ) {
            if (typeof i == typeof o) continue;
            Et(i, o);
          }
          (t.sham || (o && o.sham)) && M(i, 'sham', !0), rt(n, r, i, t);
        }
    },
    It =
      !!Object.getOwnPropertySymbols &&
      !d(function () {
        return !String(Symbol());
      }),
    Ft = p.Symbol,
    Rt = N('wks'),
    Dt = function (t) {
      return Rt[t] || (Rt[t] = (It && Ft[t]) || (It ? Ft : H)('Symbol.' + t));
    },
    Lt = Dt('match'),
    Mt = function (t) {
      if (
        (function (t) {
          var e;
          return S(t) && (void 0 !== (e = t[Lt]) ? !!e : 'RegExp' == _(t));
        })(t)
      )
        throw TypeError("The method doesn't accept regular expressions");
      return t;
    },
    zt = Dt('match'),
    Nt = ''.startsWith,
    Bt = Math.min;
  kt(
    {
      target: 'String',
      proto: !0,
      forced: !(function (t) {
        var e = /./;
        try {
          '/./'[t](e);
        } catch (n) {
          try {
            return (e[zt] = !1), '/./'[t](e);
          } catch (t) {}
        }
        return !1;
      })('startsWith'),
    },
    {
      startsWith: function (t) {
        var e = String(E(this));
        Mt(t);
        var n = lt(Bt(arguments.length > 1 ? arguments[1] : void 0, e.length)),
          r = String(t);
        return Nt ? Nt.call(e, r, n) : e.slice(n, n + r.length) === r;
      },
    }
  );
  var Wt,
    qt,
    Gt,
    Jt = function (t) {
      if ('function' != typeof t) throw TypeError(String(t) + ' is not a function');
      return t;
    },
    Ht = function (t, e, n) {
      if ((Jt(t), void 0 === e)) return t;
      switch (n) {
        case 0:
          return function () {
            return t.call(e);
          };
        case 1:
          return function (n) {
            return t.call(e, n);
          };
        case 2:
          return function (n, r) {
            return t.call(e, n, r);
          };
        case 3:
          return function (n, r, o) {
            return t.call(e, n, r, o);
          };
      }
      return function () {
        return t.apply(e, arguments);
      };
    },
    Yt = Function.call,
    Vt = function (t, e, n) {
      return Ht(Yt, p[t].prototype[e], n);
    },
    Kt =
      (Vt('String', 'startsWith'),
      function (t) {
        return function (e, n) {
          var r,
            o,
            i = String(E(e)),
            c = st(n),
            a = i.length;
          return c < 0 || c >= a
            ? t
              ? ''
              : void 0
            : (r = i.charCodeAt(c)) < 55296 ||
                r > 56319 ||
                c + 1 === a ||
                (o = i.charCodeAt(c + 1)) < 56320 ||
                o > 57343
              ? t
                ? i.charAt(c)
                : r
              : t
                ? i.slice(c, c + 2)
                : o - 56320 + ((r - 55296) << 10) + 65536;
        };
      }),
    Qt = { codeAt: Kt(!1), charAt: Kt(!0) },
    Xt = function (t) {
      return Object(E(t));
    },
    Zt = !d(function () {
      function t() {}
      return (t.prototype.constructor = null), Object.getPrototypeOf(new t()) !== t.prototype;
    }),
    $t = V('IE_PROTO'),
    te = Object.prototype,
    ee = Zt
      ? Object.getPrototypeOf
      : function (t) {
          return (
            (t = Xt(t)),
            P(t, $t)
              ? t[$t]
              : 'function' == typeof t.constructor && t instanceof t.constructor
                ? t.constructor.prototype
                : t instanceof Object
                  ? te
                  : null
          );
        },
    ne = Dt('iterator'),
    re = !1;
  [].keys &&
    ('next' in (Gt = [].keys()) ? (qt = ee(ee(Gt))) !== Object.prototype && (Wt = qt) : (re = !0)),
    null == Wt && (Wt = {}),
    P(Wt, ne) ||
      M(Wt, ne, function () {
        return this;
      });
  var oe = { IteratorPrototype: Wt, BUGGY_SAFARI_ITERATORS: re },
    ie =
      Object.keys ||
      function (t) {
        return wt(t, gt);
      },
    ce = h
      ? Object.defineProperties
      : function (t, e) {
          R(t);
          for (var n, r = ie(e), o = r.length, i = 0; o > i; ) L.f(t, (n = r[i++]), e[n]);
          return t;
        },
    ae = ct('document', 'documentElement'),
    ue = V('IE_PROTO'),
    se = function () {},
    fe = function () {
      var t,
        e = C('iframe'),
        n = gt.length;
      for (
        e.style.display = 'none',
          ae.appendChild(e),
          e.src = String('javascript:'),
          (t = e.contentWindow.document).open(),
          t.write('<script>document.F=Object</script>'),
          t.close(),
          fe = t.F;
        n--;

      )
        delete fe.prototype[gt[n]];
      return fe();
    },
    le =
      Object.create ||
      function (t, e) {
        var n;
        return (
          null !== t
            ? ((se.prototype = R(t)), (n = new se()), (se.prototype = null), (n[ue] = t))
            : (n = fe()),
          void 0 === e ? n : ce(n, e)
        );
      };
  K[ue] = !0;
  var pe = L.f,
    de = Dt('toStringTag'),
    he = function (t, e, n) {
      t && !P((t = n ? t : t.prototype), de) && pe(t, de, { configurable: !0, value: e });
    },
    ye = {},
    ve = oe.IteratorPrototype,
    we = function () {
      return this;
    },
    ge =
      Object.setPrototypeOf ||
      ('__proto__' in {}
        ? (function () {
            var t,
              e = !1,
              n = {};
            try {
              (t = Object.getOwnPropertyDescriptor(Object.prototype, '__proto__').set).call(n, []),
                (e = n instanceof Array);
            } catch (t) {}
            return function (n, r) {
              return (
                R(n),
                (function (t) {
                  if (!S(t) && null !== t)
                    throw TypeError("Can't set " + String(t) + ' as a prototype');
                })(r),
                e ? t.call(n, r) : (n.__proto__ = r),
                n
              );
            };
          })()
        : void 0),
    me = oe.IteratorPrototype,
    _e = oe.BUGGY_SAFARI_ITERATORS,
    be = Dt('iterator'),
    Oe = function () {
      return this;
    },
    Ee = Qt.charAt,
    Te = nt.set,
    Se = nt.getterFor('String Iterator');
  !(function (t, e, n, r, o, i, c) {
    !(function (t, e, n) {
      var r = e + ' Iterator';
      (t.prototype = le(ve, { next: g(1, n) })), he(t, r, !1), (ye[r] = we);
    })(n, e, r);
    var a,
      u,
      s,
      f = function (t) {
        if (t === o && y) return y;
        if (!_e && t in d) return d[t];
        switch (t) {
          case 'keys':
          case 'values':
          case 'entries':
            return function () {
              return new n(this, t);
            };
        }
        return function () {
          return new n(this);
        };
      },
      l = e + ' Iterator',
      p = !1,
      d = t.prototype,
      h = d[be] || d['@@iterator'] || (o && d[o]),
      y = (!_e && h) || f(o),
      v = ('Array' == e && d.entries) || h;
    if (
      (v &&
        ((a = ee(v.call(new t()))),
        me !== Object.prototype &&
          a.next &&
          (ee(a) !== me && (ge ? ge(a, me) : 'function' != typeof a[be] && M(a, be, Oe)),
          he(a, l, !0))),
      'values' == o &&
        h &&
        'values' !== h.name &&
        ((p = !0),
        (y = function () {
          return h.call(this);
        })),
      d[be] !== y && M(d, be, y),
      (ye[e] = y),
      o)
    )
      if (((u = { values: f('values'), keys: i ? y : f('keys'), entries: f('entries') }), c))
        for (s in u) (!_e && !p && s in d) || rt(d, s, u[s]);
      else kt({ target: e, proto: !0, forced: _e || p }, u);
  })(
    String,
    'String',
    function (t) {
      Te(this, { type: 'String Iterator', string: String(t), index: 0 });
    },
    function () {
      var t,
        e = Se(this),
        n = e.string,
        r = e.index;
      return r >= n.length
        ? { value: void 0, done: !0 }
        : ((t = Ee(n, r)), (e.index += t.length), { value: t, done: !1 });
    }
  );
  var je = function (t, e, n, r) {
      try {
        return r ? e(R(n)[0], n[1]) : e(n);
      } catch (e) {
        var o = t.return;
        throw (void 0 !== o && R(o.call(t)), e);
      }
    },
    Ae = Dt('iterator'),
    Pe = Array.prototype,
    xe = function (t) {
      return void 0 !== t && (ye.Array === t || Pe[Ae] === t);
    },
    Ue = function (t, e, n) {
      var r = j(e);
      r in t ? L.f(t, r, g(0, n)) : (t[r] = n);
    },
    Ce = Dt('toStringTag'),
    ke =
      'Arguments' ==
      _(
        (function () {
          return arguments;
        })()
      ),
    Ie = function (t) {
      var e, n, r;
      return void 0 === t
        ? 'Undefined'
        : null === t
          ? 'Null'
          : 'string' ==
              typeof (n = (function (t, e) {
                try {
                  return t[e];
                } catch (t) {}
              })((e = Object(t)), Ce))
            ? n
            : ke
              ? _(e)
              : 'Object' == (r = _(e)) && 'function' == typeof e.callee
                ? 'Arguments'
                : r;
    },
    Fe = Dt('iterator'),
    Re = function (t) {
      if (null != t) return t[Fe] || t['@@iterator'] || ye[Ie(t)];
    },
    De = Dt('iterator'),
    Le = !1;
  try {
    var Me = 0,
      ze = {
        next: function () {
          return { done: !!Me++ };
        },
        return: function () {
          Le = !0;
        },
      };
    (ze[De] = function () {
      return this;
    }),
      Array.from(ze, function () {
        throw 2;
      });
  } catch (t) {}
  var Ne = !(function (t, e) {
    if (!e && !Le) return !1;
    var n = !1;
    try {
      var r = {};
      (r[De] = function () {
        return {
          next: function () {
            return { done: (n = !0) };
          },
        };
      }),
        t(r);
    } catch (t) {}
    return n;
  })(function (t) {
    Array.from(t);
  });
  kt(
    { target: 'Array', stat: !0, forced: Ne },
    {
      from: function (t) {
        var e,
          n,
          r,
          o,
          i = Xt(t),
          c = 'function' == typeof this ? this : Array,
          a = arguments.length,
          u = a > 1 ? arguments[1] : void 0,
          s = void 0 !== u,
          f = 0,
          l = Re(i);
        if (
          (s && (u = Ht(u, a > 2 ? arguments[2] : void 0, 2)), null == l || (c == Array && xe(l)))
        )
          for (n = new c((e = lt(i.length))); e > f; f++) Ue(n, f, s ? u(i[f], f) : i[f]);
        else
          for (o = l.call(i), n = new c(); !(r = o.next()).done; f++)
            Ue(n, f, s ? je(o, u, [r.value, f], !0) : r.value);
        return (n.length = f), n;
      },
    }
  );
  ot.Array.from;
  var Be,
    We = L.f,
    qe = p.DataView,
    Ge = qe && qe.prototype,
    Je = p.Int8Array,
    He = Je && Je.prototype,
    Ye = p.Uint8ClampedArray,
    Ve = Ye && Ye.prototype,
    Ke = Je && ee(Je),
    Qe = He && ee(He),
    Xe = Object.prototype,
    Ze = Xe.isPrototypeOf,
    $e = Dt('toStringTag'),
    tn = H('TYPED_ARRAY_TAG'),
    en = !(!p.ArrayBuffer || !qe),
    nn = en && !!ge && 'Opera' !== Ie(p.opera),
    rn = {
      Int8Array: 1,
      Uint8Array: 1,
      Uint8ClampedArray: 1,
      Int16Array: 2,
      Uint16Array: 2,
      Int32Array: 4,
      Uint32Array: 4,
      Float32Array: 4,
      Float64Array: 8,
    },
    on = function (t) {
      return S(t) && P(rn, Ie(t));
    };
  for (Be in rn) p[Be] || (nn = !1);
  if (
    (!nn || 'function' != typeof Ke || Ke === Function.prototype) &&
    ((Ke = function () {
      throw TypeError('Incorrect invocation');
    }),
    nn)
  )
    for (Be in rn) p[Be] && ge(p[Be], Ke);
  if ((!nn || !Qe || Qe === Xe) && ((Qe = Ke.prototype), nn))
    for (Be in rn) p[Be] && ge(p[Be].prototype, Qe);
  if ((nn && ee(Ve) !== Qe && ge(Ve, Qe), h && !P(Qe, $e)))
    for (Be in (!0,
    We(Qe, $e, {
      get: function () {
        return S(this) ? this[tn] : void 0;
      },
    }),
    rn))
      p[Be] && M(p[Be], tn, Be);
  en && ge && ee(Ge) !== Xe && ge(Ge, Xe);
  var cn = function (t) {
      if (on(t)) return t;
      throw TypeError('Target is not a typed array');
    },
    an = function (t) {
      if (ge) {
        if (Ze.call(Ke, t)) return t;
      } else
        for (var e in rn)
          if (P(rn, Be)) {
            var n = p[e];
            if (n && (t === n || Ze.call(n, t))) return t;
          }
      throw TypeError('Target is not a typed array constructor');
    },
    un = function (t, e, n) {
      if (h) {
        if (n)
          for (var r in rn) {
            var o = p[r];
            o && P(o.prototype, t) && delete o.prototype[t];
          }
        (Qe[t] && !n) || rt(Qe, t, n ? e : (nn && He[t]) || e);
      }
    },
    sn = Dt('species'),
    fn = cn,
    ln = an,
    pn = [].slice;
  un(
    'slice',
    function (t, e) {
      for (
        var n = pn.call(fn(this), t, e),
          r = (function (t, e) {
            var n,
              r = R(t).constructor;
            return void 0 === r || null == (n = R(r)[sn]) ? e : Jt(n);
          })(this, this.constructor),
          o = 0,
          i = n.length,
          c = new (ln(r))(i);
        i > o;

      )
        c[o] = n[o++];
      return c;
    },
    d(function () {
      new Int8Array(1).slice();
    })
  );
  var dn = Dt('unscopables'),
    hn = Array.prototype;
  null == hn[dn] && M(hn, dn, le(null));
  var yn,
    vn = yt.includes;
  kt(
    { target: 'Array', proto: !0 },
    {
      includes: function (t) {
        return vn(this, t, arguments.length > 1 ? arguments[1] : void 0);
      },
    }
  ),
    (yn = 'includes'),
    (hn[dn][yn] = !0);
  Vt('Array', 'includes');
  function wn(t) {
    var e = this.constructor;
    return this.then(
      function (n) {
        return e.resolve(t()).then(function () {
          return n;
        });
      },
      function (n) {
        return e.resolve(t()).then(function () {
          return e.reject(n);
        });
      }
    );
  }
  var gn = setTimeout;
  function mn(t) {
    return Boolean(t && void 0 !== t.length);
  }
  function _n() {}
  function bn(t) {
    if (!(this instanceof bn)) throw new TypeError('Promises must be constructed via new');
    if ('function' != typeof t) throw new TypeError('not a function');
    (this._state = 0),
      (this._handled = !1),
      (this._value = void 0),
      (this._deferreds = []),
      An(t, this);
  }
  function On(t, e) {
    for (; 3 === t._state; ) t = t._value;
    0 !== t._state
      ? ((t._handled = !0),
        bn._immediateFn(function () {
          var n = 1 === t._state ? e.onFulfilled : e.onRejected;
          if (null !== n) {
            var r;
            try {
              r = n(t._value);
            } catch (t) {
              return void Tn(e.promise, t);
            }
            En(e.promise, r);
          } else (1 === t._state ? En : Tn)(e.promise, t._value);
        }))
      : t._deferreds.push(e);
  }
  function En(t, e) {
    try {
      if (e === t) throw new TypeError('A promise cannot be resolved with itself.');
      if (e && ('object' == typeof e || 'function' == typeof e)) {
        var n = e.then;
        if (e instanceof bn) return (t._state = 3), (t._value = e), void Sn(t);
        if ('function' == typeof n)
          return void An(
            ((r = n),
            (o = e),
            function () {
              r.apply(o, arguments);
            }),
            t
          );
      }
      (t._state = 1), (t._value = e), Sn(t);
    } catch (e) {
      Tn(t, e);
    }
    var r, o;
  }
  function Tn(t, e) {
    (t._state = 2), (t._value = e), Sn(t);
  }
  function Sn(t) {
    2 === t._state &&
      0 === t._deferreds.length &&
      bn._immediateFn(function () {
        t._handled || bn._unhandledRejectionFn(t._value);
      });
    for (var e = 0, n = t._deferreds.length; e < n; e++) On(t, t._deferreds[e]);
    t._deferreds = null;
  }
  function jn(t, e, n) {
    (this.onFulfilled = 'function' == typeof t ? t : null),
      (this.onRejected = 'function' == typeof e ? e : null),
      (this.promise = n);
  }
  function An(t, e) {
    var n = !1;
    try {
      t(
        function (t) {
          n || ((n = !0), En(e, t));
        },
        function (t) {
          n || ((n = !0), Tn(e, t));
        }
      );
    } catch (t) {
      if (n) return;
      (n = !0), Tn(e, t);
    }
  }
  (bn.prototype.catch = function (t) {
    return this.then(null, t);
  }),
    (bn.prototype.then = function (t, e) {
      var n = new this.constructor(_n);
      return On(this, new jn(t, e, n)), n;
    }),
    (bn.prototype.finally = wn),
    (bn.all = function (t) {
      return new bn(function (e, n) {
        if (!mn(t)) return n(new TypeError('Promise.all accepts an array'));
        var r = Array.prototype.slice.call(t);
        if (0 === r.length) return e([]);
        var o = r.length;
        function i(t, c) {
          try {
            if (c && ('object' == typeof c || 'function' == typeof c)) {
              var a = c.then;
              if ('function' == typeof a)
                return void a.call(
                  c,
                  function (e) {
                    i(t, e);
                  },
                  n
                );
            }
            (r[t] = c), 0 == --o && e(r);
          } catch (t) {
            n(t);
          }
        }
        for (var c = 0; c < r.length; c++) i(c, r[c]);
      });
    }),
    (bn.resolve = function (t) {
      return t && 'object' == typeof t && t.constructor === bn
        ? t
        : new bn(function (e) {
            e(t);
          });
    }),
    (bn.reject = function (t) {
      return new bn(function (e, n) {
        n(t);
      });
    }),
    (bn.race = function (t) {
      return new bn(function (e, n) {
        if (!mn(t)) return n(new TypeError('Promise.race accepts an array'));
        for (var r = 0, o = t.length; r < o; r++) bn.resolve(t[r]).then(e, n);
      });
    }),
    (bn._immediateFn =
      ('function' == typeof setImmediate &&
        function (t) {
          setImmediate(t);
        }) ||
      function (t) {
        gn(t, 0);
      }),
    (bn._unhandledRejectionFn = function (t) {
      'undefined' != typeof console &&
        console &&
        console.warn('Possible Unhandled Promise Rejection:', t);
    });
  var Pn = (function () {
    if ('undefined' != typeof self) return self;
    if ('undefined' != typeof window) return window;
    if ('undefined' != typeof global) return global;
    throw new Error('unable to locate global object');
  })();
  function xn(t, e) {
    return (
      (e = e || {}),
      new Promise(function (n, r) {
        var o = new XMLHttpRequest(),
          i = [],
          c = [],
          a = {},
          u = function () {
            return {
              ok: 2 == ((o.status / 100) | 0),
              statusText: o.statusText,
              status: o.status,
              url: o.responseURL,
              text: function () {
                return Promise.resolve(o.responseText);
              },
              json: function () {
                return Promise.resolve(JSON.parse(o.responseText));
              },
              blob: function () {
                return Promise.resolve(new Blob([o.response]));
              },
              clone: u,
              headers: {
                keys: function () {
                  return i;
                },
                entries: function () {
                  return c;
                },
                get: function (t) {
                  return a[t.toLowerCase()];
                },
                has: function (t) {
                  return t.toLowerCase() in a;
                },
              },
            };
          };
        for (var s in (o.open(e.method || 'get', t, !0),
        (o.onload = function () {
          o.getAllResponseHeaders().replace(/^(.*?):[^\S\n]*([\s\S]*?)$/gm, function (t, e, n) {
            i.push((e = e.toLowerCase())), c.push([e, n]), (a[e] = a[e] ? a[e] + ',' + n : n);
          }),
            n(u());
        }),
        (o.onerror = r),
        (o.withCredentials = 'include' == e.credentials),
        e.headers))
          o.setRequestHeader(s, e.headers[s]);
        o.send(e.body || null);
      })
    );
  }
  'Promise' in Pn
    ? Pn.Promise.prototype.finally || (Pn.Promise.prototype.finally = wn)
    : (Pn.Promise = bn),
    (function (t) {
      function e(t) {
        if ('utf-8' !== (t = void 0 === t ? 'utf-8' : t))
          throw new RangeError(
            "Failed to construct 'TextEncoder': The encoding label provided ('" +
              t +
              "') is invalid."
          );
      }
      function n(t, e) {
        if (((e = void 0 === e ? { fatal: !1 } : e), 'utf-8' !== (t = void 0 === t ? 'utf-8' : t)))
          throw new RangeError(
            "Failed to construct 'TextDecoder': The encoding label provided ('" +
              t +
              "') is invalid."
          );
        if (e.fatal)
          throw Error("Failed to construct 'TextDecoder': the 'fatal' option is unsupported.");
      }
      if (t.TextEncoder && t.TextDecoder) return !1;
      Object.defineProperty(e.prototype, 'encoding', { value: 'utf-8' }),
        (e.prototype.encode = function (t, e) {
          if ((e = void 0 === e ? { stream: !1 } : e).stream)
            throw Error("Failed to encode: the 'stream' option is unsupported.");
          e = 0;
          for (
            var n = t.length,
              r = 0,
              o = Math.max(32, n + (n >> 1) + 7),
              i = new Uint8Array((o >> 3) << 3);
            e < n;

          ) {
            var c = t.charCodeAt(e++);
            if (55296 <= c && 56319 >= c) {
              if (e < n) {
                var a = t.charCodeAt(e);
                56320 == (64512 & a) && (++e, (c = ((1023 & c) << 10) + (1023 & a) + 65536));
              }
              if (55296 <= c && 56319 >= c) continue;
            }
            if (
              (r + 4 > i.length &&
                ((o += 8),
                (o = ((o *= 1 + (e / t.length) * 2) >> 3) << 3),
                (a = new Uint8Array(o)).set(i),
                (i = a)),
              0 == (4294967168 & c))
            )
              i[r++] = c;
            else {
              if (0 == (4294965248 & c)) i[r++] = ((c >> 6) & 31) | 192;
              else if (0 == (4294901760 & c))
                (i[r++] = ((c >> 12) & 15) | 224), (i[r++] = ((c >> 6) & 63) | 128);
              else {
                if (0 != (4292870144 & c)) continue;
                (i[r++] = ((c >> 18) & 7) | 240),
                  (i[r++] = ((c >> 12) & 63) | 128),
                  (i[r++] = ((c >> 6) & 63) | 128);
              }
              i[r++] = (63 & c) | 128;
            }
          }
          return i.slice(0, r);
        }),
        Object.defineProperty(n.prototype, 'encoding', { value: 'utf-8' }),
        Object.defineProperty(n.prototype, 'fatal', { value: !1 }),
        Object.defineProperty(n.prototype, 'ignoreBOM', { value: !1 }),
        (n.prototype.decode = function (t, e) {
          if ((e = void 0 === e ? { stream: !1 } : e).stream)
            throw Error("Failed to decode: the 'stream' option is unsupported.");
          e = 0;
          for (var n = (t = new Uint8Array(t)).length, r = []; e < n; ) {
            var o = t[e++];
            if (0 === o) break;
            if (0 == (128 & o)) r.push(o);
            else if (192 == (224 & o)) {
              var i = 63 & t[e++];
              r.push(((31 & o) << 6) | i);
            } else if (224 == (240 & o)) {
              i = 63 & t[e++];
              var c = 63 & t[e++];
              r.push(((31 & o) << 12) | (i << 6) | c);
            } else if (240 == (248 & o)) {
              65535 <
                (o =
                  ((7 & o) << 18) |
                  ((i = 63 & t[e++]) << 12) |
                  ((c = 63 & t[e++]) << 6) |
                  (63 & t[e++])) &&
                ((o -= 65536), r.push(((o >>> 10) & 1023) | 55296), (o = 56320 | (1023 & o))),
                r.push(o);
            }
          }
          return String.fromCharCode.apply(null, r);
        }),
        (t.TextEncoder = e),
        (t.TextDecoder = n);
    })('undefined' != typeof window ? window : i);
  var Un,
    Cn = { timeoutInSeconds: 60 },
    kn = function (t) {
      return t.filter(function (e, n) {
        return t.indexOf(e) === n;
      });
    },
    In = { error: 'timeout', error_description: 'Timeout' },
    Fn = function () {
      for (var t = [], e = 0; e < arguments.length; e++) t[e] = arguments[e];
      var n = t.filter(Boolean).join();
      return kn(n.replace(/\s/g, ',').split(',')).join(' ').trim();
    },
    Rn = function () {
      var t = window.open(
        '',
        'auth0:authorize:popup',
        'left=100,top=100,width=400,height=600,resizable,scrollbars=yes,status=1'
      );
      if (!t) throw new Error('Could not open popup');
      return t;
    },
    Dn = function (t, n, r) {
      return (
        (t.location.href = n),
        new Promise(function (n, o) {
          var i = setTimeout(
            function () {
              o(e({}, In, { popup: t }));
            },
            1e3 * (r.timeoutInSeconds || 60)
          );
          window.addEventListener('message', function (e) {
            if (e.data && 'authorization_response' === e.data.type) {
              if ((clearTimeout(i), t.close(), e.data.response.error)) return o(e.data.response);
              n(e.data.response);
            }
          });
        })
      );
    },
    Ln = function () {
      var t = '0123456789ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvwxyz-_~.',
        e = '';
      return (
        Array.from(crypto.getRandomValues(new Uint8Array(43))).forEach(function (n) {
          return (e += t[n % t.length]);
        }),
        e
      );
    },
    Mn = function (t) {
      return btoa(t);
    },
    zn = function (t) {
      return Object.keys(t)
        .filter(function (e) {
          return void 0 !== t[e];
        })
        .map(function (e) {
          return encodeURIComponent(e) + '=' + encodeURIComponent(t[e]);
        })
        .join('&');
    },
    Nn = function (t) {
      return r(void 0, void 0, void 0, function () {
        var e;
        return o(this, function (n) {
          switch (n.label) {
            case 0:
              return [
                4,
                Promise.resolve(
                  window.crypto.subtle.digest({ name: 'SHA-256' }, new TextEncoder().encode(t))
                ),
              ];
            case 1:
              return (e = n.sent()).result ? [2, e.result] : [2, e];
          }
        });
      });
    },
    Bn = function (t) {
      return (function (t) {
        return decodeURIComponent(
          atob(t)
            .split('')
            .map(function (t) {
              return '%' + ('00' + t.charCodeAt(0).toString(16)).slice(-2);
            })
            .join('')
        );
      })(t.replace(/_/g, '/').replace(/-/g, '+'));
    },
    Wn = function (t) {
      var e = new Uint8Array(t);
      return (function (t) {
        var e = { '+': '-', '/': '_', '=': '' };
        return t.replace(/[\+\/=]/g, function (t) {
          return e[t];
        });
      })(window.btoa(String.fromCharCode.apply(String, Array.from(e))));
    },
    qn = function (t, e) {
      return r(void 0, void 0, void 0, function () {
        var r, i, c, a, u, s, f;
        return o(this, function (o) {
          switch (o.label) {
            case 0:
              return [4, xn(t, e)];
            case 1:
              return [4, (r = o.sent()).json()];
            case 2:
              if (
                ((i = o.sent()),
                (c = i.error),
                (a = i.error_description),
                (u = n(i, ['error', 'error_description'])),
                !r.ok)
              )
                throw (
                  ((s = a || 'HTTP error. Unable to fetch ' + t),
                  ((f = new Error(s)).error = c || 'request_error'),
                  (f.error_description = s),
                  f)
                );
              return [2, u];
          }
        });
      });
    },
    Gn = function (t) {
      return r(void 0, void 0, void 0, function () {
        var r = t.baseUrl,
          i = n(t, ['baseUrl']);
        return o(this, function (t) {
          switch (t.label) {
            case 0:
              return [
                4,
                qn(r + '/oauth/token', {
                  method: 'POST',
                  body: JSON.stringify(
                    e({ grant_type: 'authorization_code', redirect_uri: window.location.origin }, i)
                  ),
                  headers: { 'Content-type': 'application/json' },
                }),
              ];
            case 1:
              return [2, t.sent()];
          }
        });
      });
    },
    Jn = function (t) {
      return t.audience + '::' + t.scope;
    },
    Hn = (function () {
      function t() {
        this.cache = {};
      }
      return (
        (t.prototype.save = function (t) {
          var e = this,
            n = Jn(t);
          this.cache[n] = t;
          var r,
            o,
            i,
            c =
              ((r = t.expires_in),
              (o = t.decodedToken.claims.exp),
              (i = (new Date(1e3 * o).getTime() - new Date().getTime()) / 1e3),
              1e3 * Math.min(r, i));
          setTimeout(function () {
            delete e.cache[n];
          }, c);
        }),
        (t.prototype.get = function (t) {
          return this.cache[Jn(t)];
        }),
        t
      );
    })(),
    Yn = c(function (t, e) {
      var n =
        (i && i.__assign) ||
        Object.assign ||
        function (t) {
          for (var e, n = 1, r = arguments.length; n < r; n++)
            for (var o in (e = arguments[n]))
              Object.prototype.hasOwnProperty.call(e, o) && (t[o] = e[o]);
          return t;
        };
      function r(t, e) {
        if (!e) return '';
        var n = '; ' + t;
        return !0 === e ? n : n + '=' + e;
      }
      function o(t, e, n) {
        return (
          encodeURIComponent(t)
            .replace(/%(23|24|26|2B|5E|60|7C)/g, decodeURIComponent)
            .replace(/\(/g, '%28')
            .replace(/\)/g, '%29') +
          '=' +
          encodeURIComponent(e).replace(
            /%(23|24|26|2B|3A|3C|3E|3D|2F|3F|40|5B|5D|5E|60|7B|7D|7C)/g,
            decodeURIComponent
          ) +
          (function (t) {
            if ('number' == typeof t.expires) {
              var e = new Date();
              e.setMilliseconds(e.getMilliseconds() + 864e5 * t.expires), (t.expires = e);
            }
            return (
              r('Expires', t.expires ? t.expires.toUTCString() : '') +
              r('Domain', t.domain) +
              r('Path', t.path) +
              r('Secure', t.secure) +
              r('SameSite', t.sameSite)
            );
          })(n)
        );
      }
      function c(t) {
        for (
          var e = {}, n = t ? t.split('; ') : [], r = /(%[0-9A-Z]{2})+/g, o = 0;
          o < n.length;
          o++
        ) {
          var i = n[o].split('='),
            c = i.slice(1).join('=');
          '"' === c.charAt(0) && (c = c.slice(1, -1));
          try {
            e[i[0].replace(r, decodeURIComponent)] = c.replace(r, decodeURIComponent);
          } catch (t) {}
        }
        return e;
      }
      function a() {
        return c(document.cookie);
      }
      function u(t, e, r) {
        document.cookie = o(t, e, n({ path: '/' }, r));
      }
      (e.__esModule = !0),
        (e.encode = o),
        (e.parse = c),
        (e.getAll = a),
        (e.get = function (t) {
          return a()[t];
        }),
        (e.set = u),
        (e.remove = function (t, e) {
          u(t, '', n({}, e, { expires: -1 }));
        });
    });
  (Un = Yn) && Un.__esModule && Object.prototype.hasOwnProperty.call(Un, 'default') && Un.default;
  Yn.encode, Yn.parse;
  var Vn = Yn.getAll,
    Kn = Yn.get,
    Qn = Yn.set,
    Xn = Yn.remove,
    Zn = function () {
      return Object.keys(Vn() || {});
    },
    $n = function (t) {
      var e = Kn(t);
      if (void 0 !== e) return JSON.parse(e);
    },
    tr = function (t, e, n) {
      Qn(t, JSON.stringify(e), { expires: n.daysUntilExpire });
    },
    er = function (t) {
      Xn(t);
    },
    nr = 'a0.spajs.txs.',
    rr = function (t) {
      return '' + nr + t;
    },
    or = (function () {
      function t() {
        var t = this;
        (this.transactions = {}),
          Zn()
            .filter(function (t) {
              return t.startsWith(nr);
            })
            .forEach(function (e) {
              var n = e.replace(nr, '');
              t.transactions[n] = $n(e);
            });
      }
      return (
        (t.prototype.create = function (t, e) {
          (this.transactions[t] = e), tr(rr(t), e, { daysUntilExpire: 1 });
        }),
        (t.prototype.get = function (t) {
          return this.transactions[t];
        }),
        (t.prototype.remove = function (t) {
          delete this.transactions[t], er(rr(t));
        }),
        t
      );
    })(),
    ir = [
      'iss',
      'aud',
      'exp',
      'nbf',
      'iat',
      'jti',
      'azp',
      'nonce',
      'auth_time',
      'at_hash',
      'c_hash',
      'acr',
      'amr',
      'sub_jwk',
      'cnf',
      'sip_from_tag',
      'sip_date',
      'sip_callid',
      'sip_cseq_num',
      'sip_via_branch',
      'orig',
      'dest',
      'mky',
      'events',
      'toe',
      'txn',
      'rph',
      'sid',
      'vot',
      'vtm',
    ],
    cr = function (t) {
      var e,
        n,
        r,
        o,
        i,
        c,
        a,
        u,
        s =
          ((e = t.id_token),
          (n = e.split('.')),
          (r = n[0]),
          (o = n[1]),
          (i = n[2]),
          (c = JSON.parse(Bn(o))),
          (a = { __raw: e }),
          (u = {}),
          Object.keys(c).forEach(function (t) {
            (a[t] = c[t]), ir.includes(t) || (u[t] = c[t]);
          }),
          {
            encoded: { header: r, payload: o, signature: i },
            header: JSON.parse(Bn(r)),
            claims: a,
            user: u,
          });
      if (s.claims.iss !== t.iss) throw new Error('Invalid issuer');
      if (s.claims.aud !== t.aud) throw new Error('Invalid audience');
      if ('RS256' !== s.header.alg) throw new Error('Invalid algorithm');
      if (s.claims.nonce !== t.nonce) throw new Error('Invalid nonce');
      var f = new Date(),
        l = new Date(0),
        p = new Date(0),
        d = new Date(0),
        h = t.leeway || 60;
      if (
        (l.setUTCSeconds(s.claims.exp + h),
        p.setUTCSeconds(s.claims.iat - h),
        d.setUTCSeconds(s.claims.nbf - h),
        f > l)
      )
        throw new Error('id_token expired');
      if (f < p) throw new Error('id_token was issued in the future (invalid iat)');
      if (void 0 !== s.claims.nbf && f < d)
        throw new Error('token is not yet valid (invalid notBefore)');
      return s;
    },
    ar = (function (e) {
      function n(t, r, o) {
        var i = e.call(this, r) || this;
        return (
          (i.error = t),
          (i.error_description = r),
          (i.state = o),
          Object.setPrototypeOf(i, n.prototype),
          i
        );
      }
      return (
        (function (e, n) {
          function r() {
            this.constructor = e;
          }
          t(e, n),
            (e.prototype = null === n ? Object.create(n) : ((r.prototype = n.prototype), new r()));
        })(n, e),
        n
      );
    })(Error),
    ur = (function () {
      function t(t) {
        (this.options = t),
          (this.DEFAULT_SCOPE = 'openid profile email'),
          (this.cache = new Hn()),
          (this.transactionManager = new or()),
          (this.domainUrl = 'https://' + this.options.domain);
      }
      return (
        (t.prototype._url = function (t) {
          var e = encodeURIComponent(
            btoa(JSON.stringify({ name: 'auth0-spa-js', version: '1.2.4' }))
          );
          return '' + this.domainUrl + t + '&auth0Client=' + e;
        }),
        (t.prototype._getParams = function (t, r, o, i, c) {
          var a = this.options,
            u = (a.domain, a.leeway, n(a, ['domain', 'leeway']));
          return e({}, u, t, {
            scope: Fn(this.DEFAULT_SCOPE, this.options.scope, t.scope),
            response_type: 'code',
            response_mode: 'query',
            state: r,
            nonce: o,
            redirect_uri: c || this.options.redirect_uri,
            code_challenge: i,
            code_challenge_method: 'S256',
          });
        }),
        (t.prototype._authorizeUrl = function (t) {
          return this._url('/authorize?' + zn(t));
        }),
        (t.prototype._verifyIdToken = function (t, e) {
          return cr({
            iss: this.domainUrl + '/',
            aud: this.options.client_id,
            id_token: t,
            nonce: e,
            leeway: this.options.leeway,
          });
        }),
        (t.prototype.loginWithPopup = function (t, i) {
          return (
            void 0 === t && (t = {}),
            void 0 === i && (i = Cn),
            r(this, void 0, void 0, function () {
              var r, c, a, u, s, f, l, p, d, h, y, v, w;
              return o(this, function (o) {
                switch (o.label) {
                  case 0:
                    return [4, Rn()];
                  case 1:
                    return (
                      (r = o.sent()),
                      (c = n(t, [])),
                      (a = Mn(Ln())),
                      (u = Ln()),
                      (s = Ln()),
                      [4, Nn(s)]
                    );
                  case 2:
                    return (
                      (f = o.sent()),
                      (l = Wn(f)),
                      (p = this._getParams(
                        c,
                        a,
                        u,
                        l,
                        this.options.redirect_uri || window.location.origin
                      )),
                      (d = this._authorizeUrl(e({}, p, { response_mode: 'web_message' }))),
                      [4, Dn(r, d, i)]
                    );
                  case 3:
                    if (((h = o.sent()), a !== h.state)) throw new Error('Invalid state');
                    return [
                      4,
                      Gn({
                        baseUrl: this.domainUrl,
                        audience: t.audience || this.options.audience,
                        client_id: this.options.client_id,
                        code_verifier: s,
                        code: h.code,
                      }),
                    ];
                  case 4:
                    return (
                      (y = o.sent()),
                      (v = this._verifyIdToken(y.id_token, u)),
                      (w = e({}, y, {
                        decodedToken: v,
                        scope: p.scope,
                        audience: p.audience || 'default',
                      })),
                      this.cache.save(w),
                      tr('auth0.is.authenticated', !0, { daysUntilExpire: 1 }),
                      [2]
                    );
                }
              });
            })
          );
        }),
        (t.prototype.getUser = function (t) {
          return (
            void 0 === t &&
              (t = {
                audience: this.options.audience || 'default',
                scope: this.options.scope || this.DEFAULT_SCOPE,
              }),
            r(this, void 0, void 0, function () {
              var e;
              return o(this, function (n) {
                return (
                  (t.scope = Fn(this.DEFAULT_SCOPE, t.scope)),
                  [2, (e = this.cache.get(t)) && e.decodedToken.user]
                );
              });
            })
          );
        }),
        (t.prototype.getIdTokenClaims = function (t) {
          return (
            void 0 === t &&
              (t = {
                audience: this.options.audience || 'default',
                scope: this.options.scope || this.DEFAULT_SCOPE,
              }),
            r(this, void 0, void 0, function () {
              var e;
              return o(this, function (n) {
                return (
                  (t.scope = Fn(this.DEFAULT_SCOPE, t.scope)),
                  [2, (e = this.cache.get(t)) && e.decodedToken.claims]
                );
              });
            })
          );
        }),
        (t.prototype.loginWithRedirect = function (t) {
          return (
            void 0 === t && (t = {}),
            r(this, void 0, void 0, function () {
              var e, r, i, c, a, u, s, f, l, p;
              return o(this, function (o) {
                switch (o.label) {
                  case 0:
                    return (
                      (e = t.redirect_uri),
                      (r = t.appState),
                      (i = n(t, ['redirect_uri', 'appState'])),
                      (c = Mn(Ln())),
                      (a = Ln()),
                      (u = Ln()),
                      [4, Nn(u)]
                    );
                  case 1:
                    return (
                      (s = o.sent()),
                      (f = Wn(s)),
                      (l = this._getParams(i, c, a, f, e)),
                      (p = this._authorizeUrl(l)),
                      this.transactionManager.create(c, {
                        nonce: a,
                        code_verifier: u,
                        appState: r,
                        scope: l.scope,
                        audience: l.audience || 'default',
                      }),
                      window.location.assign(p),
                      [2]
                    );
                }
              });
            })
          );
        }),
        (t.prototype.handleRedirectCallback = function () {
          return r(this, void 0, void 0, function () {
            var t, n, r, i, c, a, u, s, f;
            return o(this, function (o) {
              switch (o.label) {
                case 0:
                  if (!window.location.search)
                    throw new Error(
                      'There are no query params available at `window.location.search`.'
                    );
                  if (
                    ((l = window.location.search.substr(1)),
                    (p = l.split('&')),
                    (d = {}),
                    p.forEach(function (t) {
                      var e = t.split('='),
                        n = e[0],
                        r = e[1];
                      d[n] = decodeURIComponent(r);
                    }),
                    (t = e({}, d, { expires_in: parseInt(d.expires_in) })),
                    (n = t.state),
                    (r = t.code),
                    (i = t.error),
                    (c = t.error_description),
                    i)
                  )
                    throw new ar(i, c, n);
                  if (!(a = this.transactionManager.get(n))) throw new Error('Invalid state');
                  return (
                    this.transactionManager.remove(n),
                    [
                      4,
                      Gn({
                        baseUrl: this.domainUrl,
                        audience: this.options.audience,
                        client_id: this.options.client_id,
                        code_verifier: a.code_verifier,
                        code: r,
                      }),
                    ]
                  );
                case 1:
                  return (
                    (u = o.sent()),
                    (s = this._verifyIdToken(u.id_token, a.nonce)),
                    (f = e({}, u, { decodedToken: s, audience: a.audience, scope: a.scope })),
                    this.cache.save(f),
                    tr('auth0.is.authenticated', !0, { daysUntilExpire: 1 }),
                    [2, { appState: a.appState }]
                  );
              }
              var l, p, d;
            });
          });
        }),
        (t.prototype.getTokenSilently = function (t) {
          return (
            void 0 === t &&
              (t = {
                audience: this.options.audience,
                scope: this.options.scope || this.DEFAULT_SCOPE,
                ignoreCache: !1,
              }),
            r(this, void 0, void 0, function () {
              var n, r, i, c, a, u, s, f, l, p, d, h, y;
              return o(this, function (o) {
                switch (o.label) {
                  case 0:
                    return (
                      (t.scope = Fn(this.DEFAULT_SCOPE, t.scope)),
                      !t.ignoreCache &&
                      (n = this.cache.get({ scope: t.scope, audience: t.audience || 'default' }))
                        ? [2, n.access_token]
                        : ((r = Mn(Ln())), (i = Ln()), (c = Ln()), [4, Nn(c)])
                    );
                  case 1:
                    return (
                      (a = o.sent()),
                      (u = Wn(a)),
                      (s = { audience: t.audience, scope: t.scope }),
                      (f = this._getParams(
                        s,
                        r,
                        i,
                        u,
                        this.options.redirect_uri || window.location.origin
                      )),
                      (l = this._authorizeUrl(
                        e({}, f, { prompt: 'none', response_mode: 'web_message' })
                      )),
                      [
                        4,
                        ((v = l),
                        (w = this.domainUrl),
                        new Promise(function (t, e) {
                          var n = window.document.createElement('iframe');
                          n.setAttribute('width', '0'),
                            n.setAttribute('height', '0'),
                            (n.style.display = 'none');
                          var r = setTimeout(function () {
                              e(In), window.document.body.removeChild(n);
                            }, 6e4),
                            o = function (i) {
                              i.origin == w &&
                                i.data &&
                                'authorization_response' === i.data.type &&
                                (i.source.close(),
                                i.data.response.error ? e(i.data.response) : t(i.data.response),
                                clearTimeout(r),
                                window.removeEventListener('message', o, !1),
                                window.document.body.removeChild(n));
                            };
                          window.addEventListener('message', o, !1),
                            window.document.body.appendChild(n),
                            n.setAttribute('src', v);
                        })),
                      ]
                    );
                  case 2:
                    if (((p = o.sent()), r !== p.state)) throw new Error('Invalid state');
                    return [
                      4,
                      Gn({
                        baseUrl: this.domainUrl,
                        audience: t.audience || this.options.audience,
                        client_id: this.options.client_id,
                        code_verifier: c,
                        code: p.code,
                      }),
                    ];
                  case 3:
                    return (
                      (d = o.sent()),
                      (h = this._verifyIdToken(d.id_token, i)),
                      (y = e({}, d, {
                        decodedToken: h,
                        scope: f.scope,
                        audience: f.audience || 'default',
                      })),
                      this.cache.save(y),
                      tr('auth0.is.authenticated', !0, { daysUntilExpire: 1 }),
                      [2, d.access_token]
                    );
                }
                var v, w;
              });
            })
          );
        }),
        (t.prototype.getTokenWithPopup = function (t, e) {
          return (
            void 0 === t &&
              (t = {
                audience: this.options.audience,
                scope: this.options.scope || this.DEFAULT_SCOPE,
              }),
            void 0 === e && (e = Cn),
            r(this, void 0, void 0, function () {
              return o(this, function (n) {
                switch (n.label) {
                  case 0:
                    return (
                      (t.scope = Fn(this.DEFAULT_SCOPE, this.options.scope, t.scope)),
                      [4, this.loginWithPopup(t, e)]
                    );
                  case 1:
                    return (
                      n.sent(),
                      [
                        2,
                        this.cache.get({ scope: t.scope, audience: t.audience || 'default' })
                          .access_token,
                      ]
                    );
                }
              });
            })
          );
        }),
        (t.prototype.isAuthenticated = function () {
          return r(this, void 0, void 0, function () {
            return o(this, function (t) {
              switch (t.label) {
                case 0:
                  return [4, this.getUser()];
                case 1:
                  return [2, !!t.sent()];
              }
            });
          });
        }),
        (t.prototype.logout = function (t) {
          void 0 === t && (t = {}),
            null !== t.client_id
              ? (t.client_id = t.client_id || this.options.client_id)
              : delete t.client_id,
            er('auth0.is.authenticated');
          var e = t.federated,
            r = n(t, ['federated']),
            o = e ? '&federated' : '',
            i = this._url('/v2/logout?' + zn(r));
          window.location.assign('' + i + o);
        }),
        t
      );
    })();
  return function (t) {
    return r(this, void 0, void 0, function () {
      var e;
      return o(this, function (n) {
        switch (n.label) {
          case 0:
            if (
              (!window.crypto && window.msCrypto && (window.crypto = window.msCrypto),
              !window.crypto)
            )
              throw new Error(
                'For security reasons, `window.crypto` is required to run `auth0-spa-js`.'
              );
            if (void 0 === window.crypto.subtle)
              throw new Error(
                '\n      auth0-spa-js must run on a secure origin.\n      See https://github.com/auth0/auth0-spa-js/blob/master/FAQ.md#why-do-i-get-error-invalid-state-in-firefox-when-refreshing-the-page-immediately-after-a-login \n      for more information.\n    '
              );
            if (((e = new ur(t)), !$n('auth0.is.authenticated'))) return [2, e];
            n.label = 1;
          case 1:
            return (
              n.trys.push([1, 3, , 4]),
              [4, e.getTokenSilently({ audience: t.audience, scope: t.scope, ignoreCache: !0 })]
            );
          case 2:
          case 3:
            return n.sent(), [3, 4];
          case 4:
            return [2, e];
        }
      });
    });
  };
});
//# sourceMappingURL=auth0-spa-js.production.js.map

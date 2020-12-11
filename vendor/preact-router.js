!(function (t, e) {
  "object" == typeof exports && "undefined" != typeof module
    ? (module.exports = e(require("preact")))
    : "function" == typeof define && define.amd
    ? define(["preact"], e)
    : (t.preactRouter = e(t.preact));
})(this, function (t) {
  function e(t, e) {
    for (var n in e) t[n] = e[n];
    return t;
  }
  function n(t, e, n) {
    var r,
      o = /(?:\?([^#]*))?(#.*)?$/,
      u = t.match(o),
      a = {};
    if (u && u[1])
      for (var p = u[1].split("&"), c = 0; c < p.length; c++) {
        var f = p[c].split("=");
        a[decodeURIComponent(f[0])] = decodeURIComponent(f.slice(1).join("="));
      }
    (t = i(t.replace(o, ""))), (e = i(e || ""));
    for (var l = Math.max(t.length, e.length), s = 0; s < l; s++)
      if (e[s] && ":" === e[s].charAt(0)) {
        var h = e[s].replace(/(^:|[+*?]+$)/g, ""),
          d = (e[s].match(/[+*?]+$/) || C)[0] || "",
          g = ~d.indexOf("+"),
          y = ~d.indexOf("*"),
          m = t[s] || "";
        if (!m && !y && (d.indexOf("?") < 0 || g)) {
          r = !1;
          break;
        }
        if (((a[h] = decodeURIComponent(m)), g || y)) {
          a[h] = t.slice(s).map(decodeURIComponent).join("/");
          break;
        }
      } else if (e[s] !== t[s]) {
        r = !1;
        break;
      }
    return (!0 === n.default || !1 !== r) && a;
  }
  function r(t, e) {
    return t.rank < e.rank ? 1 : t.rank > e.rank ? -1 : t.index - e.index;
  }
  function o(t, e) {
    return (t.index = e), (t.rank = p(t)), t.props;
  }
  function i(t) {
    return t.replace(/(^\/+|\/+$)/g, "").split("/");
  }
  function u(t) {
    return ":" == t.charAt(0)
      ? 1 + "*+?".indexOf(t.charAt(t.length - 1)) || 4
      : 5;
  }
  function a(t) {
    return i(t).map(u).join("");
  }
  function p(t) {
    return t.props.default ? 0 : a(t.props.path);
  }
  function c(t, e) {
    void 0 === e && (e = "push"),
      b && b[e]
        ? b[e](t)
        : "undefined" != typeof history &&
          history[e + "State"] &&
          history[e + "State"](null, null, t);
  }
  function f() {
    var t;
    return (
      (t =
        b && b.location
          ? b.location
          : b && b.getCurrentLocation
          ? b.getCurrentLocation()
          : "undefined" != typeof location
          ? location
          : x),
      "" + (t.pathname || "") + (t.search || "")
    );
  }
  function l(t, e) {
    return (
      void 0 === e && (e = !1),
      "string" != typeof t && t.url && ((e = t.replace), (t = t.url)),
      s(t) && c(t, e ? "replace" : "push"),
      h(t)
    );
  }
  function s(t) {
    for (var e = U.length; e--; ) if (U[e].canRoute(t)) return !0;
    return !1;
  }
  function h(t) {
    for (var e = !1, n = 0; n < U.length; n++)
      !0 === U[n].routeTo(t) && (e = !0);
    for (var r = k.length; r--; ) k[r](t);
    return e;
  }
  function d(t) {
    if (t && t.getAttribute) {
      var e = t.getAttribute("href"),
        n = t.getAttribute("target");
      if (e && e.match(/^\//g) && (!n || n.match(/^_?self$/i))) return l(e);
    }
  }
  function g(t) {
    if (!(t.ctrlKey || t.metaKey || t.altKey || t.shiftKey || 0 !== t.button))
      return d(t.currentTarget || t.target || this), y(t);
  }
  function y(t) {
    return (
      t &&
        (t.stopImmediatePropagation && t.stopImmediatePropagation(),
        t.stopPropagation && t.stopPropagation(),
        t.preventDefault()),
      !1
    );
  }
  function m(t) {
    if (!(t.ctrlKey || t.metaKey || t.altKey || t.shiftKey || 0 !== t.button)) {
      var e = t.target;
      do {
        if ("A" === (e.nodeName + "").toUpperCase() && e.getAttribute("href")) {
          if (e.hasAttribute("native")) return;
          if (d(e)) return y(t);
        }
      } while ((e = e.parentNode));
    }
  }
  function v() {
    A ||
      ("function" == typeof addEventListener &&
        (b ||
          addEventListener("popstate", function () {
            h(f());
          }),
        addEventListener("click", m)),
      (A = !0));
  }
  var C = {},
    b = null,
    U = [],
    k = [],
    x = {},
    A = !1,
    R = (function (i) {
      function u(t) {
        i.call(this, t),
          t.history && (b = t.history),
          (this.state = { url: t.url || f() }),
          v();
      }
      return (
        i && (u.__proto__ = i),
        (u.prototype = Object.create(i && i.prototype)),
        (u.prototype.constructor = u),
        (u.prototype.shouldComponentUpdate = function (t) {
          return (
            !0 !== t.static ||
            t.url !== this.props.url ||
            t.onChange !== this.props.onChange
          );
        }),
        (u.prototype.canRoute = function (e) {
          return (
            this.getMatchingChildren(t.toChildArray(this.props.children), e, !1)
              .length > 0
          );
        }),
        (u.prototype.routeTo = function (t) {
          this.setState({ url: t });
          var e = this.canRoute(t);
          return this.updating || this.forceUpdate(), e;
        }),
        (u.prototype.componentWillMount = function () {
          U.push(this), (this.updating = !0);
        }),
        (u.prototype.componentDidMount = function () {
          var t = this;
          b &&
            (this.unlisten = b.listen(function (e) {
              t.routeTo("" + (e.pathname || "") + (e.search || ""));
            })),
            (this.updating = !1);
        }),
        (u.prototype.componentWillUnmount = function () {
          "function" == typeof this.unlisten && this.unlisten(),
            U.splice(U.indexOf(this), 1);
        }),
        (u.prototype.componentWillUpdate = function () {
          this.updating = !0;
        }),
        (u.prototype.componentDidUpdate = function () {
          this.updating = !1;
        }),
        (u.prototype.getMatchingChildren = function (i, u, a) {
          return i
            .filter(o)
            .sort(r)
            .map(function (r) {
              var o = n(u, r.props.path, r.props);
              if (o) {
                if (!1 !== a) {
                  var i = { url: u, matches: o };
                  return (
                    e(i, o), delete i.ref, delete i.key, t.cloneElement(r, i)
                  );
                }
                return r;
              }
            })
            .filter(Boolean);
        }),
        (u.prototype.render = function (e, n) {
          var r = e.children,
            o = e.onChange,
            i = n.url,
            u = this.getMatchingChildren(t.toChildArray(r), i, !0),
            a = u[0] || null,
            p = this.previousUrl;
          return (
            i !== p &&
              ((this.previousUrl = i),
              "function" == typeof o &&
                o({
                  router: this,
                  url: i,
                  previous: p,
                  active: u,
                  current: a,
                })),
            a
          );
        }),
        u
      );
    })(t.Component),
    K = function (n) {
      return t.createElement("a", e({ onClick: g }, n));
    },
    E = function (e) {
      return t.createElement(e.component, e);
    };
  return (
    (R.subscribers = k),
    (R.getCurrentUrl = f),
    (R.route = l),
    (R.Router = R),
    (R.Route = E),
    (R.Link = K),
    (R.exec = n),
    R
  );
});

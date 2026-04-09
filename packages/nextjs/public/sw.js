if (!self.define) {
  let e,
    s = {};
  const a = (a, i) => (
    (a = new URL(a + ".js", i).href),
    s[a] ||
      new Promise((s) => {
        if ("document" in self) {
          const e = document.createElement("script");
          ((e.src = a), (e.onload = s), document.head.appendChild(e));
        } else ((e = a), importScripts(a), s());
      }).then(() => {
        let e = s[a];
        if (!e) throw new Error(`Module ${a} didn’t register its module`);
        return e;
      })
  );
  self.define = (i, n) => {
    const c =
      e ||
      ("document" in self ? document.currentScript.src : "") ||
      location.href;
    if (s[c]) return;
    let t = {};
    const r = (e) => a(e, c),
      o = { module: { uri: c }, exports: t, require: r };
    s[c] = Promise.all(i.map((e) => o[e] || r(e))).then((e) => (n(...e), t));
  };
}
define(["./workbox-4754cb34"], function (e) {
  "use strict";
  (importScripts(),
    self.skipWaiting(),
    e.clientsClaim(),
    e.precacheAndRoute(
      [
        {
          url: "/_next/app-build-manifest.json",
          revision: "eccc24080f51a8805e8a0b380be31684",
        },
        {
          url: "/_next/static/Xa4BMPYSCKM4Lm8Gciq8Y/_buildManifest.js",
          revision: "cf5a8cb0207903f0ffab1ff6d925fa4c",
        },
        {
          url: "/_next/static/Xa4BMPYSCKM4Lm8Gciq8Y/_ssgManifest.js",
          revision: "b6652df95db52feb4daf4eca35380933",
        },
        {
          url: "/_next/static/chunks/11-443e6802dfb93b50.js",
          revision: "Xa4BMPYSCKM4Lm8Gciq8Y",
        },
        {
          url: "/_next/static/chunks/137-0a01b1200f66f763.js",
          revision: "Xa4BMPYSCKM4Lm8Gciq8Y",
        },
        {
          url: "/_next/static/chunks/1f46b9a0-c1ada8765b480274.js",
          revision: "Xa4BMPYSCKM4Lm8Gciq8Y",
        },
        {
          url: "/_next/static/chunks/2f0b94e8-d066c7492321239d.js",
          revision: "Xa4BMPYSCKM4Lm8Gciq8Y",
        },
        {
          url: "/_next/static/chunks/389.f56aa367771cc792.js",
          revision: "f56aa367771cc792",
        },
        {
          url: "/_next/static/chunks/395.124e5c117df3d742.js",
          revision: "124e5c117df3d742",
        },
        {
          url: "/_next/static/chunks/4bd1b696-a7cfb3ee7e167b9e.js",
          revision: "Xa4BMPYSCKM4Lm8Gciq8Y",
        },
        {
          url: "/_next/static/chunks/518-16155d891ddc57df.js",
          revision: "Xa4BMPYSCKM4Lm8Gciq8Y",
        },
        {
          url: "/_next/static/chunks/673-196db70b1d3c5f19.js",
          revision: "Xa4BMPYSCKM4Lm8Gciq8Y",
        },
        {
          url: "/_next/static/chunks/684-b5a3f012e8351c62.js",
          revision: "Xa4BMPYSCKM4Lm8Gciq8Y",
        },
        {
          url: "/_next/static/chunks/728.2f1d4d13140127bc.js",
          revision: "2f1d4d13140127bc",
        },
        {
          url: "/_next/static/chunks/790-0e12d4ad88595ced.js",
          revision: "Xa4BMPYSCKM4Lm8Gciq8Y",
        },
        {
          url: "/_next/static/chunks/972.2c2e09fd7575551a.js",
          revision: "2c2e09fd7575551a",
        },
        {
          url: "/_next/static/chunks/app/_not-found/page-57e7b084c7696ac2.js",
          revision: "Xa4BMPYSCKM4Lm8Gciq8Y",
        },
        {
          url: "/_next/static/chunks/app/api/price/route-5386d5bd795caed7.js",
          revision: "Xa4BMPYSCKM4Lm8Gciq8Y",
        },
        {
          url: "/_next/static/chunks/app/api/privy/sign/route-c393a5ef369a6d21.js",
          revision: "Xa4BMPYSCKM4Lm8Gciq8Y",
        },
        {
          url: "/_next/static/chunks/app/api/privy/wallet/route-1d592cef8e367d4a.js",
          revision: "Xa4BMPYSCKM4Lm8Gciq8Y",
        },
        {
          url: "/_next/static/chunks/app/blockexplorer/address/%5Baddress%5D/page-1a3b7472a721d1c8.js",
          revision: "Xa4BMPYSCKM4Lm8Gciq8Y",
        },
        {
          url: "/_next/static/chunks/app/blockexplorer/page-847b738c90022795.js",
          revision: "Xa4BMPYSCKM4Lm8Gciq8Y",
        },
        {
          url: "/_next/static/chunks/app/blockexplorer/tx/%5Bhash%5D/page-688b53cac6c75b8e.js",
          revision: "Xa4BMPYSCKM4Lm8Gciq8Y",
        },
        {
          url: "/_next/static/chunks/app/configure/page-0f284515f6ad6bbf.js",
          revision: "Xa4BMPYSCKM4Lm8Gciq8Y",
        },
        {
          url: "/_next/static/chunks/app/debug/page-ccfbd550c0504896.js",
          revision: "Xa4BMPYSCKM4Lm8Gciq8Y",
        },
        {
          url: "/_next/static/chunks/app/layout-0525b8e09aa1ab6e.js",
          revision: "Xa4BMPYSCKM4Lm8Gciq8Y",
        },
        {
          url: "/_next/static/chunks/app/page-e39779b2800a43b6.js",
          revision: "Xa4BMPYSCKM4Lm8Gciq8Y",
        },
        {
          url: "/_next/static/chunks/e6909d18-184e41401890bf1f.js",
          revision: "Xa4BMPYSCKM4Lm8Gciq8Y",
        },
        {
          url: "/_next/static/chunks/framework-fa966e6248877291.js",
          revision: "Xa4BMPYSCKM4Lm8Gciq8Y",
        },
        {
          url: "/_next/static/chunks/main-8f2728d8172005c6.js",
          revision: "Xa4BMPYSCKM4Lm8Gciq8Y",
        },
        {
          url: "/_next/static/chunks/main-app-079c14cd06aed3eb.js",
          revision: "Xa4BMPYSCKM4Lm8Gciq8Y",
        },
        {
          url: "/_next/static/chunks/pages/_app-8e94039938385921.js",
          revision: "Xa4BMPYSCKM4Lm8Gciq8Y",
        },
        {
          url: "/_next/static/chunks/pages/_error-7b2d139042a6a5ab.js",
          revision: "Xa4BMPYSCKM4Lm8Gciq8Y",
        },
        {
          url: "/_next/static/chunks/polyfills-42372ed130431b0a.js",
          revision: "846118c33b2c0e922d7b3a7676f81f6f",
        },
        {
          url: "/_next/static/chunks/webpack-222dffa580d446af.js",
          revision: "Xa4BMPYSCKM4Lm8Gciq8Y",
        },
        {
          url: "/_next/static/css/64c3ada667186fde.css",
          revision: "64c3ada667186fde",
        },
        {
          url: "/blast-icon-color.svg",
          revision: "f455c22475a343be9fcd764de7e7147e",
        },
        {
          url: "/debug-icon.svg",
          revision: "25aadc709736507034d14ca7aabcd29d",
        },
        {
          url: "/debug-image.png",
          revision: "34c4ca2676dd59ff24d6338faa1af371",
        },
        {
          url: "/explorer-icon.svg",
          revision: "84507da0e8989bb5b7616a3f66d31f48",
        },
        { url: "/fail-icon.svg", revision: "904a7a4ac93a7f2ada236152f5adc736" },
        {
          url: "/gradient-s.svg",
          revision: "c003f595a6d30b1b476115f64476e2cf",
        },
        { url: "/logo.ico", revision: "0359e607e29a3d3b08095d84a9d25c39" },
        { url: "/logo.svg", revision: "962a8546ade641ef7ad4e1b669f0548c" },
        { url: "/manifest.json", revision: "781788f3e2bc4b2b176b5d8c425d7475" },
        {
          url: "/rpc-version.png",
          revision: "cf97fd668cfa1221bec0210824978027",
        },
        {
          url: "/scaffold-config.png",
          revision: "1ebfc244c31732dc4273fe292bd07596",
        },
        {
          url: "/sn-symbol-gradient.png",
          revision: "908b60a4f6b92155b8ea38a009fa7081",
        },
        {
          url: "/success-icon.svg",
          revision: "19391e78cec3583762ab80dbbba7d288",
        },
        {
          url: "/voyager-icon.svg",
          revision: "06663dd5ba2c49423225a8e3893b45fe",
        },
      ],
      { ignoreURLParametersMatching: [] },
    ),
    e.cleanupOutdatedCaches(),
    e.registerRoute(
      "/",
      new e.NetworkFirst({
        cacheName: "start-url",
        plugins: [
          {
            cacheWillUpdate: async ({
              request: e,
              response: s,
              event: a,
              state: i,
            }) =>
              s && "opaqueredirect" === s.type
                ? new Response(s.body, {
                    status: 200,
                    statusText: "OK",
                    headers: s.headers,
                  })
                : s,
          },
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      /^https:\/\/fonts\.(?:gstatic)\.com\/.*/i,
      new e.CacheFirst({
        cacheName: "google-fonts-webfonts",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 4, maxAgeSeconds: 31536e3 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      /^https:\/\/fonts\.(?:googleapis)\.com\/.*/i,
      new e.StaleWhileRevalidate({
        cacheName: "google-fonts-stylesheets",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 4, maxAgeSeconds: 604800 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      /\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,
      new e.StaleWhileRevalidate({
        cacheName: "static-font-assets",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 4, maxAgeSeconds: 604800 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
      new e.StaleWhileRevalidate({
        cacheName: "static-image-assets",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 64, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      /\/_next\/image\?url=.+$/i,
      new e.StaleWhileRevalidate({
        cacheName: "next-image",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 64, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      /\.(?:mp3|wav|ogg)$/i,
      new e.CacheFirst({
        cacheName: "static-audio-assets",
        plugins: [
          new e.RangeRequestsPlugin(),
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      /\.(?:mp4)$/i,
      new e.CacheFirst({
        cacheName: "static-video-assets",
        plugins: [
          new e.RangeRequestsPlugin(),
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      /\.(?:js)$/i,
      new e.StaleWhileRevalidate({
        cacheName: "static-js-assets",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      /\.(?:css|less)$/i,
      new e.StaleWhileRevalidate({
        cacheName: "static-style-assets",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      /\/_next\/data\/.+\/.+\.json$/i,
      new e.StaleWhileRevalidate({
        cacheName: "next-data",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      /\.(?:json|xml|csv)$/i,
      new e.NetworkFirst({
        cacheName: "static-data-assets",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      ({ url: e }) => {
        if (!(self.origin === e.origin)) return !1;
        const s = e.pathname;
        return !s.startsWith("/api/auth/") && !!s.startsWith("/api/");
      },
      new e.NetworkFirst({
        cacheName: "apis",
        networkTimeoutSeconds: 10,
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 16, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      ({ url: e }) => {
        if (!(self.origin === e.origin)) return !1;
        return !e.pathname.startsWith("/api/");
      },
      new e.NetworkFirst({
        cacheName: "others",
        networkTimeoutSeconds: 10,
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      ({ url: e }) => !(self.origin === e.origin),
      new e.NetworkFirst({
        cacheName: "cross-origin",
        networkTimeoutSeconds: 10,
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 3600 }),
        ],
      }),
      "GET",
    ));
});

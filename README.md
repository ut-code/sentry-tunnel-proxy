# sentry-tunnel-proxy

ut.code(); 内でホストしているSentryインスタンス専用のproxyです。

Sentry.init() 時に
```js
tunnel: "https://s-proxy.utcode.net/",
```
を指定するだけで使えます

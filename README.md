# sentry-tunnel-proxy

ut.code(); 内でホストしているSentryインスタンス専用のproxyです。
ut.code(); 内のプロジェクトであればどなたでも利用できます。

https://docs.sentry.io/platforms/javascript/troubleshooting/#using-the-tunnel-option のサンプルコードをworker用に書き直し、CORSをセットアップしたものです。
dsnのホストを ut.code(); 内でホストしているインスタンスに制限しています。
プロジェクトIDの制限はありません。

Sentry.init() 時に
```js
tunnel: "https://s-proxy.utcode.net/",
```
を指定するだけで使えます


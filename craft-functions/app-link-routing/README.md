# Summary

## title

端末種別に応じたアプリディープリンク振り分け

## blogUrl

https://solution.karte.io/blog/2026/10/app-link-routing/

## description

メールや広告などからアクセスした端末の種類（iOS / Android / その他）に応じて、アプリ起動・アプリストア・Webへ振り分けるHTTPエンドポイントです。Universal Links / App Links導入済みのサービス向けです。受け皿はベースURL `/` と、アプリに渡す配下パス（例: `/items/123`）です。配下パスとクエリはアプリ起動用URLとPCのリダイレクト先に載せ、ストアURLとモバイルのインストールLPには付けません。モバイル未インストール時の送り先を変数MOBILE_UNINSTALLED_FALLBACKでストア案内またはインストールLPに切り替えます。Craft Sitesのサイトの集約（プロキシ）と組み合わせて利用します。

## category

Craft Functions,CRAFT_ENDPOINT,Craft Sites

## functionType

http

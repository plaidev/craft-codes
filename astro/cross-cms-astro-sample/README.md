# cross-cms-astro-sample
Craft Cross CMSのコンテンツを使ってAstroでSSGするサンプルコードです。

Astro公式の次のチュートリアルでできる成果物をベースに改変しています。
https://docs.astro.build/ja/tutorial/0-introduction/

## ローカル開発環境の用意
### Craft Cross CMSでのコンテンツ入稿
- Craft Cross CMSの管理画面から、次のようなフィールドをもつモデルを作成します

field_name | type | description
-- | -- | --
title | テキスト | タイトル
image | 画像 | サムネイル画像
content | リッチテキスト | 本文
pubDate | 日付 | リリース日
description | テキスト | 詳細文
author | 選択 | 著者
tags | 選択（複数） | タグ

- いくつかのコンテンツを入稿し公開しておきます

### CDN APIの設定
- KARTE API v2アプリの管理画面から、次のスコープを持つ `cdn` タイプのアプリを作成します
    - beta.cdn.cms.content.get
    - beta.cdn.cms.content.list
- アクセストークンを控えておきます

### 環境変数の設定
- `package.json`と同一階層に.envファイルを作成します

```
CMS_CDN_API_ACCESS_TOKEN={API v2アプリのアクセストークン}
CMS_CDN_API_HOST={CMS設定画面から取得できるCDN APIのホスト名}
CMS_BLOG_MODEL_ID={作成したCMSモデルのmodel_id}
```

## ローカル環境での操作

```sh
# 開発サーバーの起動
$ npm run dev

# SSG build
$ npm run build

# build結果のpreview
$ npm run preview
```

## GitHub Actionsでの自動deployのための設定
### シークレットや変数の追加
- GitHubリポジトリのSettingsから、次のシークレットおよび変数を追加します
    - Repository secrets
        - `SITES_API_TOKEN`
            - 作成した`cdn`タイプのAPI v2アプリのアクセストークン
    - Repository variables
        - `CMS_CDN_API_ACCESS_TOKEN`
        - `CMS_CDN_API_HOST`
        - `CMS_BLOG_MODEL_ID`
        - `SITE_NAME`
            - deploy対象のCraft Sites サイト名

※ このサンプルではproduction環境だけにデプロイする想定になっていますが、実運用では環境毎に変数の値を分けてください。

### CMS to GitHub ActionsのためのCraft Functionsの作成
- [/docs/craft-functions-webhook.js](/docs/craft-functions-webhook.js)にあるコードを参考に、イベント駆動タイプのCraft Functionsを作成します

### API v2アプリの作成とHook設定
- 次のscopeを持つAPI v2アプリを作成します
    - `beta.cms.content.get`
- [Hook 設定]で、次のトリガーによって先ほど作成したファンクションが実行されるようにします
    - `KARTE CMS: コンテンツの公開時`
    - `KARTE CMS: コンテンツの非公開時`

これにより、CMS側でのコンテンツ更新をHookしたファンクションが実行され、GitHub Actionsに対してcms_updateイベントを発生することでワークフローを自動実行することができるようになります。
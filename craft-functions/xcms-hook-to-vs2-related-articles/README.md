# Summary

## title

Craft Cross CMS の記事公開をトリガーに、Craft Vector Search 2.0 で関連記事リストを自動作成・更新する

## blogUrl

https://solution.karte.io/blog/2026/10/xcms-hook-to-vs2-related-articles/

## description

Craft Cross CMSの記事公開・非公開をHook v2で検知し、Craft Vector Search 2.0で関連記事を検索してCMSに保存するCraft Functionsのサンプルです。新規記事の関連記事作成、既存記事への新着記事の追加、非公開記事の除外と候補の補充を行います。

## category

Craft Functions,Craft Cross CMS,Craft Vector Search 2.0,HOOK_V2

## functionType

event

## 設定

1. API v2アプリに `beta.cms.content.get`、`beta.cms.content.list`、`beta.cms.content.patch`、`beta.cms.content.publish` のscopeを設定します。発行したアクセストークンはCraft Secret Managerに保存してください。
2. Craft Cross CMSの対象モデルに、記事フィールドと複数選択の参照フィールド（関連記事）を用意します。
3. Craft Vector Search 2.0のコレクションを作成します。データスキーマには `title`、`description`、`content` を定義し、Auto Embeddingsの `textTemplate` には `{title} {description} {content}` を指定してください。
4. Craft Functionsのテンプレートから本テンプレートを取得し、イベント駆動タイプに設定します。
5. 変数に対象モデルID、コレクションID、CMSフィールドID、関連記事の最大件数、シークレット名を設定します。
6. API v2アプリのHook v2で `KARTE CMS: コンテンツの公開時` と `KARTE CMS: コンテンツの非公開時` を有効にし、本ファンクションを実行先に指定します。

## 動作

- 公開時: CMSから記事を取得し、Craft Vector Search 2.0に登録して関連記事を検索します。新記事の関連記事フィールドを書き換え、近い既存記事の関連記事フィールドにも新記事を追加します。
- 非公開時: Craft Vector Search 2.0から記事を削除し、その記事を参照している関連記事リストから除外して、候補を補充します。
- CMSの部分更新と公開には `kickHookV2: false` を指定し、Hook v2の再実行を防ぎます。
- Vector Search 2.0のAuto Embeddingsはcreate時に生成されるため、既存データを更新する場合は削除してから再作成します。
- 公開直後はベクトル生成の完了前に検索されることがあるため、検索結果がそろわない場合は `SEARCH_RETRY_DELAY_MS` または `SEARCH_MAX_RETRIES` を調整してください。
- 未公開の下書きがある既存記事は、誤って下書き内容まで公開しないよう更新をスキップします。

## 注意

設定前から公開されている記事は自動ではコレクションに登録されません。既存記事も検索対象にする場合は、設定後に対象記事を非公開にして再公開してください。

コレクションのフィールド名やCMS側のフィールドIDを変更する場合は、`VS2_FIELD_MAPPING` とCraft Vector Search 2.0のスキーマも合わせて変更してください。

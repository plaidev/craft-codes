# Summary

## title

KARTE Datahubのデータを使ってCraft Document DBを更新する

## blogUrl

https://solution.karte.io/blog/2026/06/datahub-to-docdb/

## description

Datahubクエリの結果を使ってCraft Document DBのレコードを挿入・更新・削除します。
Datahubクエリで以下フィールドの情報を持たせる形で実行します。

- オペレーション区分（insert/update/delete）
- 対象のコレクション名
- レコード情報（JSON_STRING形式にした上でBASE64形式にエンコード）

DocumentDBのコレクションは予め作成されている必要があり、
また、レコード情報は同コレクションのスキーマ情報に準じて作成されている必要があります。
ジョブフロー側の設定で、「行ごとにqueueをpublishする」にチェックが入っている前提で動作します。
未チェックの場合はエラーとなるため注意ください。

## category

Craft Functions,Craft Document DB, Datahub, DATAHUB_JOB_FLOW_CONNECTOR

## functionType

event


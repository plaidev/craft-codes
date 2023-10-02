# Summary

## title

BigQuery のテーブルに KARTE から受け取ったデータを即時書き込みする

## blogUrl

https://solution.plaid.co.jp/karte-craft-improve-customer-data-utilization-2

## description

KARTE Craft でサーバーサイドアクションで受け取ったデータを BigQuery に書き込むサンプルコードです。

## category

外部連携,SERVER_SIDE_ACTION

# 使い方

## BigQuery 側テーブルのスキーマ定義

書き込み先テーブルの スキーマ定義 は以下を想定しています。

| フィールド | 型     | モード   |
| ---------- | ------ | -------- |
| datetime   | DATE   | REQUIRED |
| visitor_id | STRING | REQUIRED |
| url        | STRING | REQUIRED |

## サーバーサイドアクションの設定

アクションの data は以下を想定しています。

```json
{ "visitor_id": "${visitor_id}", "url": "${url}", "datetime": "${datetime}" }
```

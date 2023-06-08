# Summary
## title
BigQueryのテーブルにKARTEから受け取ったデータを即時書き込みする

## blog url
https://solution.plaid.co.jp/karte-craft-improve-customer-data-utilization-2

## description
KARTE Craftでサーバーサイドアクションで受け取ったデータをBigQueryに書き込むサンプルコードです。

## category
外部連携

# 使い方
## BigQuery側テーブルのスキーマ定義
書き込み先テーブルの スキーマ定義 は以下を想定しています。

| フィールド | 型 | モード |
| --- | --- | --- |
| datetime | DATE | REQUIRED |
| visitor_id | STRING | REQUIRED |
| url | STRING | REQUIRED |

## サーバーサイドアクションの設定
アクションの data は以下を想定しています。

```json
{ "visitor_id": "${visitor_id}", "url": "${url}", "datetime": "${datetime}" }
```
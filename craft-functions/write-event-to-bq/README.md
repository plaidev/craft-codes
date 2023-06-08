# これはなんですか

KARTE Craftでサーバーサイドアクションで受け取ったデータをBigQueryに書き込むサンプルです。

[KARTEとKARTE Craftでユーザー情報の活用の幅が広がる話 (後編)](https://solution.plaid.co.jp/karte-craft-improve-customer-data-utilization-2) で利用しています。

# Craft Functions の設定方法

* codesに `write-event-to-bq.js` を貼り付けます
* packagesに `modules.json` を貼り付けます

# BQテーブルのスキーマ定義

| フィールド | 型 | モード |
| --- | --- | --- |
| datetime | DATE | REQUIRED |
| visitor_id | STRING | REQUIRED |
| url | STRING | REQUIRED |

# サーバーサイドアクションの設定

アクションの data は以下を想定しています。

```json
{ "visitor_id": "${visitor_id}", "url": "${url}", "datetime": "${datetime}" }
```
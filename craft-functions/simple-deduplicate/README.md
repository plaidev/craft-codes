# Summary
## title
KARTE Craftでファンクションの重複実行を防ぐ

## blog url
https://solution.plaid.co.jp/implementing-exactly-once-semantics-in-karte-craft

## description
Craft Functionsのセマンティクスは "at least once" (少なくとも1回は実行する) です。このサンプルでは、KARTE CraftのKVS機能を使ってCraft Functionsの実行リクエストの重複排除を行い、 "exactly once" (必ず1回だけ実行する) のセマンティクスを実現します。
## category

# 注意点
- Craft KVSが有効になっている必要があります

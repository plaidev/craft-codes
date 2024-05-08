# Summary

## title

KARTE Craft でファンクションの重複実行を防ぐ

## blogUrl
https://solution.karte.io/blog/2023/05/implementing-exactly-once-semantics-in-karte-craft/

## description

Craft Functions のセマンティクスは "at least once" (少なくとも 1 回は実行する) です。このサンプルでは、KARTE Craft の KVS 機能を使って Craft Functions の実行リクエストの重複排除を行い、 "exactly once" (必ず 1 回だけ実行する) のセマンティクスを実現します。

## category

Tips

# 注意点

- Craft KVS が有効になっている必要があります

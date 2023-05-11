# simple-deduplicate

リクエストの重複排除を行うサンプル

# これはなんですか

* Craft Functionsのセマンティクスは "at least once" (少なくとも1回は実行する) です。
* このサンプルでは、KARTE CraftのKVS機能を使ってCraft Functionsの実行リクエストの重複排除を行い、 "exactly once" (必ず1回だけ実行する) のセマンティクスを実現します。

# 前提

* Craft KVSが有効になっている必要があります。

# 使い方

deduplication.js の `checkDuplicatedExec()` と同様の実装をすることで、 "exactly once" が実現できます。

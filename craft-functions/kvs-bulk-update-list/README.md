# Summary

## title

[オーケストレーター]Craft KVSの既存レコードを一括更新する（prefix範囲を走査してワーカーを呼び出す）

## blogUrl

https://solution.karte.io/blog/2026/06/kvs-bulk-update/

## description

指定したprefix範囲のCraft KVSレコードを `kvs.list` でページング取得し、各レコードごとにワーカー（`kvs-bulk-update-write`）を呼び出して一括更新するオーケストレーターファンクションです。
データ是正・スキーマのバックフィル・運用フラグの一括切替・key更新（ホットスポット対応）などに利用します。

## category

Craft Functions, Craft KVS, CRAFT_SCHEDULER

## functionType

event


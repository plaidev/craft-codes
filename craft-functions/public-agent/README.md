# Summary

## title

Vector Search と Document DB を使ったドキュメント検索API（記事レコメンド＋実現可否判定）

## blogUrl

https://solution.karte.io/blog/2026/03/building-article-search-agent/

## description

Craft Vector Search・Craft Document DB・Craft AI Modules・Craft KVS を組み合わせ、自然文から関連ドキュメントを返すHTTP型のCraft Functionsです。`recommend` でベクトル検索＋キーワード検索＋Rerankを行い、`feasibilityCheck` でCraft AI Modules（Gemini等）によるワンショットの実現可否判定を行います。

**公開テンプレート用**に、プロンプト本文・ベースURL・シークレット名はサンプル値です。本番利用前に変数と `buildFeasibilityPrompt` 内の仕様テキストを自社環境に合わせて差し替えてください。

## category

Craft Functions,Craft Vector Search,Craft AI Modules,Craft Document DB,Craft KVS,HTTP

## functionType

http

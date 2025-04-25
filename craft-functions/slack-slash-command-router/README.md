# Summary

## title
Slackのスラッシュコマンドを受けて非同期で別のファンクションを呼び出す

## blogUrl
https://solution.karte.io/blog/2025/04/slack-slash-command

## description
Craft Functionsを利用し、SlackのスラッシュコマンドからRSSフィードの情報を取得しPOSTする際のサンプルコードです。
Slackには「Slackからのリクエストには3秒以内にレスポンスを返さないとタイムアウトエラーが発生する」という仕様があることから、タイムアウトエラーを回避するため、以下のようにファンクションを分けて実装しています。
- 1. Slackへ簡易的なレスポンスを返しつつ二つ目のファンクションを呼び出す（slack-slash-command-router）
- 2. RSSフィードから情報を取得しSlackへPOSTする（slack-slash-command-rss-notifier）

ここでは1つ目のファンクション（slack-slash-command-router）を実装しています。

## category
Craft Functions,Slack

## functionType
http

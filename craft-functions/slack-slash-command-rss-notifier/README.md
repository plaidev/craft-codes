# Summary

## title
別のファンクションの呼び出しを受けてRSSフィードから情報を取得する

## blogUrl
https://solution.karte.io/blog/2025/04/slack-slash-command

## description
Craft Functionsを利用し、SlackのスラッシュコマンドからRSSフィードの情報を取得しPOSTする際のサンプルコードです。
Slackには「Slackからのリクエストには3秒以内にレスポンスを返さないとタイムアウトエラーが発生する」という仕様があることから、タイムアウトエラーを回避するため、以下のようにファンクションを分けて実装しています。
- 1. Slackへ簡易的なレスポンスを返しつつ二つ目のファンクションを呼び出す（slack-slash-command-router）
- 2. RSSフィードから情報を取得しSlackへPOSTする（slack-slash-command-rss-notifier）

ここでは2つ目のファンクション（slack-slash-command-rss-notifier）を実装しています。

## category
Craft Functions,Slack

## functionType
event

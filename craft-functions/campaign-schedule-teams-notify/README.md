# Summary

## title

前日にスケジュール配信が開始/終了した接客サービス情報をTeamsに通知する

## blogUrl

https://solution.karte.io/blog/2024/09/campaign-schedule-teams-notify/

## description

Craft Functionsのスケジューラを用いて接客情報を抽出するクエリを実行するDatahubジョブフローを定期的に起動し、今度はジョブフロー実行結果に基づいてTeamsへメッセージを送るCraft Functionsを呼び出します。Craft Functionsでは呼び出し元（スケジューラ/ジョブフロー）に応じて処理内容を分岐するように実装しています。

## category

Slack,Craft Functions,Datahub

## functionType 

event
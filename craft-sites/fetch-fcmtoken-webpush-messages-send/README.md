# Summary


## title
ユーザーが通知を許可した場合にFirebaseからFCMトークンを取得しCraft Functionsエンドポイントに連携する

## blogUrl
https://solution.karte.io/blog/2024/08/fetch-fcmtoken-webpush-messages-send/

## description
ユーザーに対して通知の許可を確認するページです。通知を許可した場合、Firebaseから取得したFCMトークンをCraft Functionsのエンドポイントに連携し、ウェルカムプッシュを送信する処理がサンプルとして実装されています。Craft Functionsテンプレート「HTTPリクエストから取得したFCMトークンを紐付けテーブルに格納する」と「Datahubクエリの結果を元にFirebaseのAPI経由でWebプッシュを送信する」と一緒に使うことで、バックグラウンド状態の場合でも通知メッセージを送信できます。

## category
Firebase Cloud Messaging,Craft Functions,Craft Sites

# Summary
## title
KARTE CraftとGoogle Calendarを使ってKARTEの接客配信スケジュールを拡張する

## blogUrl
https://solution.plaid.co.jp/202306-campaign-scheduler-with-googlecal

## description
KARTEの接客サービスをGoogle Calendarに登録された予定に応じて公開・停止するためのサンプルコードです。接客サービスの通常の配信設定機能で実現できない配信スケジュールを実現することができます。

## category
機能拡張

# 詳細説明
## 構成

構成は以下の通りです。

```mermaid
graph LR

  subgraph KARTE
	Craft_Function -->|APIで接客の公開, 非公開| KARTE_Action
	  subgraph Craft
	  Schedule(Craft Scheduler <br/> * * * * *) -->|定期実行| Craft_Function
	  end
  end

  Craft_Function -->|祝日一覧を取得| 内閣府ウェブサイト
  Craft_Function -->|スケジュール取得| Google_Calendar
  管理者 -->|対象接客の設定| Craft_Function
  管理者 -->|スケジュール設定| Google_Calendar
```

## 設定手順

設定手順は次の通りです。

### 準備

* Google Cloudのプロジェクトを準備します。
  * プロジェクトのGoogle Calendar APIを有効化しておきます
* KARTEのAPI v2が利用できる状態にしておきます

### Google Cloudのサービスアカウントを作成する

* Google Cloudのサービスアカウントを作成します
* サービスアカウントの鍵をJSON形式で取得します

### Google Calendar にサービスアカウントを追加する

* Google Calendar で接客スケジューラー用のカレンダーを作成します
* カレンダーのメンバーにサービスアカウントのメールアドレスを追加します。閲覧権限を付与します。

### KARTEのAPI v2のアプリを作成する

* KARTEのAPI v2 のアプリを作成します。
  * アプリの種類は `token` です
  * AppのScopeには `beta.action.campaign.toggleEnabled` を指定します。
* アプリ作成時に表示されるアクセストークンを控えておきます。

### Craft Secret Manager にシークレットを登録する

* サービスアカウントの鍵データを（JSON形式のテキスト）をシークレットに登録します。
  * シークレット名は `GOOGLE_CLOUD_SA_KEY` ですが、任意の名前を設定しても構いません。 `GOOGLE_CLOUD_SA_KEY` 以外を設定した場合はコード内のシークレット名を指定している箇所を、自分で設定したシークレット名に置き換えてください。
* API v2 アプリのアクセストークンをシークレットに追加します。
  * シークレット名は `KARTE_API_TOKEN` ですが、任意の名前を設定しても構いません。 `KARTE_API_TOKEN` 以外を設定した場合はコード内のシークレット名を指定している箇所を、自分で設定したシークレット名に置き換えてください。

### Craft Functions を作成する

* campaign-scheduler.js と modules.json の内容をそれぞれ `code` と `modules` に貼り付けます。
  * 先述のシークレット名を任意の名前に変更した場合はコード内の該当箇所を置き換えます。
  * `CALENDAR_ID` にGoogle CalendarのカレンダーIDを指定します。
* 保存します。  

### Craft Functions の起動スケジュールを設定する

* ファンクションの起動スケジュールを設定します。この起動間隔によって接客スケジュールの細かさが決まります。以下は設定例です。
  * `* * * * *` とした場合は毎分起動します。
  * `0/5 * * * *` とした場合は毎時0分から5分毎に起動します。
  * `0 * * * *` とした場合は1時間毎に起動します。（この場合、カレンダーの分単位の設定は無視されます）
  * `15 3 * * *` とした場合は毎日3:15に起動します。

## 使い方

使い方は簡単で、コードに対象の接客IDを指定して、Google Calendarに予定を作成するだけです。

* Craft Functionsのコードにカレンダー管理する接客のIDを指定します。
  * `TARGET_CAMPAIGNS` にJavaScriptの配列形式で接客IDを指定します。
* Google Calenderに予定を作成します
  * メモ欄にJSON形式で以下のプロパティを設定します。
    * `campaign_id` 接客の識別子です。管理画面の接客管理画面のURLに含まれる `https://admin.karte.io/p/xxxxxxxxxxxxxxxxxxxxxxxx/service/zzzzzzzzzzzzzzzzzzzzzzzz` の `/service/` 以降の24桁の文字列です。
    * `on_holiday` 祝日に接客を公開するかどうか。`enable` もしくは `disable` を指定します。 `enable` の場合は祝日の場合に公開します。 `disable` の場合は祝日の場合に非公開にします。このプロパティは省略可能で、省略時は `enable` と解釈されます。
  ```
  { "campaign_id": "zzzzzzzzzzzzzzzzzzzzzzzz", "on_holiday": "(enable|disable)" }
  ```
  * メモ欄には上記のJSON以外は入力しないでください。
  * タイトルに接客のわかりやすい名前を記入します。


## 終了方法

スケジューラーを終了する場合は、以下の手順で作業します。

* Craft Functionsのスケジュール設定を削除します。

上記の設定により、スケジューラーの機能は停止します。この機能で利用するリソースを削除する場合は以降の手順を実施してください。

* Craft Functionsを削除します。
* Craft Secret Manager でシークレットを削除します。
* API v2 アプリを削除します。（他の機能で使われていないか注意してください）  
* Google Calendarを削除します。
* Google Cloudのサービスアカウントを削除します。

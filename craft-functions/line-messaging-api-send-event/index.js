import api from 'api';
import crypto from 'crypto';

const LOG_LEVEL = '<% LOG_LEVEL %>';
const LINE_MESSAGING_API_CHANNEL_SECRET = '<% LINE_MESSAGING_API_CHANNEL_SECRET %>';
const REF_TABLE_ID = '<% REF_TABLE_ID %>';
const KARTE_APP_TOKEN_SECRET = '<% KARTE_APP_TOKEN_SECRET %>';
const SEND_LINE_EVENT_LIST = '<% SEND_LINE_EVENT_LIST %>';
const KARTE_EVENT_NAME = '<% KARTE_EVENT_NAME %>';

async function extractLineSignature(headers) {
  // rawHeadersはキーと値が交互に並んでいるため、2個飛ばしでループを回して"キー-値"ペアを確認
  for (let i = 0; i < headers.length; i += 2) {
    if (headers[i].toLowerCase() === 'x-line-signature') {
      return headers[i + 1]; // "x-line-signature"の値を返す
    }
  }
  return undefined;
}

async function verifySignature(lineChannelSecret, lineSignature, body) {
  const computedSignature = crypto
    .createHmac('SHA256', lineChannelSecret)
    .update(JSON.stringify(body))
    .digest('base64');
  return lineSignature === computedSignature;
}

async function upsertDataSet({ sdk, tableId, rowKey, values, logger, errorMessage }) {
  try {
    await sdk.postV2betaTrackReftableRowUpsert({
      id: tableId,
      rowKey,
      values,
    });
    logger.log(`友達登録ステータスを ${tableId} に更新しました。`);
  } catch (error) {
    logger.error(`${errorMessage}:`, error);
    throw new Error(errorMessage);
  }
}

async function sendKarteEvent({ sdk, userId, eventName, eventValues, logger }) {
  try {
    await sdk.postV2betaTrackEventWriteandexecaction({
      keys: { visitor_id: `line-${userId}` },
      event: {
        event_name: eventName,
        values: eventValues,
      },
    });
    logger.log('KARTEにイベントを送信しました。');
  } catch (error) {
    logger.error('KARTEへのイベント送信でエラーが発生しました:', error);
    throw new Error('KARTEへのイベント送信エラー');
  }
}

export default async function (data, { MODULES }) {
  const { initLogger, secret } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });
  const { req, res } = data;
  const sdk = api('@dev-karte/v1.0#2ee6yim1g4jq6m');

  const secrets = await secret.get({
    keys: [KARTE_APP_TOKEN_SECRET, LINE_MESSAGING_API_CHANNEL_SECRET],
  });
  const karteToken = secrets[KARTE_APP_TOKEN_SECRET];
  sdk.auth(karteToken);
  const lineChannelSecret = secrets[LINE_MESSAGING_API_CHANNEL_SECRET];

  const lineSignature = await extractLineSignature(req.rawHeaders);
  const isValidSignature = await verifySignature(lineChannelSecret, lineSignature, req.body);
  if (!isValidSignature) {
    logger.warn('署名が一致しません。不正なリクエストの可能性があります。');
    res.status(403);
    return;
  }

  const event = req.body.events[0];
  const type = event.type;
  const userId = event.source.userId;
  const webhookEventId = event.webhookEventId;
  const unixTimestamp = Math.floor(event.timestamp / 1000);
  const dateTimestamp = new Date(event.timestamp).toLocaleString('ja-JP', {
    timeZone: 'Asia/Tokyo',
  });

  try {
    const friendStatus = type === 'unfollow' ? 'ブロック中' : '友達登録済み';
    await upsertDataSet({
      sdk,
      tableId: REF_TABLE_ID,
      rowKey: { line_id: userId },
      values: { friend_status: friendStatus, sync_date: dateTimestamp },
      logger,
      errorMessage: '紐付けテーブルへの投入エラー',
    });

    const includedEvents = SEND_LINE_EVENT_LIST.split(',').map(t => t.trim());
    if (!includedEvents.includes(type)) {
      const message = `LINEイベント "${type}" は対象外のため、KARTEへのイベント送信は行いません。`;
      logger.debug(message);
      res.status(200);
      return;
    }

    await sendKarteEvent({
      sdk,
      userId,
      eventName: KARTE_EVENT_NAME,
      eventValues: {
        webhook_event_id: webhookEventId,
        event_type: type,
        webhook_date: unixTimestamp,
      },
      logger,
    });

    res.sendStatus(200);
  } catch (error) {
    logger.error('KARTEでの処理中にエラーが発生しました:', error);
    res.sendStatus(500);
  }
}

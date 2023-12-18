import api from 'api';

const LOG_LEVEL = '<% LOG_LEVEL %>'; // ログのレベルを定義
const SECRET_NAME = '<% SECRET_NAME %>'; // 作成したシークレットの値を定義
const karteApiClient = api('@dev-karte/v1.0#1jvnhd6llgekil84');
const TABLE_ID = '<% TABLE_ID %>' // 今回更新したい紐付けテーブルIDを登録 

export default async function (data, { MODULES }) {
    const { initLogger, secret } = MODULES;
    const logger = initLogger({ logLevel: LOG_LEVEL });
    const secrets = await secret.get({ keys: [SECRET_NAME] });
    const token = secrets[SECRET_NAME];
    karteApiClient.auth(token);

    const userId = data.jsonPayload.data.hook_data.body.user_id; // 紐付けテーブルの値を更新したいユーザーのuser_idを指定
    const rank = data.jsonPayload.data.hook_data.body.rank; // 会員の新しいrankを指定
    try {
        await karteApiClient.postV2betaTrackReftableRowUpsert({
            id: TABLE_ID,
            rowKey: { user_id: userId },
            values: { rank }
        });
        logger.log(`${TABLE_ID} is updated`);
    } catch (e) {
        logger.error(e);
    }
}
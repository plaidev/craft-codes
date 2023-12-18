import api from 'api';
const LOG_LEVEL = '<% LOG_LEVEL %>'; // ログのレベルを必要に応じて定義
const SECRET_NAME = '<% SECRET_NAME %>'; // 登録したシークレットを定義
const karteApiClient = api('@dev-karte/v1.0#1ehqt16lkm2a8jw'); 
const TABLE_ID = '<% TABLE_ID %>' // 今回更新したいテーブルIDを登録

export default async function (data, { MODULES }) {
    const { initLogger, secret } = MODULES;
    const logger = initLogger({ logLevel: LOG_LEVEL });
    const secrets = await secret.get({ keys: [SECRET_NAME] });
    const token = secrets[SECRET_NAME];
    karteApiClient.auth(token);

    const pageUrl = data.jsonPayload.data.hook_data.body.PageURL; // body.xxxの部分はGAS側の記述に依存して変更可能
    const salesCount = data.jsonPayload.data.hook_data.body.SalesCount; 
    const others = data.jsonPayload.data.hook_data.body.Others; 

    try {
        await karteApiClient.postV2betaActionActiontableRecordsUpsert({
            table: TABLE_ID,
            data: {
                pageurl: pageUrl, // ここの内容は作成したアクションテーブルのカラム名に応じて変更可能、今回の場合はpageurl, salescount, othersの3カラムにしたので左記のようになっています。
                salescount: salesCount,
                others
            }
        });
        logger.log(`${TABLE_ID} is updated`);
    } catch (e) {
        logger.error(e);
    }
}
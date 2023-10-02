const LOG_LEVEL = '<% LOG_LEVEL %>';

export default async function (data, { MODULES }) {
  const { initLogger,secret } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });
  const { NOTION_API_TOKEN, NOTION_DB_ID } = await secret.get({
    keys: ['NOTION_API_TOKEN','NOTION_DB_ID'],
  });
  logger.log('data:', data.jsonPayload.data);

  //アンケート結果を格納する
  const user_id = data.jsonPayload.data.user_id
  const nps = data.jsonPayload.data.nps
  const about_product = data.jsonPayload.data.about_product
  const how_to_buy = data.jsonPayload.data.how_to_buy
  const free_comment = data.jsonPayload.data.free_comment 

  logger.log(user_id,nps,about_product,how_to_buy,free_comment)
  //日付を作成
  const dateObj = new Date();
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const day = String(dateObj.getDate()).padStart(2, "0");
  const hours = String(dateObj.getHours()).padStart(2, "0");
  const minutes = String(dateObj.getMinutes()).padStart(2, "0");
  const seconds = String(dateObj.getSeconds()).padStart(2, "0");
  const isoDateTime = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
  logger.log(isoDateTime);

  // Notionに送るデータを構成する
  const database_id = NOTION_DB_ID;
  const payload = {
    parent: {
      database_id: database_id,
    },
    properties: {
      "Name": {
        title: [
          {
            text: {
              content: user_id,
            },
          },
        ],
      },
      'NPSスコア': {
        'rich_text': [
          {
            text: {
              content: nps,
            },
          },
        ],
      },
      '掲載商品の評価': {
        'rich_text': [
          {
            text: {
              content: about_product,
            },
          },
        ],
      },
      '購入手続きについて': {
        'rich_text': [
          {
            text: {
              content: how_to_buy,
            },
          },
        ],
      },
      'フリーコメント': {
        'rich_text': [
          {
            text: {
              content: free_comment,
            },
          },
        ],
      },
      "回答日時":{
        "date":{
          "start": isoDateTime,
          "end":null
        }
      },
    },
  }; 

  // Notionにデータを送信する
  const sendNotionDB = async () => {
    const url = 'https://api.notion.com/v1/pages';
    const token = NOTION_API_TOKEN;

    const headers = {
      'content-type': 'application/json',
      Authorization: 'Bearer ' + token,
      'Notion-Version': '2022-06-28',
    };

    await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload), // payloadをリクエストのbodyに追加する
    })
      .then(async (response) => {
        logger.log('成功');
        const notion_result = await response.text();
        logger.log(notion_result)
      })
      .catch((error) => {
        logger.log('失敗 : ' + error);
      });
  };
  await sendNotionDB(); // sendNotionDB関数を呼び出す
}
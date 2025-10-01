const CMS_CDN_API_ACCESS_TOKEN = import.meta.env.CMS_CDN_API_ACCESS_TOKEN;
const CMS_CDN_API_HOST = import.meta.env.CMS_CDN_API_HOST;
const CMS_BLOG_MODEL_ID = import.meta.env.CMS_BLOG_MODEL_ID;
const BASE_URL = `https://${CMS_CDN_API_HOST}/beta/cms/content`;

export async function fetchAllBlogContents() {
  const url = `${BASE_URL}/list?modelId=${CMS_BLOG_MODEL_ID}&limit=1000`;
  const headers = {
    accept: "application/json",
    authorization: `Bearer ${CMS_CDN_API_ACCESS_TOKEN}`,
  };

  const response = await fetch(url, {
    headers,
  });

  if (!response.ok) {
    throw new Error(`コンテンツ一覧の取得に失敗しました: ${response.status}`);
  }

  const data = await response.json();

  if (!data.items || data.items.length === 0) {
    console.log("取得可能なコンテンツがありません");
    return [];
  }

  console.log(`${data.items.length}件のコンテンツデータを取得完了`);
  return data.items;
}

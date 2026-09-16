// [変更必須] Craft FunctionsのエンドポイントURL
const CRAFT_FUNCTIONS_END_POINT = 'https://xxx.yyy.karte.io/functions/zzz';
// [変更必須] LINE developersコンソールから取得したLIFF ID
const LIFF_ID = '1234567890-ogSq0Pjq';

// デバッグ用に画面上に情報を表示
function showInfo(id, txt) {
  const el = document.getElementById(id);
  el.innerText = txt;
}

try {
  await liff.init({ liffId: LIFF_ID });
  // 現在のユーザーのアクセストークンを取得
  const accessToken = liff.getAccessToken();

  if (!accessToken) {
    const errMsg = 'Access token is not available.';
    showInfo('message', errMsg);
    throw new Error(errMsg);
  }

  showInfo('message', `accessToken: ${accessToken}`);
  showInfo('response', 'loading...');

  // Craft Functionsのエンドポイントにアクセストークンを送信
  const res = await fetch(CRAFT_FUNCTIONS_END_POINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ accessToken }),
  });

  if (!res.ok) {
    const err = await res.text();
    const errMsg = `fetch error. status: ${res.status}, error: ${err}`;
    showInfo('message', errMsg);
    throw new Error(errMsg);
  }

  // Craft Functionsから受け取った結果を表示
  const result = await res.json();
  showInfo('response', JSON.stringify(result));
} catch (err) {
  showInfo('message', `error: ${err}`);
}

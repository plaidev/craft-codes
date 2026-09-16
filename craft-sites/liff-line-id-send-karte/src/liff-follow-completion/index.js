const CONFIG = {
  LIFF: {
    ID: '<LIFF_ID>', // 実際のLIFF IDに書き換えてください
  },
  CRAFT: {
    ENDPOINT: '<CRAFT_FUNCTIONS_ENDPOINT>', // 実際のCraft FunctionsのエンドポイントURLに書き換えてください
  },
  UI: {
    AUTO_CLOSE_DELAY_MS: 3000, // LIFFクライアント内で完了後に自動で閉じるまでの遅延時間（ミリ秒）
  },
};

async function sendDataToCraftFunctions() {
  const loadingEl = document.getElementById('loading');
  const completeEl = document.getElementById('complete');

  try {
    const result = await initializeLiff();

    if (!result) return; // LINEアプリ外の場合は何もしない

    const { idToken, isFriend, utmParams, visitorId } = result;

    await sendDataToServer({ idToken, isFriend, utmParams, visitorId });
    await updateButtonState();

  } catch (error) {
    console.error('error:', error);
    if (loadingEl) {
      loadingEl.innerHTML = `<p style="color:red; padding:20px;">エラーが発生しました。<br>${error.message}</p>`;
    }
  }

  async function initializeLiff() {
    await liff.init({ liffId: CONFIG.LIFF.ID });

    if (!liff.isInClient()) {
      showQRCode();
      return null;
    }

    const idToken = liff.getIDToken();
    if (!idToken) {
      throw new Error('IDトークンの取得に失敗しました');
    }

    const { friendFlag: isFriend } = await liff.getFriendship();

    const search = decodeURIComponent(window.location.search).replace('?liff.state=', '');
    const params = new URLSearchParams(search);

    const utmParams = {
      source: params.get('utm_source') || null,
      medium: params.get('utm_medium') || null,
      campaign: params.get('utm_campaign') || null,
    };

    const visitorId = params.get('visitor_id') || null;

    if (!visitorId) {
      console.warn('visitor_idがパラメータの中に存在しません');
    }

    return { idToken, isFriend, utmParams, visitorId };
  }

  function showQRCode() {
    if (!loadingEl) return;

    loadingEl.innerHTML = `<p style="color:red; padding:20px;">このページはLINEアプリのインストールされたスマートフォンからアクセスしてください</p>`;

    const qrContainer = document.createElement('div');
    qrContainer.style.cssText = 'margin-top: 20px; text-align: center;';
    qrContainer.innerHTML = `
      <p style="margin-bottom: 10px; font-size: 14px;">スマートフォンでこのQRコードを読み取ってください</p>
      <div id="qrcode" style="display: inline-block;"></div>
    `;
    loadingEl.appendChild(qrContainer);

    const liffUrl = `line://app/${CONFIG.LIFF.ID}${window.location.search}`;

    new QRCode(document.getElementById('qrcode'), {
      text: liffUrl,
      width: 256,
      height: 256,
      colorDark: '#000000',
      colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.L
    });
  }

  async function updateButtonState() {
    if (loadingEl) loadingEl.style.display = 'none';
    if (completeEl) completeEl.style.display = 'block';

    if (liff.isInClient()) {
      setTimeout(() => {
        liff.closeWindow();
      }, CONFIG.UI.AUTO_CLOSE_DELAY_MS);
    }
  }

  async function sendDataToServer({ idToken, isFriend, utmParams, visitorId }) {
    try {
      const response = await fetch(CONFIG.CRAFT.ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idToken,
          isFriend,
          utmParams,
          visitorId,
        }),
      });

      if (!response.ok) {
        throw new Error(`サーバーへのデータ送信エラー: ${response.statusText}`);
      }

      console.log('データが正常に送信されました');
    } catch (error) {
      console.error('サーバー送信中にエラーが発生しました:', error);
      throw error;
    }
  }
}

sendDataToCraftFunctions();
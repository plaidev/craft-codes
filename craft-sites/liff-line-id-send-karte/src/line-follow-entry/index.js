const CONFIG = {
  COOKIE: {
    NAME: 'krt.vis', // KARTEのCookie以外を使いたい場合は変更してください
    DOMAIN: '<COOKIE_DOMAIN>', // 実際にCookieを取得するドメインに書き換えてください
  },
  LIFF: {
    ID: '<LIFF_ID>', // 実際のLIFF IDに書き換えてください
  },
  SELECTORS: {
    REGISTER_BUTTON: '<REGISTER_BUTTON_SELECTOR>', // ページ内にあるLINEの友達登録を促すボタンのクラス名に書き換えてください
  },
};

function addClickHandlerToButtons() {
  const buttons = document.querySelectorAll(CONFIG.SELECTORS.REGISTER_BUTTON);

  if (!buttons.length) {
    console.warn('友達登録ボタンが見つかりませんでした');
    return;
  }

  buttons.forEach(button => {
    button.addEventListener('click', event => {
      event.preventDefault();

      const visitorId = getVisitorIdFromCookie();
      const { utmParams } = getUrlParams();

      const utmParamsString = new URLSearchParams({
        utm_source: utmParams.source,
        utm_medium: utmParams.medium,
        utm_campaign: utmParams.campaign,
      }).toString();

      const visitorParam = visitorId ? `&visitor_id=${encodeURIComponent(visitorId)}` : '';
      const separator = utmParamsString ? '?' : '';
      
      const liffUrl = `https://liff.line.me/${CONFIG.LIFF.ID}${separator}${utmParamsString}${visitorParam}`;

      window.location.href = liffUrl;
    });
  });

function getVisitorIdFromCookie() {
    const allowedDomain = CONFIG.COOKIE.DOMAIN.startsWith('.')
      ? CONFIG.COOKIE.DOMAIN
      : `.${CONFIG.COOKIE.DOMAIN}`;

    const cookies = document.cookie.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.split('=').map(c => c.trim());
      acc[key] = value;
      return acc;
    }, {});

    const cookieValue = cookies[CONFIG.COOKIE.NAME];

    if (cookieValue && window.location.hostname.endsWith(allowedDomain)) {
      return cookieValue;
    }

    return null;
  }

  function getUrlParams() {
    const search = decodeURIComponent(window.location.search).replace('?liff.state=', '');
    const params = new URLSearchParams(search);

    const utmParams = {
      source: params.get('utm_source') || null,
      medium: params.get('utm_medium') || null,
      campaign: params.get('utm_campaign') || null,
    };
    const visitorId = params.get('visitor_id') || null;

    if (!visitorId) {
      console.warn('visitor_idが見つかりません');
    }

    return { utmParams, visitorId };
  }
}

addClickHandlerToButtons();
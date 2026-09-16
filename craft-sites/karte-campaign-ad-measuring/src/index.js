(() => {
  const COOKIE_DOMAIN = null; // LPとサンクスページが異なるサブドメインの場合は、その親ドメインを'example.com' のように設定してください
  const TRACKING_ID_QUERY_KEY = 'krt_tid';
  const TRACKING_ID_COOKIE_NAME = 'krt_tid';
  const COOKIE_EXPIRES_DAYS = 7;
  const ENDPOINT_URL = 'https://xxxxxx.cev2.karte.io/functions/yyyyyyyyyyyyy'; // 実際のCraft FunctionsのエンドポイントURLに書き換えてください

  const sharedState = {
    shouldTrack: false,
    cvOptions: {},
  };

  function getTrackingIdFromUrl() {
    const url = new URL(window.location.href);
    return url.searchParams.get(TRACKING_ID_QUERY_KEY);
  }

  function getCookie(name) {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [k, v] = cookie.trim().split('=');
      if (k === name) return decodeURIComponent(v);
    }
    return null;
  }

  function setCookie(name, value, days, domain) {
    const expires = new Date(Date.now() + days * 86400000);
    let cookie = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/`;
    if (domain) cookie += `;domain=${domain}`;
    document.cookie = cookie;
  }

  async function sendConversion({ trackingId, eventName = 'conversion' }) {
    if (!trackingId) return;
    try {
      await fetch(ENDPOINT_URL, {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trackingId,
          timestamp: Date.now(),
          eventName,
        }),
      });
    } catch (error) {
      console.error('[krtExTracker] CV送信失敗:', error);
    }
  }

  function handleTrackingId() {
    const tid = getTrackingIdFromUrl();
    if (tid) {
      setCookie(TRACKING_ID_COOKIE_NAME, tid, COOKIE_EXPIRES_DAYS, COOKIE_DOMAIN);
    }
  }

  if (typeof window.krtExTracker === 'object') {
    if (window.krtExTracker.__shouldTrack__ === true) {
      sharedState.shouldTrack = true;
    }
    if (typeof window.krtExTracker.__cvOptions__ === 'object') {
      sharedState.cvOptions = window.krtExTracker.__cvOptions__;
    }
  }

  handleTrackingId();

  window.krtExTracker = {
    trackCv: (options = {}) => {
      const tid = getCookie(TRACKING_ID_COOKIE_NAME);
      if (!tid) {
        console.warn('[krtExTracker] trackingIdがCookieに見つかりません');
        return;
      }
      sendConversion({ trackingId: tid, ...options });
    },
  };

  if (sharedState.shouldTrack) {
    window.krtExTracker.trackCv(sharedState.cvOptions);
  }
})();

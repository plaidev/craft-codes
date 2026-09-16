// [変更必須] 遷移先ページURL
const DISTINATION_URL = 'https://example.com';

// [変更必須] 待合室通過時間を記録するCookieの書き込み先ドメイン (TLD+1レベルを推奨)
const DOMAIN_FOR_COOKIE = 'example.com';

// [変更必須] Craft FunctionsのエンドポイントURL
const CRAFT_END_POINT = `https://xxx.cev2.karte.io/functions/{{ Craft Endpoint Path }}`;

// 通過可能時刻を過ぎたかチェックする間隔(ms)
const INTERVAL_MS = 1000;

// localStorageとCookieのキー名
const LOCAL_STORAGE_CACHE_KEY = 'waiting_room_time_window_cache';
const LOCAL_STORAGE_REDIRECT_URL_KEY = 'waiting_room_redirect_url';
const COOKIE_NAME = 'passed_waiting_room_at';

const app = Vue.createApp({
  data() {
    return {
      timeWindowHHMM: '',
      isLoading: true,
    };
  },
  async mounted() {
    // 正しいredirect_urlパラメータが付与されていたら、localStorageを上書きする
    setRedirectUrl();

    let timeWindow;
    const cachedTimeWindow = getTimeWindowCache();
    if (cachedTimeWindow) {
      console.log(`[DEBUG] cachedTimeWindow: ${cachedTimeWindow}`);
      timeWindow = cachedTimeWindow;
    } else {
      const v = await fetchTimeWindow();
      if (v.isThrough) {
        return redirect();
      }
      timeWindow = v.timeWindow;
      setTimeWindowCache(timeWindow);
      console.log(`[DEBUG] timeWindow: ${timeWindow}`);
    }

    setInterval(() => {
      if (isCurrentTimeInRange(timeWindow)) {
        redirect();
      }
    }, INTERVAL_MS);

    this.isLoading = false;
    this.timeWindowHHMM = extractHHMM(timeWindow);
  },
});
app.mount('#app');

function redirect() {
  // 待合室をパスしたことを示すCookieを書き込む
  setPassedCookie();

  // localStorageに保存したredirect_urlがあればそれをリダイレクト先に指定
  let url = getAndRemoveRedirectUrl();
  location.href = url || DISTINATION_URL;
}
function setPassedCookie() {
  const now = new Date().toISOString();
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `${COOKIE_NAME}=${now}; path=/; expires=${expires}; domain=${DOMAIN_FOR_COOKIE};`;
}
async function fetchTimeWindow() {
  try {
    const res = await fetch(CRAFT_END_POINT, { method: 'GET' });
    if (!res.ok) throw new Error('Network response was not ok');
    const fetchData = await res.json();
    const { isThrough, timeWindow } = fetchData;
    return { isThrough, timeWindow };
  } catch (error) {
    console.log('There has been a problem with your fetch operation: ', error.message);
  }
}
function getTimeWindowCache() {
  const tw = JSON.parse(localStorage.getItem(LOCAL_STORAGE_CACHE_KEY));
  if (!tw) {
    return null;
  }
  const createdAt = new Date(tw.created_at);
  const tenMinutesAgo = new Date(new Date().getTime() - 10 * 60 * 1000);

  // 10分以上前のキャッシュは無視する
  if (createdAt < tenMinutesAgo) {
    return null;
  }
  return tw.value;
}
function setTimeWindowCache(timeWindow) {
  const data = {
    created_at: new Date().toISOString(),
    value: timeWindow,
  };
  localStorage.setItem(LOCAL_STORAGE_CACHE_KEY, JSON.stringify(data));
}
function getAndRemoveRedirectUrl() {
  const decodedUrl = localStorage.getItem('redirect_url');
  localStorage.removeItem('redirect_url');

  if (!isValidUrl(decodedUrl)) return null;
  return decodedUrl;
}
function setRedirectUrl() {
  const redirectUrl = getQueryParam('redirect_url');

  if (!redirectUrl) return;

  const decodedUrl = decodeURIComponent(redirectUrl);

  if (!isValidUrl(decodedUrl)) return;

  localStorage.setItem('redirect_url', decodedUrl);
}
function extractHHMM(timeWindow) {
  const m = timeWindow.match(/\d\d:\d\d/);
  return m[0];
}
function isCurrentTimeInRange(timeWindow) {
  const now = new Date();
  const target = new Date(timeWindow.replace('_', ' ') + '+09:00'); // JSTであることを明示。 "yyyy-MM-dd_HH:mm" -> "yyyy-MM-dd HH:mm+9:00"
  return target <= now;
}
function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}
function isValidUrl(url) {
  if (!url) return false;
  try {
    const parsedUrl = new URL(url);
    // プロトコルをチェック
    return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
  } catch (error) {
    console.error(`redirect_url is invalid. url: ${url}`);
    return false;
  }
}

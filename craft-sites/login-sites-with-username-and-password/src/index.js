// 署名付きCookie発行用ファンクションのエンドポイントURL
const CRAFT_FUNCTIONS_ENDPOINT = 'https://xxx.yyy.karte.io/functions/zzz';
// Cookieを付与するドメイン. ログインページと認証付きページに共通するドメインを指定
const DOMAIN = 'example.com';
// 閲覧を許可するサイト範囲をURLのprefixで指定
const ALLOWED_AUTH_SITE_URL_PREFIX = 'https://example.com/';
// 認証後のリダイレクト先URL
const REDIRECT_URL = 'https://example.com/';
// 署名の有効期間
const EXPIRED_SECONDS = 60 * 60 * 24;

document.getElementById('loginForm').addEventListener('submit', async function (event) {
  event.preventDefault();
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  setLoading(true);
  // ログイン処理を行うためのAPIリクエスト
  const { signedCookie, jwt, error } = await signin(username, password);
  setLoading(false);
  if (error) {
    document.getElementById('error-message').textContent = error;
    return;
  }
  setSignedCookie(signedCookie);
  setJwtToCookie(jwt);
  window.location.href = REDIRECT_URL;
});

async function signin(username, password) {
  try {
    const res = await fetch(CRAFT_FUNCTIONS_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        urlPrefix: ALLOWED_AUTH_SITE_URL_PREFIX,
        expiredSeconds: EXPIRED_SECONDS,
        username,
        password,
      }),
    });
    if (!res.ok) {
      const { error } = await res.json();
      const errMsg = `status: ${res.status}, error: ${error}`;
      throw new Error(errMsg);
    }

    const { signedCookie, jwt } = await res.json();
    return { signedCookie, jwt };
  } catch (error) {
    console.error(`[signin] error: ${error}`);
    return { error };
  }
}

function setSignedCookie(signedCookie) {
  document.cookie = `${signedCookie}; domain=${DOMAIN}; max-age=${EXPIRED_SECONDS}; path=/`;
}

function setJwtToCookie(jwt) {
  document.cookie = `craft-jwt=${jwt}; domain=${DOMAIN}; max-age=${EXPIRED_SECONDS}; path=/`;
}

function setLoading(isLoading) {
  const btn = document.getElementById('submit');
  if (isLoading) {
    btn.classList.add('is-loading');
  } else {
    btn.classList.remove('is-loading');
  }
}

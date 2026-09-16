// Craft FunctionsのエンドポイントURL
const CRAFT_FUNCTIONS_ENDPOINT = 'https://xxx.yyy.karte.io/functions/zzz';
// Cookieを付与するドメイン. ログインページと認証付きページに共通するドメインを指定
const DOMAIN = 'example.com';
// 認証後のリダイレクト先URL
const REDIRECT_URL = 'https://admin.example.com/admin-console/index.html';
// idTokenのCookie名
const ID_TOKEN_KEY = 'craft-auth-id-token';
// refreshTokenのCookie名
const REFRESH_TOKEN_KEY = 'craft-auth-refresh-token';
// refreshTokenを保存するCookieの有効期限（日数）。再ログインを促すまでの期間として適切な値を設定してください
const REFRESH_TOKEN_EXPIRES_DAYS = 30;

document.getElementById('loginForm').addEventListener('submit', async function (event) {
  event.preventDefault();

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  document.getElementById('error-message').textContent = '';

  setLoading(true);

  try {
    const {
      user,
      idToken,
      idTokenExpiresIn,
      refreshToken,
      signedCookie,
      signedCookieMaxAge,
      error,
    } = await signIn(email, password);

    if (error) {
      document.getElementById('error-message').textContent = error;
      return;
    }

    setSignedCookie(signedCookie, signedCookieMaxAge);
    setIdTokenToCookie(idToken, idTokenExpiresIn);
    const refreshTokenMaxAge = REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60; // 日数を秒に変換
    setRefreshTokenToCookie(refreshToken, refreshTokenMaxAge);

    // リダイレクト
    window.location.href = REDIRECT_URL;
  } catch (error) {
    console.error('Login error:', error);
    document.getElementById('error-message').textContent =
      'ログインに失敗しました。しばらく時間をおいて再度お試しください。';
  } finally {
    setLoading(false);
  }
});

async function signIn(email, password) {
  try {
    const response = await fetch(CRAFT_FUNCTIONS_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'signin',
        email,
        password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        error: data.error || `サーバーエラーが発生しました (${response.status})`,
      };
    }

    return {
      user: data.result.user,
      idToken: data.result.idToken,
      idTokenExpiresIn: data.result.idTokenExpiresIn,
      refreshToken: data.result.refreshToken,
      signedCookie: data.result.signedCookie,
      signedCookieMaxAge: data.result.signedCookieMaxAge,
    };
  } catch (error) {
    console.error('Sign in request error:', error);
    return {
      error: 'ネットワークエラーが発生しました。インターネット接続を確認してください。',
    };
  }
}

function setSignedCookie(signedCookie, maxAge) {
  document.cookie = `${signedCookie}; domain=${DOMAIN}; max-age=${maxAge}; path=/; secure; samesite=strict`;
}

function setIdTokenToCookie(idToken, maxAge) {
  document.cookie = `${ID_TOKEN_KEY}=${idToken}; domain=${DOMAIN}; max-age=${maxAge}; path=/; secure; samesite=strict`;
}

function setRefreshTokenToCookie(refreshToken, maxAge) {
  document.cookie = `${REFRESH_TOKEN_KEY}=${refreshToken}; domain=${DOMAIN}; max-age=${maxAge}; path=/; secure; samesite=strict`;
}

function setLoading(isLoading) {
  const button = document.getElementById('submit');
  const buttonText = button.querySelector('.button-text');
  const loadingSpinner = button.querySelector('.loading-spinner');

  if (isLoading) {
    button.disabled = true;
    button.classList.add('loading');
    buttonText.style.display = 'none';
    loadingSpinner.style.display = 'inline';
  } else {
    button.disabled = false;
    button.classList.remove('loading');
    buttonText.style.display = 'inline';
    loadingSpinner.style.display = 'none';
  }
}

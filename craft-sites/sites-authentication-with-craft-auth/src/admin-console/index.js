// Craft FunctionsのエンドポイントURL
const CRAFT_FUNCTIONS_ENDPOINT = 'https://xxx.yyy.karte.io/functions/zzz';
// Cookieを付与するドメイン. ログインページと認証付きページに共通するドメインを指定
const DOMAIN = 'example.com';
// ログインページのURL（認証エラー時のリダイレクト先）
const LOGIN_URL = 'https://login.example.com/login/index.html';
// idTokenのCookie名
const ID_TOKEN_KEY = 'craft-auth-id-token';
// refreshTokenのCookie名
const REFRESH_TOKEN_KEY = 'craft-auth-refresh-token';

document.addEventListener('DOMContentLoaded', () => {
  loadContent();

  document.getElementById('retry-button').addEventListener('click', () => {
    loadContent();
  });

  document.getElementById('logout-button').addEventListener('click', () => {
    logout();
  });
});

async function loadContent() {
  showLoading();

  try {
    const { title, description, username, error } = await getContent();

    if (error) {
      showError(error);
      return;
    }

    showContent(title, description, username);
  } catch (error) {
    console.error('Content loading error:', error);
    showError('コンテンツの読み込みに失敗しました。しばらく時間をおいて再度お試しください。');
  }
}

async function getContent(options = {}) {
  const { isRetry = false } = options;

  try {
    let idToken = getCookieValue(ID_TOKEN_KEY);
    const refreshToken = getCookieValue(REFRESH_TOKEN_KEY);

    if (!idToken && !refreshToken) {
      window.location.href = LOGIN_URL;
      return { error: 'トークンが見つかりません' };
    }

    if (!idToken && refreshToken) {
      const refreshResult = await refreshIdToken(refreshToken);
      if (refreshResult.error) {
        window.location.href = LOGIN_URL;
        return { error: 'トークンの更新に失敗しました' };
      }
      idToken = refreshResult.idToken;
    }

    const response = await fetch(CRAFT_FUNCTIONS_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({
        action: 'getContent',
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401) {
        if (!isRetry) {
          deleteIdTokenFromCookie();
          return await getContent({ isRetry: true });
        } else {
          window.location.href = LOGIN_URL;
          return { error: '認証が必要です' };
        }
      }
      return {
        error: data.error || `サーバーエラーが発生しました (${response.status})`,
      };
    }

    return {
      title: data.result.title,
      description: data.result.description,
      username: data.result.displayName || data.result.email,
    };
  } catch (error) {
    console.error('Get content request error:', error);
    return {
      error: 'ネットワークエラーが発生しました。インターネット接続を確認してください。',
    };
  }
}

async function refreshIdToken(refreshToken) {
  try {
    const response = await fetch(CRAFT_FUNCTIONS_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'getIdToken',
        refreshToken,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        error: data.error || `トークン更新に失敗しました (${response.status})`,
      };
    }

    const maxAge = data.result.idTokenExpiresIn;
    setIdTokenToCookie(data.result.idToken, maxAge);

    return {
      idToken: data.result.idToken,
    };
  } catch (error) {
    console.error('Refresh token error:', error);
    return {
      error: 'トークン更新でネットワークエラーが発生しました。',
    };
  }
}

function setIdTokenToCookie(idToken, maxAge) {
  document.cookie = `${ID_TOKEN_KEY}=${idToken}; domain=${DOMAIN}; max-age=${maxAge}; path=/; secure; samesite=strict`;
}

function deleteIdTokenFromCookie() {
  document.cookie = `${ID_TOKEN_KEY}=; domain=${DOMAIN}; max-age=0; path=/; secure; samesite=strict`;
}

function deleteRefreshTokenFromCookie() {
  document.cookie = `${REFRESH_TOKEN_KEY}=; domain=${DOMAIN}; max-age=0; path=/; secure; samesite=strict`;
}

function logout() {
  deleteIdTokenFromCookie();
  deleteRefreshTokenFromCookie();
  window.location.href = LOGIN_URL;
}

function getCookieValue(name) {
  const cookies = document.cookie.split(';');
  for (let cookie of cookies) {
    const [cookieName, cookieValue] = cookie.trim().split('=');
    if (cookieName === name) {
      return cookieValue;
    }
  }
  return null;
}

function showLoading() {
  document.getElementById('loading').style.display = 'block';
  document.getElementById('error-container').style.display = 'none';
  document.getElementById('content-container').style.display = 'none';
}

function showError(errorMessage) {
  document.getElementById('loading').style.display = 'none';
  document.getElementById('error-container').style.display = 'block';
  document.getElementById('content-container').style.display = 'none';
  document.getElementById('error-message').textContent = errorMessage;
}

function showContent(title, description, username) {
  document.getElementById('loading').style.display = 'none';
  document.getElementById('error-container').style.display = 'none';
  document.getElementById('content-container').style.display = 'block';

  // コンテンツ情報を表示
  document.getElementById('content-title').textContent = title;
  document.getElementById('content-description').textContent = description;
  document.getElementById('content-username').textContent = username;

  // ヘッダーにもユーザー名を表示
  document.getElementById('header-username').textContent = username;
}

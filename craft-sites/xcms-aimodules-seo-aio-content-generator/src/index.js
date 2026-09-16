// コンテンツ生成・入稿用 Craft Functions のエンドポイントURLを指定します
const CONTENT_FUNCTIONS_ENDPOINT = 'https://xxx.cev2.karte.io/functions/content-yyy';
// 認証用 Craft Functions のエンドポイントURLを指定します
const AUTH_FUNCTIONS_ENDPOINT = 'https://xxx.karte.io/functions/auth-yyy';
// ログインページと認証付きページに共通する、Cookieを付与するドメインを指定します
const DOMAIN = 'example.com';
// ログイン画面のパス　を指定します
const LOGIN_URL = '../login/index.html';
// idToken / refreshToken の Cookie 名を指定します
const ID_TOKEN_KEY = 'craft-auth-id-token';
const REFRESH_TOKEN_KEY = 'craft-auth-refresh-token';

document.addEventListener('DOMContentLoaded', async () => {
  // === 1. Craft Auth による認証チェック ===
  const idToken = await ensureIdToken();
  if (!idToken) return;

  const userNameElem = document.querySelector('.user-name');
  if (userNameElem) {
    userNameElem.textContent = getEmailFromIdToken(idToken) || 'ログイン中';
  }

  // === 2. DOM要素の取得 ===
  const form = document.getElementById('generator-form');
  const btnGenerate = document.getElementById('btn-generate');
  const spinner = document.getElementById('generate-spinner');

  const outputTitle = document.getElementById('output-title');
  const outputSlug = document.getElementById('output-slug');
  const outputMeta = document.getElementById('output-meta');
  const editorBody = document.getElementById('editor-body');
  const charCount = document.getElementById('char-count');
  const btnPublish = document.getElementById('btn-publish');
  const toast = document.getElementById('toast');

  editorBody.addEventListener('input', () => {
    charCount.textContent = editorBody.value.length;
  });

  // === 3. AI生成処理（Craft Functions呼出: action = generate） ===
  form.addEventListener('submit', async e => {
    e.preventDefault();

    btnGenerate.disabled = true;
    spinner.hidden = false;

    try {
      const data = await callContentFunction({
        action: 'generate',
        productName: document.getElementById('product-name').value,
        keywords: document.getElementById('keywords').value,
        productDesc: document.getElementById('product-desc').value,
        authorInfo: document.getElementById('author-info').value,
        targetPersona: document.getElementById('target-persona').value,
        toneManner: document.getElementById('tone-manner').value,
      });

      console.log('API response:', data);

      // 画面反映
      outputTitle.value = data.title;
      outputSlug.value = data.slug;
      outputMeta.value = data.metaDescription;
      editorBody.value = data.body;
      charCount.textContent = data.body.length;

      btnPublish.disabled = false;
      showToast('✨ 記事の骨子・素案が生成されました');
    } catch (error) {
      console.error(error);
      showToast('生成に失敗しました: ' + error.message);
    } finally {
      btnGenerate.disabled = false;
      spinner.hidden = true;
    }
  });

  // === 4. CMSへの入稿処理（API v2 POST: action = submit） ===
  btnPublish.addEventListener('click', async () => {
    btnPublish.disabled = true;

    const payload = {
      action: 'submit',
      title: outputTitle.value,
      slug: outputSlug.value,
      metaDescription: outputMeta.value,
      body: editorBody.value,
    };

    try {
      await callContentFunction(payload);
      showToast('🚀 Craft Cross CMSに下書き（Draft）として入稿完了しました');
    } catch (error) {
      console.error(error);
      showToast('入稿に失敗しました: ' + error.message);
    } finally {
      btnPublish.disabled = false;
    }
  });

  function showToast(message) {
    toast.textContent = message;
    toast.hidden = false;
    setTimeout(() => {
      toast.hidden = true;
    }, 3500);
  }
});

async function ensureIdToken() {
  let idToken = getCookieValue(ID_TOKEN_KEY);
  const refreshToken = getCookieValue(REFRESH_TOKEN_KEY);

  if (!idToken && !refreshToken) {
    window.location.href = LOGIN_URL;
    return null;
  }

  if (!idToken && refreshToken) {
    const refreshResult = await refreshIdToken(refreshToken);
    if (refreshResult.error) {
      window.location.href = LOGIN_URL;
      return null;
    }
    idToken = refreshResult.idToken;
  }

  return idToken;
}

async function callContentFunction(body, options = {}) {
  const { isRetry = false } = options;

  let idToken = await ensureIdToken();
  if (!idToken) {
    throw new Error('認証が必要です');
  }

  const response = await fetch(CONTENT_FUNCTIONS_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401) {
      if (!isRetry) {
        deleteIdTokenFromCookie();
        return callContentFunction(body, { isRetry: true });
      }
      window.location.href = LOGIN_URL;
      throw new Error('認証が必要です');
    }
    throw new Error(data.message || data.error || `HTTP ${response.status}`);
  }

  if (!data.success) {
    throw new Error(data.message || data.error || 'リクエストに失敗しました');
  }

  return data;
}

async function refreshIdToken(refreshToken) {
  try {
    const response = await fetch(AUTH_FUNCTIONS_ENDPOINT, {
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

function getCookieValue(name) {
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [cookieName, ...rest] = cookie.trim().split('=');
    if (cookieName === name) {
      return rest.join('=');
    }
  }
  return null;
}

function getEmailFromIdToken(idToken) {
  try {
    const payloadPart = idToken.split('.')[1];
    if (!payloadPart) return '';
    const normalized = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
    const payload = JSON.parse(atob(padded));
    return payload.email || payload.preferred_username || payload.name || '';
  } catch (error) {
    console.warn('Failed to parse idToken payload', error);
    return '';
  }
}

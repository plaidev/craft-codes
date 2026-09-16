const { createApp, ref, computed } = Vue;

const CREATE_SHORTEN_FUNCTION_URL = 'https://xxxxxxx.cev2.karte.io/functions/yyyyyyy'; // 短縮URL生成及び登録用ファンクションのエンドポイントURLに書き換えてく
const DOMAIN = 'example.com'; // Cookieを付与するドメイン. ログインページと認証付きページに共通するドメインを指定してください
const LOGIN_URL = 'https://login.example.com/login/index.html'; // ログインページのURL（認証エラー時のリダイレクト先）を指定してください
const ID_TOKEN_KEY = 'craft-auth-id-token'; // idTokenのCookie名
const REFRESH_TOKEN_KEY = 'craft-auth-refresh-token'; // refreshTokenのCookie名

createApp({
  setup() {
    const form = ref({
      originalUrl: '',
      utm: { source: '', medium: '', campaign: '', term: '', content: '' },
    });

    const isLoading = ref(false);
    const isModalOpen = ref(false);
    const resultUrl = ref('');
    const copyBtnText = ref('コピー');

    const getCookieValue = name => {
      const cookies = document.cookie.split(';');
      for (let cookie of cookies) {
        const [cookieName, cookieValue] = cookie.trim().split('=');
        if (cookieName === name) return cookieValue;
      }
      return null;
    };

    const setIdTokenToCookie = (idToken, maxAge) => {
      document.cookie = `${ID_TOKEN_KEY}=${idToken}; domain=${DOMAIN}; max-age=${maxAge}; path=/; secure; samesite=strict`;
    };

    const refreshIdToken = async refreshToken => {
      try {
        const response = await fetch(CREATE_SHORTEN_FUNCTION_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'getIdToken', refreshToken }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error();
        setIdTokenToCookie(data.result.idToken, data.result.idTokenExpiresIn);
        return { idToken: data.result.idToken };
      } catch (e) {
        return { error: '更新失敗' };
      }
    };

    const previewUrl = computed(() => {
      if (!form.value.originalUrl) return 'URLを入力してください';
      try {
        const url = new URL(form.value.originalUrl);
        Object.entries(form.value.utm).forEach(([key, val]) => {
          if (val) url.searchParams.set(`utm_${key}`, val);
        });
        return url.toString();
      } catch (e) {
        return '有効なURLではありません';
      }
    });

    const generateShortUrl = async () => {
      isLoading.value = true;

      try {
        let idToken = getCookieValue(ID_TOKEN_KEY);
        const refreshToken = getCookieValue(REFRESH_TOKEN_KEY);

        if (!idToken && !refreshToken) {
          window.location.href = LOGIN_URL;
          return;
        }

        if (!idToken && refreshToken) {
          const res = await refreshIdToken(refreshToken);
          if (res.error) {
            window.location.href = LOGIN_URL;
            return;
          }
          idToken = res.idToken;
        }

        const payload = {
          finalDestination: previewUrl.value,
        };

        const response = await fetch(CREATE_SHORTEN_FUNCTION_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error || '送信に失敗しました');
        }

        const result = await response.json();
        resultUrl.value = result.shortenedUrl;
        isModalOpen.value = true;
      } catch (error) {
        alert('エラー: ' + error.message);
      } finally {
        isLoading.value = false;
      }
    };

    const copyToClipboard = () => {
      navigator.clipboard.writeText(resultUrl.value).then(() => {
        copyBtnText.value = '完了！';
        setTimeout(() => (copyBtnText.value = 'コピー'), 2000);
      });
    };

    const resetForm = () => location.reload();

    return {
      form,
      isLoading,
      isModalOpen,
      resultUrl,
      copyBtnText,
      previewUrl,
      generateShortUrl,
      copyToClipboard,
      resetForm,
    };
  },
}).mount('#app');

// 設定変数（管理画面から設定）
const LOG_LEVEL = '<% LOG_LEVEL %>';
const IOS_APP_SCHEME = '<% IOS_APP_SCHEME %>'.trim();
const IOS_STORE_URL = '<% IOS_STORE_URL %>'.trim();
const ANDROID_PACKAGE_NAME = '<% ANDROID_PACKAGE_NAME %>'.trim();
const ANDROID_APP_SCHEME = '<% ANDROID_APP_SCHEME %>'.trim();
const ANDROID_STORE_URL = '<% ANDROID_STORE_URL %>'.trim();
const WEB_FALLBACK_URL = '<% WEB_FALLBACK_URL %>'.trim();
const MOBILE_UNINSTALLED_FALLBACK = '<% MOBILE_UNINSTALLED_FALLBACK %>'.trim();

const MAX_ROUTING_PATH_LENGTH = 2048;

/**
 * テキスト本文で HTTP 応答を返す
 * @param res Craft HTTP のレスポンス
 * @param status HTTP ステータス
 * @param body 応答本文
 * @param extraHeaders 追加ヘッダー（Allow など）
 */
function sendText(res, status, body, extraHeaders) {
  res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  if (extraHeaders) {
    Object.entries(extraHeaders).forEach(([key, value]) => {
      res.set(key, value);
    });
  }
  return res.status(status).send(body);
}

/**
 * キャッシュ無効化ヘッダー付きで 302 リダイレクトする
 * @param res Craft HTTP のレスポンス
 * @param location Location ヘッダーに載せる絶対 URL
 */
function redirect(res, location) {
  res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  return res.redirect(302, location);
}

/**
 * 値が http/https の絶対 URL として解釈できるかを判定する
 * @param value 検証対象の文字列
 * @param httpsOnly true のときは https のみ許可する
 */
function isHttpOrHttpsUrl(value, { httpsOnly }) {
  try {
    const parsed = new URL(value);
    if (parsed.protocol === 'https:') return true;
    if (!httpsOnly && parsed.protocol === 'http:') return true;
    return false;
  } catch {
    return false;
  }
}

/**
 * 必須変数の欠落・不正値を検証する。不正ならログを出して false を返す
 */
function validateConfig(logger) {
  const requiredVars = {
    IOS_APP_SCHEME,
    IOS_STORE_URL,
    ANDROID_PACKAGE_NAME,
    ANDROID_APP_SCHEME,
    ANDROID_STORE_URL,
    WEB_FALLBACK_URL,
    MOBILE_UNINSTALLED_FALLBACK,
  };
  const emptyVars = Object.entries(requiredVars)
    .filter(([, value]) => !value)
    .map(([key]) => key);
  if (emptyVars.length > 0) {
    logger.error(`以下の変数が設定されていません: ${emptyVars.join(', ')}`);
    return false;
  }

  if (MOBILE_UNINSTALLED_FALLBACK !== 'store' && MOBILE_UNINSTALLED_FALLBACK !== 'web') {
    logger.error('MOBILE_UNINSTALLED_FALLBACK は store または web を指定してください');
    return false;
  }

  // スキーム本体のみを受け取り、:// は組み立て側で付与する
  if (IOS_APP_SCHEME.includes('://')) {
    logger.error('IOS_APP_SCHEME に :// を含めないでください');
    return false;
  }
  if (ANDROID_APP_SCHEME.includes('://')) {
    logger.error('ANDROID_APP_SCHEME に :// を含めないでください');
    return false;
  }

  if (!isHttpOrHttpsUrl(IOS_STORE_URL, { httpsOnly: false })) {
    logger.error('IOS_STORE_URL が不正です');
    return false;
  }
  if (!isHttpOrHttpsUrl(ANDROID_STORE_URL, { httpsOnly: false })) {
    logger.error('ANDROID_STORE_URL が不正です');
    return false;
  }
  if (!isHttpOrHttpsUrl(WEB_FALLBACK_URL, { httpsOnly: true })) {
    logger.error('WEB_FALLBACK_URL が不正です');
    return false;
  }

  return true;
}

/**
 * 制御文字（U+0000–U+001F と U+007F）を含むかを判定する
 */
function hasControlChar(value) {
  for (let i = 0; i < value.length; i += 1) {
    const code = value.charCodeAt(i);
    if (code <= 0x1f || code === 0x7f) return true;
  }
  return false;
}

/**
 * Craft の `/functions/<id>` 接頭辞を除いた pathname を返す
 */
function stripFunctionPrefix(reqPath) {
  return reqPath.replace(/^\/functions\/[^/]+/, '');
}

/**
 * パスセグメントが `.` / `..` / 区切り文字の混入でないことを、% デコード後も含めて確認する
 */
function isSafePathSegment(segment) {
  if (segment === '' || segment === '.' || segment === '..') return false;
  let decoded;
  try {
    decoded = decodeURIComponent(segment);
  } catch {
    return false;
  }
  if (decoded === '' || decoded === '.' || decoded === '..') return false;
  if (
    decoded.includes('/') ||
    decoded.includes('\\') ||
    decoded.includes('?') ||
    decoded.includes('#') ||
    decoded.includes(';') ||
    decoded.includes('://')
  ) {
    return false;
  }
  return !hasControlChar(decoded);
}

/**
 * プレフィックス除去後のパスをアプリに渡せる形へ正規化する。不正なら null
 * 空と `/` はルート（空文字）。末尾スラッシュは 1 つだけ削る。
 */
function normalizeAppPath(stripped) {
  if (stripped.length > MAX_ROUTING_PATH_LENGTH) return null;
  if (stripped === '' || stripped === '/') return '';

  const path = stripped.endsWith('/') ? stripped.slice(0, -1) : stripped;
  if (!path.startsWith('/')) return null;
  if (
    path.includes('://') ||
    path.includes('\\') ||
    path.includes('?') ||
    path.includes('#') ||
    path.includes(';') ||
    hasControlChar(path)
  ) {
    return null;
  }

  const segments = path.split('/');
  if (segments.length < 2) return null;
  for (let i = 1; i < segments.length; i += 1) {
    if (!isSafePathSegment(segments[i])) return null;
  }
  return path;
}

/**
 * クエリのキーまたは値として使える文字列かを判定する
 */
function isSafeQueryToken(value) {
  return !hasControlChar(value);
}

/**
 * `req.query` をアプリ起動 URL 用のクエリ文字列へ再構築する。不正なら null
 */
function buildQueryString(query) {
  if (query == null) return '';
  if (typeof query !== 'object' || Array.isArray(query)) return null;

  const params = new URLSearchParams();
  const entries = Object.entries(query);
  for (let i = 0; i < entries.length; i += 1) {
    const key = entries[i][0];
    const value = entries[i][1];
    if (!isSafeQueryToken(key)) return null;
    const values = Array.isArray(value) ? value : [value];
    for (let j = 0; j < values.length; j += 1) {
      const item = values[j];
      if (typeof item !== 'string' || !isSafeQueryToken(item)) return null;
      params.append(key, item);
    }
  }

  const serialized = params.toString();
  return serialized ? `?${serialized}` : '';
}

/**
 * リクエストのパスとクエリをアプリ起動用の経路に解決する。不正なら null
 */
function resolveAppRoute(reqPath, query) {
  if (typeof reqPath !== 'string' && reqPath != null && reqPath !== '') return null;

  const stripped = typeof reqPath === 'string' ? stripFunctionPrefix(reqPath) : '';
  const path = normalizeAppPath(stripped);
  if (path === null) return null;

  const queryString = buildQueryString(query);
  if (queryString === null) return null;
  return { path, query: queryString };
}

/**
 * 不正時のログに出すパス。クエリ値は含めない
 */
function pathForLog(reqPath) {
  if (typeof reqPath !== 'string') return reqPath;
  return stripFunctionPrefix(reqPath);
}

/**
 * User-Agent ヘッダーを文字列として取り出す（配列のときは先頭要素）
 */
function readUserAgent(headers) {
  const raw = headers?.['user-agent'];
  if (Array.isArray(raw)) {
    return raw[0] ?? '';
  }
  return typeof raw === 'string' ? raw : '';
}

/**
 * User-Agent から端末種別を判定する。iOS / Android 以外は other（PC 含む）
 */
function detectPlatform(userAgent) {
  if (userAgent.includes('iPhone') || userAgent.includes('iPad') || userAgent.includes('iPod')) {
    return 'ios';
  }
  // Windows Phone の UA は Android を含むことがあるが、仕様上 other とする
  if (userAgent.includes('Windows Phone')) {
    return 'other';
  }
  if (userAgent.includes('Android')) {
    return 'android';
  }
  return 'other';
}

/**
 * アプリ起動 URI に載せるパス。先頭の `/` を1つ除き、最初のセグメントをホストにする
 * `/recipes/123` は `recipes/123`（`scheme://recipes/123`）
 */
function buildAppUriPath(routingPath) {
  return routingPath.startsWith('/') ? routingPath.slice(1) : routingPath;
}

/**
 * iOS カスタム URL スキーム（アプリ起動用）を組み立てる。
 * パスがあれば先頭の `/` を除いて `scheme://recipes/123` にする。パスもクエリも無ければ `scheme://`
 * @param routingPath 正規化済みパス。ルートは空文字
 * @param query `?` 付きクエリ。無ければ空文字
 */
function buildIosSchemeUrl(routingPath, query) {
  const path = buildAppUriPath(routingPath);
  if (!path && !query) return `${IOS_APP_SCHEME}://`;
  if (!path) return `${IOS_APP_SCHEME}://${query}`;
  return `${IOS_APP_SCHEME}://${path}${query}`;
}

/**
 * Android 向け Intent URL を組み立てる。Functions 到達後は App Links（https）を再試行せず、
 * カスタムスキームで起動する。未インストール時は browser_fallback_url へ進む。
 * パスとクエリは Intent 本体にだけ載せ、browser_fallback_url には付けない
 * @param routingPath 正規化済みパス。ルートは空文字
 * @param query `?` 付きクエリ。無ければ空文字
 * @param fallbackUrl 未インストール時の遷移先（ストアまたはインストール LP）
 */
function buildAndroidIntentUrl(routingPath, query, fallbackUrl) {
  const fallback = encodeURIComponent(fallbackUrl);
  const path = buildAppUriPath(routingPath);
  const intentSuffix = `#Intent;scheme=${ANDROID_APP_SCHEME};package=${ANDROID_PACKAGE_NAME};S.browser_fallback_url=${fallback};end`;
  if (!path && !query) return `intent://${intentSuffix}`;
  if (!path) return `intent://${query}${intentSuffix}`;
  return `intent://${path}${query}${intentSuffix}`;
}

/**
 * PC 向け 302 の Location を組み立てる。
 * 検証済みの配下パスとクエリを WEB_FALLBACK_URL に連結する。ホストは変数の origin のまま。
 * パスもクエリも無ければ WEB_FALLBACK_URL をそのまま返す。
 * URL.pathname への代入は % の二重エンコードになるため、パスは文字列結合する。
 * @param routingPath 正規化済みパス。ルートは空文字
 * @param query `?` 付きクエリ。無ければ空文字
 */
function buildPcRedirectUrl(routingPath, query) {
  if (!routingPath && !query) return WEB_FALLBACK_URL;

  const base = new URL(WEB_FALLBACK_URL);
  const pathname = routingPath ? `${base.pathname.replace(/\/$/, '')}${routingPath}` : base.pathname;
  let search = base.search;
  if (query) {
    search = base.search ? `${base.search}&${query.slice(1)}` : query;
  }
  return `${base.origin}${pathname}${search}${base.hash}`;
}

/**
 * モバイル未インストール時の送り先を変数 MOBILE_UNINSTALLED_FALLBACK に応じて決める
 * store: 各ストア URL / web: インストール LP。パスもクエリも付けない
 */
function resolveMobileFallbackUrl(platform) {
  if (MOBILE_UNINSTALLED_FALLBACK === 'web') {
    return WEB_FALLBACK_URL;
  }
  return platform === 'ios' ? IOS_STORE_URL : ANDROID_STORE_URL;
}

/**
 * HTML 属性値向けに &, ", ', < をエスケープする
 */
function escapeHtmlAttr(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;');
}

/**
 * モバイル向け中間ページ HTML を返す。アプリ起動用 URL とフォールバック先のリンクを置く
 * @param openAppUrl アプリ起動用 URL（iOS はカスタムスキーム、Android は Intent URL）
 * @param fallbackUrl アプリが開かない場合の遷移先
 */
function buildInterstitialHtml(openAppUrl, fallbackUrl) {
  const schemeHref = escapeHtmlAttr(openAppUrl);
  const fallbackHref = escapeHtmlAttr(fallbackUrl);

  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
<title></title>
</head>
<body>
<p><a id="open-app" href="${schemeHref}">アプリを開く</a></p>
<p><a id="open-fallback" href="${fallbackHref}">アプリが開かない場合</a></p>
</body>
</html>`;
}

/**
 * 端末種別に応じてアプリ起動・ストア・インストール LP へ振り分けるメインハンドラー。
 * 安全な配下パスとクエリはアプリ起動用 URL と PC の 302 先に載せる。モバイルのストア / LP には付けない。
 * モバイルは 200 HTML、PC は WEB_FALLBACK_URL へ 302。GET 以外・設定不正・パス不正は早期リターンする。
 */
export default async function (data, { MODULES }) {
  const { initLogger } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });
  const { req, res } = data;

  try {
    if (req.method !== 'GET') {
      logger.warn('Method Not Allowed', { method: req.method });
      return sendText(res, 405, 'Method Not Allowed', { Allow: 'GET' });
    }

    if (!validateConfig(logger)) {
      return sendText(res, 500, 'Function configuration error');
    }

    const route = resolveAppRoute(req.path, req.query);
    if (!route) {
      logger.warn('Invalid path', { path: pathForLog(req.path) });
      return sendText(res, 400, 'Invalid path');
    }

    const userAgent = readUserAgent(req.headers);
    const platform = detectPlatform(userAgent);
    logger.log('Detected platform', { platform, path: route.path });
    logger.debug('User-Agent', { userAgent });

    if (platform === 'ios' || platform === 'android') {
      const fallbackUrl = resolveMobileFallbackUrl(platform);
      // 自動リダイレクトせず、ユーザー操作でカスタムスキーム / Intent 起動できるように HTML を返す
      const openAppUrl =
        platform === 'ios'
          ? buildIosSchemeUrl(route.path, route.query)
          : buildAndroidIntentUrl(route.path, route.query, fallbackUrl);
      const html = buildInterstitialHtml(openAppUrl, fallbackUrl);
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.set('Content-Type', 'text/html; charset=utf-8');
      return res.status(200).send(html);
    }

    // PC および判定不能端末は WEB_FALLBACK_URL に配下パスとクエリを付けて送る
    return redirect(res, buildPcRedirectUrl(route.path, route.query));
  } catch (error) {
    logger.error('Unexpected error', error);
    throw error;
  }
}

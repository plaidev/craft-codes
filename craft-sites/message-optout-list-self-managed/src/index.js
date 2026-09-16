/**
 * 配信設定ページ（index.html）
 *
 * 全体の流れ:
 *   【1】ユーザーがメールのリンクをクリック
 *   【2】ローディング表示 → Function GET で購読状態を取得
 *   【3】フォーム表示 → トグル操作 → 保存ボタンで Function POST
 *   【4】成功: 完了画面 → 「設定に戻る」でフォームへ / 失敗: エラー画面
 */
const CONFIG = {
   // 実際のCraft FunctionsのエンドポイントURLに書き換えてください
  functionEndpoint: 'https://xxxxxx.cev2.karte.io/functions/yyyyyyyyyyyyy',
};

// 【1】メールリンクのクエリパラメータを読み取る
const params = new URLSearchParams(window.location.search);
const PAGE = {
  userId: params.get("user_id") || "",
  userToken: params.get("user_token") || "",
  maskedEmail: "",
  subscribed: true,
  originalSubscribed: true // 取得時の subscribed（トグル変更検知の基準）
};

// 画面要素
const viewLoading = document.getElementById("view-loading");
const viewForm = document.getElementById("view-form");
const viewSuccess = document.getElementById("view-success");
const viewError = document.getElementById("view-error");
const form = document.getElementById("settings-form");
const toggle = document.getElementById("optout-toggle");
const hintWrap = document.getElementById("toggle-hint-wrap");
const hint = document.getElementById("toggle-hint");
const saveButton = document.getElementById("btn-save");
const successMessage = document.getElementById("success-message");
const errorTitle = document.getElementById("error-title");
const errorMessage = document.getElementById("error-message");
const btnRetry = document.getElementById("btn-retry");
const btnBackToSettings = document.getElementById("btn-back-to-settings");
const maskedEmailEl = document.getElementById("masked-email");

// Function から返る購読状態 JSON の形を検証
function parseSubscriptionResponse(data) {
  if (typeof data?.subscribed !== "boolean") {
    throw new Error("default");
  }
  if (typeof data?.maskedEmail !== "string" || !data.maskedEmail) {
    throw new Error("default");
  }
  return { maskedEmail: data.maskedEmail, subscribed: data.subscribed };
}

// Function から返る error コード → 画面メッセージ
const ERROR_MESSAGES = {
  invalid_request: "リンクが正しくありません。メールに記載のリンクから再度お試しください。",
  invalid_token: "リンクが無効です。メールに記載のリンクから再度お試しください。",
  user_not_found: "対象のユーザーが見つかりませんでした。",
  default: "時間をおいて再度お試しください。問題が続く場合はお問い合わせください。"
};

function hasUnsavedChanges() {
  return toggle.checked !== PAGE.originalSubscribed;
}

// ヒント表示と保存ボタンの有効/無効を更新
function updateFormState() {
  const dirty = hasUnsavedChanges();
  const isLoading = saveButton.dataset.loading === "true";

  // 取得時 subscribed=true かつトグル変更後オフのときだけ停止ヒントを表示
  const showStopHint = PAGE.originalSubscribed && dirty && !toggle.checked;
  hintWrap.classList.toggle("is-visible", showStopHint);
  hint.setAttribute("aria-hidden", showStopHint ? "false" : "true");

  saveButton.disabled = !dirty || isLoading;
}

function showView(name) {
  viewLoading.hidden = name !== "loading";
  viewForm.hidden = name !== "form";
  viewSuccess.hidden = name !== "success";
  viewError.hidden = name !== "error";
}

function showErrorView(title, message) {
  errorTitle.textContent = title;
  errorMessage.textContent = message;
  showView("error");
}

function showFormView() {
  updateFormState();
  showView("form");
}

function showSuccessView(subscribed) {
  successMessage.textContent = subscribed
    ? "メールマガジンの購読設定を保存しました。"
    : "メールマガジンの配信を停止しました。";
  showView("success");
}

function setLoading(isLoading) {
  saveButton.dataset.loading = isLoading ? "true" : "false";
  saveButton.textContent = isLoading ? "保存中..." : "設定を保存する";
  updateFormState();
}

// 【3】Function に渡す URL を組み立て（メールリンクと同じクエリをそのまま転送）
function buildStatusUrl() {
  const url = new URL(CONFIG.functionEndpoint);
  url.searchParams.set("user_id", PAGE.userId);
  url.searchParams.set("user_token", PAGE.userToken);
  return url.toString();
}

// 【3】【4】Function を GET して購読状態を取得
async function fetchSubscriptionStatus() {
  if (!PAGE.userId || !PAGE.userToken) {
    throw new Error("invalid_request");
  }

  const response = await fetch(buildStatusUrl());

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || "default");
  }

  return parseSubscriptionResponse(await response.json());
}

// 【2】→【5】ページ読み込み時のメイン処理
async function loadSubscriptionStatus() {
  showView("loading"); // 【2】ローディング表示

  try {
    const data = await fetchSubscriptionStatus(); // 【3】【4】
    PAGE.maskedEmail = data.maskedEmail;
    PAGE.subscribed = data.subscribed;
    PAGE.originalSubscribed = data.subscribed;

    // 【5】成功: マスクメール・トグルを最新状態にセット
    maskedEmailEl.textContent = data.maskedEmail;
    toggle.checked = data.subscribed;
    updateFormState();
    showView("form");
  } catch (error) {
    console.error(error);
    // 【5】失敗: エラーメッセージを表示
    const message = ERROR_MESSAGES[error.message] || ERROR_MESSAGES.default;
    showErrorView("読み込みに失敗しました", message);
  }
}

// Function を POST して購読状態を更新
async function submitToServer(payload) {
  const response = await fetch(CONFIG.functionEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_id: payload.userId,
      user_token: payload.userToken,
      subscribed: payload.subscribed
    })
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || "default");
  }

  return parseSubscriptionResponse(await response.json());
}

async function submitSettings() {
  const subscribed = toggle.checked;
  setLoading(true);

  try {
    const data = await submitToServer({
      userId: PAGE.userId,
      userToken: PAGE.userToken,
      subscribed
    });

    PAGE.subscribed = data.subscribed;
    PAGE.originalSubscribed = data.subscribed;
    maskedEmailEl.textContent = data.maskedEmail;
    toggle.checked = data.subscribed;
    updateFormState();
    showSuccessView(data.subscribed);
  } catch (error) {
    console.error(error);
    const message = ERROR_MESSAGES[error.message] || ERROR_MESSAGES.default;
    showErrorView("保存に失敗しました", message);
  } finally {
    setLoading(false);
  }
}

toggle.addEventListener("change", updateFormState);

form.addEventListener("submit", (event) => {
  event.preventDefault();
  submitSettings();
});

btnRetry.addEventListener("click", () => {
  loadSubscriptionStatus();
});

btnBackToSettings.addEventListener("click", () => {
  showFormView();
});

// ページ表示完了後に【2】〜【5】を開始
document.addEventListener("DOMContentLoaded", () => {
  loadSubscriptionStatus();
});
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";
import {
  getMessaging,
  getToken,
  onMessage,
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-messaging.js";

// Firebaseから発行するFirebase Cloud Messagingのウェブプッシュ証明書
const VAPIDKEY = "xxxxxxxxxx";
// 取得したFCMトークンを紐付けテーブルに書き込むCraft FunctionsのエンドポイントURL
const CRAFT_ENDPOINT = "xxxxxxxxxx";

// Firebaseで発行するfirebaseConfigに置き換えてください
const FIREBASECONFIG = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
};

initializeApp(FIREBASECONFIG);
const messaging = getMessaging();

let serviceWorkerRegistration = null;

async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    console.warn("Service Workerが非対応のブラウザです。");
    return;
  }

  try {
    serviceWorkerRegistration = await navigator.serviceWorker.register(
      "/firebase-messaging-sw.js"
    );
  } catch (error) {
    console.error("Service Workerの登録に失敗しました。:", error);
  }
}

function setLoadingState(isLoading) {
  const button = document.getElementById("notification-button");
  const buttonText = document.getElementById("button-text");

  if (isLoading) {
    button.classList.add("loading");
    buttonText.textContent = "読み込み中...";
  } else {
    button.classList.remove("loading");
    buttonText.textContent = "プッシュ通知を有効にする";
  }
}

async function requestNotificationPermission() {
  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    alert("通知が許可されていません。");
    throw error;
  }
}

async function getFcmToken() {
  const SERVICE_WORKER_TIMEOUT = 5000;

  async function waitForServiceWorkerRegistration() {
    const startTime = Date.now();

    while (!serviceWorkerRegistration) {
      if (Date.now() - startTime > SERVICE_WORKER_TIMEOUT) {
        console.error("サービスワーカーの登録がタイムアウトしました。");
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  try {
    await waitForServiceWorkerRegistration();
    const token = await getToken(messaging, {
      vapidKey: VAPIDKEY,
      serviceWorkerRegistration,
    });
    return token;
  } catch (error) {
    console.error("FCMトークンの取得に失敗しました。:", error);
    throw error;
  }
}

async function sendTokenToCraft(token) {
  const krtVisValue = document.cookie
    .split("; ")
    .find((row) => row.startsWith("krt.vis="))
    .split("=")[1];

  try {
    const response = await fetch(CRAFT_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fcmToken: token, visitorId: krtVisValue }),
    });

    if (!response.ok) {
      console.error("ネットワーク応答が正常ではありませんでした");
      throw error;
    }
  } catch (error) {
    console.error("サーバーへのトークン送信中にエラーが発生しました:", error);
    throw error;
  }
}

// ウェルカムメッセージの内容に変更してください
function showNotification() {
  if (Notification.permission === "granted") {
    new Notification("通知許可ありがとうございます！", {
      body: "今後あなたにおすすめな情報を定期的にお届けします。",
      icon: "./image/karte_icon.png",
    });
  }
}

async function subscribeToPush() {
  if (!("Notification" in window)) {
    alert("このブラウザーはデスクトップ通知には対応していません。");
    return;
  }

  setLoadingState(true);

  try {
    await requestNotificationPermission();
    const token = await getFcmToken();
    await sendTokenToCraft(token);
    showNotification();
  } catch (error) {
    return;
  } finally {
    setLoadingState(false);
  }
}

registerServiceWorker();

document.getElementById("notification-button").addEventListener("click", () => {
  subscribeToPush();
});

// フォアグラウンドでメッセージ受信時の処理
onMessage(messaging, (payload) => {
  console.log("Message received. ", payload);
  if (Notification.permission === "granted") {
    new Notification(payload.notification.title, {
      body: payload.notification.body,
      icon: payload.notification.icon,
    });
  }
});

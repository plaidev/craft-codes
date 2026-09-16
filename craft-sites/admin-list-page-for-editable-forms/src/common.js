// Craft FunctionsのエンドポイントURLを指定します
const CRAFT_FUNCTIONS_ENDPOINT = 'https://XXXXX.cev2.karte.io/functions/XXXXX';

// 成功時やエラー時のメッセージ画面表示時間（ミリ秒）
const MSG_SHOW_MS = 10000;

const app = Vue.createApp({
  data() {
    return {
      title: '',
      fields: [],
      formData: {},
      isLoading: false,
      successMessage: '',
      errorMessage: '',
    };
  },
  mounted() {
    fetch('./fields.json')
      .then(response => response.json())
      .then(data => {
        this.fields = data.fields;
        this.title = data.title;
        this.isLoading = false;
      });
  },
  methods: {
    async submitForm(e) {
      e.preventDefault();
      this.isLoading = true;
      try {
        const response = await fetch(CRAFT_FUNCTIONS_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(this.formData),
        });

        if (response.status >= 400 && response.status < 500) {
          this.showErrorMessage('入力内容に誤りがあります。入力内容をご確認ください');
          return;
        }
        if (!response.ok) {
          throw new Error(`submitForm error. status: ${response.status}`);
        }
        this.showSuccessMessage('送信に成功しました');
      } catch (error) {
        this.showErrorMessage('送信に失敗しました。時間をおいて再度お試しください');
        console.error(error);
      } finally {
        this.isLoading = false;
      }
    },
    showSuccessMessage(msg) {
      this.successMessage = msg;
      setTimeout(() => (this.successMessage = ''), MSG_SHOW_MS);
    },
    showErrorMessage(msg) {
      this.errorMessage = msg;
      setTimeout(() => (this.errorMessage = ''), MSG_SHOW_MS);
    },
  },
});

app.mount('#app');

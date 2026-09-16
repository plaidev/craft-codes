// Craft FunctionsのエンドポイントURL
const CRAFT_FUNCTIONS_ENDPOINT = 'https://XXXXX.cev2.karte.io/functions/XXXXX';

// 編集対象フォーム画面へのリンク生成用情報
const PUBLIC_SITES_DOMAIN = 'XXXXX'; // フォーム画面のドメイン
const FORM_DIR_PATH = '/admin-page-for-editable-forms'; // フォーム画面URLのディレクトリパス

const app = Vue.createApp({
  data() {
    return {
      isLoading: true,
      fetchError: "",
      forms: {},
    };
  },
  async mounted() {
    const body = JSON.stringify({ startCursor: null, pageSize: 30, startKey: "form-manage", stopKey: null });
    console.log('req body:', body);

    try {
      const response = await fetch(`${CRAFT_FUNCTIONS_ENDPOINT}?shouldFetchList=true`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body,
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      console.log('response:', response);
      this.forms = await response.json();
      console.log('forms:', this.forms);
    } catch (err) {
      console.error(err);
      this.fetchError = err.message;
    } finally {
      this.isLoading = false;
    }

  },
  methods: {
    goToDetail(id) {
      window.location.href = `https://${PUBLIC_SITES_DOMAIN}/${FORM_DIR_PATH}/admin-page/admin-detail/detail.html?id=${id}`;
    },
    formatDate(dateStr) {
      const date = new Date(dateStr);
      return date.toLocaleString("ja-JP");
    }
  },
});
app.mount('#app');
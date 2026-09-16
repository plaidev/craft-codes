// Craft FunctionsのエンドポイントURL
const CRAFT_FUNCTIONS_ENDPOINT = 'https://xxxxxxxx.yyyy.karte.io/functions/zzzzzzzzzz';

// 編集対象フォーム画面へのリンク生成用情報
const PUBLIC_SITES_DOMAIN = 'example.com'; // フォーム画面のドメイン
const FORM_DIR_PATH = '/admin-page-for-editable-forms'; // フォーム画面URLのディレクトリパス

// form_idを一時保存するlocalStorageキー名
const LOCALSTORAGE_KEY = 'editable_form-form_id';

// 成功時やエラー時のメッセージ画面表示時間（ミリ秒）
const MSG_SHOW_MS = 10000;

const app = Vue.createApp({
  data() {
    return {
      form: {
        form_id: '',
        title: '',
        fields: [],
      },
      newField: {
        label: '',
        name: '',
        type: '',
        placeholder: '',
      },
      isLoading: false,
      successMessage: '',
      errorMessage: '',
    };
  },
  mounted() {
    this.form.form_id = localStorage.getItem(LOCALSTORAGE_KEY) || '';
  },
  computed: {
    targetFormUrl() {
      if (!PUBLIC_SITES_DOMAIN || !FORM_DIR_PATH || !this.form.form_id) return null;
      return `https://${PUBLIC_SITES_DOMAIN}${FORM_DIR_PATH}/${this.form.form_id}/index.html`;
    },
    isNewFieldAddable() {
      return this.newField.label && this.newField.name && this.newField.type;
    },
  },
  methods: {
    addField() {
      this.form.fields.push(this.newField);
      this.newField = { label: '', name: '', type: 'text', placeholder: '' };
    },
    deleteField(index) {
      this.form.fields.splice(index, 1);
    },
    moveFieldUp(index) {
      if (index > 0) {
        const temp = this.form.fields[index];
        this.form.fields[index] = this.form.fields[index - 1];
        this.form.fields[index - 1] = temp;
      }
    },
    moveFieldDown(index) {
      if (index < this.form.fields.length - 1) {
        const temp = this.form.fields[index];
        this.form.fields[index] = this.form.fields[index + 1];
        this.form.fields[index + 1] = temp;
      }
    },
    async saveForm() {
      if (!confirm('入力した内容でフォームを更新しますか？')) {
        return;
      }

      this.isLoading = true;
      const body = JSON.stringify(this.form);

      try {
        const response = await fetch(CRAFT_FUNCTIONS_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body,
        });

        if (!response.ok) {
          throw new Error('Network response was not ok');
        }

        const data = await response.json();
        const msg = `フォームの更新に成功しました. フォームID: ${this.form.form_id}`;
        this.showSuccessMessage(msg);
        console.log(`${msg}, data: ${JSON.stringify(data)}`);
      } catch (err) {
        console.error(err);
        this.showErrorMessage(err);
      } finally {
        this.isLoading = false;
      }
    },
    updateFormId(event) {
      localStorage.setItem(LOCALSTORAGE_KEY, event.target.value);
    },
    async loadForm() {
      this.isLoading = true;
      try {
        const response = await fetch(`${CRAFT_FUNCTIONS_ENDPOINT}?form_id=${this.form.form_id}`, {
          method: 'GET',
        });
        const data = await response.json();
        if (!response.ok) {
          const msg =
            data.error ||
            'フォーム項目の取得に失敗しました. フォームIDが正しいかどうか確認してください';
          throw new Error(msg);
        }
        this.form.title = data.title;
        this.form.fields = data.fields;
      } catch (err) {
        console.error(err);
        this.showErrorMessage(err);
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

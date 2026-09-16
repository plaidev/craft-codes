const CRAFT_END_POINT = 'https://t.karte.io/hook/xxxxxxxxxx/craft/xxxxxxxxxxxxxxxxx';
const KARTE_VIS_ID_COOKIE_NAME = ''; // 指定した場合は送信データに自動でvisitorIdフィールドが追加されます

function getVisitorIdFromCookie() {
  const visitorMatch = document.cookie.match(
    new RegExp(`(^| )${KARTE_VIS_ID_COOKIE_NAME}=([^;]+)`)
  );
  return visitorMatch ? visitorMatch[2] : null;
}

const app = Vue.createApp({
  data() {
    return {
      form: {
        companyName: '',
        fullName: '',
        comment: '',
        age: null,
        email: '',
        tel: '',
        birthday: '',
        selectSatification: '',
        gender: '',
      },
      currentStep: 1,
      loading: false,
      errorMsg: '',
    };
  },
  computed: {
    // 1ページ目の必須項目が入寮されているかのバリデーション
    isSendableP1() {
      return (
        this.form.companyName.trim() !== '' &&
        this.form.fullName.trim() !== '' &&
        this.form.selectSatification.trim() !== ''
      );
    },
    // 2ページ目の必須項目が入力されているかのバリデーション
    isSendableP2() {
      return (
        this.form.email.trim() !== '' &&
        this.form.tel.trim() !== '' &&
        this.form.birthday.trim() !== ''
      );
    },
  },
  methods: {
    async submitForm() {
      // ここでフォームのデータを送信するための処理を追加
      this.loading = true;

      if (KARTE_VIS_ID_COOKIE_NAME) {
        this.form['visitorId'] = getVisitorIdFromCookie();
      }

      try {
        const response = await fetch(CRAFT_END_POINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(this.form),
        });

        if (response.ok) {
          this.loading = false;
          this.nextStep();
        } else if (response.status >= 400 && response.status < 500) {
          this.loading = false;
          this.setErrorMsg('入力内容に誤りがあります。入力内容をご確認ください');
        } else {
          this.loading = false;
          this.setErrorMsg('送信に失敗しました。時間をおいて再度お試しください');
        }
      } catch (error) {
        this.loading = false;
        console.log(error);
      }
    },
    nextStep() {
      this.currentStep++;
    },
    prevStep() {
      this.currentStep--;
    },
    setErrorMsg(msg) {
      this.errorMsg = msg;
      setTimeout(() => {
        this.errorMsg = '';
      }, 5000);
    },
  },
});
app.mount('#app');

import { toggleLoading, validateBody, sendEvent } from './utils.js';

const FUNCTION_ENDPOINT =
  'https://kh8wdkc7.cev2.karte.io/functions/4a4sFjHNy8b51K7QpvHziknh2cMDLW2d';
let app = new Vue({
  el: '#app',
  data: {
    error_message: '',
    message: '',
    user_id: '',
    event_name: '',
    values: '',
  },
  methods: {
    submit: function (result) {
      const user_id = this.user_id;
      const event_name = this.event_name;
      const values = this.values;
      const body = { user_id, event_name, values };

      const validationErr = validateBody(body);
      if (validationErr) {
        this.setErrorMsg(validationErr);
        return;
      }

      const ok = confirm('イベント送信しますか？');
      if (!ok) {
        return;
      }

      toggleLoading(true);

      sendEvent(body, res => {
        if (res.error) {
          this.setErrorMsg(res.error);
        } else {
          this.setMsg(res.result);
        }
        toggleLoading(false);
      });
    },

    setMsg: function (txt) {
      this.message = txt;
      this.setClearMessageTimer();
    },

    setErrorMsg: function (txt) {
      this.error_message = txt;
      this.setClearMessageTimer();
    },

    setClearMessageTimer: function () {
      setTimeout(() => {
        this.error_message = '';
        this.message = '';
      }, 10000);
    },
  },
});

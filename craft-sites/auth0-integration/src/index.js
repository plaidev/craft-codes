const config = {
  domain: "YOUR_AUTH0_DOMAIN",
  clientId: "YOUR_AUTH0_CLIENT_ID",
  callbackUrl: "YOUR_CALLBACK_URL",
};

const app = Vue.createApp({
  data() {
    return {
      isLoggedIn: false,
      userProfile: null,
      authClient: null,
      error: "",
    };
  },
  methods: {
    async initializeAuthClient() {
      this.authClient = await createAuth0Client({
        domain: config.domain,
        client_id: config.clientId,
        redirect_uri: config.callbackUrl,
      });
    },
    async refreshUI() {
      const isAuthenticated = await this.authClient.isAuthenticated();
      if (isAuthenticated) {
        this.isLoggedIn = true;
        this.userProfile = await this.authClient.getUser();
        this.userProfile.token = await this.authClient.getTokenSilently();
      }
    },
    async signIn() {
      try {
        await this.authClient.loginWithRedirect({
          redirect_uri: config.callbackUrl,
        });
      } catch (e) {
        console.error(e);
        this.error = "ログインに失敗しました。もう一度お試しください。";
      }
    },
    async signOut() {
      try {
        await this.authClient.logout({
          returnTo: config.callbackUrl,
        });
        this.isLoggedIn = false;
        this.userProfile = null;
        this.error = "";
      } catch (e) {
        console.error(e);
        this.error = "ログアウトに失敗しました。もう一度お試しください。";
      }
    },
  },
  async mounted() {
    await this.initializeAuthClient();
    this.refreshUI();
    const isAuthenticated = await this.authClient.isAuthenticated();
    if (isAuthenticated) {
      return;
    }
    const query = window.location.search;
    if (query.includes("code=") && query.includes("state=")) {
      try {
        await this.authClient.handleRedirectCallback();
        this.refreshUI();
        window.history.replaceState({}, document.title, "/");
      } catch (e) {
        console.error(e);
        this.error =
          "認証の初期化に失敗しました。ページを再読み込みしてください。";
      }
    }
  },
});

app.mount("#app");

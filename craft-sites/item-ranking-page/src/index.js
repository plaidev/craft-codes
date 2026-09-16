const app = Vue.createApp({
  data() {
    return {
      products: [],
    };
  },
  mounted() {
    fetch('./ranking.json')
      .then(response => response.json())
      .then(data => {
        this.products = data.products;
      });
  },
  methods: {
    formatPrice(price) {
      if (price == null) return '';
      return price.toLocaleString();
    },
  },
});

app.mount('#app');

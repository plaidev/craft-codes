const API_URL = 'https://xxx.cev2.karte.io/functions/your-function-id';

const app = Vue.createApp({
  data() {
    return {
      location: null,
      weatherData: null,
      products: [],
      isLoading: false,
      error: null,
      isAcceptedToGetLocation: false,
    };
  },
  computed: {
    advice() {
      if (!this.weatherData) return ['位置情報からおすすめのアイテムを紹介します。', ''];
      return this.generateClothingAdvice(
        this.location.city,
        this.weatherData.forecasts[0].temperature.maximum,
        this.weatherData.forecasts[0].day.longPhrase,
        this.weatherData.summary
      );
    },
    backgroundImage() {
      return this.products.length > 0
        ? `url(assets/${this.products[0].images[0]})`
        : 'url(assets/images/default-background.jpeg)';
    },
  },
  methods: {
    async handleLocationPermission() {
      try {
        const position = await this.getCurrentPosition();
        await this.fetchLocationWeatherData(position.coords.longitude, position.coords.latitude);
        this.isAcceptedToGetLocation = true;
      } catch (err) {
        console.error('位置情報の取得に失敗しました:', err);
        this.handleError(err, '位置情報の取得に失敗しました');
      }
    },
    async fetchLocationWeatherData(x, y) {
      this.clearError();
      this.isLoading = true;
      try {
        const response = await fetch(`${API_URL}?route=locationWeather&x=${x}&y=${y}`);
        if (!response.ok) {
          throw new Error('位置情報と天気データの取得に失敗しました');
        }
        const data = await response.json();
        this.location = data.location;
        this.weatherData = {
          ...data.weather,
          forecasts: data.weather.forecasts.map(forecast => ({
            ...forecast,
            day: {
              ...forecast.day,
              iconPhrase: this.processIconPhrase(forecast.day.iconCode),
            },
          })),
        };
        await this.fetchFeaturedProducts(this.weatherData.forecasts[0].temperature.maximum.value);
      } catch (err) {
        this.handleError(err, '位置情報と天気データを読み込めませんでした');
      } finally {
        this.isLoading = false;
      }
    },
    async fetchFeaturedProducts(temp) {
      this.clearError();
      this.isLoading = true;
      try {
        const response = await fetch(
          `${API_URL}?route=products${temp ? `&temp=${temp}` : ''}`
        );
        if (!response.ok) {
          throw new Error('おすすめ商品の取得に失敗しました');
        }
        this.products = await response.json();
      } catch (err) {
        this.handleError(err, 'おすすめ商品を読み込めませんでした');
      } finally {
        this.isLoading = false;
      }
    },
    getCurrentPosition() {
      return new Promise((resolve, reject) => {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        } else {
          reject(new Error('このブラウザは位置情報をサポートしていません'));
        }
      });
    },
    processIconPhrase(iconCode) {
      if ([1, 2, 3, 4, 5, 21, 33, 34, 35, 36].includes(iconCode)) return '🌞';
      if ([6, 7, 8, 13, 14, 16, 17, 20, 38, 39, 40, 41, 42, 43].includes(iconCode)) return '🌥️';
      if ([12, 15, 18, 19, 22, 24, 25, 26, 29].includes(iconCode)) return '🌧️';
      if ([22, 23, 24, 25, 26, 29, 44].includes(iconCode)) return '⛄️';
      if ([30].includes(iconCode)) return '🌡️';
      if ([31].includes(iconCode)) return '🌨️';
      if ([32].includes(iconCode)) return '💨';
      if ([11].includes(iconCode)) return '💨';
      return '🌈';
    },
    generateClothingAdvice(cityName, maxTemp, longPhrase, summary) {
      let adviceStart = '';
      let adviceEnd = '';

      if (maxTemp.value >= 30) {
        adviceStart = `${cityName}はとても暑く、今日は${longPhrase}の予報です。ノースリーブや半袖の涼しい服を選んで、快適に過ごしましょう。`;
      } else if (maxTemp.value >= 25) {
        adviceStart = `${cityName}は暖かく、今日は${longPhrase}です。半袖の服が最適です。`;
      } else if (maxTemp.value >= 20) {
        adviceStart = `${cityName}は過ごしやすい気温で、今日は${longPhrase}の予報です。長袖の服を着て、一日中快適に過ごしましょう。`;
      } else if (maxTemp.value >= 15) {
        adviceStart = `${cityName}は少し肌寒く、今日は${longPhrase}です。軽い羽織りものを用意して、温度調整ができるようにしましょう。`;
      } else if (maxTemp.value >= 10) {
        adviceStart = `${cityName}は寒く、今日は${longPhrase}の予報です。アウターを着て、しっかりと防寒対策をしてください。`;
      } else {
        adviceStart = `${cityName}は非常に寒く、今日は${longPhrase}です。コートや厚手の服を着て、暖かく過ごしましょう。`;
      }

      adviceEnd = summary.phrase;

      return [adviceStart, adviceEnd];
    },
    formatPrice(price) {
      if (price == null) return '';
      return price.toLocaleString();
    },
    clearError() {
      this.error = null;
    },
    handleError(err, message) {
      console.error(err);
      this.error = message || err.message;
    },
  },
  mounted() {
    this.fetchFeaturedProducts();
  },
});

app.mount('#app');
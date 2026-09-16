const app = Vue.createApp({
  data() {
    return {
      currentPage: "start",
      content: {},
      questions: [],
      diagnosisResults: {},
      currentIndex: 0,
      answers: [],
      canShowResult: false,
      result: "",
      isLoading: false,
    };
  },
  computed: {
    currentQuestion() {
      return this.questions[this.currentIndex] || null;
    },
    startPage() {
      return this.content.startPage || {};
    },
    loadingPage() {
      return this.content.loadingPage || {};
    },
    resultPage() {
      return this.content.resultPage || {};
    },
    isErrorPage() {
      return this.getResult().id === undefined;
    },
  },
  methods: {
    async loadDiagnosticContent() {
      try {
        const response = await axios.get("data.json");
        this.content = response.data.content;
        this.questions = response.data.questions;
        this.diagnosisResults = response.data.diagnosisResults;
      } catch (error) {
        console.error("Error loading questions:", error);
      }
    },
    async startDiagnosis() {
      this.currentPage = "diagnosis";
    },
    selectAnswer(choiceId) {
      const answer = {
        questionId: this.currentQuestion.id,
        choiceId: choiceId,
      };
      this.answers.push(answer);
      this.nextQuestion();
    },
    nextQuestion() {
      if (this.currentIndex < this.questions.length - 1) {
        this.currentIndex++;
      } else {
        this.showLoading();
        const result = this.getResult();
        this.sendDiagnosisResultToKarte(result);
      }
    },
    showLoading() {
      this.isLoading = true;
      setTimeout(() => {
        this.isLoading = false;
        this.canShowResult = true;
      }, 2000); // 2秒間のローディング時間をシミュレート
    },
    sendDiagnosisResultToKarte(result) {
      krt("send", "diagnosis_result", {
        id: result.id,
        text: result.text,
      });
    },
    reset() {
      this.currentPage = "start";
      this.currentIndex = 0;
      this.answers = [];
      this.canShowResult = false;
      this.result = "";
      this.isLoading = false;
    },
    getResult() {
      const key = this.answers
        .map((answer) => answer.questionId + answer.choiceId)
        .join("_");
      return this.diagnosisResults[key] || this.content.resultPageError;
    },
    goBack() {
      if (this.currentIndex > 0) {
        this.currentIndex--;
        this.answers.pop();
      }
    },
  },
  mounted() {
    this.loadDiagnosticContent();
  },
});

app.mount("#app");

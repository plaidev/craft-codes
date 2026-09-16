const MANAGE_LINE_RICH_MENUS_ENDPOINT = ''; // エンドポイントURL
const PUBLIC_SITES_DOMAIN = ''; // フォーム画面のドメイン

const { createApp, ref, watch, computed, onMounted } = Vue;

function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

const app = createApp({
  setup() {
    const menus = ref([]);
    const isLoading = ref(true);
    const fetchError = ref('');
    const showSuccessMessage = ref(false);
    const methodType = ref('');
    const formPageUrl = `https://${PUBLIC_SITES_DOMAIN}/line_rich_menu_management_screen/create-rich-menu-page/index.html`;

    //処理の成功メッセージを出し分けるためのパラメーターを取得
    function handleMethodTypeFromURL() {
      const urlParams = new URLSearchParams(window.location.search);
      const type = urlParams.get('methodType');
      if (type) {
        methodType.value = type;
        showSuccessMessage.value = true;
        setTimeout(() => {
          showSuccessMessage.value = false;
        }, 3000); // 3秒後にメッセージを非表示
      }
      return type;
    }

    async function fetchMenus() {
      try {
        const res = await fetch(MANAGE_LINE_RICH_MENUS_ENDPOINT);
        if (!res.ok) throw new Error('Failed to fetch menus');
        const data = await res.json();
        menus.value = data.richMenuResponse.richMenusData;
        menus.value.forEach(menu => {
          menu.createdAt = formatDate(menu.createdAt);
        });
      } catch (err) {
        console.error(err);
        fetchError.value = err.message;
      } finally {
        isLoading.value = false;
      }
    }

    //リッチメニューの詳細画面に遷移する
    function goToDetail(id) {
      //リッチメニューの種類（デフォルト、ユーザー単位)によってUIを出し分けるために、メニューユーのタイプをパラメーターに渡す
      const menuType = menus.value.find(menu => menu.richMenuId === id).menuType;
      window.location.href = `https://${PUBLIC_SITES_DOMAIN}/line_rich_menu_management_screen/rich-menu-list-page/rich-menu-detail/detail.html?id=${id}&menuType=${menuType}`;
    }


    onMounted(() => {
      fetchMenus();
      handleMethodTypeFromURL();
    });

    return {
      menus,
      isLoading,
      fetchError,
      showSuccessMessage,
      methodType,
      formPageUrl,
      fetchMenus,
      goToDetail,
    };
  },
});

app.mount('#app');

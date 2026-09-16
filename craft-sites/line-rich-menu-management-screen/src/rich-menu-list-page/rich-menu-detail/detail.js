const MANAGE_LINE_RICH_MENUS_ENDPOINT = '';
const PUBLIC_SITES_DOMAIN = '';

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
};

const app = createApp({
  setup() {
    const menu = ref(null);
    const imageUrl = ref(null);
    const userIds = ref([]);
    const createdAt = ref(null);
    const isLoading = ref(true);
    const fetchError = ref('');
    const isFailed = ref(false);
    const menuType = ref('');

    function getMenuType() {
      const params = new URLSearchParams(window.location.search);
      return params.get('menuType');
    };

    function getId() {
      const params = new URLSearchParams(window.location.search);
      return params.get('id');
    };

    async function fetchMenuById(id) {
      try {
        const res = await fetch(`${MANAGE_LINE_RICH_MENUS_ENDPOINT}?id=${id}`, {
          method: 'GET',
        });

        if (!res.ok) throw new Error('Failed to fetch menu');

        const data = await res.json();
        menu.value = data.richMenuData;

        const base64Image = data.base64Image;
        userIds.value = data.userIds;
        createdAt.value = formatDate(data.createdAt);
        imageUrl.value = `data:image/jpeg;base64,${base64Image}`;
      } catch (err) {
        console.error(err);
        fetchError.value = err.message;
      } finally {
        isLoading.value = false;
      }
    };

    //リッチメニューの削除、デフォルトリッチメニューの解除、設定をした際に、リッチメニュー一覧画面に遷移する
    function goBack(isMutation, methodType) {
      //処理の成功メッセージを出し分けるために、パラメーターに渡す
      if (isMutation) {
        window.location.href = `https://${PUBLIC_SITES_DOMAIN}/line_rich_menu_management_screen/rich-menu-list-page/index.html?methodType=${methodType}`;
      } else {
        window.location.href = `https://${PUBLIC_SITES_DOMAIN}/line_rich_menu_management_screen/rich-menu-list-page/index.html`;
      }
    };

    async function setDefaultMenu(id) {
      try {
        const res = await fetch(`${MANAGE_LINE_RICH_MENUS_ENDPOINT}?id=${id}`, {
          method: 'POST',
        });
        if (!res.ok) {
          isFailed.value = true;
          throw new Error('Failed to set default menu');
        }
        goBack(true, 'setDefaultRichMenu');
      } catch (err) {
        console.error(err);
        fetchError.value = err.message;
      }
    };

    async function unSetDefaultRichMenu() {
      try {
        const res = await fetch(MANAGE_LINE_RICH_MENUS_ENDPOINT, {
          method: 'DELETE',
          body: JSON.stringify({ action: 'unSetDefaultLineRichMenu' }),
        });

        if (!res.ok) {
          isFailed.value = true;
          throw new Error('Failed to delete default rich menu');
        }
        goBack(true, 'unSetDefaultRichMenu');
      } catch (err) {
        console.error(err);
      }
    };

    async function deleteMenu(id) {
      try {
        const res = await fetch(`${MANAGE_LINE_RICH_MENUS_ENDPOINT}?id=${id}`, {
          method: 'DELETE',
          body: JSON.stringify({ action: 'deleteLineRichMenu' }),
        });
        if (!res.ok) {
          isFailed.value = true;
          throw new Error('Failed to delete menu');
        }
        goBack(true, 'deleteRichMenu');
      } catch (err) {
        console.error(err);
        fetchError.value = err.message;
      }
    };

    onMounted(() => {
      fetchMenuById(getId());
      menuType.value = getMenuType();
    });

    return {
      menu,
      imageUrl,
      isLoading,
      fetchError,
      userIds,
      isFailed,
      menuType,
      createdAt,
      getId,
      fetchMenuById,
      goBack,
      deleteMenu,
      setDefaultMenu,
      unSetDefaultRichMenu,
    };
  },
});

app.mount('#app');

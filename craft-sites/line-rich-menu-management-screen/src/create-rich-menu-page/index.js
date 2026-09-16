const CREATE_RICH_MENU_ENDPOINT = ''; // エンドポイントURL
const PUBLIC_SITES_DOMAIN = ''; // フォーム画面のドメイン

const { createApp, ref, watch, computed } = Vue;

const templateImagesMaster = ref({
  large: [
    {
      name: 'テンプレ１',
      imageUrl: '../assets/large/richmenu-template-guide-07.png',
      size: { width: 2500, height: 1686 },
      areas: [{ x: 0, y: 0, width: 2500, height: 1686 }],
    },
    {
      name: 'テンプレ２',
      imageUrl: '../assets/large/richmenu-template-guide-06.png',
      size: { width: 2500, height: 1686 },
      areas: [
        { x: 0, y: 0, width: 1250, height: 1686 },
        { x: 1250, y: 0, width: 1250, height: 1686 },
      ],
    },
    {
      name: 'テンプレ３',
      imageUrl: '../assets/large/richmenu-template-guide-05.png',
      size: { width: 2500, height: 1686 },
      areas: [
        { x: 0, y: 0, width: 2500, height: 843 },
        { x: 0, y: 843, width: 2500, height: 843 },
      ],
    },
    {
      name: 'テンプレ４',
      imageUrl: '../assets/large/richmenu-template-guide-04.png',
      size: { width: 2500, height: 1686 },
      areas: [
        { x: 0, y: 0, width: 1666, height: 1686 },
        { x: 1666, y: 0, width: 834, height: 843 },
        { x: 1666, y: 843, width: 834, height: 843 },
      ],
    },
    {
      name: 'テンプレ５',
      imageUrl: '../assets/large/richmenu-template-guide-03.png',
      size: { width: 2500, height: 1686 },
      areas: [
        { x: 0, y: 0, width: 2500, height: 843 },
        { x: 0, y: 843, width: 833, height: 843 },
        { x: 833, y: 843, width: 833, height: 843 },
        { x: 1667, y: 843, width: 834, height: 843 },
      ],
    },
    {
      name: 'テンプレ６',
      imageUrl: '../assets/large/richmenu-template-guide-02.png',
      size: { width: 2500, height: 1686 },
      areas: [
        { x: 0, y: 0, width: 1250, height: 843 },
        { x: 1250, y: 0, width: 1250, height: 843 },
        { x: 0, y: 843, width: 1250, height: 843 },
        { x: 1250, y: 843, width: 1250, height: 843 },
      ],
    },
    {
      name: 'テンプレ7',
      imageUrl: '../assets/large/richmenu-template-guide-01.png',
      size: { width: 2500, height: 1686 },
      areas: [
        { x: 0, y: 0, width: 833, height: 843 },
        { x: 833, y: 0, width: 833, height: 843 },
        { x: 1667, y: 0, width: 833, height: 843 },
        { x: 0, y: 843, width: 833, height: 843 },
        { x: 833, y: 843, width: 833, height: 843 },
        { x: 1667, y: 843, width: 833, height: 843 },
      ],
    },
  ],
  compact: [
    {
      name: 'テンプレ1',
      imageUrl: '../assets/compact/richmenu-template-guide-05.png',
      size: { width: 2500, height: 843 },
      areas: [{ x: 0, y: 0, width: 2500, height: 843 }],
    },
    {
      name: 'テンプレ2',
      imageUrl: '../assets/compact/richmenu-template-guide-04.png',
      size: { width: 2500, height: 843 },
      areas: [
        { x: 0, y: 0, width: 833, height: 843 },
        { x: 833, y: 0, width: 1667, height: 843 },
      ],
    },
    {
      name: 'テンプレ3',
      imageUrl: '../assets/compact/richmenu-template-guide-03.png',
      size: { width: 2500, height: 843 },
      areas: [
        { x: 0, y: 0, width: 1667, height: 843 },
        { x: 1667, y: 0, width: 833, height: 843 },
      ],
    },
    {
      name: 'テンプレ4',
      imageUrl: '../assets/compact/richmenu-template-guide-02.png',
      size: { width: 2500, height: 843 },
      areas: [
        { x: 0, y: 0, width: 1250, height: 843 },
        { x: 1250, y: 0, width: 1250, height: 843 },
      ],
    },
    {
      name: 'テンプレ5',
      imageUrl: '../assets/compact/richmenu-template-guide-01.png',
      size: { width: 2500, height: 843 },
      areas: [
        { x: 0, y: 0, width: 833, height: 843 },
        { x: 833, y: 0, width: 834, height: 843 },
        { x: 1667, y: 0, width: 833, height: 843 },
      ],
    },
  ],
});

const actionTypeFieldsMaster = {
  postback: [
    { id: 'data', label: 'データ', required: true },
    { id: 'label', label: 'ラベル' },
    { id: 'displayText', label: '表示テキスト' },
    {
      id: 'inputOption',
      label: '入力オプション',
      options: [
        { value: 'closeRichMenu', label: 'リッチメニューを閉じる' },
        { value: 'openRichMenu', label: 'リッチメニューを開く' },
        { value: 'openKeyboard', label: 'キーボードを開く' },
        { value: 'openVoice', label: '音声入力を開く' },
      ],
    },
    { id: 'fillInText', label: '入力テキスト' },
  ],
  message: [
    { id: 'text', label: 'テキスト', required: true },
    { id: 'label', label: 'ラベル' },
  ],
  uri: [
    { id: 'uri', label: 'URL', required: true },
    { id: 'label', label: 'ラベル' },
    { id: 'altUri.desktop', label: 'デスクトップの代替URL' },
  ],
  datetimepicker: [
    { id: 'data', label: 'データ', required: true },
    {
      id: 'mode',
      label: 'モード',
      options: [
        { value: 'date', label: '日付' },
        { value: 'time', label: '時間' },
        { value: 'datetime', label: '日時' },
      ],
      value: 'date',
      required: true,
    },
    { id: 'label', label: 'ラベル' },
    {
      id: 'initial',
      label: '初期値',
      placeholder: '例: 2024-04-30',
    },
    {
      id: 'max',
      label: '最大値',
      placeholder: '例: 2025-12-31',
    },
    {
      id: 'min',
      label: '最小値',
      placeholder: '例: 2023-01-01',
    },
  ],
  switchRichMenu: [
    {
      id: 'richMenuAliasId',
      label: '切替先のリッチメニューエイリアスID',
      required: true,
    },
    { id: 'data', label: 'データ', required: true },
    { id: 'label', label: 'ラベル' },
  ],
  clipboard: [
    {
      id: 'clipboardText',
      label: 'クリップボードにコピーされる文字列',
      required: true,
    },
    { id: 'label', label: 'ラベル' },
  ],
};

const actionTypeDocs = {
  postback: {
    url: 'https://developers.line.biz/ja/reference/messaging-api/#postback-action',
    text: 'ポストバックアクションについての詳細はこちら',
  },
  message: {
    url: 'https://developers.line.biz/ja/reference/messaging-api/#message-action',
    text: 'メッセージアクションについての詳細はこちら',
  },
  uri: {
    url: 'https://developers.line.biz/ja/reference/messaging-api/#uri-action',
    text: 'URIアクションについての詳細はこちら',
  },
  datetimepicker: {
    url: 'https://developers.line.biz/ja/reference/messaging-api/#datetime-picker-action',
    text: '日時選択アクションについての詳細はこちら',
  },
  switchRichMenu: {
    url: 'https://developers.line.biz/ja/reference/messaging-api/#richmenu-switch-action',
    text: 'リッチメニュー切替アクションについての詳細はこちら',
  },
  clipboard: {
    url: 'https://developers.line.biz/ja/reference/messaging-api/#clipboard-action',
    text: 'クリップボードアクションについての詳細はこちら',
  },
};

const AreaFields = {
  props: {
    areas: Array,
    errors: Object,
    handleImageChange: Function,
  },
  emits: ['update:actionType', 'update:actionField', 'update:boundsField'],

  setup() {
    const actionTypeFields = actionTypeFieldsMaster;
    const actionTypes = [
      { value: 'postback', label: 'ポストバック' },
      { value: 'message', label: 'メッセージ' },
      { value: 'uri', label: 'URI' },
      { value: 'datetimepicker', label: '日時選択' },
      { value: 'switchRichMenu', label: 'リッチメニュー切替' },
      { value: 'clipboard', label: 'クリップボード' },
    ];

    const collapsedStates = ref({});

    function toggleCollapse(index) {
      collapsedStates.value[index] = !collapsedStates.value[index];
    }

    return {
      actionTypeFields,
      actionTypes,
      actionTypeDocs,
      collapsedStates,
      toggleCollapse,
    };
  },

  template: `
    <div v-for="(area, index) in areas" :key="index" class="border p-3 mb-4 rounded">
      <div class="d-flex justify-content-between align-items-center" 
           @click="toggleCollapse(index)"
           style="cursor: pointer;">
        <h5 class="mb-0">エリア {{ String.fromCharCode(65 + index) }}</h5>
        <i class="bi" :class="collapsedStates[index] ? 'bi-chevron-right' : 'bi-chevron-down'"></i>
      </div>

      <div v-show="!collapsedStates[index]">
        <div class="mb-3 mt-3">
          <div class="d-flex align-items-center justify-content-start">
            <label class="form-label mb-0 me-5">アクションタイプ</label>
            <a v-if="actionTypeDocs[area.action.type]" 
               :href="actionTypeDocs[area.action.type].url" 
               target="_blank" 
               class="text-primary small text-decoration-underline">
              {{ actionTypeDocs[area.action.type].text }}
            </a>
          </div>
           <div class="text-muted small my-2">領域がタップされたときに実行されるアクション</div>
          <select class="form-select" :value="area.action.type"  @change="$emit('update:actionType', index, $event.target.value)">
            <option v-for="actionType in actionTypes" :key="actionType.value" :value="actionType.value">{{ actionType.label }}</option>
          </select>
        </div>

        <div class="row">
          <div v-for="(field, i) in actionTypeFields[area.action.type] || []" :key="i" class="col-md-6 mb-3">
            <label class="form-label">{{ field.label }}</label>
            <span v-if="field.required" class="text-danger">*</span>
            
            <select v-if="field.options" 
                    class="form-select" 
                    @change="$emit('update:actionField', index, field.id, $event.target.value)">
              <option v-for="option in field.options" :value="option.value">{{ option.label }}</option>
            </select>

            <input v-else
                  type="text"
                  class="form-control"
                  :placeholder="field.placeholder"
                  :value="area.action[field.id]"
                  @input="$emit('update:actionField', index, field.id, $event.target.value)" />
            <div class="text-danger small">{{ errors.areas[index].action[field.id] }}</div>
          </div>
        </div>

        <div class="row mb-3">
          <div class="col">
            <label class="form-label">x</label>
            <input type="number" class="form-control" :value="area.bounds.x" @input="$emit('update:boundsField', index, 'x', $event.target.value)" />
          </div>
          <div class="col">
            <label class="form-label">y</label>
            <input type="number" class="form-control" :value="area.bounds.y" @input="$emit('update:boundsField', index, 'y', $event.target.value)" />
          </div>
          <div class="col">
            <label class="form-label">width</label>
            <input type="number" class="form-control" :value="area.bounds.width" @input="$emit('update:boundsField', index, 'width', $event.target.value)" />
          </div>
          <div class="col">
            <label class="form-label">height</label>
            <input type="number" class="form-control" :value="area.bounds.height"  @input="$emit('update:boundsField', index, 'height', $event.target.value)" />
          </div>
        </div>
        <div v-if="Object.keys(errors.areas[index].bounds).length > 0" class="text-danger small">{{ errors.areas[index].bounds }}</div>
      </div>
    </div>
  `,
};

const createEmptyFormData = () => {
  return {
    name: '',
    width: '',
    height: '',
    text: '',
    image: null,
    userId: '',
    areas: [
      {
        bounds: {
          x: 0,
          y: 0,
          width: 0,
          height: 0,
        },
        action: {
          type: 'postback',
        },
      },
    ],
  };
};

const richMenuTypeDescriptions = {
  default: '全ユーザーに表示されるリッチメニューです。',
  user: '指定したユーザーIDのみに表示されるリッチメニューです。ユーザー単位のリッチメニューは、デフォルトリッチメニューよりも優先して表示されます。',
};

const CreateRichMenuForm = {
  components: {
    AreaFields,
  },

  setup() {
    const formData = ref(createEmptyFormData());
    const imagePreview = ref('');
    const errors = ref({
      name: '',
      width: '',
      height: '',
      text: '',
      areas: [
        {
          bounds: {},
          action: {},
        },
      ],
    });
    const canvasRef = ref(null);

    const selectedTemplate = ref(null);

    const isFailed = ref(false);

    const isLoading = ref(false);

    const richMenuType = ref('default');

    const templateImages = ref(templateImagesMaster);

    const templateSize = ref('large');

    function createInitialAction(type, index) {
      const fields = actionTypeFieldsMaster[type] || [];

      formData.value.areas[index].action = fields.reduce(
        (acc, field) => {
          if (field.required && Array.isArray(field.options) && field.options.length > 0) {
            acc[field.id] = field.options[0].value;
          }
          return acc;
        },
        { type }
      );
    }

    const canvasHeight = computed(() => {
      if (!selectedTemplate.value) return 180; // デフォルト
      const aspectRatio = selectedTemplate.value.size.height / selectedTemplate.value.size.width;
      return 300 * aspectRatio; // 300px は表示領域の幅
    });

    function drawPreview({ canvas, backgroundImage, userImage, areas }) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // canvasのサイズをプレビュー画面の大きさに合わせる
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;

      // 背景画像を描画
      ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);

      // スケーリング倍率を事前に算出
      const scaleX = canvas.width / backgroundImage.width;
      const scaleY = canvas.height / backgroundImage.height;

      // ユーザー画像がある場合のみ、上書き＋枠・文字を描画
      if (userImage) {
        // ユーザー画像を上から重ねる
        ctx.drawImage(userImage, 0, 0, canvas.width, canvas.height);

        // 枠・文字を描画
        areas.forEach((area, index) => {
          const x = Number(area.bounds.x);
          const y = Number(area.bounds.y);
          const w = Number(area.bounds.width);
          const h = Number(area.bounds.height);

          if ([x, y, w, h].some(v => isNaN(v))) {
            console.warn(`無効な座標が検出されました:`, area.bounds);
            return;
          }

          ctx.strokeStyle = 'green';
          ctx.lineWidth = 2;
          ctx.strokeRect(x * scaleX, y * scaleY, w * scaleX, h * scaleY);

          const centerX = (x + w / 2) * scaleX;
          const centerY = (y + h / 2) * scaleY;

          ctx.fillStyle = 'green';
          ctx.font = '32px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(String.fromCharCode(65 + index), centerX, centerY);
        });
      }
    }

    function selectTemplate(template) {
      selectedTemplate.value = template;
      imagePreview.value = template.imageUrl;
      formData.value.width = template.size.width;
      formData.value.height = template.size.height;
      formData.value.areas = template.areas.map(area => ({
        bounds: {
          x: area.x,
          y: area.y,
          width: area.width,
          height: area.height,
        },
        action: {
          type: 'postback',
        },
      }));

      errors.value.areas = formData.value.areas.map(() => ({
        bounds: {},
        action: {},
      }));

      const canvas = canvasRef.value;
      const background = new Image();
      background.src = template.imageUrl;

      background.onload = () => {
        drawPreview({
          canvas,
          backgroundImage: background,
          userImage: null,
          areas: formData.value.areas,
        });
      };
    }

    async function mergeImages() {
      const canvas = canvasRef.value;

      const background = new Image();
      background.src = selectedTemplate.value.imageUrl;
      await new Promise(resolve => (background.onload = resolve));

      let userImage = null;
      if (formData.value.image) {
        userImage = new Image();
        userImage.src = formData.value.image;
        await new Promise(resolve => (userImage.onload = resolve));
      }

      drawPreview({
        canvas,
        backgroundImage: background,
        userImage,
        areas: formData.value.areas,
      });
    }

    let drawTimeout;
    watch(
      () => formData.value.areas,
      () => {
        clearTimeout(drawTimeout);
        drawTimeout = setTimeout(() => {
          mergeImages();
        }, 200);
      },
      { deep: true }
    );

    function handleImageChange(e) {
      const file = e.target.files[0];
      //画像をbase64に変換
      if (file) {
        const reader = new FileReader();
        reader.onload = evt => {
          formData.value.image = evt.target.result;
          mergeImages(); // 再描画
        };
        reader.readAsDataURL(file);
      }
    }

    function validateField(field, value) {
      switch (field) {
        case 'name':
          if (!value) {
            errors.value.name = 'リッチメニュー名は必須です';
            return false;
          }
          errors.value.name = '';
          return true;
        case 'width':
          if (!value || isNaN(value) || value <= 0) {
            errors.value.width = '有効な幅を入力してください';
            return false;
          }
          errors.value.width = '';
          return true;
        case 'height':
          if (!value || isNaN(value)) {
            errors.value.height = '有効な高さを入力してください';
            return false;
          }
          errors.value.height = '';
          return true;
        case 'text':
          if (!value) {
            errors.value.text = '表示文言は必須です';
            return false;
          }
          errors.value.text = '';
          return true;
        case 'image':
          if (!value) {
            errors.value.image = '画像は必須です';
            return false;
          }
          errors.value.image = '';
          return true;
        default:
          return true;
      }
    }

    function validateActionFields() {
      let isValid = true;

      // errorsオブジェクトを初期化
      errors.value.areas = formData.value.areas.map(() => ({
        bounds: {},
        action: {},
      }));

      formData.value.areas.forEach((area, index) => {
        const actionFields = actionTypeFieldsMaster[area.action.type] || [];

        // actionFieldのバリデーション
        actionFields.forEach(field => {
          if (field.required && !area.action[field.id]) {
            errors.value.areas[index].action[field.id] = `${field.label}は必須です`;
            isValid = false;
          }
        });
      });
      return isValid;
    }

    function validateBoundsFields() {
      let isValid = true;
      formData.value.areas.forEach((area, index) => {
        const { x, y, width, height } = area.bounds;
        if (
          x === '' ||
          y === '' ||
          width === '' ||
          height === '' ||
          isNaN(Number(x)) ||
          isNaN(Number(y)) ||
          isNaN(Number(width)) ||
          isNaN(Number(height))
        ) {
          errors.value.areas[index].bounds = '座標は数値で入力してください';
          isValid = false;
        }
      });
      return isValid;
    }

    function validateForm() {
      let isValid = true;
      for (const [field, value] of Object.entries(formData.value)) {
        if (!validateField(field, value)) {
          isValid = false;
        }
      }

      if (!validateActionFields()) {
        isValid = false;
      }

      if (!validateBoundsFields()) {
        isValid = false;
      }
      console.log('formData', formData.value);
      console.log('errors', errors.value);

      return isValid;
    }

    function generateRichMenuJson() {
      return {
        size: {
          width: Number(formData.value.width),
          height: Number(formData.value.height),
        },
        selected: richMenuType.value === 'default',
        name: formData.value.name,
        chatBarText: formData.value.text,
        areas: formData.value.areas.map(area => {
          const eventTypeValue = area.action.type;
          const fields = actionTypeFieldsMaster[eventTypeValue] || [];

          const actionData = fields.reduce((acc, field) => {
            if (area.action[field.id]) {
              acc[field.id] = area.action[field.id];
            }
            return acc;
          }, {});

          return {
            bounds: {
              x: Number(area.bounds.x),
              y: Number(area.bounds.y),
              width: Number(area.bounds.width),
              height: Number(area.bounds.height),
            },
            action: {
              type: eventTypeValue,
              ...actionData,
            },
          };
        }),
      };
    }

    //画像のサイズを縮小してbase64に変換
    function convertToJpegBase64(dataUrl, quality = 0.8) {
      return new Promise(resolve => {
        const img = new Image();
        img.src = dataUrl;

        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);

          //  png → jpeg変換
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
      });
    }

    async function postJSON(richMenuJson, userIds) {
      try {
        const resizedImage = await convertToJpegBase64(formData.value.image);
        const base64Image = resizedImage.replace(/^data:image\/\w+;base64,/, '');

        const action =
          richMenuType.value === 'default' ? 'setDefaultLineRichMenu' : 'setUserLineRichMenu';

        const payload = {
          richMenuJson,
          base64Image,
          userIds,
          action,
        };

        const res = await fetch(CREATE_RICH_MENU_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          isFailed.value = true;
          throw new Error('Failed to create rich menu');
        }

        isFailed.value = false;
        return await res.json();
      } catch (error) {
        console.error('Error:', error);
        throw new Error('Failed to create rich menu');
      }
    }

    function goToListPage(isMutation, methodType) {
      if (isMutation) {
        window.location.href = `https://${PUBLIC_SITES_DOMAIN}/line_rich_menu_management_screen/rich-menu-list-page/index.html?methodType=${methodType}`;
      } else {
        window.location.href = `https://${PUBLIC_SITES_DOMAIN}/line_rich_menu_management_screen/rich-menu-list-page/index.html`;
      }
    }

    async function handleSubmit() {
      if (!validateForm()) {
        return;
      }

      isLoading.value = true;
      try {
        const richMenuJson = generateRichMenuJson();
        const userIds = formData.value.userId
          ? formData.value.userId
              .split('\n')
              .map(id => id.trim())
              .filter(id => id !== '')
          : [];
        await postJSON(richMenuJson, userIds);

        formData.value = createEmptyFormData();
        goToListPage(true, 'createRichMenu');
      } catch (error) {
        console.error('Error:', error);
        throw new Error('Failed to create rich menu');
      } finally {
        isLoading.value = false;
      }
    }

    return {
      formData,
      errors,
      imagePreview,
      canvasRef,
      selectedTemplate,
      isFailed,
      isLoading,
      richMenuType,
      templateImages,
      canvasHeight,
      templateSize,
      richMenuTypeDescriptions,
      handleImageChange,
      validateField,
      validateActionFields,
      validateBoundsFields,
      validateForm,
      handleSubmit,
      selectTemplate,
      mergeImages,
      createInitialAction,
      goToListPage,
    };
  },
  template: `
    <div class="mb-4">
      <label class="form-label">リッチメニュータイプ</label>
      <select class="form-select" v-model="richMenuType">
        <option value="default">デフォルトリッチメニュー</option>
        <option value="user">ユーザー単位のリッチメニュー</option>
      </select>
      <small class="form-text text-muted mt-1">{{ richMenuTypeDescriptions[richMenuType] }}</small>
    </div>


    <div class="mb-4">
      <div class="d-flex align-items-center gap-2">
        <label class="form-label mb-0">
          リッチメニュー名 <span class="text-danger">*</span>
        </label>
        <div class="text-muted small">ユーザーには表示されません。リッチメニューの管理に役立ちます。</div>
      </div>
      <input type="text" class="form-control" v-model="formData.name" placeholder="例: サンプルメニュー"  @input="validateField('name', formData.name)"/>
      <div class="text-danger small">{{ errors.name }}</div>
    </div>

    <div class="mb-4">
      <div class="d-flex align-items-center gap-2">
        <label class="form-label mb-0">
          テキスト <span class="text-danger">*</span>
        </label>
        <div class="text-muted small">トークルームメニューに表示されるテキストです。</div>
      </div>
      <input type="text" class="form-control" v-model="formData.text" @input="validateField('text', formData.text)" />
      <div class="text-danger small">{{ errors.text }}</div>
    </div>

    <div class="mb-3">
      <label class="form-label">リッチメニューサイズ</label>
      <select class="form-select" v-model="templateSize">
        <option value="large">大</option>
        <option value="compact">小</option>
      </select>
    </div>

    <div class="d-flex ms-3 flex-wrap">
      <div 
        v-for="(template, index) in templateImages[templateSize]" 
        :key="index"
        @click="selectTemplate(template)"
        class="template-item m-2 p-1 border rounded"
        :class="{ 'border-primary': selectedTemplate?.name === template.name }"
        style="cursor: pointer;"
      >
        <img :src="template.imageUrl" style="width: 150px; height: auto;" />
        <div class="text-center mt-1">{{ template.name }}</div>
      </div>
    </div>
   
    <div v-if="selectedTemplate" class="mt-3 ms-5 d-flex align-items-end gap-2">
      <div class="flex-grow-1" style="max-width: 300px;">
        <label class="form-label">画像を選択</label>
        <input type="file" class="form-control" accept="image/*"
               @change="handleImageChange($event, index)" />
        <div class="text-danger small">{{ errors.image }}</div>
      </div>
      <div class="d-flex gap-2 ms-auto">
        <div class="mb-3">
          <div class="form-text">
            幅: {{ formData.width }} px / 高さ: {{ formData.height }} px  
            <br>
            ※このサイズはレイアウトの基準であり、実際の表示はデバイスに応じて縮小されます。
          </div>
        </div>
      </div>
    </div>

    <div class="row">
      <!-- プレビュー画面 -->
      <div class="col-md-4">
        <div class="d-flex justify-content-center my-5">
          <div class="border rounded-4 shadow d-flex flex-column bg-white" 
               style="width: 300px; height: 560px;">
            <!-- ヘッダー -->
            <div class="bg-success text-white text-center fw-bold py-2 rounded-top-4">
              LINE トーク画面
            </div>

            <!-- トークエリア -->
            <div class="flex-grow-1 bg-white">
              <!-- ダミーのトークエリア -->
              <div class="h-100 d-flex align-items-center justify-content-center text-muted">
              </div>
            </div>

            <!-- リッチメニュー (canvas) -->
            <div 
              class="bg-white w-100 d-flex align-items-center justify-content-center" 
              :style="{ height: canvasHeight + 'px' }"
            >
              <canvas 
                id="richMenuCanvas" 
                ref="canvasRef" 
                style="width: 100%; height: 100%; display: block; object-fit: contain; max-width: 100%;"
              ></canvas>
            </div>


            <!-- 表示文言 -->
            <div class="bg-white text-center py-2">
              {{ formData.text }}
            </div>
          </div>
        </div>
      </div>

      <!-- エリアフィールド -->
      <div class="col-md-8">
        <div class="mb-3 mt-3" v-if="formData.areas.length > 0">  
          <area-fields 
            :key="selectedTemplate?.name"
            :areas="formData.areas"
            :errors="errors"
            @update:actionField="(index, id, value) => {
              formData.areas[index].action[id] = value;
              validateActionFields();
            }"
            @update:actionType="(index, value) => {
              formData.areas[index].action.type = value;
              createInitialAction(value, index)
            }" 
            @update:boundsField="(index, id, value) => {
              formData.areas[index].bounds[id] = value;
              validateBoundsFields();
            }"
          />
        </div>
      </div>
    </div>

    <div v-if="richMenuType === 'user'" class="mb-3">
      <label class="form-label">ユーザーID（ユーザー単位のリッチメニューを作成する場合）</label>
      <textarea class="form-control" v-model="formData.userId" rows="3"
                placeholder="複数ユーザーは1行ずつ入力してください"></textarea>
    </div>

    <div v-if="selectedTemplate" class="mb-3 w-25 mx-auto">
      <button class="btn btn-success w-100" @click="handleSubmit" :disabled="isLoading">
        <span v-if="isLoading" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
        {{ isLoading ? '作成中...' : '作成' }}
      </button>
      <div v-if="isFailed" class="text-danger mt-2">リッチメニューの作成に失敗しました</div>
    </div>
  `,
};

const app = createApp({
  components: {
    CreateRichMenuForm,
  },
  setup() {
    const listPageUrl = `https://${PUBLIC_SITES_DOMAIN}/line_rich_menu_management_screen/rich-menu-list-page/index.html`;
    return {
      listPageUrl,
    };
  },
});
app.mount('#app');

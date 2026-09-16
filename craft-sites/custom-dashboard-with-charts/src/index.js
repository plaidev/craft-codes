import { dummyComponents } from './dummy.js';

// Craft FunctionsのエンドポイントURLを指定します
const CRAFT_FUNCTIONS_ENDPOINT = 'https://xxx.yyy.karte.io/functions/zzz';

// 対象のcomponent設定を指定します。特にcomponent_idは、HTML上のid属性およびDatahubクエリで抽出したcomponent_idと一致させてください
const COMPONENT_SETTINGS = [
  { component_id: 'avg_satisfaction_level' },
  { component_id: 'satisfaction_level', seriesName: '満足度' },
  { component_id: 'reason_for_purchasing', seriesName: '購入理由' },
  { component_id: 'other_reason_for_purchasing' },
];
// デモ用のダミーデータを表示する場合はtrueを、実際のデータを表示するにはfalseを指定します
const SHOW_DUMMY_DATA = true;

const CHART_CLASS_NAME = '_chart';
const UPDATED_AT_CLASS_NAME = '_updated-at';
const ERROR_MESSAGE =
  'データの取得に失敗しました。もう一度画面を更新しても改善しなければ、管理者までご連絡ください。';

await main();

async function main() {
  if (SHOW_DUMMY_DATA) {
    setLoading(false);
    showComponents(dummyComponents);
    return;
  }

  const componentIds = COMPONENT_SETTINGS.map(c => c.component_id);
  const d = await fetchComponents(CRAFT_FUNCTIONS_END_POINT, componentIds);
  setLoading(false);

  if (!d || !d.components) {
    setErrorMsg(ERROR_MESSAGE);
    return;
  }
  showComponents(d.components);
}

function showComponents(components) {
  const cs = preprocessComponents(components);
  console.log(`[custom dashboard] components: ${JSON.stringify(cs)}`);

  cs.forEach(c => {
    switch (c.type) {
      case 'bignum':
        initBignum(c.component_id, c.data, c.updated_at_f);
        break;
      case 'pie':
        initPie(c.component_id, c.data, c.updated_at_f, c.seriesName);
        break;
      case 'bar':
        initBar(c.component_id, c.data, c.updated_at_f, c.seriesName);
        break;
      case 'table':
        initTable(c.component_id, c.data, c.updated_at_f);
        break;
      default:
        console.error(`[custom dashboard] invalid type: ${c.type}`);
        break;
    }
  });
}

function preprocessComponents(components) {
  return components.map(c => {
    // series名の設定を挿入
    const cs = COMPONENT_SETTINGS.find(cs => cs.component_id === c.component_id);
    c.seriesName = cs.seriesName || null;

    // 更新日を変換
    c.updated_at_f = new Date(Number(c.updated_at)).toLocaleString();

    return c;
  });
}

async function fetchComponents(url, componentIds) {
  try {
    // Craft Functionsのエンドポイントから表示用データを取得
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ componentIds }),
    });

    if (!res.ok) {
      const err = await res.text();
      const errMsg = `fetch error. status: ${res.status}, error: ${err}`;
      throw new Error(errMsg);
    }

    // Craft Functionsから受け取った結果を表示
    const components = await res.json();
    return components;
  } catch (err) {
    console.error(`[fetchComponents] error: ${err}`);
    return null;
  }
}

function initBignum(id, data, updatedAt) {
  const el = document.querySelector(`#${id} .${CHART_CLASS_NAME} div`);
  el.textContent = data;

  // 更新日の表示
  insertUpdateDate(id, updatedAt);
}

function initTable(id, data, updatedAt) {
  // data例: [ { "answer": "デザインが良かった", "count": "42" } ]

  // フィールド名の一覧
  // 例: ["answer", "count"]
  const columns = Object.keys(data[0]);

  // レコード群
  // 例: ["デザインが良かった", "42"]
  const rows = data.map(d => columns.map(c => d[c]));

  const el = document.querySelector(`#${id} .${CHART_CLASS_NAME}`);
  new gridjs.Grid({
    columns,
    data: rows,
    sort: true,
  }).render(el);

  // 更新日の表示
  insertUpdateDate(id, updatedAt);
}

function initEchart(id, option, updatedAt) {
  // chartの初期化
  const cEl = document.querySelector(`#${id} .${CHART_CLASS_NAME}`);
  const chart = echarts.init(cEl);
  chart.setOption(option);

  // 更新日の表示
  insertUpdateDate(id, updatedAt);
}

function initPie(id, data, updatedAt, seriesName) {
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b} : {c} ({d}%)',
    },
    series: [
      {
        name: seriesName,
        type: 'pie',
        radius: ['40%', '70%'],
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2,
        },
        data,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)',
          },
        },
      },
    ],
  };
  initEchart(id, option, updatedAt);
}

function initBar(id, data, updatedAt, seriesName) {
  const xArray = [];
  const yArray = [];
  data.forEach(d => {
    xArray.push(d.x);
    yArray.push(d.y);
  });
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'value',
      boundaryGap: [0, 0.01],
    },
    yAxis: {
      type: 'category',
      inverse: true,
      data: xArray,
    },
    series: [
      {
        name: seriesName,
        type: 'bar',
        data: yArray,
      },
    ],
  };
  initEchart(id, option, updatedAt);
}

function insertUpdateDate(id, updatedAt) {
  const uEl = document.querySelector(`#${id} .${UPDATED_AT_CLASS_NAME}`);
  uEl.textContent = `${updatedAt} 更新`;
}

function setLoading(isLoading) {
  const el = document.getElementById('loading');
  el.style.display = isLoading ? '' : 'none';
}
function setErrorMsg(msg) {
  const el = document.getElementById('error');
  el.textContent = msg;
}

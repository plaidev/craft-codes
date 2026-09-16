export function toggleLoading(isLoading) {
  const btn = document.getElementById('submit');
  if (isLoading) {
    btn.classList.add('is-loading');
  } else {
    btn.classList.remove('is-loading');
  }
}

export function validateBody(body) {
  if (!body.user_id) return 'user_idが空です';
  if (!body.event_name) return 'event_nameが空です';
  try {
    JSON.parse(body.values);
  } catch (e) {
    return 'valuesのJSONが不正です';
  }
  return null;
}

export function sendEvent(body, cb) {
  const options = {
    method: 'POST',
    mode: 'no-cors',
    body: JSON.stringify(body),
  };
  fetch(FUNCTION_ENDPOINT, options)
    .then(response => {
      cb({ result: 'イベントが送信されました' });
    })
    .catch(error => {
      console.error('Error:', error);
      cb({ error: '送信に失敗しました' });
    });
}

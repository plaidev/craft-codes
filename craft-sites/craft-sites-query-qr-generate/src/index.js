// QRコードの遷移先として実際に指定したいURL形式に書き換えてください
const TEMPLATE_URL = 'https://example.com/?q={{code}}';

function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

function generateUrlWithCode(templateUrl, code) {
  return templateUrl.replace('{{code}}', code);
}

function generateQRCode() {
  const code = getQueryParam('code');
  const codeNameElement = document.querySelector('.code-name');
  const qrcodeElement = document.querySelector('.qrcode');

  if (code) {
    const url = generateUrlWithCode(TEMPLATE_URL, code);
    codeNameElement.innerText = `コード: ${code}`;
    new QRCode(qrcodeElement, url);
  } else {
    codeNameElement.innerText = 'コードが見つかりません。';
    qrcodeElement.innerHTML = '';
  }
}

document.addEventListener('DOMContentLoaded', generateQRCode);

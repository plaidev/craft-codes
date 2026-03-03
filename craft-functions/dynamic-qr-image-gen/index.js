import qrcode from 'qrcode';

const LOG_LEVEL = '<% LOG_LEVEL %>';
const IMAGE_TYPE = '<% IMAGE_TYPE %>';
const QR_MARGIN = Number('<% QR_MARGIN %>');
const DOT_SCALE = Number('<% DOT_SCALE %>');
const DOT_COLOR = '<% DOT_COLOR %>';
const BACK_COLOR = '<% BACK_COLOR %>';

export default async function (data, { MODULES }) {
  const { initLogger } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });
  const { req, res } = data;

  // バリデーション
  const errors = [];

  // IMAGE_TYPE: png, jpeg, webpのどれか
  const validTypes = ['png', 'jpeg', 'webp'];
  if (!validTypes.includes(IMAGE_TYPE)) {
    errors.push(`Invalid IMAGE_TYPE: ${IMAGE_TYPE}. Must be one of: ${validTypes.join(', ')}`);
  }

  // QR_MARGIN: 数値（0〜10の整数）
  if (!Number.isInteger(QR_MARGIN) || QR_MARGIN < 0 || QR_MARGIN > 10) {
    errors.push(`Invalid QR_MARGIN: ${QR_MARGIN}. Must be an integer between 0 and 50`);
  }

  // DOT_SCALE: 数値（1〜20の整数）
  if (!Number.isInteger(DOT_SCALE) || DOT_SCALE < 1 || DOT_SCALE > 20) {
    errors.push(`Invalid DOT_SCALE: ${DOT_SCALE}. Must be an integer between 1 and 100`);
  }

  // DOT_COLOR: 16進数カラーコード
  const hexColorPattern = /^#[0-9A-Fa-f]{6}$/;
  if (!hexColorPattern.test(DOT_COLOR)) {
    errors.push(`Invalid DOT_COLOR: ${DOT_COLOR}. Must be a hex color code (e.g., #000000)`);
  }

  // BACK_COLOR: 16進数カラーコード
  if (!hexColorPattern.test(BACK_COLOR)) {
    errors.push(`Invalid BACK_COLOR: ${BACK_COLOR}. Must be a hex color code (e.g., #FFFFFF)`);
  }

  // バリデーションチェックでエラーがある場合
  if (errors.length > 0) {
    logger.error('Configuration validation failed', { errors });
    res.status(400).send(`Configuration error: ${errors.join('; ')}`);
    return;
  }

  // targetの存在有無
  const targetText = req.query.target;
  const MAX_TEXT_LENGTH = 500;

  if (!targetText || !targetText.trim() || targetText.length > MAX_TEXT_LENGTH) {
    logger.error('Invalid target parameter', { length: targetText?.length });
    res
      .status(400)
      .send(`target parameter is required and must be ${MAX_TEXT_LENGTH} characters or less`);
    return;
  }

  try {
    const imageBuffer = await qrcode.toBuffer(targetText, {
      type: IMAGE_TYPE, // 出力形式
      margin: QR_MARGIN, // QRコードの周囲の余白
      scale: DOT_SCALE, // 1ドットあたりのピクセル数
      color: {
        dark: DOT_COLOR, // ドットの色
        light: BACK_COLOR, // 背景の色
      },
    });

    res.setHeader('Content-Type', `image/${IMAGE_TYPE}`);
    res.status(200).send(imageBuffer);
  } catch (error) {
    logger.error('Image fetch failed', error);
    res.status(500).send('Failed to generate QR code');
  }
}

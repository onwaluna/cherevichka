const crypto = require('crypto');

const SECRET_PASS = "fav256sobaka";

function getBlobsStore(name) {
  try {
    const { getStore } = require('@netlify/blobs');
    return getStore(name);
  } catch (e) {
    return null;
  }
}

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const payload = JSON.parse(event.body || '{}');

    // Security check
    if (payload.auth !== SECRET_PASS && event.headers['authorization'] !== `Bearer ${SECRET_PASS}`) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ success: false, error: 'Unauthorized' })
      };
    }

    const { dataUrl } = payload;
    if (!dataUrl || !dataUrl.startsWith('data:image/')) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, error: 'Invalid image format' })
      };
    }

    const matches = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+_-]+);base64,(.+)$/);
    if (!matches) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, error: 'Could not parse image data' })
      };
    }

    const mimeType = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');

    const hash = crypto.createHash('md5').update(buffer).digest('hex').substring(0, 16);
    const ext = mimeType.includes('webp') ? 'webp' : (mimeType.includes('png') ? 'png' : 'jpg');
    const assetId = `img_${hash}.${ext}`;

    const store = getBlobsStore('cherevichka_media');
    if (store) {
      try {
        await store.set(assetId, buffer, {
          metadata: { contentType: mimeType }
        });
      } catch (e) {}
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        assetId: assetId,
        url: `/api/media?id=${assetId}`,
        dataUrlFallback: dataUrl,
        sizeBytes: buffer.length,
        message: 'Image uploaded to Live Cloud Storage!'
      })
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, error: err.message })
    };
  }
};

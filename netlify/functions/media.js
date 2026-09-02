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
  const assetId = event.queryStringParameters && event.queryStringParameters.id;

  if (!assetId) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'text/plain' },
      body: 'Missing image id'
    };
  }

  try {
    const store = getBlobsStore('cherevichka_media');
    if (!store) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'text/plain' },
        body: 'Storage not available'
      };
    }

    const blob = await store.get(assetId, { type: 'arrayBuffer' });
    if (!blob) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'text/plain' },
        body: 'Image not found'
      };
    }

    const buffer = Buffer.from(blob);
    const isPng = assetId.endsWith('.png');
    const isWebp = assetId.endsWith('.webp');
    const mimeType = isWebp ? 'image/webp' : (isPng ? 'image/png' : 'image/jpeg');

    return {
      statusCode: 200,
      headers: {
        'Content-Type': mimeType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*'
      },
      body: buffer.toString('base64'),
      isBase64Encoded: true
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'text/plain' },
      body: `Error: ${err.message}`
    };
  }
};

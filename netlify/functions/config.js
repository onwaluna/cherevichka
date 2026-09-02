const SECRET_PASS = "fav256sobaka";

let memoryConfigStore = null;

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
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const store = getBlobsStore('cherevichka_config');

  // 1. GET: Return Live Config for all devices
  if (event.httpMethod === 'GET') {
    try {
      let data = null;
      if (store) {
        try { data = await store.get('live_config', { type: 'json' }); } catch (e) {}
      }
      if (!data && memoryConfigStore) {
        data = memoryConfigStore;
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          source: data ? 'cloud_store' : 'defaults',
          config: data || null
        })
      };
    } catch (err) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          source: 'fallback',
          config: memoryConfigStore || null
        })
      };
    }
  }

  // 2. POST: Save and publish Live Config for all devices
  if (event.httpMethod === 'POST') {
    try {
      const payload = JSON.parse(event.body || '{}');

      // Password Auth Check
      if (payload.auth !== SECRET_PASS && event.headers['authorization'] !== `Bearer ${SECRET_PASS}`) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ success: false, error: 'Unauthorized' })
        };
      }

      const configToSave = {
        designPanels: payload.designPanels || null,
        spots: payload.spots || null,
        colors: payload.colors || null,
        fonts: payload.fonts || null,
        i18n: payload.i18n || null,
        updatedAt: new Date().toISOString()
      };

      memoryConfigStore = configToSave;

      if (store) {
        try { await store.setJSON('live_config', configToSave); } catch (e) {}
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'Published to Live Production for all devices globally!',
          updatedAt: configToSave.updatedAt
        })
      };
    } catch (err) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ success: false, error: err.message })
      };
    }
  }

  return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
};

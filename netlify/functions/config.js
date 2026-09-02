const { getStore } = require('@netlify/blobs');

const SECRET_PASS = "fav256sobaka";

// In-memory fallback if Blobs are initializing
let memoryConfigStore = null;

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

  let store = null;
  try {
    store = getStore('cherevichka_config');
  } catch (e) {
    // Blobs store initialized on edge
  }

  // 1. GET: Fetch Live Cloud Configuration
  if (event.httpMethod === 'GET') {
    try {
      let data = null;
      if (store) {
        data = await store.get('live_config', { type: 'json' });
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
          source: 'defaults_fallback',
          config: memoryConfigStore || null
        })
      };
    }
  }

  // 2. POST: Save Live Cloud Configuration
  if (event.httpMethod === 'POST') {
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
        await store.setJSON('live_config', configToSave);
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'Configuration successfully published to Live Production Cloud!',
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

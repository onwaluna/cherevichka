const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_PASS = "fav256sobaka";

const DATA_DIR = path.join(__dirname, 'data');
const UPLOADS_DIR = path.join(__dirname, 'assets', 'images', 'uploads');
const CONFIG_FILE = path.join(DATA_DIR, 'live_config.json');
const LEADS_FILE = path.join(DATA_DIR, 'leads.json');

// Ensure necessary directories exist
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// Middlewares
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Helper: load initial config
function loadLiveConfig() {
  if (fs.existsSync(CONFIG_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    } catch (e) {
      console.error('Error reading live_config.json:', e);
    }
  }
  return null;
}

// 1. Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'CHEREVICHKA Standalone Production Server',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// 2. GET /api/config — Get centralized live configuration
app.get('/api/config', (req, res) => {
  const config = loadLiveConfig();
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.json({
    success: true,
    source: config ? 'disk_store' : 'defaults',
    config: config
  });
});

// 3. POST /api/config — Save centralized live configuration
app.post('/api/config', (req, res) => {
  const { auth, designPanels, spots, colors, fonts, i18n } = req.body;

  if (auth !== SECRET_PASS && req.headers['authorization'] !== `Bearer ${SECRET_PASS}`) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  const currentConfig = loadLiveConfig() || {};
  const updatedConfig = {
    ...currentConfig,
    ...(designPanels ? { designPanels } : {}),
    ...(spots ? { spots } : {}),
    ...(colors ? { colors } : {}),
    ...(fonts ? { fonts } : {}),
    ...(i18n ? { i18n } : {}),
    updatedAt: new Date().toISOString()
  };

  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(updatedConfig, null, 2), 'utf8');
    console.log(`[CONFIG] Updated live_config.json at ${updatedConfig.updatedAt}`);
    res.json({
      success: true,
      message: 'Configuration permanently saved to server disk and published globally!',
      updatedAt: updatedConfig.updatedAt
    });
  } catch (err) {
    console.error('Error saving config to disk:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. POST /api/upload — Save uploaded image directly to server disk
app.post('/api/upload', (req, res) => {
  const { auth, dataUrl, filename } = req.body;

  if (auth !== SECRET_PASS && req.headers['authorization'] !== `Bearer ${SECRET_PASS}`) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  if (!dataUrl || !dataUrl.startsWith('data:image/')) {
    return res.status(400).json({ success: false, error: 'Invalid dataUrl image format' });
  }

  try {
    const matches = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+_-]+);base64,(.+)$/);
    if (!matches) {
      return res.status(400).json({ success: false, error: 'Could not parse base64 image data' });
    }

    const mimeType = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');

    const hash = crypto.createHash('md5').update(buffer).digest('hex').substring(0, 16);
    const ext = mimeType.includes('webp') ? 'webp' : (mimeType.includes('png') ? 'png' : 'jpg');
    const assetFilename = `img_${hash}.${ext}`;
    const filePath = path.join(UPLOADS_DIR, assetFilename);

    fs.writeFileSync(filePath, buffer);
    const publicUrl = `/assets/images/uploads/${assetFilename}`;

    console.log(`[UPLOAD] Saved new image: ${publicUrl} (${buffer.length} bytes)`);
    res.json({
      success: true,
      assetId: assetFilename,
      url: publicUrl,
      sizeBytes: buffer.length,
      message: 'Image permanently saved to server disk!'
    });
  } catch (err) {
    console.error('Error writing uploaded file:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Leads handling (POST /api/leads & GET /api/leads)
app.get('/api/leads', (req, res) => {
  if (req.headers['authorization'] !== `Bearer ${SECRET_PASS}` && req.query.auth !== SECRET_PASS) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }
  let leads = [];
  if (fs.existsSync(LEADS_FILE)) {
    try { leads = JSON.parse(fs.readFileSync(LEADS_FILE, 'utf8')); } catch (e) {}
  }
  res.json({ success: true, leads });
});

app.post('/api/leads', (req, res) => {
  const leadData = req.body;
  if (!leadData || !leadData.storeName) {
    return res.status(400).json({ success: false, error: 'Missing store details' });
  }

  let leads = [];
  if (fs.existsSync(LEADS_FILE)) {
    try { leads = JSON.parse(fs.readFileSync(LEADS_FILE, 'utf8')); } catch (e) {}
  }

  const newLead = {
    id: 'lead-' + Date.now(),
    date: new Date().toISOString().split('T')[0],
    status: 'pending',
    ...leadData
  };

  leads.unshift(newLead);
  fs.writeFileSync(LEADS_FILE, JSON.stringify(leads, null, 2), 'utf8');

  res.json({ success: true, message: 'Lead submitted successfully', leadId: newLead.id });
});

// 6. Serve static files with proper cache control
app.use(express.static(path.join(__dirname), {
  setHeaders: (res, pathUrl) => {
    if (pathUrl.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    } else if (pathUrl.includes('/assets/images/uploads/')) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
  }
}));

// Fallback to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`=======================================================`);
  console.log(`🚀 CHEREVICHKA Server running at http://0.0.0.0:${PORT}`);
  console.log(`📁 Static files root: ${__dirname}`);
  console.log(`📂 Uploads directory: ${UPLOADS_DIR}`);
  console.log(`⚙️  API endpoints active: /api/config, /api/upload, /api/leads`);
  console.log(`=======================================================`);
});

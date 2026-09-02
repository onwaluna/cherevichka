import { I18N as DEFAULT_I18N, SPOTS_DATA as DEFAULT_SPOTS, WALKING_TOURS, COUNTRY_SURVIVAL_GUIDES } from './data/spots.js';

const SECRET_FOUNDER_PASS = "fav256sobaka";

/* ==========================================================================
   SAFE PROTOCOL-AGNOSTIC & PRIVATE-MODE STORAGE ADAPTER
   ========================================================================== */

const memoryStore = {};

const safeStorage = {
  get(key) {
    try {
      const val = localStorage.getItem(key);
      if (val !== null) return val;
    } catch (e) {}
    try {
      const sVal = sessionStorage.getItem(key);
      if (sVal !== null) return sVal;
    } catch (e) {}
    return memoryStore[key] || null;
  },
  getJSON(key, fallback) {
    const raw = safeStorage.get(key);
    if (!raw) return fallback;
    try {
      return JSON.parse(raw);
    } catch (e) {
      return fallback;
    }
  },
  set(key, val) {
    try { localStorage.setItem(key, typeof val === 'string' ? val : JSON.stringify(val)); } catch (e) {}
    try { sessionStorage.setItem(key, typeof val === 'string' ? val : JSON.stringify(val)); } catch (e) {}
    memoryStore[key] = typeof val === 'string' ? val : JSON.stringify(val);
  },
  remove(key) {
    try { localStorage.removeItem(key); } catch (e) {}
    try { sessionStorage.removeItem(key); } catch (e) {}
    delete memoryStore[key];
  }
};

/* ==========================================================================
   STATE MANAGEMENT
   ========================================================================== */

const state = {
  unlocked: safeStorage.get('cherevichka_admin_auth') === SECRET_FOUNDER_PASS,
  activeSection: 'secSpots',
  editorLang: 'en',      // 'en' | 'ru' | 'zh'
  textLang: 'en',        // 'en' | 'ru' | 'zh'
  editingSpotId: null,   // null = creating new, string = editing existing
  spots: safeStorage.getJSON('cherevichka_custom_spots', JSON.parse(JSON.stringify(DEFAULT_SPOTS))),
  i18n: safeStorage.getJSON('cherevichka_custom_i18n', JSON.parse(JSON.stringify(DEFAULT_I18N))),
  colors: safeStorage.getJSON('cherevichka_custom_colors', {
    redOchre: '#913731',
    babyBlue: '#B5C8D4',
    bgPrimary: '#FAF7EE',
    textPrimary: '#161413',
    textSecondary: '#57524E'
  }),
  fonts: safeStorage.getJSON('cherevichka_custom_fonts', {
    headerFont: "'Cormorant Garamond', serif",
    bodyFont: "'Plus Jakarta Sans', sans-serif"
  }),
  designPanels: safeStorage.getJSON('cherevichka_design_panels', {
    header: {
      bgImage: '',
      target: 'header'
    },
    hero: {
      bgImage: '',
      overlayOpacity: 45,
      titleColor: '#FFFFFF',
      subtitleColor: '#E5DFC9'
    },
    pillars: {
      clothingImg: 'assets/images/e213de95-ef12-45a0-a0da-362a0f43265f.webp',
      shoesImg: 'assets/images/4d6497c6-bdbf-4d74-864a-ca4b68dfbf7f.webp',
      vintageImg: 'assets/images/ac16aa4c-ae90-4511-81ec-27020e10e49c.webp',
      jewelryImg: 'assets/images/33718ecc-4a03-4871-b1cd-422e7e49b25a.webp'
    },
    manifesto: {
      bgImage: '',
      overlayOpacity: 20
    }
  }),
  leads: safeStorage.getJSON('cherevichka_inbound_leads', [
    {
      id: "sample-lead-1",
      storeName: "Kyoto Indigo Workshop",
      email: "founder@kyoto-indigo.jp",
      city: "japan",
      address: "77-6 Sueyoshicho, Gion, Kyoto, Japan",
      category: "clothing",
      price: "$$",
      description: "Natural hand-dyed indigo kimono jackets and artisan cotton shirts.",
      contact: "@kyotoindigo",
      date: "2026-09-01",
      status: "pending"
    }
  ]),
  currentEditingGallery: []
};

// Temp trilingual buffer during spot editing
let tempSpotLangData = {
  district: { en: '', ru: '', zh: '' },
  curatorNote: { en: '', ru: '', zh: '' },
  howToFind: { en: '', ru: '', zh: '' },
  touristPerk: { en: '', ru: '', zh: '' }
};

/* ==========================================================================
   INITIALIZATION
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  try { setupEventListeners(); } catch (e) { console.error('Error in setupEventListeners:', e); }
  try { renderDashboard(); } catch (e) { console.error('Error in renderDashboard:', e); }
  try { initDesignPanels(); } catch (e) { console.error('Error in initDesignPanels:', e); }
  try { initColorPickers(); } catch (e) { console.error('Error in initColorPickers:', e); }
  try { populateLandingTextInputs(); } catch (e) { console.error('Error in populateLandingTextInputs:', e); }
});

/* ==========================================================================
   AUTH & PIN
   ========================================================================== */

function checkAuth() {
  const lockscreen = document.getElementById('pinLockscreen');
  if (!lockscreen) return;
  if (state.unlocked) {
    lockscreen.classList.add('unlocked');
    lockscreen.style.display = 'none';
  } else {
    lockscreen.classList.remove('unlocked');
    lockscreen.style.display = 'flex';
  }
}

function unlockAdmin() {
  state.unlocked = true;
  safeStorage.set('cherevichka_admin_auth', SECRET_FOUNDER_PASS);
  const lockscreen = document.getElementById('pinLockscreen');
  if (lockscreen) {
    lockscreen.classList.add('unlocked');
    lockscreen.style.display = 'none';
  }
  showToast('Welcome Founder! Studio Access Unlocked.');
}

function handleAdminLogin(e) {
  if (e) e.preventDefault();
  const inp = document.getElementById('pinInput');
  const val = inp ? inp.value.trim() : '';
  if (val === SECRET_FOUNDER_PASS) {
    unlockAdmin();
  } else {
    alert('Access Denied: Incorrect Founder Password.');
    if (inp) {
      inp.value = '';
      inp.focus();
    }
  }
}

function doAdminLogout() {
  state.unlocked = false;
  safeStorage.remove('cherevichka_admin_auth');
  const lockscreen = document.getElementById('pinLockscreen');
  if (lockscreen) {
    lockscreen.classList.remove('unlocked');
    lockscreen.style.display = 'flex';
  }
  const inp = document.getElementById('pinInput');
  if (inp) {
    inp.value = '';
    inp.focus();
  }
}

window.handleAdminLogin = handleAdminLogin;
window.unlockAdmin = unlockAdmin;
window.doAdminLogout = doAdminLogout;

/* ==========================================================================
   DASHBOARD & SPOTS TABLE
   ========================================================================== */

function renderDashboard() {
  // Update Stats
  document.getElementById('statTotalSpots').textContent = state.spots.length;
  document.getElementById('statMskSpots').textContent = state.spots.filter(s => s.city === 'japan').length;
  document.getElementById('statSpbSpots').textContent = state.spots.filter(s => s.city === 'bali').length;
  document.getElementById('statEditorPicks').textContent = state.spots.filter(s => s.editorPick).length;

  const pendingLeads = state.leads.filter(l => l.status === 'pending').length;
  const leadsBadge = document.getElementById('adminLeadsBadge');
  if (leadsBadge) leadsBadge.textContent = pendingLeads;

  renderSpotsTable();
  renderLeadsTable();
}

function renderLeadsTable() {
  const tbody = document.getElementById('adminLeadsTableBody');
  if (!tbody) return;

  const searchQ = (document.getElementById('adminSearchLeads')?.value || '').toLowerCase().trim();
  const filterStatus = document.getElementById('adminFilterLeadsStatus')?.value || 'all';

  const filtered = state.leads.filter(lead => {
    if (filterStatus !== 'all' && lead.status !== filterStatus) return false;
    if (searchQ !== '') {
      const matchName = (lead.storeName || '').toLowerCase().includes(searchQ);
      const matchEmail = (lead.email || '').toLowerCase().includes(searchQ);
      const matchCity = (lead.city || '').toLowerCase().includes(searchQ);
      if (!matchName && !matchEmail && !matchCity) return false;
    }
    return true;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 2rem; color: var(--admin-text-muted);">No inbound applications found.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map((lead) => {
    return `
      <tr>
        <td style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--admin-text-muted);">${lead.date || '—'}</td>
        <td>
          <div style="font-weight: 700;">${lead.storeName}</div>
          <div style="font-size: 0.78rem; color: var(--admin-text-muted); max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${lead.description || '—'}</div>
        </td>
        <td>
          <a href="mailto:${lead.email}" style="font-family: var(--font-mono); font-weight: 700; color: var(--color-red-ochre); text-decoration: underline;">${lead.email}</a>
        </td>
        <td>
          <span style="font-family: var(--font-mono); font-weight: 700; text-transform: uppercase;">${lead.city}</span>
          <div style="font-size: 0.78rem; color: var(--admin-text-muted);">${lead.address || ''}</div>
        </td>
        <td>
          <span class="tag-badge-pill">${lead.category}</span>
          <span style="font-family: var(--font-mono); font-weight: 700; margin-left: 4px;">${lead.price || '$$'}</span>
        </td>
        <td>
          <span style="font-family: var(--font-mono); font-size: 0.8rem;">${lead.contact || '—'}</span>
        </td>
        <td>
          ${lead.status === 'approved' 
            ? `<span class="tag-badge-pill" style="background-color: var(--color-green-light); color: var(--color-green); border-color: var(--color-green);">✓ Approved ($10)</span>` 
            : `<span class="tag-badge-pill" style="background-color: #FFF3CD; color: #856404; border-color: #FFEEBA;">⏳ Pending</span>`}
        </td>
        <td>
          ${lead.status !== 'approved' ? `
            <button class="btn-sidebar-action btn-export-code" style="padding: 0.35rem 0.65rem; font-size: 0.72rem; display: inline-flex;" onclick="window.adminApproveLead('${lead.id}')">
              ✓ Approve & List
            </button>
          ` : ''}
          <button class="action-icon-btn btn-del" onclick="window.adminDeleteLead('${lead.id}')" title="Delete Lead">🗑️</button>
        </td>
      </tr>
    `;
  }).join('');
}

function adminApproveLead(leadId) {
  const lead = state.leads.find(l => l.id === leadId);
  if (!lead) return;

  // Convert lead to live spot
  const newSpot = {
    id: 'spot-' + Date.now(),
    name: lead.storeName,
    cyrillicName: lead.storeName,
    city: lead.city || 'japan',
    cityName: lead.city ? lead.city.toUpperCase() : 'Global',
    district: { en: lead.address || 'Central', ru: lead.address || 'Центр', zh: lead.address || '中心' },
    address: lead.address || '',
    cyrillicAddress: lead.address || '',
    coordinates: [35.6762, 139.6503], // Default coords
    category: lead.category || 'clothing',
    styles: ["avantgarde-upcycle"],
    priceRange: lead.price || '$$',
    editorPick: false,
    englishStaff: { en: 'Fluent', ru: 'Свободный', zh: '流利' },
    payments: ["Credit Cards", "Cash"],
    touristPerk: { en: '5% off with code CHEREVICHKA', ru: 'Скидка 5% по коду CHEREVICHKA', zh: '出示代码享95折' },
    hours: 'Daily 11:00 – 20:00',
    instagram: lead.contact ? (lead.contact.startsWith('@') ? lead.contact : '@' + lead.contact) : '',
    telegram: '',
    website: 'https://cherevichka.com',
    howToFind: { en: lead.address, ru: lead.address, zh: lead.address },
    curatorNote: { en: lead.description || 'Curated independent fashion store.', ru: lead.description || 'Локальный независимый магазин.', zh: lead.description || '独立精选店铺。' },
    tags: [lead.category],
    images: ['https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=1400&q=85']
  };

  lead.status = 'approved';
  state.spots.unshift(newSpot);

  localStorage.setItem('cherevichka_inbound_leads', JSON.stringify(state.leads));
  localStorage.setItem('cherevichka_custom_spots', JSON.stringify(state.spots));

  renderDashboard();
  showToast(`Approved "${lead.storeName}" and added to live website!`);
}

function adminDeleteLead(leadId) {
  if (confirm('Are you sure you want to delete this lead?')) {
    state.leads = state.leads.filter(l => l.id !== leadId);
    localStorage.setItem('cherevichka_inbound_leads', JSON.stringify(state.leads));
    renderDashboard();
    showToast('Application deleted');
  }
}

function exportLeadsCsv() {
  if (state.leads.length === 0) {
    showToast('No leads to export');
    return;
  }

  let csv = 'Date,Store Name,Email,City,Address,Category,Price,Contact,Description,Status\n';
  state.leads.forEach(l => {
    csv += `"${l.date}","${l.storeName}","${l.email}","${l.city}","${l.address}","${l.category}","${l.price}","${l.contact}","${(l.description || '').replace(/"/g, '""')}","${l.status}"\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'cherevichka_leads.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('Downloaded leads as CSV!');
}

function renderSpotsTable() {
  const tbody = document.getElementById('adminSpotsTableBody');
  const searchQ = document.getElementById('adminSearchSpots').value.toLowerCase().trim();
  const filterCity = document.getElementById('adminFilterCity').value;
  const filterCat = document.getElementById('adminFilterCat').value;

  const filtered = state.spots.filter(spot => {
    if (filterCity !== 'all' && spot.city !== filterCity) return false;
    if (filterCat !== 'all' && spot.category !== filterCat) return false;
    if (searchQ !== '') {
      const matchName = spot.name.toLowerCase().includes(searchQ);
      const matchCyr = spot.cyrillicName.toLowerCase().includes(searchQ);
      if (!matchName && !matchCyr) return false;
    }
    return true;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 2rem; color: var(--admin-text-muted);">No spots matching search filter.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map((spot) => {
    const district = typeof spot.district === 'object' ? spot.district.en : spot.district;
    const perk = spot.touristPerk ? (typeof spot.touristPerk === 'object' ? spot.touristPerk.en : spot.touristPerk) : '—';

    return `
      <tr>
        <td>
          <img src="${spot.images[0] || 'https://via.placeholder.com/60'}" class="spot-thumb-mini" alt="${spot.name}">
        </td>
        <td>
          <div style="font-weight: 700;">${spot.name}</div>
          <div style="font-size: 0.78rem; color: var(--admin-text-muted);">${spot.cyrillicName}</div>
        </td>
        <td>
          <span style="text-transform: uppercase; font-family: var(--font-mono); font-size: 0.75rem; font-weight: 700; color: var(--color-red-ochre);">${spot.city}</span>
          <div style="font-size: 0.8rem;">${district}</div>
        </td>
        <td>
          <span class="tag-badge-pill">${spot.category}</span>
        </td>
        <td>
          <span style="font-family: var(--font-mono); font-weight: 700;">${spot.priceRange}</span>
        </td>
        <td>
          <span style="font-size: 0.8rem; color: var(--admin-text-muted);">${perk}</span>
        </td>
        <td>
          ${spot.editorPick ? `<span class="tag-badge-pill pick">★ Editor's Pick</span>` : `<span class="tag-badge-pill">Standard</span>`}
        </td>
        <td>
          <button class="action-icon-btn" onclick="window.adminEditSpot('${spot.id}')" title="Edit Spot">✏️</button>
          <button class="action-icon-btn" onclick="window.adminDuplicateSpot('${spot.id}')" title="Duplicate">📋</button>
          <button class="action-icon-btn btn-del" onclick="window.adminDeleteSpot('${spot.id}')" title="Delete">🗑️</button>
        </td>
      </tr>
    `;
  }).join('');
}

/* ==========================================================================
   SPOT EDITOR (MODAL DRAWER)
   ========================================================================== */

function openSpotEditor(spotId = null) {
  state.editingSpotId = spotId;
  const modal = document.getElementById('spotEditorModal');
  const title = document.getElementById('spotEditorModalTitle');

  state.editorLang = 'en';
  updateSpotEditorLangTabs();

  if (spotId) {
    title.textContent = 'Edit Fashion Spot';
    const spot = state.spots.find(s => s.id === spotId);
    if (!spot) return;

    // Fill basic
    document.getElementById('inpSpotName').value = spot.name || '';
    document.getElementById('inpSpotCyrillicName').value = spot.cyrillicName || '';
    document.getElementById('inpSpotCity').value = spot.city || 'moscow';
    document.getElementById('inpSpotAddress').value = spot.address || '';
    document.getElementById('inpSpotCyrillicAddress').value = spot.cyrillicAddress || '';
    document.getElementById('inpSpotCoords').value = spot.coordinates ? spot.coordinates.join(', ') : '';
    document.getElementById('inpSpotPrice').value = spot.priceRange || '$$';
    document.getElementById('inpSpotCategory').value = spot.category || 'clothing';
    document.getElementById('inpSpotEditorPick').value = spot.editorPick ? 'true' : 'false';

    // Styles checkboxes
    const styles = spot.styles || [];
    document.querySelectorAll('input[name="spotStyles"]').forEach(cb => {
      cb.checked = styles.includes(cb.value);
    });

    // Gallery
    state.currentEditingGallery = [...(spot.images || [])];
    renderGalleryPreviews();

    // Practical
    document.getElementById('inpSpotHours').value = spot.hours || '';
    const engStaff = typeof spot.englishStaff === 'object' ? spot.englishStaff.en : spot.englishStaff;
    document.getElementById('inpSpotEnglishStaff').value = engStaff || 'Good';
    document.getElementById('inpSpotInstagram').value = spot.instagram || '';
    document.getElementById('inpSpotTelegram').value = spot.telegram || '';

    // Trilingual Buffer
    tempSpotLangData = {
      district: typeof spot.district === 'object' ? { ...spot.district } : { en: spot.district || '', ru: spot.district || '', zh: spot.district || '' },
      curatorNote: typeof spot.curatorNote === 'object' ? { ...spot.curatorNote } : { en: spot.curatorNote || '', ru: spot.curatorNote || '', zh: spot.curatorNote || '' },
      howToFind: typeof spot.howToFind === 'object' ? { ...spot.howToFind } : { en: spot.howToFind || '', ru: spot.howToFind || '', zh: spot.howToFind || '' },
      touristPerk: typeof spot.touristPerk === 'object' ? { ...spot.touristPerk } : { en: spot.touristPerk || '', ru: spot.touristPerk || '', zh: spot.touristPerk || '' }
    };
  } else {
    title.textContent = 'Add New Fashion Spot';
    document.getElementById('spotEditForm').reset();
    state.currentEditingGallery = [
      'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=1000&q=80'
    ];
    renderGalleryPreviews();

    tempSpotLangData = {
      district: { en: '', ru: '', zh: '' },
      curatorNote: { en: '', ru: '', zh: '' },
      howToFind: { en: '', ru: '', zh: '' },
      touristPerk: { en: '', ru: '', zh: '' }
    };
  }

  loadSpotLangFields(state.editorLang);
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeSpotEditor() {
  const modal = document.getElementById('spotEditorModal');
  modal.classList.remove('active');
  document.body.style.overflow = '';
  state.editingSpotId = null;
}

function saveSpotLangFields(lang) {
  tempSpotLangData.district[lang] = document.getElementById('inpSpotDistrict').value;
  tempSpotLangData.curatorNote[lang] = document.getElementById('inpSpotCuratorNote').value;
  tempSpotLangData.howToFind[lang] = document.getElementById('inpSpotHowToFind').value;
  tempSpotLangData.touristPerk[lang] = document.getElementById('inpSpotTouristPerk').value;
}

function loadSpotLangFields(lang) {
  document.getElementById('lblDistrictLang').textContent = lang.toUpperCase();
  document.getElementById('lblStoryLang').textContent = lang.toUpperCase();

  document.getElementById('inpSpotDistrict').value = tempSpotLangData.district[lang] || '';
  document.getElementById('inpSpotCuratorNote').value = tempSpotLangData.curatorNote[lang] || '';
  document.getElementById('inpSpotHowToFind').value = tempSpotLangData.howToFind[lang] || '';
  document.getElementById('inpSpotTouristPerk').value = tempSpotLangData.touristPerk[lang] || '';
}

function updateSpotEditorLangTabs() {
  document.querySelectorAll('.editor-lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.spotLang === state.editorLang);
  });
}

function renderGalleryPreviews() {
  const container = document.getElementById('galleryPreviewRow');
  container.innerHTML = state.currentEditingGallery.map((imgUrl, i) => `
    <div class="img-preview-box">
      <img src="${imgUrl}" alt="Photo ${i + 1}">
      <button type="button" class="img-remove-btn" onclick="window.adminRemoveGalleryImage(${i})">✕</button>
    </div>
  `).join('');
}

// Add Photo to gallery
document.getElementById('btnAddImageToGallery').addEventListener('click', () => {
  const inp = document.getElementById('inpSpotNewImage');
  const url = inp.value.trim();
  if (url) {
    state.currentEditingGallery.push(url);
    renderGalleryPreviews();
    inp.value = '';
  }
});

// Save Spot Form Submit
document.getElementById('spotEditForm').addEventListener('submit', (e) => {
  e.preventDefault();
  saveSpotLangFields(state.editorLang);

  const rawCoords = document.getElementById('inpSpotCoords').value.split(',').map(n => parseFloat(n.trim()));
  const coordinates = (rawCoords.length === 2 && !isNaN(rawCoords[0])) ? rawCoords : [55.7558, 37.6173];

  const selectedStyles = [];
  document.querySelectorAll('input[name="spotStyles"]:checked').forEach(cb => selectedStyles.push(cb.value));

  const spotData = {
    id: state.editingSpotId || ('spot-' + Date.now()),
    name: document.getElementById('inpSpotName').value.trim(),
    cyrillicName: document.getElementById('inpSpotCyrillicName').value.trim(),
    city: document.getElementById('inpSpotCity').value,
    district: { ...tempSpotLangData.district },
    address: document.getElementById('inpSpotAddress').value.trim(),
    cyrillicAddress: document.getElementById('inpSpotCyrillicAddress').value.trim(),
    coordinates: coordinates,
    category: document.getElementById('inpSpotCategory').value,
    styles: selectedStyles,
    priceRange: document.getElementById('inpSpotPrice').value,
    editorPick: document.getElementById('inpSpotEditorPick').value === 'true',
    englishStaff: {
      en: document.getElementById('inpSpotEnglishStaff').value,
      ru: document.getElementById('inpSpotEnglishStaff').value === 'Fluent' ? 'Свободный' : 'Хороший',
      zh: document.getElementById('inpSpotEnglishStaff').value === 'Fluent' ? '流利' : '良好'
    },
    payments: ["Cash", "MIR Card", "UnionPay"],
    touristPerk: { ...tempSpotLangData.touristPerk },
    hours: document.getElementById('inpSpotHours').value.trim() || 'Daily 12:00 – 21:00',
    instagram: document.getElementById('inpSpotInstagram').value.trim(),
    telegram: document.getElementById('inpSpotTelegram').value.trim(),
    website: "https://cherevichka.com",
    howToFind: { ...tempSpotLangData.howToFind },
    curatorNote: { ...tempSpotLangData.curatorNote },
    tags: selectedStyles,
    images: state.currentEditingGallery.length > 0 ? state.currentEditingGallery : ['https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=1000&q=80']
  };

  if (state.editingSpotId) {
    const idx = state.spots.findIndex(s => s.id === state.editingSpotId);
    if (idx !== -1) state.spots[idx] = spotData;
    showToast(`Updated spot "${spotData.name}"!`);
  } else {
    state.spots.unshift(spotData);
    showToast(`Added new spot "${spotData.name}"!`);
  }

  saveSpotsToLocalStorage();
  closeSpotEditor();
  renderDashboard();
});

/* ==========================================================================
   CRUD ACTIONS (EDIT, DUPLICATE, DELETE)
   ========================================================================== */

function adminEditSpot(spotId) {
  openSpotEditor(spotId);
}

function adminDuplicateSpot(spotId) {
  const spot = state.spots.find(s => s.id === spotId);
  if (!spot) return;
  const clone = JSON.parse(JSON.stringify(spot));
  clone.id = 'spot-' + Date.now();
  clone.name = clone.name + ' (Copy)';
  state.spots.unshift(clone);
  saveSpotsToLocalStorage();
  renderDashboard();
  showToast(`Duplicated "${spot.name}"`);
}

function adminDeleteSpot(spotId) {
  const spot = state.spots.find(s => s.id === spotId);
  if (!spot) return;
  if (confirm(`Are you sure you want to delete "${spot.name}"?`)) {
    state.spots = state.spots.filter(s => s.id !== spotId);
    saveSpotsToLocalStorage();
    renderDashboard();
    showToast(`Deleted "${spot.name}"`);
  }
}

function adminRemoveGalleryImage(index) {
  state.currentEditingGallery.splice(index, 1);
  renderGalleryPreviews();
}

function saveSpotsToLocalStorage() {
  safeStorage.set('cherevichka_custom_spots', state.spots);
}

/* ==========================================================================
   IMAGE COMPRESSION & FILE UPLOAD HELPER
   ========================================================================== */

function compressImageFile(file, maxDimension = 1400, quality = 0.85) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/webp', quality);
        resolve(dataUrl);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

/* ==========================================================================
   DESIGN PANELS & BACKGROUNDS CUSTOMIZER
   ========================================================================== */

function initDesignPanels() {
  const p = state.designPanels;

  // 0. Top Header & Upper Beige Background setup
  p.header = p.header || { bgColor: '#FAF7EE', bgImage: '', target: 'header' };
  const inpHeaderBgUrl = document.getElementById('inpHeaderBgUrl');
  const headerPreviewBanner = document.getElementById('headerPreviewBanner');
  const selHeaderBgTarget = document.getElementById('selHeaderBgTarget');
  const pickerHeaderBgColor = document.getElementById('pickerHeaderBgColor');
  const hexHeaderBgColor = document.getElementById('hexHeaderBgColor');

  // Set initial color & image
  if (p.header.bgColor) {
    pickerHeaderBgColor.value = p.header.bgColor;
    hexHeaderBgColor.value = p.header.bgColor;
    headerPreviewBanner.style.backgroundColor = p.header.bgColor;
  }
  if (p.header.bgImage) {
    inpHeaderBgUrl.value = p.header.bgImage;
    headerPreviewBanner.style.backgroundImage = `url('${p.header.bgImage}')`;
  }
  if (p.header.target) {
    selHeaderBgTarget.value = p.header.target;
  }

  // Color picker sync
  pickerHeaderBgColor.addEventListener('input', (e) => {
    p.header.bgColor = e.target.value;
    hexHeaderBgColor.value = e.target.value.toUpperCase();
    headerPreviewBanner.style.backgroundColor = p.header.bgColor;
  });

  hexHeaderBgColor.addEventListener('input', (e) => {
    let val = e.target.value.trim();
    if (!val.startsWith('#')) val = '#' + val;
    if (val.length === 7) {
      p.header.bgColor = val;
      pickerHeaderBgColor.value = val;
      headerPreviewBanner.style.backgroundColor = val;
    }
  });

  // Quick preset swatches
  document.querySelectorAll('.btn-preset-swatch').forEach(btn => {
    btn.addEventListener('click', () => {
      const col = btn.dataset.presetColor;
      p.header.bgColor = col;
      pickerHeaderBgColor.value = col;
      hexHeaderBgColor.value = col;
      headerPreviewBanner.style.backgroundColor = col;
      showToast(`Selected color ${col}`);
    });
  });

  // File upload for background image/texture
  document.getElementById('fileHeaderBg').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        p.header.bgImage = event.target.result;
        inpHeaderBgUrl.value = '';
        headerPreviewBanner.style.backgroundImage = `url('${p.header.bgImage}')`;
        showToast('Loaded top header background from PC!');
      };
      reader.readAsDataURL(file);
    }
  });

  inpHeaderBgUrl.addEventListener('input', (e) => {
    p.header.bgImage = e.target.value.trim();
    headerPreviewBanner.style.backgroundImage = p.header.bgImage ? `url('${p.header.bgImage}')` : 'none';
  });

  selHeaderBgTarget.addEventListener('change', (e) => {
    p.header.target = e.target.value;
  });

  document.getElementById('btnResetHeaderBg').addEventListener('click', () => {
    p.header.bgColor = '#FAF7EE';
    p.header.bgImage = '';
    p.header.target = 'header';
    pickerHeaderBgColor.value = '#FAF7EE';
    hexHeaderBgColor.value = '#FAF7EE';
    inpHeaderBgUrl.value = '';
    selHeaderBgTarget.value = 'header';
    headerPreviewBanner.style.backgroundColor = '#FAF7EE';
    headerPreviewBanner.style.backgroundImage = 'none';
    showToast('Reset top background to default Vanilla (#FAF7EE)');
  });

  // 1. Hero section setup
  p.hero = p.hero || { bgImage: '', overlayOpacity: 45, titleColor: '#FFFFFF', subtitleColor: '#E5DFC9' };
  const inpHeroBgUrl = document.getElementById('inpHeroBgUrl');
  const rangeHeroOverlay = document.getElementById('rangeHeroOverlay');
  const lblHeroOverlayVal = document.getElementById('lblHeroOverlayVal');
  const heroPreviewBanner = document.getElementById('heroPreviewBanner');
  const heroPreviewOverlay = document.getElementById('heroPreviewOverlay');
  const pickerHeroTitleColor = document.getElementById('pickerHeroTitleColor');
  const hexHeroTitleColor = document.getElementById('hexHeroTitleColor');
  const pickerHeroSubtitleColor = document.getElementById('pickerHeroSubtitleColor');
  const hexHeroSubtitleColor = document.getElementById('hexHeroSubtitleColor');

  if (p.hero.bgImage) {
    inpHeroBgUrl.value = p.hero.bgImage;
    heroPreviewBanner.style.backgroundImage = `url('${p.hero.bgImage}')`;
  }
  if (p.hero.titleColor && pickerHeroTitleColor) {
    pickerHeroTitleColor.value = p.hero.titleColor;
    hexHeroTitleColor.value = p.hero.titleColor;
  }
  if (p.hero.subtitleColor && pickerHeroSubtitleColor) {
    pickerHeroSubtitleColor.value = p.hero.subtitleColor;
    hexHeroSubtitleColor.value = p.hero.subtitleColor;
  }

  rangeHeroOverlay.value = p.hero.overlayOpacity || 45;
  lblHeroOverlayVal.textContent = (p.hero.overlayOpacity || 45) + '%';
  heroPreviewOverlay.style.opacity = (p.hero.overlayOpacity || 45) / 100;

  if (pickerHeroTitleColor) {
    pickerHeroTitleColor.addEventListener('input', (e) => {
      p.hero.titleColor = e.target.value;
      hexHeroTitleColor.value = e.target.value.toUpperCase();
    });
    hexHeroTitleColor.addEventListener('input', (e) => {
      let val = e.target.value.trim();
      if (!val.startsWith('#')) val = '#' + val;
      if (val.length === 7) {
        p.hero.titleColor = val;
        pickerHeroTitleColor.value = val;
      }
    });
  }

  if (pickerHeroSubtitleColor) {
    pickerHeroSubtitleColor.addEventListener('input', (e) => {
      p.hero.subtitleColor = e.target.value;
      hexHeroSubtitleColor.value = e.target.value.toUpperCase();
    });
    hexHeroSubtitleColor.addEventListener('input', (e) => {
      let val = e.target.value.trim();
      if (!val.startsWith('#')) val = '#' + val;
      if (val.length === 7) {
        p.hero.subtitleColor = val;
        pickerHeroSubtitleColor.value = val;
      }
    });
  }

  // Quick preset swatches for hero subtitle
  document.querySelectorAll('[data-hero-sub-preset]').forEach(btn => {
    btn.addEventListener('click', () => {
      const col = btn.dataset.heroSubPreset;
      p.hero.subtitleColor = col;
      if (pickerHeroSubtitleColor) pickerHeroSubtitleColor.value = col;
      if (hexHeroSubtitleColor) hexHeroSubtitleColor.value = col;
      showToast(`Selected subtitle color ${col}`);
    });
  });

  // Handle local file upload for Hero
  document.getElementById('fileHeroBg').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const compressed = await compressImageFile(file, 1600, 0.85);
        p.hero.bgImage = compressed;
        inpHeroBgUrl.value = '';
        heroPreviewBanner.style.backgroundImage = `url('${compressed}')`;
        safeStorage.set('cherevichka_design_panels', state.designPanels);
        showToast('Loaded hero image (compressed & saved)!');
      } catch (err) {
        showToast('Error loading image');
      }
    }
  });

  inpHeroBgUrl.addEventListener('input', (e) => {
    p.hero.bgImage = e.target.value.trim();
    heroPreviewBanner.style.backgroundImage = p.hero.bgImage ? `url('${p.hero.bgImage}')` : 'none';
  });

  rangeHeroOverlay.addEventListener('input', (e) => {
    p.hero.overlayOpacity = parseInt(e.target.value, 10);
    lblHeroOverlayVal.textContent = p.hero.overlayOpacity + '%';
    heroPreviewOverlay.style.opacity = p.hero.overlayOpacity / 100;
  });

  document.getElementById('btnResetHeroBg').addEventListener('click', () => {
    p.hero.bgImage = 'https://images.unsplash.com/photo-1534126511673-b6899657816a?auto=format&fit=crop&w=2600&q=90';
    p.hero.titleColor = '#FFFFFF';
    p.hero.subtitleColor = '#E5DFC9';
    inpHeroBgUrl.value = p.hero.bgImage;
    if (pickerHeroTitleColor) pickerHeroTitleColor.value = '#FFFFFF';
    if (hexHeroTitleColor) hexHeroTitleColor.value = '#FFFFFF';
    if (pickerHeroSubtitleColor) pickerHeroSubtitleColor.value = '#E5DFC9';
    if (hexHeroSubtitleColor) hexHeroSubtitleColor.value = '#E5DFC9';
    p.hero.overlayOpacity = 45;
    rangeHeroOverlay.value = 45;
    lblHeroOverlayVal.textContent = '45%';
    heroPreviewBanner.style.backgroundImage = `url('${p.hero.bgImage}')`;
    heroPreviewOverlay.style.opacity = 0.45;
    showToast('Reset hero to luxury default');
  });

  // Pillars Covers Setup
  setupPillarUploader('filePillarClothing', 'inpUrlPillarClothing', 'thumbPillarClothing', 'clothingImg');
  setupPillarUploader('filePillarShoes', 'inpUrlPillarShoes', 'thumbPillarShoes', 'shoesImg');
  setupPillarUploader('filePillarVintage', 'inpUrlPillarVintage', 'thumbPillarVintage', 'vintageImg');
  setupPillarUploader('filePillarJewelry', 'inpUrlPillarJewelry', 'thumbPillarJewelry', 'jewelryImg');

  // Manifesto section setup
  const inpManifestoBgUrl = document.getElementById('inpManifestoBgUrl');
  const rangeManifestoOverlay = document.getElementById('rangeManifestoOverlay');
  const lblManifestoOverlayVal = document.getElementById('lblManifestoOverlayVal');

  if (p.manifesto.bgImage) {
    inpManifestoBgUrl.value = p.manifesto.bgImage;
  }
  rangeManifestoOverlay.value = p.manifesto.overlayOpacity;
  lblManifestoOverlayVal.textContent = p.manifesto.overlayOpacity + '%';

  document.getElementById('fileManifestoBg').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const compressed = await compressImageFile(file, 1600, 0.85);
        p.manifesto.bgImage = compressed;
        inpManifestoBgUrl.value = '';
        safeStorage.set('cherevichka_design_panels', state.designPanels);
        showToast('Loaded manifesto texture (compressed & saved)!');
      } catch (err) {
        showToast('Error loading image');
      }
    }
  });

  inpManifestoBgUrl.addEventListener('input', (e) => {
    p.manifesto.bgImage = e.target.value.trim();
  });

  rangeManifestoOverlay.addEventListener('input', (e) => {
    p.manifesto.overlayOpacity = parseInt(e.target.value, 10);
    lblManifestoOverlayVal.textContent = p.manifesto.overlayOpacity + '%';
  });

  document.getElementById('btnResetManifestoBg').addEventListener('click', () => {
    p.manifesto.bgImage = '';
    inpManifestoBgUrl.value = '';
    p.manifesto.overlayOpacity = 20;
    rangeManifestoOverlay.value = 20;
    lblManifestoOverlayVal.textContent = '20%';
    showToast('Reset manifesto texture');
  });

  document.getElementById('btnSavePanels').addEventListener('click', () => {
    safeStorage.set('cherevichka_design_panels', p);
    showToast('Design Panels applied to live site!');
  });
}

function setupPillarUploader(fileId, urlInputId, thumbId, stateKey) {
  const p = state.designPanels.pillars;
  const thumb = document.getElementById(thumbId);
  const urlInp = document.getElementById(urlInputId);

  if (p[stateKey]) {
    thumb.src = p[stateKey];
    if (!p[stateKey].startsWith('data:')) {
      urlInp.value = p[stateKey];
    }
  }

  document.getElementById(fileId).addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const compressed = await compressImageFile(file, 1400, 0.85);
        p[stateKey] = compressed;
        thumb.src = compressed;
        urlInp.value = '';
        safeStorage.set('cherevichka_design_panels', state.designPanels);
        showToast('Updated category cover photo (compressed & saved)!');
      } catch (err) {
        showToast('Error loading image');
      }
    }
  });

  urlInp.addEventListener('input', (e) => {
    const val = e.target.value.trim();
    if (val) {
      p[stateKey] = val;
      thumb.src = val;
      safeStorage.set('cherevichka_design_panels', state.designPanels);
    }
  });
}
      safeStorage.set('cherevichka_design_panels', state.designPanels);
    }
  });
}

/* ==========================================================================
   COLOR PALETTE CUSTOMIZER
   ========================================================================== */

function initColorPickers() {
  const pRed = document.getElementById('pickerRedOchre');
  const hRed = document.getElementById('hexRedOchre');
  const sRed = document.getElementById('swatchRedOchre');

  const pBlue = document.getElementById('pickerBabyBlue');
  const hBlue = document.getElementById('hexBabyBlue');
  const sBlue = document.getElementById('swatchBabyBlue');

  const pBg = document.getElementById('pickerBgPrimary');
  const hBg = document.getElementById('hexBgPrimary');
  const sBg = document.getElementById('swatchBgPrimary');

  const pTxt = document.getElementById('pickerTextPrimary');
  const hTxt = document.getElementById('hexTextPrimary');
  const sTxt = document.getElementById('swatchTextPrimary');

  const pSec = document.getElementById('pickerTextSecondary');
  const hSec = document.getElementById('hexTextSecondary');
  const sSec = document.getElementById('swatchTextSecondary');

  // Sync inputs
  syncColorPair(pRed, hRed, sRed, state.colors.redOchre);
  syncColorPair(pBlue, hBlue, sBlue, state.colors.babyBlue);
  syncColorPair(pBg, hBg, sBg, state.colors.bgPrimary);
  syncColorPair(pTxt, hTxt, sTxt, state.colors.textPrimary);
  if (pSec && hSec && sSec) {
    syncColorPair(pSec, hSec, sSec, state.colors.textSecondary || '#57524E');
  }

  // Typography Setup & Preview
  const selHeaderFont = document.getElementById('selHeaderFont');
  const selBodyFont = document.getElementById('selBodyFont');
  const prevHeadingSample = document.getElementById('prevHeadingSample');
  const prevBodySample = document.getElementById('prevBodySample');

  if (state.fonts.headerFont) {
    selHeaderFont.value = state.fonts.headerFont;
    prevHeadingSample.style.fontFamily = state.fonts.headerFont;
  }
  if (state.fonts.bodyFont) {
    selBodyFont.value = state.fonts.bodyFont;
    prevBodySample.style.fontFamily = state.fonts.bodyFont;
  }

  selHeaderFont.addEventListener('change', (e) => {
    prevHeadingSample.style.fontFamily = e.target.value;
  });

  selBodyFont.addEventListener('change', (e) => {
    prevBodySample.style.fontFamily = e.target.value;
  });
}

function syncColorPair(picker, textInput, swatch, initialVal) {
  picker.value = initialVal;
  textInput.value = initialVal;
  swatch.style.backgroundColor = initialVal;

  picker.addEventListener('input', (e) => {
    textInput.value = e.target.value.toUpperCase();
    swatch.style.backgroundColor = e.target.value;
  });

  textInput.addEventListener('input', (e) => {
    let val = e.target.value;
    if (!val.startsWith('#')) val = '#' + val;
    if (val.length === 7) {
      picker.value = val;
      swatch.style.backgroundColor = val;
    }
  });
}

document.getElementById('btnSaveColors').addEventListener('click', () => {
  state.colors = {
    redOchre: document.getElementById('hexRedOchre').value,
    babyBlue: document.getElementById('hexBabyBlue').value,
    bgPrimary: document.getElementById('hexBgPrimary').value,
    textPrimary: document.getElementById('hexTextPrimary').value,
    textSecondary: document.getElementById('hexTextSecondary') ? document.getElementById('hexTextSecondary').value : '#57524E'
  };

  state.fonts = {
    headerFont: document.getElementById('selHeaderFont').value,
    bodyFont: document.getElementById('selBodyFont').value
  };

  safeStorage.set('cherevichka_custom_colors', state.colors);
  safeStorage.set('cherevichka_custom_fonts', state.fonts);
  showToast('Colors & Typography applied to live site!');
});

document.getElementById('btnResetColors').addEventListener('click', () => {
  state.colors = {
    redOchre: '#913731',
    babyBlue: '#B5C8D4',
    bgPrimary: '#FAF7EE',
    textPrimary: '#161413',
    textSecondary: '#57524E'
  };
  state.fonts = {
    headerFont: "'Cormorant Garamond', serif",
    bodyFont: "'Plus Jakarta Sans', sans-serif"
  };
  initColorPickers();
  safeStorage.set('cherevichka_custom_colors', state.colors);
  safeStorage.set('cherevichka_custom_fonts', state.fonts);
  showToast('Reset colors and fonts to moodboard defaults');
});

/* ==========================================================================
   LANDING TEXTS & MANIFESTO EDITOR
   ========================================================================== */

function populateLandingTextInputs() {
  const lang = state.textLang;
  const t = state.i18n[lang] || state.i18n.en;

  document.getElementById('inpTextHeroTitle').value = t.heroTitle || '';
  document.getElementById('inpTextHeroSubtitle').value = t.heroSubtitle || '';
  document.getElementById('inpTextManifestoTitle').value = t.manifestoTitle || '';
  document.getElementById('inpTextManifestoP1').value = t.manifestoP1 || '';
  document.getElementById('inpTextManifestoP2').value = t.manifestoP2 || '';
}

function saveLandingTextInputs() {
  const lang = state.textLang;
  if (!state.i18n[lang]) state.i18n[lang] = {};

  state.i18n[lang].heroTitle = document.getElementById('inpTextHeroTitle').value;
  state.i18n[lang].heroSubtitle = document.getElementById('inpTextHeroSubtitle').value;
  state.i18n[lang].manifestoTitle = document.getElementById('inpTextManifestoTitle').value;
  state.i18n[lang].manifestoP1 = document.getElementById('inpTextManifestoP1').value;
  state.i18n[lang].manifestoP2 = document.getElementById('inpTextManifestoP2').value;

  safeStorage.set('cherevichka_custom_i18n', state.i18n);
}

document.getElementById('btnSaveTexts').addEventListener('click', () => {
  saveLandingTextInputs();
  showToast('Saved landing texts successfully!');
});

/* ==========================================================================
   1-CLICK CODE GENERATION & EXPORT (data/spots.js)
   ========================================================================== */

function generateSpotsJsCode() {
  return `export const I18N = ${JSON.stringify(state.i18n, null, 2)};\n\nexport const DESIGN_PANELS = ${JSON.stringify(state.designPanels, null, 2)};\n\nexport const CUSTOM_COLORS = ${JSON.stringify(state.colors, null, 2)};\n\nexport const CUSTOM_FONTS = ${JSON.stringify(state.fonts, null, 2)};\n\nexport const COUNTRY_SURVIVAL_GUIDES = ${JSON.stringify(COUNTRY_SURVIVAL_GUIDES, null, 2)};\n\nexport const SPOTS_DATA = ${JSON.stringify(state.spots, null, 2)};\n\nexport const WALKING_TOURS = ${JSON.stringify(WALKING_TOURS, null, 2)};\n\nexport const TOURIST_SURVIVAL_TIPS = COUNTRY_SURVIVAL_GUIDES;\n`;
}

function downloadSpotsFile() {
  const code = generateSpotsJsCode();
  const blob = new Blob([code], { type: 'text/javascript' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'spots.js';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('Downloaded spots.js! Replace data/spots.js in your folder.');
}

document.getElementById('btnDownloadSpotsFile').addEventListener('click', downloadSpotsFile);
document.getElementById('btnQuickExport').addEventListener('click', downloadSpotsFile);

document.getElementById('btnResetToDefaults').addEventListener('click', () => {
  if (confirm('Are you sure you want to restore the original sample data? All custom additions will be reset.')) {
    localStorage.removeItem('cherevichka_custom_spots');
    localStorage.removeItem('cherevichka_custom_i18n');
    localStorage.removeItem('cherevichka_custom_colors');
    state.spots = JSON.parse(JSON.stringify(DEFAULT_SPOTS));
    state.i18n = JSON.parse(JSON.stringify(DEFAULT_I18N));
    state.colors = { redOchre: '#913731', babyBlue: '#B5C8D4', bgPrimary: '#FAF7EE', textPrimary: '#161413' };
    renderDashboard();
    initColorPickers();
    populateLandingTextInputs();
    showToast('Restored original sample dataset');
  }
});

/* ==========================================================================
   TOAST HELPER
   ========================================================================== */

function showToast(msg) {
  const container = document.getElementById('adminToastContainer');
  const toast = document.createElement('div');
  toast.className = 'admin-toast';
  toast.innerHTML = `<span>✓</span> <span>${msg}</span>`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3200);
}

/* ==========================================================================
   NAVIGATION & EVENT LISTENERS
   ========================================================================== */

function setupEventListeners() {
  // Sidebar navigation tabs
  document.querySelectorAll('.nav-item-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.nav-item-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.admin-section').forEach(sec => sec.classList.remove('active-section'));

      btn.classList.add('active');
      const targetSec = document.getElementById(btn.dataset.section);
      if (targetSec) targetSec.classList.add('active-section');
    });
  });

  // Table search & filter
  document.getElementById('adminSearchSpots').addEventListener('input', renderSpotsTable);
  document.getElementById('adminFilterCity').addEventListener('change', renderSpotsTable);
  document.getElementById('adminFilterCat').addEventListener('change', renderSpotsTable);

  // Add new spot button
  document.getElementById('btnAddNewSpot').addEventListener('click', () => openSpotEditor(null));
  document.getElementById('closeSpotEditorBtn').addEventListener('click', closeSpotEditor);
  document.getElementById('cancelSpotEditBtn').addEventListener('click', closeSpotEditor);

  // Spot Editor Language Tabs (EN / RU / ZH)
  document.getElementById('spotEditorLangTabs').addEventListener('click', (e) => {
    const btn = e.target.closest('.editor-lang-btn');
    if (!btn) return;
    saveSpotLangFields(state.editorLang);
    state.editorLang = btn.dataset.spotLang;
    updateSpotEditorLangTabs();
    loadSpotLangFields(state.editorLang);
  });

  // Landing Text Language Tabs (EN / RU / ZH)
  document.getElementById('landingTextLangTabs').addEventListener('click', (e) => {
    const btn = e.target.closest('.editor-lang-btn');
    if (!btn) return;
    saveLandingTextInputs();
    state.textLang = btn.dataset.textLang;
    document.querySelectorAll('#landingTextLangTabs .editor-lang-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    populateLandingTextInputs();
  });
  // Leads search & filter
  const searchLeads = document.getElementById('adminSearchLeads');
  if (searchLeads) searchLeads.addEventListener('input', renderLeadsTable);
  const filterLeadsStatus = document.getElementById('adminFilterLeadsStatus');
  if (filterLeadsStatus) filterLeadsStatus.addEventListener('change', renderLeadsTable);
  const btnExportLeadsCsv = document.getElementById('btnExportLeadsCsv');
  if (btnExportLeadsCsv) btnExportLeadsCsv.addEventListener('click', exportLeadsCsv);
}

/* Global exports */
window.adminEditSpot = adminEditSpot;
window.adminDuplicateSpot = adminDuplicateSpot;
window.adminDeleteSpot = adminDeleteSpot;
window.adminRemoveGalleryImage = adminRemoveGalleryImage;
window.adminApproveLead = adminApproveLead;
window.adminDeleteLead = adminDeleteLead;

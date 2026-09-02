import { I18N as BASE_I18N, SPOTS_DATA as BASE_SPOTS, WALKING_TOURS, COUNTRY_SURVIVAL_GUIDES } from './data/spots.js';

/* ==========================================================================
   DYNAMIC DATA ADAPTER (READS FROM LOCALSTORAGE IF ADMIN HAS EDITED)
   ========================================================================== */

function getSpots() {
  const custom = localStorage.getItem('cherevichka_custom_spots');
  if (custom) {
    try { return JSON.parse(custom); } catch (e) {}
  }
  return BASE_SPOTS;
}

function getI18N() {
  const custom = localStorage.getItem('cherevichka_custom_i18n');
  if (custom) {
    try { return JSON.parse(custom); } catch (e) {}
  }
  return BASE_I18N;
}

function applyCustomColors() {
  const custom = localStorage.getItem('cherevichka_custom_colors');
  if (custom) {
    try {
      const colors = JSON.parse(custom);
      if (colors.redOchre) document.documentElement.style.setProperty('--color-red-ochre', colors.redOchre);
      if (colors.babyBlue) document.documentElement.style.setProperty('--color-baby-blue', colors.babyBlue);
      if (colors.bgPrimary) document.documentElement.style.setProperty('--bg-primary', colors.bgPrimary);
      if (colors.textPrimary) document.documentElement.style.setProperty('--text-primary', colors.textPrimary);
      if (colors.textSecondary) document.documentElement.style.setProperty('--text-secondary', colors.textSecondary);
    } catch (e) {}
  }
}

function applyCustomFonts() {
  const custom = localStorage.getItem('cherevichka_custom_fonts');
  if (custom) {
    try {
      const fonts = JSON.parse(custom);
      if (fonts.headerFont) document.documentElement.style.setProperty('--font-serif', fonts.headerFont);
      if (fonts.bodyFont) document.documentElement.style.setProperty('--font-sans', fonts.bodyFont);
    } catch (e) {}
  }
}

function applyCustomDesignPanels() {
  const custom = localStorage.getItem('cherevichka_design_panels');
  if (!custom) return;
  try {
    const panels = JSON.parse(custom);

    // 0. Top Header Bar & Global Background Layer (Color Fill + Image)
    const siteHeader = document.querySelector('.site-header');
    const globalBgLayer = document.getElementById('globalBgLayer');

    // 0.1 Color Fill Application
    if (panels.header && panels.header.bgColor && panels.header.target === 'both') {
      document.documentElement.style.setProperty('--bg-primary', panels.header.bgColor);
      document.body.style.backgroundColor = panels.header.bgColor;
    }

    // 0.2 Global Background Layer
    if (panels.header && panels.header.bgImage && panels.header.target === 'both') {
      if (globalBgLayer) {
        globalBgLayer.style.backgroundImage = `url('${panels.header.bgImage}')`;
        globalBgLayer.classList.add('active-bg');
      }
    } else if (globalBgLayer) {
      globalBgLayer.classList.remove('active-bg');
      globalBgLayer.style.backgroundImage = '';
    }

    // 1. Hero background & overlay
    const heroSection = document.getElementById('heroSection');
    const heroOverlay = document.getElementById('heroOverlayCustom');
    const txtHeroTitle = document.getElementById('txtHeroTitle');
    const txtHeroSubtitle = document.getElementById('txtHeroSubtitle');

    if (heroSection && heroOverlay && panels.hero) {
      const h = panels.hero;

      // Custom direct title & subtitle colors
      if (txtHeroTitle && h.titleColor) {
        txtHeroTitle.style.color = h.titleColor;
      }
      if (txtHeroSubtitle && h.subtitleColor) {
        txtHeroSubtitle.style.color = h.subtitleColor;
      }

      if (h.bgImage) {
        heroSection.style.backgroundImage = `url('${h.bgImage}')`;
        heroSection.style.backgroundSize = h.bgFit || 'cover';
        heroSection.style.backgroundRepeat = h.bgFit === 'repeat' ? 'repeat' : 'no-repeat';
        heroOverlay.style.opacity = (h.overlayOpacity || 45) / 100;
      } else {
        heroSection.style.backgroundImage = '';
        heroOverlay.style.opacity = '0';
      }
    }

    // 2. Pillars covers
    if (panels.pillars) {
      const p = panels.pillars;
      const imgClothing = document.getElementById('imgPillarClothing');
      const imgShoes = document.getElementById('imgPillarShoes');
      const imgVintage = document.getElementById('imgPillarVintage');
      const imgJewelry = document.getElementById('imgPillarJewelry');

      if (imgClothing && p.clothingImg) imgClothing.src = p.clothingImg;
      if (imgShoes && p.shoesImg) imgShoes.src = p.shoesImg;
      if (imgVintage && p.vintageImg) imgVintage.src = p.vintageImg;
      if (imgJewelry && p.jewelryImg) imgJewelry.src = p.jewelryImg;
    } else {
      const imgClothing = document.getElementById('imgPillarClothing');
      const imgShoes = document.getElementById('imgPillarShoes');
      const imgVintage = document.getElementById('imgPillarVintage');
      const imgJewelry = document.getElementById('imgPillarJewelry');

      if (imgClothing) imgClothing.src = 'assets/images/e213de95-ef12-45a0-a0da-362a0f43265f.webp';
      if (imgShoes) imgShoes.src = 'assets/images/4d6497c6-bdbf-4d74-864a-ca4b68dfbf7f.webp';
      if (imgVintage) imgVintage.src = 'assets/images/ac16aa4c-ae90-4511-81ec-27020e10e49c.webp';
      if (imgJewelry) imgJewelry.src = 'assets/images/33718ecc-4a03-4871-b1cd-422e7e49b25a.webp';
    }

    // 3. Manifesto background & overlay
    const manifestoSection = document.getElementById('manifestoSection');
    const manifestoOverlay = document.getElementById('manifestoOverlayCustom');
    if (manifestoSection && manifestoOverlay && panels.manifesto) {
      if (panels.manifesto.bgImage) {
        manifestoSection.style.backgroundImage = `url('${panels.manifesto.bgImage}')`;
        manifestoOverlay.style.opacity = (panels.manifesto.overlayOpacity || 20) / 100;
      } else {
        manifestoSection.style.backgroundImage = '';
        manifestoOverlay.style.opacity = '0';
      }
    }
  } catch (e) {}
}

/* ==========================================================================
   STATE MANAGEMENT
   ========================================================================== */

const state = {
  page: 'home',    // 'home' | 'directory'
  lang: localStorage.getItem('cherevichka_lang') || 'en',
  city: 'all',     // 'all' | 'russia' | 'japan' | 'uae' | 'bali' | 'thailand'
  survivalCountry: 'russia',
  category: 'all', // 'all' | 'clothing' | 'shoes-bags' | 'vintage-archive' | 'jewelry-accs'
  style: 'all',    // 'all' | 'runway-archive' | 'minimal-oldmoney' | 'soviet-heritage' | 'avantgarde-upcycle' | 'streetwear-y2k'
  price: 'all',
  searchQuery: '',
  view: 'split',   // 'split' | 'grid' | 'map'
  favorites: new Set(JSON.parse(localStorage.getItem('cherevichka_favs') || '[]')),
  selectedSpotId: null,
  theme: localStorage.getItem('cherevichka_theme') || 'light'
};

let map = null;
let markersLayer = null;
let currentTileLayer = null;

/* ==========================================================================
   DOM ELEMENTS
   ========================================================================== */

const pageHome = document.getElementById('pageHome');
const pageDirectory = document.getElementById('pageDirectory');
const navTabHome = document.getElementById('navTabHome');
const navTabDirectory = document.getElementById('navTabDirectory');

const spotsGrid = document.getElementById('spotsGrid');
const resultsCountText = document.getElementById('resultsCountText');
const searchInput = document.getElementById('searchInput');
const langSwitcher = document.getElementById('langSwitcher');
const dirCitySwitcher = document.getElementById('dirCitySwitcher');
const primaryCategoryTabs = document.getElementById('primaryCategoryTabs');
const styleChips = document.getElementById('styleChips');
const priceFilters = document.getElementById('priceFilters');
const viewSwitcher = document.getElementById('viewSwitcher');
const mainLayoutContainer = document.getElementById('mainLayoutContainer');
const favoritesCount = document.getElementById('favoritesCount');
const themeToggleBtn = document.getElementById('themeToggleBtn');
const spotlightGridContainer = document.getElementById('spotlightGridContainer');

// Modals & Drawers
const spotDrawer = document.getElementById('spotDrawer');
const drawerOverlay = document.getElementById('drawerOverlay');
const drawerCloseBtn = document.getElementById('drawerCloseBtn');
const drawerBody = document.getElementById('drawerBody');
const drawerCategoryPill = document.getElementById('drawerCategoryPill');

const toursModal = document.getElementById('toursModal');
const survivalModal = document.getElementById('survivalModal');
const submitModal = document.getElementById('submitModal');
const favoritesModal = document.getElementById('favoritesModal');
const submitSpotForm = document.getElementById('submitSpotForm');

/* ==========================================================================
   INITIALIZATION
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  applyCustomColors();
  applyCustomFonts();
  applyCustomDesignPanels();
  applyTheme(state.theme);
  setupEventListeners();
  applyLanguage(state.lang);
  updateFavoritesBadge();
  renderSpotlight();

  // Prada Header Scroll Effect
  const siteHeader = document.querySelector('.site-header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 60) {
      siteHeader.classList.add('scrolled-header');
    } else {
      siteHeader.classList.remove('scrolled-header');
    }
  }, { passive: true });
});

/* ==========================================================================
   PAGE ROUTING / NAVIGATION (HOME <-> DIRECTORY)
   ========================================================================== */

function navigateTo(page, options = {}) {
  state.page = page;
  document.body.classList.toggle('in-directory', page === 'directory');

  if (page === 'home') {
    pageHome.classList.add('active-page');
    pageDirectory.classList.remove('active-page');
    navTabHome.classList.add('active');
    navTabDirectory.classList.remove('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else if (page === 'directory') {
    pageHome.classList.remove('active-page');
    pageDirectory.classList.add('active-page');
    navTabHome.classList.remove('active');
    navTabDirectory.classList.add('active');

    // If options provided, apply them
    if (options.category) {
      state.category = options.category;
      document.querySelectorAll('.discipline-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.category === options.category);
      });
    }

    if (options.city) {
      state.city = options.city;
      document.querySelectorAll('.city-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.city === options.city);
      });
    }

    // Lazy init map if not yet initialized
    if (!map) {
      setTimeout(initMap, 50);
    } else {
      setTimeout(() => map.invalidateSize(), 150);
    }

    renderSpots();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

/* ==========================================================================
   TRILINGUAL LOCALIZATION (EN / RU / ZH)
   ========================================================================== */

function applyLanguage(lang) {
  state.lang = lang;
  localStorage.setItem('cherevichka_lang', lang);
  document.documentElement.lang = lang;

  document.querySelectorAll('.lang-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.lang === lang);
  });

  const allI18n = getI18N();
  const t = allI18n[lang] || allI18n.en;

  // Header & Brand
  document.getElementById('txtBrandTagline').textContent = t.brandTagline;
  document.getElementById('navTabHome').textContent = t.navHome;
  document.getElementById('navTabDirectory').textContent = t.navDirectory;
  document.getElementById('navTabTours').textContent = t.navTours;
  document.getElementById('navTabSurvival').textContent = t.navSurvival;
  document.getElementById('txtSubmitSpot').textContent = t.navSubmit;

  // Home Hero
  document.getElementById('txtHeroBadge').textContent = t.heroBadge;
  document.getElementById('txtHeroTitle').innerHTML = t.heroTitle;
  document.getElementById('txtHeroSubtitle').textContent = t.heroSubtitle;
  document.getElementById('txtHeroCtaExplore').textContent = t.heroCtaExplore;
  if (document.getElementById('txtHeroCtaRussia')) document.getElementById('txtHeroCtaRussia').textContent = t.heroCtaRussia;
  if (document.getElementById('txtHeroCtaJapan')) document.getElementById('txtHeroCtaJapan').textContent = t.heroCtaJapan;
  if (document.getElementById('txtHeroCtaBali')) document.getElementById('txtHeroCtaBali').textContent = t.heroCtaBali;
  if (document.getElementById('txtHeroCtaDubai')) document.getElementById('txtHeroCtaDubai').textContent = t.heroCtaDubai;
  if (document.getElementById('txtHeroCtaThai')) document.getElementById('txtHeroCtaThai').textContent = t.destThailand || 'Thailand (Bangkok)';

  // Home Pillars
  document.getElementById('txtPillarsTag').textContent = t.pillarsTag;
  document.getElementById('txtPillarsTitle').textContent = t.pillarsTitle;
  document.getElementById('txtPillarsSub').textContent = t.pillarsSubtitle;
  document.getElementById('txtPillarClothingTitle').textContent = t.pillarClothingTitle;
  document.getElementById('txtPillarClothingDesc').textContent = t.pillarClothingDesc;
  document.getElementById('txtPillarShoesTitle').textContent = t.pillarShoesTitle;
  document.getElementById('txtPillarShoesDesc').textContent = t.pillarShoesDesc;
  document.getElementById('txtPillarVintageTitle').textContent = t.pillarVintageTitle;
  document.getElementById('txtPillarVintageDesc').textContent = t.pillarVintageDesc;
  document.getElementById('txtPillarJewelryTitle').textContent = t.pillarJewelryTitle;
  document.getElementById('txtPillarJewelryDesc').textContent = t.pillarJewelryDesc;
  document.getElementById('txtPillarEnter1').textContent = t.pillarEnter;
  document.getElementById('txtPillarEnter2').textContent = t.pillarEnter;
  document.getElementById('txtPillarEnter3').textContent = t.pillarEnter;
  document.getElementById('txtPillarEnter4').textContent = t.pillarEnter;

  // Home Manifesto
  document.getElementById('txtManifestoTag').textContent = t.manifestoTag;
  document.getElementById('txtManifestoTitle').textContent = t.manifestoTitle;
  document.getElementById('txtManifestoP1').textContent = t.manifestoP1;
  document.getElementById('txtManifestoP2').textContent = t.manifestoP2;
  document.getElementById('txtMStat1').textContent = t.manifestoStat1;
  document.getElementById('txtMStat2').textContent = t.manifestoStat2;
  document.getElementById('txtMStat3').textContent = t.manifestoStat3;

  // Home Spotlight & How it works
  document.getElementById('txtSpotlightTag').textContent = t.spotlightTag;
  document.getElementById('txtSpotlightTitle').textContent = t.spotlightTitle;
  document.getElementById('txtSpotlightCta').textContent = t.spotlightCta;
  document.getElementById('txtHowTitle').textContent = t.howTitle;
  document.getElementById('txtStep1Title').textContent = t.step1Title;
  document.getElementById('txtStep1Desc').textContent = t.step1Desc;
  document.getElementById('txtStep2Title').textContent = t.step2Title;
  document.getElementById('txtStep2Desc').textContent = t.step2Desc;
  document.getElementById('txtStep3Title').textContent = t.step3Title;
  document.getElementById('txtStep3Desc').textContent = t.step3Desc;

  // Directory Header & Filters
  document.getElementById('txtDirHeaderTitle').textContent = t.dirHeaderTitle;
  document.getElementById('txtDirHeaderSub').textContent = t.dirHeaderSubtitle;
  document.getElementById('btnCityAll').textContent = t.allCities;
  if (document.getElementById('btnCityRussia')) document.getElementById('btnCityRussia').textContent = t.destRussia;
  if (document.getElementById('btnCityJapan')) document.getElementById('btnCityJapan').textContent = t.destJapan;
  if (document.getElementById('btnCityUae')) document.getElementById('btnCityUae').textContent = t.destUae;
  if (document.getElementById('btnCityThai')) document.getElementById('btnCityThai').textContent = t.destThailand;
  if (document.getElementById('btnCityBali')) document.getElementById('btnCityBali').textContent = t.destBali;

  document.getElementById('tabCatAll').textContent = t.allDisciplines;
  document.getElementById('tabCatClothing').textContent = t.catClothing;
  document.getElementById('tabCatShoesBags').textContent = t.catShoesBags;
  document.getElementById('tabCatVintage').textContent = t.catVintageArchive;
  document.getElementById('tabCatJewelry').textContent = t.catJewelryAccs;
  searchInput.placeholder = t.searchPlaceholder;
  document.getElementById('chipStyleAll').textContent = t.allStyles;
  document.getElementById('chipStyleRunway').textContent = t.styleRunway;
  document.getElementById('chipStyleMinimal').textContent = t.styleMinimal;
  document.getElementById('chipStyleSoviet').textContent = t.styleSoviet;
  document.getElementById('chipStyleAvantgarde').textContent = t.styleAvantgarde;
  document.getElementById('chipStyleStreetwear').textContent = t.styleStreetwear;
  document.getElementById('txtViewSplit').textContent = t.splitView;
  document.getElementById('txtViewGrid').textContent = t.gridView;
  document.getElementById('txtViewMap').textContent = t.mapView;

  // Modals text
  document.getElementById('txtModalToursTitle').textContent = t.toursTitle;
  document.getElementById('txtModalSurvivalTitle').textContent = t.survivalTitle;
  document.getElementById('txtModalSubmitTitle').textContent = t.submitModalTitle;
  document.getElementById('txtModalSubmitSub').textContent = t.submitModalSubtitle;
  document.getElementById('lblStoreName').textContent = t.submitStoreName;
  if (document.getElementById('lblStoreEmail')) document.getElementById('lblStoreEmail').textContent = t.submitEmail;
  document.getElementById('lblStoreCity').textContent = t.submitCity;
  document.getElementById('lblStoreAddress').textContent = t.submitAddress;
  document.getElementById('lblStoreCategory').textContent = t.submitCategory;
  document.getElementById('lblStorePrice').textContent = t.submitPrice;
  document.getElementById('lblStoreDesc').textContent = t.submitDesc;
  document.getElementById('lblStoreContact').textContent = t.submitContact;
  document.getElementById('btnSubmitSend').textContent = t.submitSendBtn;
  document.getElementById('txtModalFavTitle').textContent = t.navSaved;

  // Footer text
  document.getElementById('txtFooterAbout').textContent = t.footerAbout;
  document.getElementById('txtFooterExpansion').textContent = t.footerExpansion;
  document.getElementById('txtFooterPartners').textContent = t.footerPartners;
  document.getElementById('txtFooterRights').textContent = t.footerRights;
  if (document.getElementById('linkFooterJapan')) document.getElementById('linkFooterJapan').textContent = t.destJapan;
  if (document.getElementById('linkFooterUae')) document.getElementById('linkFooterUae').textContent = t.destUae;
  if (document.getElementById('linkFooterThai')) document.getElementById('linkFooterThai').textContent = t.destThailand;
  if (document.getElementById('linkFooterBali')) document.getElementById('linkFooterBali').textContent = t.destBali;

  // Re-render
  renderSpotlight();
  renderSpots();
  renderWalkingTours();
  renderSurvivalTips();

  if (state.selectedSpotId) {
    openSpotDrawer(state.selectedSpotId);
  }
}

/* ==========================================================================
   THEME SWITCHER
   ========================================================================== */

function applyTheme(theme) {
  state.theme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('cherevichka_theme', theme);

  if (map) {
    updateMapTiles();
  }
}

function toggleTheme() {
  const newTheme = state.theme === 'light' ? 'dark' : 'light';
  applyTheme(newTheme);
}

/* ==========================================================================
   INTERACTIVE MAP (LEAFLET)
   ========================================================================== */

function initMap() {
  const mapElem = document.getElementById('leafletMap');
  if (!mapElem) return;

  const defaultCenter = [22.0, 85.0]; // Global Asia & Middle East Hub View
  map = L.map('leafletMap', {
    zoomControl: true,
    scrollWheelZoom: true
  }).setView(defaultCenter, 3);

  markersLayer = L.layerGroup().addTo(map);
  updateMapTiles();
}

function updateMapTiles() {
  if (!map) return;
  if (currentTileLayer) {
    map.removeLayer(currentTileLayer);
  }

  currentTileLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap',
    maxZoom: 19,
    subdomains: 'abcd'
  }).addTo(map);
}

function renderMapMarkers(spots) {
  if (!markersLayer || !map) return;
  markersLayer.clearLayers();

  if (spots.length === 0) return;

  const latLngs = [];

  spots.forEach((spot, index) => {
    const coords = spot.coordinates;
    latLngs.push(coords);

    const isSelected = state.selectedSpotId === spot.id;

    const customIcon = L.divIcon({
      className: 'custom-pin-wrapper',
      html: `
        <div class="custom-map-pin ${isSelected ? 'active-pin' : ''}" data-id="${spot.id}">
          <span>${index + 1}</span>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -30]
    });

    const marker = L.marker(coords, { icon: customIcon });
    const districtName = typeof spot.district === 'object' ? (spot.district[state.lang] || spot.district.en) : spot.district;

    const popupContent = `
      <div class="map-popup-card" onclick="window.openSpotDrawer('${spot.id}')">
        <img src="${spot.images[0]}" alt="${spot.name}" class="map-popup-img">
        <div class="map-popup-info">
          <div class="map-popup-title">${spot.name}</div>
          <div class="map-popup-meta">${districtName} • ${spot.priceRange}</div>
        </div>
      </div>
    `;

    marker.bindPopup(popupContent);
    marker.on('click', () => {
      openSpotDrawer(spot.id);
    });

    markersLayer.addLayer(marker);
  });

  if (latLngs.length > 1) {
    map.fitBounds(latLngs, { padding: [40, 40], maxZoom: 14 });
  } else if (latLngs.length === 1) {
    map.setView(latLngs[0], 14);
  }
}

/* ==========================================================================
   SPOTLIGHT SECTION ON HOME PAGE
   ========================================================================== */

function renderSpotlight() {
  if (!spotlightGridContainer) return;
  const allSpots = getSpots();
  const spotlightSpots = allSpots.filter(s => s.editorPick).slice(0, 3);
  const allI18n = getI18N();
  const t = allI18n[state.lang] || allI18n.en;

  spotlightGridContainer.innerHTML = spotlightSpots.map(spot => {
    const districtName = typeof spot.district === 'object' ? (spot.district[state.lang] || spot.district.en) : spot.district;
    const curatorNote = typeof spot.curatorNote === 'object' ? (spot.curatorNote[state.lang] || spot.curatorNote.en) : spot.curatorNote;
    const isFav = state.favorites.has(spot.id);

    return `
      <article class="spot-card" onclick="window.openSpotDrawer('${spot.id}')">
        <div class="card-media-wrap">
          <img src="${spot.images[0]}" alt="${spot.name}" class="card-img" loading="lazy">
          <div class="card-top-badges">
            <span class="badge-pill editor-pick">${t.editorPick}</span>
            <button class="fav-btn ${isFav ? 'active' : ''}" onclick="event.stopPropagation(); window.toggleFavorite('${spot.id}')">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            </button>
          </div>
        </div>
        <div class="card-content">
          <div class="card-meta-row">
            <span class="card-district">${districtName}</span>
            <span class="card-price">${spot.priceRange}</span>
          </div>
          <h3 class="card-title">${spot.name}</h3>
          <p class="card-curator-snippet">${curatorNote}</p>
          <div class="card-footer">
            <span style="font-family: var(--font-mono); font-size: 0.76rem; color: var(--color-red-ochre); font-weight: 700;">View in Directory →</span>
          </div>
        </div>
      </article>
    `;
  }).join('');
}

/* ==========================================================================
   DIRECTORY FILTERING & CARDS
   ========================================================================== */

function getFilteredSpots() {
  const allSpots = getSpots();
  return allSpots.filter(spot => {
    if (state.city !== 'all' && spot.city !== state.city) return false;
    if (state.category !== 'all' && spot.category !== state.category) return false;
    if (state.style !== 'all' && !spot.styles.includes(state.style)) return false;
    if (state.price !== 'all' && spot.priceRange !== state.price) return false;

    if (state.searchQuery.trim() !== '') {
      const q = state.searchQuery.toLowerCase().trim();
      const matchName = spot.name.toLowerCase().includes(q);
      const matchCyrillic = spot.cyrillicName.toLowerCase().includes(q);
      const districtText = typeof spot.district === 'object' ? Object.values(spot.district).join(' ').toLowerCase() : spot.district.toLowerCase();
      const matchDistrict = districtText.includes(q);
      const matchTags = spot.tags.some(tag => tag.toLowerCase().includes(q));
      const curatorText = typeof spot.curatorNote === 'object' ? Object.values(spot.curatorNote).join(' ').toLowerCase() : spot.curatorNote.toLowerCase();
      const matchDesc = curatorText.includes(q);

      if (!matchName && !matchCyrillic && !matchDistrict && !matchTags && !matchDesc) {
        return false;
      }
    }

    return true;
  });
}

function renderSpots() {
  if (!spotsGrid) return;
  const filtered = getFilteredSpots();
  const allI18n = getI18N();
  const t = allI18n[state.lang] || allI18n.en;

  const countLabel = filtered.length === 1 ? t.location : t.locations;
  resultsCountText.innerHTML = `${t.showing} <strong>${filtered.length}</strong> ${countLabel}`;

  renderMapMarkers(filtered);

  if (filtered.length === 0) {
    spotsGrid.innerHTML = `
      <div style="grid-column: 1 / -1; padding: 4rem 1.5rem; text-align: center; background: var(--bg-card); border-radius: var(--radius-md); border: 1px dashed var(--border-subtle);">
        <h3 class="font-serif" style="font-size: 1.6rem; margin-bottom: 0.5rem;">${t.noSpotsFound}</h3>
        <p style="color: var(--text-secondary); max-width: 420px; margin: 0 auto 1.2rem;">${t.noSpotsDesc}</p>
        <button class="nav-link-btn" onclick="window.resetFilters()" style="margin: 0 auto; display: inline-flex; border: 1px solid var(--border-subtle);">
          ${t.resetFiltersBtn}
        </button>
      </div>
    `;
    return;
  }

  let countryBannerHtml = '';
  if (state.city !== 'all' && COUNTRY_SURVIVAL_GUIDES[state.city]) {
    const cData = COUNTRY_SURVIVAL_GUIDES[state.city];
    const countryName = typeof cData.countryName === 'object' ? (cData.countryName[state.lang] || cData.countryName.en) : cData.countryName;
    countryBannerHtml = `
      <div class="country-insider-banner" style="grid-column: 1 / -1;">
        <div>
          <div style="font-family: var(--font-mono); font-size: 0.75rem; font-weight: 700; color: var(--color-red-ochre); text-transform: uppercase;">
            ${cData.flag} ${countryName} Guide & Phrasebook
          </div>
          <div style="font-size: 0.88rem; color: var(--text-secondary); margin-top: 0.2rem;">
            Local shopping phrases with pronunciation, taxi navigation app, and payment / tax-free rules.
          </div>
        </div>
        <button class="quick-copy-taxi-btn" onclick="window.openCountryGuideModal('${state.city}')">
          <span>Open ${cData.flag} Phrasebook & Tips →</span>
        </button>
      </div>
    `;
  }

  spotsGrid.innerHTML = countryBannerHtml + filtered.map((spot) => {
    const isFav = state.favorites.has(spot.id);
    const isSelected = state.selectedSpotId === spot.id;
    const districtName = typeof spot.district === 'object' ? (spot.district[state.lang] || spot.district.en) : spot.district;
    const curatorNote = typeof spot.curatorNote === 'object' ? (spot.curatorNote[state.lang] || spot.curatorNote.en) : spot.curatorNote;
    const howToFind = typeof spot.howToFind === 'object' ? (spot.howToFind[state.lang] || spot.howToFind.en) : spot.howToFind;
    const touristPerk = spot.touristPerk ? (typeof spot.touristPerk === 'object' ? (spot.touristPerk[state.lang] || spot.touristPerk.en) : spot.touristPerk) : null;

    return `
      <article class="spot-card ${isSelected ? 'selected-active' : ''}" data-id="${spot.id}" onclick="window.openSpotDrawer('${spot.id}')">
        <div class="card-media-wrap">
          <img src="${spot.images[0]}" alt="${spot.name}" class="card-img" loading="lazy">
          <div class="card-top-badges">
            <div style="display: flex; gap: 4px;">
              ${spot.editorPick ? `<span class="badge-pill editor-pick">${t.editorPick}</span>` : ''}
              <span class="badge-pill">${spot.priceRange}</span>
            </div>
            <button class="fav-btn ${isFav ? 'active' : ''}" title="${isFav ? 'Remove' : 'Save'}" onclick="event.stopPropagation(); window.toggleFavorite('${spot.id}')">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            </button>
          </div>
        </div>

        <div class="card-content">
          <div class="card-meta-row">
            <span class="card-district">${districtName}</span>
            <span class="card-price">${spot.priceRange}</span>
          </div>

          <div>
            <h3 class="card-title">${spot.name}</h3>
            <div class="card-cyrillic">${spot.cyrillicName}</div>
          </div>

          <p class="card-curator-snippet">${curatorNote}</p>

          ${touristPerk ? `
            <div class="card-perk-badge">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
              <span>${touristPerk}</span>
            </div>
          ` : ''}

          <div class="card-footer">
            <span class="how-to-find-preview" title="${howToFind}">
              🔑 ${howToFind}
            </span>
            <button class="quick-copy-taxi-btn" onclick="event.stopPropagation(); window.copyTaxiAddress('${spot.cyrillicAddress}')" title="${t.taxiPrompt}">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              <span>${t.taxiBtn}</span>
            </button>
          </div>
        </div>
      </article>
    `;
  }).join('');
}

/* ==========================================================================
   SPOT DETAIL DRAWER
   ========================================================================== */

function openSpotDrawer(spotId) {
  const allSpots = getSpots();
  const spot = allSpots.find(s => s.id === spotId);
  if (!spot) return;

  state.selectedSpotId = spotId;
  const allI18n = getI18N();
  const t = allI18n[state.lang] || allI18n.en;

  document.querySelectorAll('.spot-card').forEach(card => {
    card.classList.toggle('selected-active', card.dataset.id === spotId);
  });

  if (map) {
    map.flyTo(spot.coordinates, 15, { duration: 1.2 });
  }

  const districtName = typeof spot.district === 'object' ? (spot.district[state.lang] || spot.district.en) : spot.district;
  const curatorNote = typeof spot.curatorNote === 'object' ? (spot.curatorNote[state.lang] || spot.curatorNote.en) : spot.curatorNote;
  const howToFind = typeof spot.howToFind === 'object' ? (spot.howToFind[state.lang] || spot.howToFind.en) : spot.howToFind;
  const touristPerk = spot.touristPerk ? (typeof spot.touristPerk === 'object' ? (spot.touristPerk[state.lang] || spot.touristPerk.en) : spot.touristPerk) : null;
  const englishStaff = typeof spot.englishStaff === 'object' ? (spot.englishStaff[state.lang] || spot.englishStaff.en) : spot.englishStaff;

  drawerCategoryPill.textContent = spot.priceRange + ' • ' + districtName;

  drawerBody.innerHTML = `
    <div class="gallery-container">
      <img src="${spot.images[0]}" alt="${spot.name}" class="gallery-main-img" id="drawerMainImg">
      ${spot.images.length > 1 ? `
        <div class="gallery-thumbs">
          ${spot.images.map((img, i) => `
            <img src="${img}" class="thumb-img ${i === 0 ? 'active' : ''}" onclick="window.switchDrawerImg('${img}', this)" alt="Thumbnail ${i + 1}">
          `).join('')}
        </div>
      ` : ''}
    </div>

    <div class="drawer-title-block">
      <div style="display: flex; justify-content: space-between; align-items: baseline;">
        <h2 class="drawer-spot-name">${spot.name}</h2>
        <span style="font-family: var(--font-mono); font-weight: 700; font-size: 1.1rem; color: var(--color-red-ochre);">${spot.priceRange}</span>
      </div>
      <div class="drawer-spot-cyrillic">${spot.cyrillicName} — ${districtName}</div>
      <div class="drawer-key-tags">
        ${spot.tags.map(tag => `<span class="key-tag">#${tag}</span>`).join('')}
      </div>
    </div>

    <!-- Curator Review -->
    <div style="background-color: var(--bg-surface); padding: 1.1rem; border-radius: var(--radius-md); border: 1px solid var(--border-subtle);">
      <div style="font-family: var(--font-mono); font-size: 0.7rem; font-weight: 700; text-transform: uppercase; color: var(--color-red-ochre); margin-bottom: 0.3rem;">
        ★ ${t.curatorReviewTitle}
      </div>
      <p style="font-size: 0.95rem; line-height: 1.55; color: var(--text-primary); font-style: italic;">
        "${curatorNote}"
      </p>
    </div>

    <!-- Secret Entrance Guide -->
    <div class="secret-entrance-box">
      <span class="box-label">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        ${t.secretPasscodeTitle}
      </span>
      <p class="box-desc">${howToFind}</p>
    </div>

    <!-- Tourist Voucher Perk -->
    ${touristPerk ? `
      <div class="tourist-voucher-box">
        <span class="voucher-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4"/><path d="M4 6v12c0 1.1.9 2 2 2h14v-4"/><circle cx="18" cy="12" r="2"/></svg>
          ${t.touristPerkTitle}
        </span>
        <p style="font-size: 0.88rem; color: var(--text-secondary);">${t.showVoucherPrompt}</p>
        <div class="voucher-code-badge">
          <span>${touristPerk}</span>
          <button class="quick-copy-taxi-btn" onclick="window.copyVoucherCode('CHEREVICHKA')">Copy Code</button>
        </div>
      </div>
    ` : ''}

    <!-- Address & Taxi Helper -->
    <div class="address-helper-box">
      <div>
        <div style="font-size: 0.92rem; font-weight: 600;">${spot.address}</div>
        <div style="font-size: 0.88rem; color: var(--text-secondary);">${spot.cyrillicAddress}</div>
      </div>

      <div class="action-buttons-grid">
        <button class="btn-primary-action" onclick="window.copyTaxiAddress('${spot.cyrillicAddress}')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          <span>${t.copyForTaxi}</span>
        </button>
        <a href="https://yandex.ru/maps/?text=${encodeURIComponent(spot.cyrillicAddress)}" target="_blank" rel="noopener noreferrer" class="btn-secondary-action">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
          <span>${t.openYandexMaps}</span>
        </a>
      </div>
    </div>

    <!-- Specs Grid -->
    <div class="specs-grid">
      <div class="spec-card">
        <span class="spec-card-lbl">${t.openingHours}</span>
        <div class="spec-card-val">${spot.hours}</div>
      </div>
      <div class="spec-card">
        <span class="spec-card-lbl">${t.englishStaff}</span>
        <div class="spec-card-val">${englishStaff}</div>
      </div>
      <div class="spec-card">
        <span class="spec-card-lbl">${t.paymentMethods}</span>
        <div class="spec-card-val">${spot.payments.join(', ')}</div>
      </div>
      <div class="spec-card">
        <span class="spec-card-lbl">${t.socialLinks}</span>
        <div class="spec-card-val" style="display: flex; gap: 0.5rem; margin-top: 0.3rem;">
          ${spot.instagram ? `<a href="https://instagram.com/${spot.instagram.replace('@','')}" target="_blank" style="color: var(--color-red-ochre); text-decoration: underline;">IG</a>` : ''}
          ${spot.telegram ? `<a href="https://${spot.telegram}" target="_blank" style="color: var(--color-red-ochre); text-decoration: underline;">TG</a>` : ''}
          ${spot.website ? `<a href="${spot.website}" target="_blank" style="color: var(--color-red-ochre); text-decoration: underline;">Web</a>` : ''}
        </div>
      </div>
    </div>
  `;

  spotDrawer.classList.add('active');
  drawerOverlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeSpotDrawer() {
  spotDrawer.classList.remove('active');
  drawerOverlay.classList.remove('active');
  document.body.style.overflow = '';
  state.selectedSpotId = null;
  document.querySelectorAll('.spot-card').forEach(card => card.classList.remove('selected-active'));
}

/* ==========================================================================
   FAVORITES SYSTEM
   ========================================================================== */

function toggleFavorite(spotId) {
  if (state.favorites.has(spotId)) {
    state.favorites.delete(spotId);
    showToast('Removed from favorites');
  } else {
    state.favorites.add(spotId);
    showToast('Saved to your wardrobe itinerary!');
  }

  localStorage.setItem('cherevichka_favs', JSON.stringify([...state.favorites]));
  updateFavoritesBadge();
  renderSpots();
  renderSpotlight();
}

function updateFavoritesBadge() {
  favoritesCount.textContent = state.favorites.size;
}

function openFavoritesModal() {
  const allI18n = getI18N();
  const t = allI18n[state.lang] || allI18n.en;
  const container = document.getElementById('favoritesListContainer');
  const allSpots = getSpots();
  const favSpots = allSpots.filter(s => state.favorites.has(s.id));

  if (favSpots.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 2.5rem 1rem;">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="1.5" style="margin-bottom: 0.75rem;"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
        <h4 style="font-size: 1.1rem; margin-bottom: 0.3rem;">${t.emptyFavTitle}</h4>
        <p style="color: var(--text-secondary);">${t.emptyFavDesc}</p>
      </div>
    `;
  } else {
    container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 0.8rem;">
        ${favSpots.map(s => {
          const districtName = typeof s.district === 'object' ? (s.district[state.lang] || s.district.en) : s.district;
          return `
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.85rem; background: var(--bg-secondary); border-radius: var(--radius-md); border: 1px solid var(--border-subtle);">
              <div style="display: flex; align-items: center; gap: 0.75rem; cursor: pointer;" onclick="window.closeModal('favoritesModal'); window.openSpotDrawer('${s.id}')">
                <img src="${s.images[0]}" style="width: 48px; height: 48px; border-radius: var(--radius-sm); object-fit: cover;">
                <div>
                  <h4 style="font-size: 1rem; font-weight: 700;">${s.name}</h4>
                  <span style="font-family: var(--font-mono); font-size: 0.72rem; color: var(--text-muted);">${districtName} • ${s.priceRange}</span>
                </div>
              </div>
              <button class="icon-btn" onclick="window.toggleFavorite('${s.id}'); window.openFavoritesModal();" title="Remove">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  openModal('favoritesModal');
}

/* ==========================================================================
   WALKING TOURS & SURVIVAL GUIDE RENDERING
   ========================================================================== */

function renderWalkingTours() {
  const container = document.getElementById('toursListContainer');
  container.innerHTML = WALKING_TOURS.map(tour => {
    const title = typeof tour.title === 'object' ? (tour.title[state.lang] || tour.title.en) : tour.title;
    const city = typeof tour.city === 'object' ? (tour.city[state.lang] || tour.city.en) : tour.city;
    const desc = typeof tour.description === 'object' ? (tour.description[state.lang] || tour.description.en) : tour.description;

    return `
      <article class="tour-card">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span class="tour-pill">${city}</span>
          <span style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--text-muted);">
            ⏱️ ${tour.duration} • 🚶 ${tour.distance}
          </span>
        </div>
        <h3 class="tour-title">${title}</h3>
        <p style="font-size: 0.9rem; color: var(--text-secondary); line-height: 1.5;">${desc}</p>
        <div>
          <span style="font-family: var(--font-mono); font-size: 0.72rem; font-weight: 700; text-transform: uppercase; color: var(--text-muted);">Stops:</span>
          <ol class="tour-stops-list" style="margin-top: 0.35rem;">
            ${tour.stops.map(stop => `<li class="tour-stop-item">${stop}</li>`).join('')}
          </ol>
        </div>
      </article>
    `;
  }).join('');
}

function renderSurvivalCountryTabs() {
  const tabsContainer = document.getElementById('survivalCountryTabs');
  if (!tabsContainer) return;

  const countries = Object.keys(COUNTRY_SURVIVAL_GUIDES);
  tabsContainer.innerHTML = countries.map(cKey => {
    const cData = COUNTRY_SURVIVAL_GUIDES[cKey];
    const name = typeof cData.countryName === 'object' ? (cData.countryName[state.lang] || cData.countryName.en) : cData.countryName;
    const isActive = state.survivalCountry === cKey;
    return `
      <button class="survival-tab-btn ${isActive ? 'active' : ''}" data-survival-country="${cKey}">
        <span>${cData.flag}</span>
        <span>${name}</span>
      </button>
    `;
  }).join('');
}

function renderSurvivalTips() {
  renderSurvivalCountryTabs();
  const container = document.getElementById('survivalListContainer');
  if (!container) return;

  const cData = COUNTRY_SURVIVAL_GUIDES[state.survivalCountry] || COUNTRY_SURVIVAL_GUIDES.russia;

  container.innerHTML = cData.sections.map(sec => {
    const title = typeof sec.title === 'object' ? (sec.title[state.lang] || sec.title.en) : sec.title;
    
    let bodyHtml = '';
    if (sec.content) {
      const content = typeof sec.content === 'object' ? (sec.content[state.lang] || sec.content.en) : sec.content;
      bodyHtml = `<p class="tip-desc">${content}</p>`;
    } else if (sec.phrases) {
      bodyHtml = `
        <div class="phrase-table">
          ${sec.phrases.map(p => {
            const meaning = typeof p.meaning === 'object' ? (p.meaning[state.lang] || p.meaning.en) : p.meaning;
            return `
              <div class="phrase-item-row">
                <div>
                  <div class="phrase-orig">${p.original}</div>
                  <div class="phrase-trans">Pronunciation: <em>${p.translit}</em></div>
                </div>
                <div class="phrase-meaning">${meaning}</div>
              </div>
            `;
          }).join('')}
        </div>
      `;
    }

    return `
      <div class="tip-item-card">
        <div class="tip-title">
          <span style="font-family: var(--font-mono); font-size: 0.72rem; background: var(--color-red-ochre-light); color: var(--color-red-ochre); padding: 0.2rem 0.6rem; border-radius: var(--radius-full); font-weight: 700;">${cData.flag} ${cData.key.toUpperCase()}</span>
          <span>${title}</span>
        </div>
        ${bodyHtml}
      </div>
    `;
  }).join('');
}

/* ==========================================================================
   MODAL CONTROLLERS & TOASTS
   ========================================================================== */

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

function showToast(message) {
  const toastContainer = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = 'toast-item';
  toast.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
    <span>${message}</span>
  `;
  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 300);
  }, 2800);
}

/* ==========================================================================
   CLIPBOARD & QUICK HELPERS
   ========================================================================== */

function copyTaxiAddress(address) {
  const allI18n = getI18N();
  const t = allI18n[state.lang] || allI18n.en;
  navigator.clipboard.writeText(address).then(() => {
    showToast(t.copiedTaxi);
  }).catch(() => {
    showToast(address);
  });
}

function copyVoucherCode(code) {
  const allI18n = getI18N();
  const t = allI18n[state.lang] || allI18n.en;
  navigator.clipboard.writeText(code).then(() => {
    showToast(t.copiedVoucher);
  });
}

function switchDrawerImg(src, thumbElement) {
  document.getElementById('drawerMainImg').src = src;
  document.querySelectorAll('.thumb-img').forEach(t => t.classList.remove('active'));
  thumbElement.classList.add('active');
}

function resetFilters() {
  state.city = 'all';
  state.category = 'all';
  state.style = 'all';
  state.price = 'all';
  state.searchQuery = '';
  searchInput.value = '';

  document.querySelectorAll('.city-btn').forEach(b => b.classList.toggle('active', b.dataset.city === 'all'));
  document.querySelectorAll('.discipline-tab').forEach(b => b.classList.toggle('active', b.dataset.category === 'all'));
  document.querySelectorAll('.style-chip').forEach(b => b.classList.toggle('active', b.dataset.style === 'all'));
  document.querySelectorAll('.price-btn').forEach(b => b.classList.toggle('active', b.dataset.price === 'all'));

  renderSpots();
}

/* ==========================================================================
   EVENT LISTENERS SETUP
   ========================================================================== */

function setupEventListeners() {
  // Theme toggle
  themeToggleBtn?.addEventListener('click', toggleTheme);

  // Logo button -> Home
  document.getElementById('navLogoBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    navigateTo('home');
  });

  // Top Nav Tabs
  navTabHome?.addEventListener('click', () => navigateTo('home'));
  navTabDirectory?.addEventListener('click', () => navigateTo('directory'));
  document.getElementById('navTabTours')?.addEventListener('click', () => openModal('toursModal'));

  // Survival Guide modal openers
  const openSurvivalGuideHandler = () => {
    if (state.city !== 'all' && COUNTRY_SURVIVAL_GUIDES[state.city]) {
      state.survivalCountry = state.city;
    }
    renderSurvivalTips();
    openModal('survivalModal');
  };

  document.getElementById('openSurvivalBtn')?.addEventListener('click', openSurvivalGuideHandler);
  document.getElementById('navTabSurvival')?.addEventListener('click', openSurvivalGuideHandler);

  // Survival modal country switcher tabs
  const survivalCountryTabs = document.getElementById('survivalCountryTabs');
  if (survivalCountryTabs) {
    survivalCountryTabs.addEventListener('click', (e) => {
      const btn = e.target.closest('.survival-tab-btn');
      if (!btn) return;
      state.survivalCountry = btn.dataset.survivalCountry;
      renderSurvivalTips();
    });
  }

  // Hero CTA Buttons on Home
  document.getElementById('heroExploreDirBtn')?.addEventListener('click', () => navigateTo('directory'));
  document.getElementById('spotlightViewAllBtn')?.addEventListener('click', () => navigateTo('directory'));

  document.querySelectorAll('[data-goto-city]').forEach(btn => {
    btn.addEventListener('click', () => {
      const city = btn.dataset.gotoCity;
      if (COUNTRY_SURVIVAL_GUIDES[city]) state.survivalCountry = city;
      navigateTo('directory', { city });
    });
  });

  document.querySelectorAll('[data-goto-category]').forEach(card => {
    card.addEventListener('click', () => {
      const category = card.dataset.gotoCategory;
      navigateTo('directory', { category });
    });
  });

  // Language Switcher (EN / RU / ZH)
  langSwitcher?.addEventListener('click', (e) => {
    const btn = e.target.closest('.lang-btn');
    if (!btn) return;
    applyLanguage(btn.dataset.lang);
  });

  // Directory City Switcher
  dirCitySwitcher?.addEventListener('click', (e) => {
    const btn = e.target.closest('.city-btn');
    if (!btn) return;
    document.querySelectorAll('#dirCitySwitcher .city-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.city = btn.dataset.city;
    if (state.city !== 'all' && COUNTRY_SURVIVAL_GUIDES[state.city]) {
      state.survivalCountry = state.city;
    }
    renderSpots();
  });

  // Primary Disciplines / Category Tabs
  primaryCategoryTabs?.addEventListener('click', (e) => {
    const tab = e.target.closest('.discipline-tab');
    if (!tab) return;
    document.querySelectorAll('.discipline-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    state.category = tab.dataset.category;
    renderSpots();
  });

  // Style Filter Chips
  styleChips?.addEventListener('click', (e) => {
    const chip = e.target.closest('.style-chip');
    if (!chip) return;
    document.querySelectorAll('.style-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    state.style = chip.dataset.style;
    renderSpots();
  });

  // Price Filters
  priceFilters?.addEventListener('click', (e) => {
    const btn = e.target.closest('.price-btn');
    if (!btn) return;
    document.querySelectorAll('.price-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.price = btn.dataset.price;
    renderSpots();
  });

  // Search input
  searchInput?.addEventListener('input', (e) => {
    state.searchQuery = e.target.value;
    renderSpots();
  });

  // View Switcher (Split / Grid / Map)
  viewSwitcher?.addEventListener('click', (e) => {
    const btn = e.target.closest('.view-toggle-btn');
    if (!btn) return;
    document.querySelectorAll('.view-toggle-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.view = btn.dataset.view;
    mainLayoutContainer.className = `layout-${state.view}`;
    setTimeout(() => {
      if (map) map.invalidateSize();
    }, 150);
  });

  // Drawer Close
  drawerCloseBtn?.addEventListener('click', closeSpotDrawer);
  drawerOverlay?.addEventListener('click', closeSpotDrawer);

  // Modals Open
  document.getElementById('openSubmitBtn')?.addEventListener('click', () => openModal('submitModal'));
  document.getElementById('openFavoritesBtn')?.addEventListener('click', openFavoritesModal);

  // Footer Links
  document.getElementById('footerSubmitLink')?.addEventListener('click', (e) => {
    e.preventDefault();
    openModal('submitModal');
  });
  document.getElementById('footerAdvertiseLink')?.addEventListener('click', (e) => {
    e.preventDefault();
    openModal('submitModal');
  });

  document.querySelectorAll('[data-footer-city]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      const city = el.dataset.footerCity;
      navigateTo('directory', { city });
    });
  });

  // Close modals
  document.querySelectorAll('.close-modal-btn').forEach(btn => {
    btn.addEventListener('click', () => closeModal(btn.dataset.modal));
  });

  document.querySelectorAll('.modal-dialog-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        closeModal(overlay.id);
      }
    });
  });

  // Submit Spot Form ($10 Listing)
  submitSpotForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const newLead = {
      id: 'lead-' + Date.now(),
      storeName: document.getElementById('storeName').value.trim(),
      email: document.getElementById('storeEmail').value.trim(),
      city: document.getElementById('storeCity').value,
      address: document.getElementById('storeAddress').value.trim(),
      category: document.getElementById('storeCategory').value,
      price: document.getElementById('storePrice').value,
      description: document.getElementById('storeDescription').value.trim(),
      contact: document.getElementById('storeContact').value.trim(),
      date: new Date().toISOString().split('T')[0],
      status: 'pending'
    };

    const existingLeads = JSON.parse(localStorage.getItem('cherevichka_inbound_leads') || '[]');
    existingLeads.unshift(newLead);
    localStorage.setItem('cherevichka_inbound_leads', JSON.stringify(existingLeads));

    const allI18n = getI18N();
    const t = allI18n[state.lang] || allI18n.en;
    showToast(t.submitSuccess);
    submitSpotForm.reset();
    closeModal('submitModal');
  });

  // Mobile Floating View Switcher (Map <-> List)
  const btnMobileToggleView = document.getElementById('btnMobileToggleView');
  const txtMobileToggleIcon = document.getElementById('txtMobileToggleIcon');
  const txtMobileToggleText = document.getElementById('txtMobileToggleText');

  if (btnMobileToggleView) {
    btnMobileToggleView.addEventListener('click', () => {
      const isMapActive = mainLayoutContainer.classList.toggle('mobile-show-map-active');
      const allI18n = getI18N();
      const t = allI18n[state.lang] || allI18n.en;

      if (isMapActive) {
        txtMobileToggleIcon.textContent = '📋';
        txtMobileToggleText.textContent = t.mobileShowList || 'Show List';
        if (map) setTimeout(() => map.invalidateSize(), 200);
      } else {
        txtMobileToggleIcon.textContent = '📍';
        txtMobileToggleText.textContent = t.mobileShowMap || 'Show Map';
      }
    });
  }

  // Global ESC key listener
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeSpotDrawer();
      document.querySelectorAll('.modal-dialog-overlay.active').forEach(m => closeModal(m.id));
    }
  });
}

function openCountryGuideModal(countryKey) {
  if (COUNTRY_SURVIVAL_GUIDES[countryKey]) {
    state.survivalCountry = countryKey;
  }
  renderSurvivalTips();
  openModal('survivalModal');
}

/* ==========================================================================
   GLOBAL EXPORTS
   ========================================================================== */

window.openCountryGuideModal = openCountryGuideModal;
window.navigateTo = navigateTo;
window.openSpotDrawer = openSpotDrawer;
window.toggleFavorite = toggleFavorite;
window.copyTaxiAddress = copyTaxiAddress;
window.copyVoucherCode = copyVoucherCode;
window.switchDrawerImg = switchDrawerImg;
window.openFavoritesModal = openFavoritesModal;
window.closeModal = closeModal;
window.resetFilters = resetFilters;

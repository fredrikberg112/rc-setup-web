// ===== RC Setup Tracker =====
// LocalStorage data layer + SPA router

const DB = {
  get(key) {
    try { return JSON.parse(localStorage.getItem('rc_' + key) || '[]'); }
    catch { return []; }
  },
  set(key, val) { localStorage.setItem('rc_' + key, JSON.stringify(val)); },
  uid() { return Date.now().toString(36) + Math.random().toString(36).substr(2, 6); }
};

let currentModelId = null;
let currentSetupId = null;
let tempPhotos = [];

// ===== STATE =====
function loadState() {
  if (DB.get('models').length === 0) {
    seedData();
  }
  updateStats();
}

function seedData() {
  const model1 = {
    id: DB.uid(),
    name: 'RX8E 2026',
    brand: 'XRAY',
    type: 'On-Road',
    setupSheet: 'images/setup-rx8e-2026.jpg',
    dateAdded: new Date().toISOString()
  };
  const model2 = {
    id: DB.uid(),
    name: 'X4 2025',
    brand: 'XRAY',
    type: 'On-Road',
    setupSheet: 'images/setup-x4-asphalt.jpg',
    dateAdded: new Date().toISOString()
  };
  const setup1 = {
    id: DB.uid(), modelId: model1.id,
    name: 'RX8E Basic Setup 2026',
    date: new Date().toISOString(),
    trackId: '',
    notes: 'Grundsetup för RX8E 2026 enligt officiell setup sheet. Basic setup med standardkonfiguration.',
    isFavorite: true, performanceRating: 4,
    escModel: 'Hobbywing XR10', escPunch: 5, escDragBrake: 5,
    escBrakeForce: 50, escTiming: '0°', escCutoff: '3.2V/cell',
    escTemp: '85°C', escNotes: 'Stock ESC settings',
    chRhF: 8.0, chRhR: 9.0, chCbF: -2.0, chCbR: -2.0,
    chToF: 1.5, chToR: 3.0, chShF: '600', chShR: '600',
    chSpF: '5.6', chSpR: '5.0',
    chDfF: '7000', chDfR: '3000', chDfC: '10000',
    chArF: false, chArR: false, chNotes: 'RX8E 2026 Basic Setup: Ride height 8.0mm front, 9.0mm rear. Camber -2.0° front/rear. Toe-out 1.5° front, 3° rear. Shock oil 600 both. Shock positions: 2-DOT KIT front, 3 rear. Shock springs 5.6 front, 5.0 rear. Diff oil 7000/3000/10000. No anti-roll bars. Body position 17, wing height 10. Wheelbase 287, track width 250/260. Body post: Rear, Body mount: NO. Short pack.',
    tireBrand: 'Pro-Line', tireModel: 'Blockade',
    tireCompound: 'M3', tireInsert: 'Closed Cell',
    tireGlue: 'Fresh', tireWear: 'Nya',
    tireNotes: 'Pro-Line Blockade M3 compound',
    photos: []
  };
  const setup2 = {
    id: DB.uid(), modelId: model2.id,
    name: 'X4 Basic Asfalt',
    date: new Date().toISOString(),
    trackId: '',
    notes: 'Grundsetup för asfalt enligt setup sheet',
    isFavorite: true, performanceRating: 4,
    escModel: 'Hobbywing', escPunch: 5, escDragBrake: 5,
    escBrakeForce: 50, escTiming: '0°', escCutoff: '3.4V/cell',
    escTemp: '85°C', escNotes: 'Stock ESC settings',
    chRhF: 5.2, chRhR: 5.4, chCbF: -2.0, chCbR: -2.0,
    chToF: 0.0, chToR: 2.0, chShF: '350', chShR: '350',
    chSpF: '2.5-2.8', chSpR: '2.6',
    chDfF: '7000', chDfR: '3000', chDfC: '10000',
    chArF: true, chArR: true, chNotes: 'Basic asphalt setup: Ride height 5.2mm front, 5.4mm rear. Camber -2.0° front and rear. Toe 0° front, 2° rear. Shock oil 350 both. Diff oil 7000/3000/10000. Anti-roll bars both ends. Shock springs 2.5-2.8 front, 2.6 rear.',
    tireBrand: 'HUDY', tireModel: 'A1-36',
    tireCompound: 'Red', tireInsert: 'Closed Cell',
    tireGlue: 'Fresh', tireWear: 'Nya',
    tireNotes: 'HUDY A1-36 Red compound, additive HUDY Red, additive timing 15min, wipe off time 2min, tire warmers 15min temp 65°. Side wall glue.',
    photos: []
  };
  DB.set('models', [model1, model2]);
  DB.set('setups', [setup1, setup2]);
  DB.set('tracks', []);
}

// ===== NAVIGATION =====
function showView(viewName) {
  document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
  document.getElementById('view-' + viewName).classList.remove('hidden');

  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const navBtn = document.querySelector(`.nav-item[data-view="${viewName}"]`);
  if (navBtn) navBtn.classList.add('active');

  const titleMap = {
    'models': 'RC Setup Tracker',
    'add-model': 'Ny Modell',
    'model-detail': 'Modell',
    'add-setup': 'Ny Setup',
    'setup-detail': 'Setup',
    'compare': 'Jämför',
    'tracks': 'Banor',
    'add-track': 'Ny Bana',
    'all-setups': 'Alla Setups'
  };
  document.getElementById('page-title').textContent = titleMap[viewName] || 'RC Setup Tracker';

  document.getElementById('back-btn').classList.toggle('hidden',
    ['models','compare','tracks','all-setups'].includes(viewName));
  document.getElementById('add-btn').classList.toggle('hidden',
    viewName !== 'models');

  if (viewName === 'models') renderModels();
  if (viewName === 'all-setups') renderAllSetups();
  if (viewName === 'tracks') renderTracks();
  if (viewName === 'compare') initCompare();
  if (viewName === 'model-detail') renderModelDetail(currentModelId);
  if (viewName === 'setup-detail') renderSetupDetail(currentSetupId);
  if (viewName === 'add-setup') initAddSetup();

  window.scrollTo(0, 0);
}

document.getElementById('back-btn').onclick = () => {
  const view = document.querySelector('.view:not(.hidden)').id.replace('view-', '');
  const backMap = {
    'add-model': 'models',
    'model-detail': 'models',
    'add-setup': 'model-detail',
    'setup-detail': 'model-detail',
    'add-track': 'tracks'
  };
  showView(backMap[view] || 'models');
};

document.getElementById('add-btn').onclick = () => showView('add-model');

// ===== MODELS =====
function renderModels() {
  const models = DB.get('models').sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
  const setups = DB.get('setups');
  const list = document.getElementById('models-list');
  const empty = document.getElementById('models-empty');

  if (!models.length) {
    list.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');

  list.innerHTML = models.map(m => {
    const count = setups.filter(s => s.modelId === m.id).length;
    return `
      <div class="card" onclick="openModel('${m.id}')">
        <div class="card-row">
          <div class="card-icon">🚗</div>
          <div class="card-body">
            <div class="card-title">${esc(m.name)}</div>
            <div class="card-subtitle">${esc(m.brand)} · ${esc(m.type)}</div>
            ${count ? `<div class="card-badge">${count} setup${count > 1 ? 's' : ''}</div>` : ''}
          </div>
          <div class="card-chevron">›</div>
        </div>
      </div>
    `;
  }).join('');
}

function openModel(id) {
  currentModelId = id;
  showView('model-detail');
}

document.getElementById('form-add-model').onsubmit = (e) => {
  e.preventDefault();
  const model = {
    id: DB.uid(),
    name: document.getElementById('model-name').value.trim(),
    brand: document.getElementById('model-brand').value.trim(),
    type: document.getElementById('model-type').value,
    dateAdded: new Date().toISOString()
  };
  DB.set('models', [...DB.get('models'), model]);
  document.getElementById('form-add-model').reset();
  showView('models');
  updateStats();
};

// ===== MODEL DETAIL =====
function renderModelDetail(id) {
  const models = DB.get('models');
  const model = models.find(m => m.id === id);
  if (!model) return showView('models');

  const setups = DB.get('setups').filter(s => s.modelId === id).sort((a, b) => new Date(b.date) - new Date(a.date));

  document.getElementById('model-info-card').innerHTML = `
    <div class="card-row">
      <div class="card-icon">🚗</div>
      <div class="card-body">
        <div class="card-title">${esc(model.name)}</div>
        <div class="card-subtitle">${esc(model.brand)} · ${esc(model.type)}</div>
        <div class="card-badge">${setups.length} setup${setups.length !== 1 ? 's' : ''}</div>
      </div>
    </div>
    ${model.setupSheet ? `<div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--border);"><img src="${esc(model.setupSheet)}" style="width:100%;border-radius:8px;cursor:pointer;" onclick="window.open('${esc(model.setupSheet)}','_blank')"><div style="font-size:0.75rem;color:var(--text-muted);margin-top:4px;text-align:center;">Setup Sheet - klicka för full storlek</div></div>` : ''}
    <div style="margin-top:12px;">
      <button type="button" class="btn btn-secondary btn-full" onclick="document.getElementById('setup-sheet-input').click()">${model.setupSheet ? '🖼️ Byt Setup Sheet' : '🖼️ Lägg till Setup Sheet'}</button>
      <input type="file" id="setup-sheet-input" accept="image/*" class="hidden" onchange="handleSetupSheetUpload(this,'${model.id}')">
    </div>
  `;

  const list = document.getElementById('setups-list');
  const empty = document.getElementById('setups-empty');
  document.getElementById('setup-count-badge').textContent = setups.length;

  if (!setups.length) {
    list.innerHTML = '';
    empty.classList.remove('hidden');
  } else {
    empty.classList.add('hidden');
    list.innerHTML = setups.map(s => setupRowHTML(s, true)).join('');
  }
}

function setupRowHTML(s, withModel) {
  const track = DB.get('tracks').find(t => t.id === s.trackId);
  return `
    <div class="card" onclick="openSetup('${s.id}')">
      <div class="card-row">
        <div style="width:14px;height:14px;border-radius:50%;background:${getRatingColor(s.performanceRating)};flex-shrink:0;margin-top:4px;"></div>
        <div class="card-body">
          <div class="card-title">${esc(s.name)}</div>
          ${withModel ? '' : `<div class="card-subtitle">${esc(s.modelBrand || '')} ${esc(s.modelName || '')}</div>`}
          <div style="display:flex;gap:12px;margin-top:4px;">
            <span style="font-size:0.75rem;color:var(--text-muted);">${fmtDate(s.date)}</span>
            ${s.isFavorite ? '⭐' : ''}
            ${track ? `<span style="font-size:0.75rem;color:var(--accent);">🏁 ${esc(track.name)}</span>` : ''}
          </div>
        </div>
        <div class="card-chevron">›</div>
      </div>
    </div>
  `;
}

function getRatingColor(r) {
  return ['#f44336','#f44336','#ff9800','#ffc107','#4caf50'][r - 1] || '#888';
}

function openSetup(id) {
  currentSetupId = id;
  showView('setup-detail');
}

// ===== SETUP SHEET UPLOAD =====
function handleSetupSheetUpload(input, modelId) {
  const file = input.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const dataUrl = e.target.result;
    const models = DB.get('models');
    const model = models.find(m => m.id === modelId);
    if (model) {
      model.setupSheet = dataUrl;
      DB.set('models', models);
      renderModelDetail(modelId);
    }
  };
  reader.readAsDataURL(file);
}

function fmtDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('sv-SE', { month: 'short', day: 'numeric' });
}

// ===== SETUP DETAIL =====
function renderSetupDetail(id) {
  const s = DB.get('setups').find(x => x.id === id);
  if (!s) return showView('models');
  const model = DB.get('models').find(m => m.id === s.modelId);
  const track = DB.get('tracks').find(t => t.id === s.trackId);
  const labels = { 5: 'Perfekt', 4: 'Bra', 3: 'OK', 2: 'Justera', 1: 'Dålig' };
  const rClass = `r${s.performanceRating}`;

  document.getElementById('setup-detail-content').innerHTML = `
    <div class="setup-detail-header">
      <h2>${esc(s.name)}</h2>
      <div class="setup-meta">
        <span>📅 ${fmtDate(s.date)}</span>
        ${model ? `<span>🚗 ${esc(model.brand)} ${esc(model.name)}</span>` : ''}
        ${track ? `<span>🏁 ${esc(track.name)}</span>` : ''}
        ${s.isFavorite ? '<span>⭐ Favorit</span>' : ''}
      </div>
      <div class="rating-badge ${rClass}">${s.performanceRating}/5 — ${labels[s.performanceRating]}</div>
      ${s.notes ? `<p style="margin-top:12px;color:var(--text-muted);font-size:0.9rem;">${esc(s.notes)}</p>` : ''}
    </div>

    ${s.photos && s.photos.length ? `
      <div class="spec-table">
        <h3>📸 Bilder</h3>
        <div class="photo-grid">${s.photos.map(p => `<img src="${p}" class="photo-thumb">`).join('')}</div>
      </div>
    ` : ''}

    ${specTable('⚡ ESC', [
      ['Modell', s.escModel], ['Punch', s.escPunch + '/10'],
      ['Drag Brake', s.escDragBrake + '%'], ['Brake Force', s.escBrakeForce + '%'],
      ['Timing', s.escTiming], ['Cutoff', s.escCutoff],
      ['Temp Limit', s.escTemp], ['Anteckningar', s.escNotes]
    ])}

    ${specTable('🔧 Chassi', [
      ['Ride Height Fram', s.chRhF + ' mm'], ['Ride Height Bak', s.chRhR + ' mm'],
      ['Camber Fram', s.chCbF + '°'], ['Camber Bak', s.chCbR + '°'],
      ['Toe Fram', s.chToF + '°'], ['Toe Bak', s.chToR + '°'],
      ['Shock Fram', s.chShF], ['Shock Bak', s.chShR],
      ['Spring Fram', s.chSpF], ['Spring Bak', s.chSpR],
      ['Diff Fram', s.chDfF], ['Diff Bak', s.chDfR], ['Diff Center', s.chDfC],
      ['Anti-Roll Fram', s.chArF ? 'Ja' : 'Nej'], ['Anti-Roll Bak', s.chArR ? 'Ja' : 'Nej'],
      ['Anteckningar', s.chNotes]
    ])}

    ${specTable('🛞 Däck', [
      ['Märke', s.tireBrand], ['Modell', s.tireModel],
      ['Compound', s.tireCompound], ['Insert', s.tireInsert],
      ['Lim-status', s.tireGlue], ['Slitage', s.tireWear],
      ['Anteckningar', s.tireNotes]
    ])}

    <div class="action-bar">
      <button class="btn btn-secondary" onclick="editSetup('${s.id}')">✏️ Redigera</button>
      <button class="btn btn-danger" onclick="deleteSetup('${s.id}')">🗑️ Ta bort</button>
    </div>
    <div style="height:40px;"></div>
  `;
}

function specTable(title, specs) {
  const rows = specs.filter(([_, v]) => v !== '' && v !== undefined && v !== null)
    .map(([k, v]) => `<div class="spec-row"><span class="spec-label">${esc(k)}</span><span class="spec-value">${esc(String(v))}</span></div>`).join('');
  if (!rows) return '';
  return `<div class="spec-table"><h3>${esc(title)}</h3>${rows}</div>`;
}

function deleteSetup(id) {
  if (!confirm('Ta bort denna setup?')) return;
  DB.set('setups', DB.get('setups').filter(s => s.id !== id));
  showView('model-detail');
  updateStats();
}

function editSetup(id) {
  alert('Redigering kommer i nästa version! För nu, ta bort och skapa ny.');
}

// ===== ADD SETUP =====
function initAddSetup() {
  tempPhotos = [];
  renderPhotoGrid();
  loadTrackSelect('setup-track');
  initStarRating();
  
  // Kolla om vi skapar setup för RX8E eller X4 och förfyll med lämpliga värden
  const model = DB.get('models').find(m => m.id === currentModelId);
  if (model) {
    if (model.name.includes('RX8E')) {
      resetToRX8EBasic();
    } else if (model.name.includes('X4')) {
      resetToBasicAsphalt();
    }
  }
  
  // Uppdatera knapptext
  updateResetButtonText();
}

// Återställ till X4 Basic Asfalt värden
function resetToBasicAsphalt() {
  if (!confirm('Återställa alla fält till X4 Basic Asfalt värden?')) return;
  
  document.getElementById('setup-name').value = '';
  document.getElementById('setup-notes').value = 'Grundsetup för asfalt';
  
  // ESC
  document.getElementById('esc-model').value = 'Hobbywing';
  document.getElementById('esc-punch').value = '5';
  document.getElementById('esc-drag-brake').value = '5';
  document.getElementById('esc-brake-force').value = '50';
  document.getElementById('esc-timing').value = '0°';
  document.getElementById('esc-cutoff').value = '3.4V/cell';
  document.getElementById('esc-temp').value = '85°C';
  document.getElementById('esc-notes').value = 'Stock ESC settings';
  
  // Chassi
  document.getElementById('ch-rh-f').value = '5.2';
  document.getElementById('ch-rh-r').value = '5.4';
  document.getElementById('ch-cb-f').value = '-2.0';
  document.getElementById('ch-cb-r').value = '-2.0';
  document.getElementById('ch-to-f').value = '0.0';
  document.getElementById('ch-to-r').value = '2.0';
  document.getElementById('ch-sh-f').value = '350';
  document.getElementById('ch-sh-r').value = '350';
  document.getElementById('ch-sp-f').value = '2.5-2.8';
  document.getElementById('ch-sp-r').value = '2.6';
  document.getElementById('ch-df-f').value = '7000';
  document.getElementById('ch-df-r').value = '3000';
  document.getElementById('ch-df-c').value = '10000';
  document.getElementById('ch-ar-f').checked = true;
  document.getElementById('ch-ar-r').checked = true;
  document.getElementById('ch-notes').value = 'Basic asphalt setup: Ride height 5.2mm front, 5.4mm rear. Camber -2.0° front and rear. Toe 0° front, 2° rear. Shock oil 350 both. Diff oil 7000/3000/10000. Anti-roll bars both ends. Shock springs 2.5-2.8 front, 2.6 rear.';
  
  // Däck
  document.getElementById('tire-brand').value = 'HUDY';
  document.getElementById('tire-model').value = 'A1-36';
  document.getElementById('tire-compound').value = 'Red';
  document.getElementById('tire-insert').value = 'Closed Cell';
  document.getElementById('tire-glue').value = 'Fresh';
  document.getElementById('tire-wear').value = 'Nya';
  document.getElementById('tire-notes').value = 'HUDY A1-36 Red compound, additive HUDY Red, additive timing 15min, wipe off time 2min, tire warmers 15min temp 65°. Side wall glue.';
  
  // Rating
  document.getElementById('setup-rating').value = '4';
  document.querySelectorAll('.rating-input .star').forEach((s, i) => s.classList.toggle('active', i < 4));
  
  alert('Fält återställda till X4 Basic Asfalt! Ändra setup-namn och spara.');
}

// Återställ till RX8E Basic värden
function resetToRX8EBasic() {
  if (!confirm('Återställa alla fält till RX8E Basic värden?')) return;
  document.getElementById('setup-name').value = '';
  document.getElementById('setup-notes').value = 'Grundsetup för RX8E';
  
  // ESC
  document.getElementById('esc-model').value = 'Hobbywing XR10';
  document.getElementById('esc-punch').value = '5';
  document.getElementById('esc-drag-brake').value = '5';
  document.getElementById('esc-brake-force').value = '50';
  document.getElementById('esc-timing').value = '0°';
  document.getElementById('esc-cutoff').value = '3.2V/cell';
  document.getElementById('esc-temp').value = '85°C';
  document.getElementById('esc-notes').value = 'Stock ESC settings';
  
  // Chassi
  document.getElementById('ch-rh-f').value = '5.0';
  document.getElementById('ch-rh-r').value = '5.0';
  document.getElementById('ch-cb-f').value = '-2.0';
  document.getElementById('ch-cb-r').value = '-2.0';
  document.getElementById('ch-to-f').value = '0.0';
  document.getElementById('ch-to-r').value = '2.0';
  document.getElementById('ch-sh-f').value = '450';
  document.getElementById('ch-sh-r').value = '400';
  document.getElementById('ch-sp-f').value = 'Medium';
  document.getElementById('ch-sp-r').value = 'Medium-Soft';
  document.getElementById('ch-df-f').value = '7000';
  document.getElementById('ch-df-r').value = '3000';
  document.getElementById('ch-df-c').value = '10000';
  document.getElementById('ch-ar-f').checked = true;
  document.getElementById('ch-ar-r').checked = false;
  document.getElementById('ch-notes').value = 'Basic RX8E setup: Ride height 5.0mm front/rear. Camber -2.0° front/rear. Toe 0° front, 2° rear. Shock oil 450/400. Diff oil 7000/3000/10000. Anti-roll bar front only.';
  
  // Däck
  document.getElementById('tire-brand').value = 'Pro-Line';
  document.getElementById('tire-model').value = 'Blockade';
  document.getElementById('tire-compound').value = 'M3';
  document.getElementById('tire-insert').value = 'Closed Cell';
  document.getElementById('tire-glue').value = 'Fresh';
  document.getElementById('tire-wear').value = 'Nya';
  document.getElementById('tire-notes').value = 'Pro-Line Blockade M3 compound';
  
  // Rating
  document.getElementById('setup-rating').value = '4';
  document.querySelectorAll('.rating-input .star').forEach((s, i) => s.classList.toggle('active', i < 4));
}

// Smart reset baserat på vilken modell som är vald
function resetCurrentSetup() {
  const model = DB.get('models').find(m => m.id === currentModelId);
  if (!model) {
    alert('Ingen modell vald');
    return;
  }
  
  if (model.name.includes('RX8E')) {
    resetToRX8EBasic();
  } else if (model.name.includes('X4')) {
    resetToBasicAsphalt();
  } else {
    // Generisk reset för andra modeller
    document.getElementById('setup-name').value = '';
    document.getElementById('setup-notes').value = '';
    document.querySelectorAll('input, select').forEach(el => {
      if (el.type === 'checkbox') el.checked = false;
      else if (el.id !== 'setup-rating' && el.id !== 'photo-input') el.value = '';
    });
    document.getElementById('esc-punch').value = '5';
    document.getElementById('esc-drag-brake').value = '5';
    document.getElementById('esc-brake-force').value = '50';
    document.getElementById('esc-timing').value = '0°';
    document.getElementById('esc-cutoff').value = '3.2V/cell';
    document.getElementById('esc-temp').value = '85°C';
    document.getElementById('setup-rating').value = '3';
    document.querySelectorAll('.rating-input .star').forEach((s, i) => s.classList.toggle('active', i < 3));
    alert('Formulär återställt till neutrala värden');
  }
}

window.resetCurrentSetup = resetCurrentSetup;

function loadTrackSelect(id) {
  const sel = document.getElementById(id);
  const tracks = DB.get('tracks');
  sel.innerHTML = '<option value="">Välj bana...</option>' +
    tracks.map(t => `<option value="${t.id}">${esc(t.name)}</option>`).join('');
}

function initStarRating() {
  document.querySelectorAll('.rating-input .star').forEach(star => {
    star.onclick = () => {
      const val = parseInt(star.dataset.value);
      document.getElementById('setup-rating').value = val;
      document.querySelectorAll('.rating-input .star').forEach((s, i) => {
        s.classList.toggle('active', i < val);
      });
    };
  });
  document.querySelectorAll('.rating-input .star').forEach((s, i) => s.classList.toggle('active', i < 3));
}

// Photo handling
document.getElementById('photo-input').onchange = function(e) {
  [...e.target.files].forEach(file => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      tempPhotos.push(ev.target.result);
      renderPhotoGrid();
    };
    reader.readAsDataURL(file);
  });
};

function renderPhotoGrid() {
  const grid = document.getElementById('setup-photos');
  if (!tempPhotos.length) { grid.innerHTML = ''; return; }
  grid.innerHTML = tempPhotos.map((p, i) => `
    <div style="position:relative;">
      <img src="${p}" class="photo-thumb">
      <button onclick="removePhoto(${i})" style="position:absolute;top:-4px;right:-4px;background:#f44336;color:#fff;border:none;border-radius:50%;width:22px;height:22px;font-size:12px;cursor:pointer;">×</button>
    </div>
  `).join('');
}

window.removePhoto = (i) => { tempPhotos.splice(i, 1); renderPhotoGrid(); };

// Submit setup
document.getElementById('form-add-setup').onsubmit = (e) => {
  e.preventDefault();
  const model = DB.get('models').find(m => m.id === currentModelId);
  if (!model) return;

  const setup = {
    id: DB.uid(), modelId: currentModelId,
    name: document.getElementById('setup-name').value.trim(),
    date: new Date().toISOString(),
    trackId: document.getElementById('setup-track').value,
    notes: document.getElementById('setup-notes').value.trim(),
    isFavorite: false,
    performanceRating: parseInt(document.getElementById('setup-rating').value) || 3,
    photos: [...tempPhotos],
    escModel: document.getElementById('esc-model').value.trim(),
    escPunch: parseInt(document.getElementById('esc-punch').value) || 5,
    escDragBrake: parseInt(document.getElementById('esc-drag-brake').value) || 10,
    escBrakeForce: parseInt(document.getElementById('esc-brake-force').value) || 75,
    escTiming: document.getElementById('esc-timing').value.trim(),
    escCutoff: document.getElementById('esc-cutoff').value.trim(),
    escTemp: document.getElementById('esc-temp').value.trim(),
    escNotes: document.getElementById('esc-notes').value.trim(),
    chRhF: parseFloat(document.getElementById('ch-rh-f').value) || 0,
    chRhR: parseFloat(document.getElementById('ch-rh-r').value) || 0,
    chCbF: parseFloat(document.getElementById('ch-cb-f').value) || 0,
    chCbR: parseFloat(document.getElementById('ch-cb-r').value) || 0,
    chToF: parseFloat(document.getElementById('ch-to-f').value) || 0,
    chToR: parseFloat(document.getElementById('ch-to-r').value) || 0,
    chShF: document.getElementById('ch-sh-f').value.trim(),
    chShR: document.getElementById('ch-sh-r').value.trim(),
    chSpF: document.getElementById('ch-sp-f').value.trim(),
    chSpR: document.getElementById('ch-sp-r').value.trim(),
    chDfF: document.getElementById('ch-df-f').value.trim(),
    chDfR: document.getElementById('ch-df-r').value.trim(),
    chDfC: document.getElementById('ch-df-c').value.trim(),
    chArF: document.getElementById('ch-ar-f').checked,
    chArR: document.getElementById('ch-ar-r').checked,
    chNotes: document.getElementById('ch-notes').value.trim(),
    tireBrand: document.getElementById('tire-brand').value.trim(),
    tireModel: document.getElementById('tire-model').value.trim(),
    tireCompound: document.getElementById('tire-compound').value.trim(),
    tireInsert: document.getElementById('tire-insert').value.trim(),
    tireGlue: document.getElementById('tire-glue').value,
    tireWear: document.getElementById('tire-wear').value,
    tireNotes: document.getElementById('tire-notes').value.trim()
  };

  DB.set('setups', [...DB.get('setups'), setup]);
  document.getElementById('form-add-setup').reset();
  tempPhotos = [];
  renderPhotoGrid();
  showView('model-detail');
  updateStats();
};

window.showAddSetup = () => { showView('add-setup'); };

// ===== ALL SETUPS =====
function renderAllSetups() {
  const filter = document.getElementById('setup-filter').value;
  const search = document.getElementById('setup-search').value.toLowerCase();
  let setups = DB.get('setups');

  if (filter === 'favorites') setups = setups.filter(s => s.isFavorite);
  if (filter === 'best') setups = setups.filter(s => s.performanceRating >= 4);
  if (filter === 'recent') setups = setups.slice(0, 10);
  if (search) setups = setups.filter(s =>
    s.name.toLowerCase().includes(search) ||
    (s.modelName && s.modelName.toLowerCase().includes(search)) ||
    (s.modelBrand && s.modelBrand.toLowerCase().includes(search))
  );

  setups.sort((a, b) => new Date(b.date) - new Date(a.date));
  const models = DB.get('models');
  setups = setups.map(s => {
    const m = models.find(x => x.id === s.modelId);
    return { ...s, modelName: m?.name, modelBrand: m?.brand };
  });

  const list = document.getElementById('all-setups-list');
  if (!setups.length) {
    list.innerHTML = `<div class="empty-state"><div class="empty-icon">⚙️</div><p>Inga setups hittades</p></div>`;
    return;
  }
  list.innerHTML = setups.map(s => setupRowHTML(s, false)).join('');
}

document.getElementById('setup-search').oninput = renderAllSetups;
document.getElementById('setup-filter').onchange = renderAllSetups;

// ===== COMPARE =====
function initCompare() {
  const models = DB.get('models');
  const sel = document.getElementById('compare-model');
  sel.innerHTML = '<option>Välj modell...</option>' +
    models.map(m => `<option value="${m.id}">${esc(m.name)}</option>`).join('');
  sel.onchange = () => loadCompareSetups(sel.value);
}

function loadCompareSetups(modelId) {
  const setups = DB.get('setups').filter(s => s.modelId === modelId);
  const s1 = document.getElementById('compare-setup-1');
  const s2 = document.getElementById('compare-setup-2');
  const html = setups.map(s => `<option value="${s.id}">${esc(s.name)}</option>`).join('');
  s1.innerHTML = '<option>Setup 1...</option>' + html;
  s2.innerHTML = '<option>Setup 2...</option>' + html;
}

function doCompare() {
  const id1 = document.getElementById('compare-setup-1').value;
  const id2 = document.getElementById('compare-setup-2').value;
  if (!id1 || !id2 || id1 === id2) {
    document.getElementById('compare-results').innerHTML = '<div class="empty-state"><p>Välj två olika setups</p></div>';
    return;
  }
  const s1 = DB.get('setups').find(s => s.id === id1);
  const s2 = DB.get('setups').find(s => s.id === id2);

  const sections = [
    { title: 'ESC', fields: [
      ['Modell', 'escModel'], ['Punch', 'escPunch'],
      ['Drag Brake', 'escDragBrake'], ['Brake Force', 'escBrakeForce'],
      ['Timing', 'escTiming'], ['Cutoff', 'escCutoff'], ['Temp', 'escTemp']
    ]},
    { title: 'Chassi', fields: [
      ['Ride Height F', 'chRhF'], ['Ride Height B', 'chRhR'],
      ['Camber F', 'chCbF'], ['Camber B', 'chCbR'],
      ['Toe F', 'chToF'], ['Toe B', 'chToR'],
      ['Shock F', 'chShF'], ['Shock B', 'chShR'],
      ['Spring F', 'chSpF'], ['Spring B', 'chSpR'],
      ['Diff F', 'chDfF'], ['Diff B', 'chDfR'], ['Diff C', 'chDfC'],
      ['AR F', 'chArF'], ['AR B', 'chArR']
    ]},
    { title: 'Däck', fields: [
      ['Märke', 'tireBrand'], ['Modell', 'tireModel'],
      ['Compound', 'tireCompound'], ['Insert', 'tireInsert'],
      ['Glue', 'tireGlue'], ['Wear', 'tireWear']
    ]}
  ];

  let html = '';
  sections.forEach(sec => {
    const rows = sec.fields.map(([label, key]) => {
      const v1 = String(s1[key] ?? '-');
      const v2 = String(s2[key] ?? '-');
      const diff = v1 !== v2 ? ' diff' : '';
      return `<div class="compare-row${diff}">
        <div><div class="compare-setup-name" style="color:var(--accent);">${esc(s1.name)}</div><div>${esc(v1)}</div></div>
        <div style="text-align:right;"><div class="compare-setup-name" style="color:var(--accent-light);">${esc(s2.name)}</div><div>${esc(v2)}</div></div>
      </div>`;
    }).join('');
    html += `<div class="compare-section"><h3>${esc(sec.title)}</h3>${rows}</div>`;
  });

  document.getElementById('compare-results').innerHTML = html;
}

document.getElementById('compare-setup-1').onchange = doCompare;
document.getElementById('compare-setup-2').onchange = doCompare;

// ===== TRACKS =====
function renderTracks() {
  const tracks = DB.get('tracks').sort((a, b) => a.name.localeCompare(b.name));
  const list = document.getElementById('tracks-list');
  const empty = document.getElementById('tracks-empty');

  if (!tracks.length) {
    list.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');

  list.innerHTML = tracks.map(t => {
    const setupCount = DB.get('setups').filter(s => s.trackId === t.id).length;
    return `
      <div class="card">
        <div class="card-row">
          <div class="card-icon">🏁</div>
          <div class="card-body">
            <div class="card-title">${esc(t.name)}</div>
            ${t.location ? `<div class="card-subtitle">${esc(t.location)}</div>` : ''}
            ${t.surface ? `<div class="card-badge">${esc(t.surface)}</div>` : ''}
          </div>
          ${setupCount ? `<div style="font-size:0.75rem;color:var(--text-muted);padding:4px 10px;background:var(--bg-card-hover);border-radius:8px;">${setupCount}</div>` : ''}
        </div>
      </div>
    `;
  }).join('');
}

// Add track
document.getElementById('form-add-track').onsubmit = (e) => {
  e.preventDefault();
  const track = {
    id: DB.uid(),
    name: document.getElementById('track-name').value.trim(),
    location: document.getElementById('track-location').value.trim(),
    surface: document.getElementById('track-surface').value,
    notes: document.getElementById('track-notes').value.trim()
  };
  DB.set('tracks', [...DB.get('tracks'), track]);
  document.getElementById('form-add-track').reset();
  showView('tracks');
  updateStats();
};

// ===== STATS =====
function updateStats() {
  document.getElementById('stat-models').textContent = DB.get('models').length;
  document.getElementById('stat-setups').textContent = DB.get('setups').length;
  document.getElementById('stat-tracks').textContent = DB.get('tracks').length;
}

// ===== UTILS =====
function esc(s) {
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}

// ===== INIT =====
loadState();
showView('models');

// Smart reset baserat på vilken modell som är vald
function resetCurrentSetup() {
  const model = DB.get('models').find(m => m.id === currentModelId);
  if (!model) {
    alert('Ingen modell vald');
    return;
  }
  
  if (model.name.includes('RX8E')) {
    resetToRX8EBasic();
  } else if (model.name.includes('X4')) {
    resetToBasicAsphalt();
  } else {
    // Generisk reset för andra modeller
    document.getElementById('setup-name').value = '';
    document.getElementById('setup-notes').value = '';
    document.querySelectorAll('input, select').forEach(el => {
      if (el.type === 'checkbox') el.checked = false;
      else if (el.id !== 'setup-rating' && el.id !== 'photo-input') el.value = '';
    });
    document.getElementById('esc-punch').value = '5';
    document.getElementById('esc-drag-brake').value = '5';
    document.getElementById('esc-brake-force').value = '50';
    document.getElementById('esc-timing').value = '0°';
    document.getElementById('esc-cutoff').value = '3.2V/cell';
    document.getElementById('esc-temp').value = '85°C';
    document.getElementById('setup-rating').value = '3';
    document.querySelectorAll('.rating-input .star').forEach((s, i) => s.classList.toggle('active', i < 3));
    alert('Formulär återställt till neutrala värden');
  }
}

// Uppdatera knapptext när man öppnar add-setup vyn
function updateResetButtonText() {
  const model = DB.get('models').find(m => m.id === currentModelId);
  const btn = document.getElementById('reset-btn');
  if (model && btn) {
    if (model.name.includes('RX8E')) {
      btn.textContent = '🔄 Återställ till RX8E Basic';
    } else if (model.name.includes('X4')) {
      btn.textContent = '🔄 Återställ till X4 Basic Asfalt';
    } else {
      btn.textContent = '🔄 Återställ till grundvärden';
    }
  }
}

window.resetCurrentSetup = resetCurrentSetup;
window.updateResetButtonText = updateResetButtonText;

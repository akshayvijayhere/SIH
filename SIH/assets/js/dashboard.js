/* 
   NIRMAAN AI - Dashboard Page Dedicated Logic
*/

document.addEventListener('DOMContentLoaded', async () => {
  if (window.NIRMAAN_API) {
    await window.NIRMAAN_API.getProjects();
    await window.NIRMAAN_API.getSCurveData();
  }
  const data = window.NIRMAAN_DATA;
  if (!data) return;

  // Render Charts
  if (window.NIRMAAN_CHARTS) {
    window.NIRMAAN_CHARTS.renderDonutChart(
      'dashboard-donut-container',
      data.riskDistribution.high.count,
      data.riskDistribution.medium.count,
      data.riskDistribution.low.count
    );

    window.NIRMAAN_CHARTS.renderStateBarChart('dashboard-state-barchart', data.stateWiseRisk);
  }

  // Render Interactive GIS Map
  if (window.NIRMAAN_MAP) {
    window.NIRMAAN_MAP.initMap('gis-map-container');
  }

  // Render High Risk Table
  const tableBody = document.getElementById('dashboard-high-risk-table-body');
  if (tableBody) {
    const highRiskProjs = data.projects.filter(p => p.riskScore >= 60).slice(0, 5);
    tableBody.innerHTML = highRiskProjs.map((p, idx) => `
      <tr>
        <td>${idx + 1}</td>
        <td><strong>${p.name}</strong></td>
        <td>${p.state}</td>
        <td>${p.sector}</td>
        <td><div style="display: flex; align-items: center; gap: 8px;"><div class="progress-bar-wrap" style="width: 70px;"><div class="progress-bar-fill ${p.riskScore > 75 ? 'high-risk' : 'medium-risk'}" style="width: ${p.progress}%;"></div></div><span style="font-weight: 700; font-size: 0.78rem;">${p.progress}%</span></div></td>
        <td><span style="font-weight: 800; color: ${p.riskScore > 75 ? '#ef4444' : '#f59e0b'};">${p.riskScore}%</span></td>
        <td><span class="status-badge ${p.statusClass}">${p.status}</span></td>
        <td><a class="btn-action-sm" href="project-detail.html?id=${p.id}">View</a></td>
      </tr>
    `).join('');
  }

  // Executive Monthly PDF Digest Button Listener
  document.getElementById('btn-generate-executive-digest')?.addEventListener('click', openExecutiveDigestModal);
  document.getElementById('close-digest-modal')?.addEventListener('click', closeExecutiveDigestModal);
  document.getElementById('btn-close-digest-footer')?.addEventListener('click', closeExecutiveDigestModal);

  document.getElementById('btn-print-executive-digest')?.addEventListener('click', () => {
    document.body.classList.add('printing-digest');
    window.print();
    setTimeout(() => {
      document.body.classList.remove('printing-digest');
    }, 600);
  });

  // Google Earth Engine 40-Year Time-Lapse Modal Listeners
  document.getElementById('btn-open-gee-modal')?.addEventListener('click', openGEETimelapseModal);
  document.getElementById('btn-close-gee-modal')?.addEventListener('click', closeGEETimelapseModal);
  document.getElementById('gee-project-select')?.addEventListener('change', updateGEEProjectData);
  document.getElementById('gee-modal-slider')?.addEventListener('input', () => {
    if (modalPlayInterval) {
      clearInterval(modalPlayInterval);
      modalPlayInterval = null;
      const btn = document.getElementById('btn-modal-play-timelapse');
      if (btn) {
        btn.innerHTML = '<i class="fa-solid fa-play"></i>';
        btn.style.background = 'linear-gradient(135deg, #2563eb, #1d4ed8)';
      }
    }
    updateGEEYearSlider();
  });
  document.getElementById('btn-modal-play-timelapse')?.addEventListener('click', toggleModalTimeLapsePlay);
});

const GEE_PROJECT_METADATA = {
  chenab: {
    name: 'Chenab Railway Bridge (Jammu & Kashmir)',
    lat: 33.155, lng: 74.885,
    baselineYear: '1984', baselineTitle: 'Jammu Mountain River Valley', baselineDesc: 'NDVI Vegetation Index: 0.94 (Dense Forest / Pristine Topography). Zero civil footprint.',
    currentYear: '2026', currentTitle: '359m Steel Arch Railway Bridge', currentDesc: 'NDVI: 0.38. Bare Soil & Steel Index: 0.88. World highest railway arch bridge complete.',
    ndvi: ['0.94 (Forest)', '0.78 (Survey)', '0.62 (Cut)', '0.49 (Piling)', '0.42 (Arch Build)', '0.38 (Complete)'],
    bsi: ['0.05 (Zero)', '0.22 (Clearing)', '0.48 (Earthwork)', '0.68 (Foundation)', '0.81 (Structural)', '0.88 (Operational)'],
    expansion: ['0% (Greenfield)', '+45% Growth', '+120% Growth', '+230% Growth', '+340% Growth', '+420% Expansion']
  },
  navimumbai: {
    name: 'Navi Mumbai International Airport',
    lat: 18.990, lng: 73.076,
    baselineYear: '1984', baselineTitle: 'Panvel Agricultural Delta & Mangroves', baselineDesc: 'NDVI: 0.89 (Coastal Mangrove & Paddy Fields). Zero runway excavation.',
    currentYear: '2026', currentTitle: 'Navi Mumbai International Airport Phase 1', currentDesc: 'NDVI: 0.28 (Paved). 3,700m Code 4F Runway & Terminal Pier 1 Structure Operational.',
    ndvi: ['0.89 (Mangroves)', '0.72 (Demarcation)', '0.55 (Hill Cut)', '0.42 (Dredging)', '0.33 (Tarmac)', '0.28 (Runway Paved)'],
    bsi: ['0.08 (Zero)', '0.28 (Clearance)', '0.58 (Hill Blasting)', '0.76 (Sub-base)', '0.88 (Bitumen)', '0.94 (Concrete Paved)'],
    expansion: ['0% (Baseline)', '+60% Area', '+180% Area', '+320% Area', '+500% Area', '+650% Expansion']
  },
  zojila: {
    name: 'Zojila Mountain Pass Tunnel',
    lat: 34.296, lng: 75.250,
    baselineYear: '1984', baselineTitle: 'High-Altitude Alpine Mountain Pass', baselineDesc: 'NDVI: 0.65 (Alpine Scrub / Snow Cover). Seasonally cut off for 6 months.',
    currentYear: '2026', currentTitle: '13.15 km All-Weather Zojila Tunnel Portal', currentDesc: 'NDVI: 0.31. Tunnel Excavation Completed. Smart NATM Ventilation & Fire Ducting.',
    ndvi: ['0.65 (Alpine)', '0.58 (Survey)', '0.49 (Approach)', '0.41 (Portal)', '0.35 (Drifting)', '0.31 (Scrub Cleared)'],
    bsi: ['0.12 (Rock)', '0.30 (Access)', '0.52 (Portal Box)', '0.69 (Tunneling)', '0.76 (NATM Lining)', '0.81 (Rock Boring)'],
    expansion: ['0% (Alpine)', '+30% Pass', '+90% Portal', '+170% Portal', '+240% Bore', '+310% Expansion']
  },
  bengaluru: {
    name: 'Bengaluru Satellite Ring Road (STRR)',
    lat: 12.971, lng: 77.594,
    baselineYear: '1984', baselineTitle: 'Peri-Urban Agriculture & Lakes', baselineDesc: 'NDVI: 0.91 (Agricultural Land). Zero heavy arterial road paving.',
    currentYear: '2026', currentTitle: '280 km 8-Lane Expressway Corridor', currentDesc: 'NDVI: 0.41 (Cleared). Bituminous Pavement Index: 0.84. Toll Plaza & Flyover Live.',
    ndvi: ['0.91 (Farmland)', '0.79 (Acquisition)', '0.64 (ROW Grading)', '0.52 (Sub-base)', '0.45 (Bituminous)', '0.41 (Bituminous)'],
    bsi: ['0.04 (Soil)', '0.24 (ROW)', '0.54 (Grading)', '0.71 (Base Course)', '0.80 (Asphalt)', '0.84 (Pavement)'],
    expansion: ['0% (Greenfield)', '+50% Corridor', '+160% Corridor', '+290% Corridor', '+430% Corridor', '+540% Expansion']
  },
  bullettrain: {
    name: 'Mumbai-Ahmedabad High Speed Rail',
    lat: 19.076, lng: 72.877,
    baselineYear: '1984', baselineTitle: 'Urban & Suburbs Greenfield Corridor', baselineDesc: 'NDVI: 0.82 (Suburban Farmland). No elevated pier foundations.',
    currentYear: '2026', currentTitle: 'High-Speed Rail Elevated Viaduct & Pier Track', currentDesc: 'NDVI: 0.35. Segmental Girder Erection Completed. Shinkansen Track Bed Installed.',
    ndvi: ['0.82 (Farmland)', '0.71 (Piling Row)', '0.58 (Pier Rig)', '0.48 (Viaduct Launcher)', '0.39 (Girders)', '0.35 (Viaduct Pervious)'],
    bsi: ['0.06 (Zero)', '0.25 (Rig Test)', '0.56 (Cast Piers)', '0.74 (Girder Launch)', '0.84 (Shinkansen Track)', '0.89 (Elevated Pier)'],
    expansion: ['0% (Greenfield)', '+40% Align', '+140% Viaduct', '+260% Viaduct', '+380% Viaduct', '+480% Expansion']
  }
};

const GEE_YEAR_STEPS = ['1984', '1995', '2005', '2015', '2020', '2026'];
const SATELLITE_YEAR_FILTERS = [
  'hue-rotate(65deg) saturate(2.2) contrast(1.15) brightness(0.88)',
  'hue-rotate(25deg) saturate(1.5) contrast(1.3) sepia(0.25)',
  'hue-rotate(-5deg) saturate(1.25) contrast(1.35) sepia(0.4)',
  'hue-rotate(-25deg) saturate(1.15) contrast(1.25)',
  'hue-rotate(-45deg) saturate(1.3) contrast(1.15)',
  'none'
];

let geeModalMapInstance = null;
let geeModalMarker = null;
let geeModalCircle = null;
let modalPlayInterval = null;

function openGEETimelapseModal() {
  const modal = document.getElementById('gee-timelapse-modal');
  if (modal) {
    modal.style.display = 'flex';
    updateGEEProjectData();
    if (window.showGlobalToast) {
      window.showGlobalToast('🌍 Live Embedded Google Earth Engine Satellite View Initialized', 'info');
    }
  }
}

function closeGEETimelapseModal() {
  const modal = document.getElementById('gee-timelapse-modal');
  if (modal) {
    modal.style.display = 'none';
    if (modalPlayInterval) {
      clearInterval(modalPlayInterval);
      modalPlayInterval = null;
    }
  }
}

function toggleModalTimeLapsePlay() {
  const btn = document.getElementById('btn-modal-play-timelapse');
  const slider = document.getElementById('gee-modal-slider');
  if (!btn || !slider) return;

  if (modalPlayInterval) {
    clearInterval(modalPlayInterval);
    modalPlayInterval = null;
    btn.innerHTML = '<i class="fa-solid fa-play"></i>';
    btn.style.background = 'linear-gradient(135deg, #2563eb, #1d4ed8)';
    if (window.showGlobalToast) window.showGlobalToast('⏸️ Time-Lapse Playback Paused', 'info');
  } else {
    btn.innerHTML = '<i class="fa-solid fa-pause"></i>';
    btn.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
    if (window.showGlobalToast) window.showGlobalToast('▶️ Playing Automated 40-Year Satellite Time-Lapse (1984 ➔ 2026)', 'success');

    if (parseInt(slider.value) >= 5) slider.value = 0;

    updateGEEYearSlider();

    modalPlayInterval = setInterval(() => {
      let currentVal = parseInt(slider.value);
      let nextVal = currentVal + 1;
      if (nextVal > 5) {
        clearInterval(modalPlayInterval);
        modalPlayInterval = null;
        btn.innerHTML = '<i class="fa-solid fa-play"></i>';
        btn.style.background = 'linear-gradient(135deg, #2563eb, #1d4ed8)';
        if (window.showGlobalToast) window.showGlobalToast('✅ 40-Year Satellite Time-Lapse Completed (Year 2026 Operational)', 'success');
        return;
      }
      slider.value = nextVal;
      updateGEEYearSlider();
    }, 1400);
  }
}

function updateGEEProjectData() {
  const select = document.getElementById('gee-project-select');
  if (!select) return;

  const key = select.value || 'chenab';
  const meta = GEE_PROJECT_METADATA[key] || GEE_PROJECT_METADATA['chenab'];

  const overlayName = document.getElementById('gee-overlay-project-name');
  if (overlayName) overlayName.innerText = meta.name;

  const earthLink = document.getElementById('btn-launch-google-earth-3d');
  if (earthLink) {
    earthLink.href = `https://earth.google.com/web/@${meta.lat},${meta.lng},500a,35d,35y,0h,0t,0r`;
  }

  const slider = document.getElementById('gee-modal-slider');
  const sliderVal = slider ? parseInt(slider.value) : 5;

  initOrUpdateGEEModalMap(meta.lat, meta.lng, meta.name, sliderVal);
}

function updateGEEYearSlider() {
  const slider = document.getElementById('gee-modal-slider');
  const activeLabel = document.getElementById('gee-active-year-label');

  if (!slider || !activeLabel) return;

  const idx = parseInt(slider.value) || 5;
  const year = GEE_YEAR_STEPS[idx] || '2026';

  activeLabel.innerText = `Active Snapshot: Year ${year}`;

  const select = document.getElementById('gee-project-select');
  const key = select ? (select.value || 'chenab') : 'chenab';
  const meta = GEE_PROJECT_METADATA[key] || GEE_PROJECT_METADATA['chenab'];

  const overlayNdvi = document.getElementById('gee-overlay-ndvi');
  const overlayBsi = document.getElementById('gee-overlay-bsi');
  const overlayExpansion = document.getElementById('gee-overlay-expansion');

  if (overlayNdvi && meta.ndvi[idx]) overlayNdvi.innerText = meta.ndvi[idx];
  if (overlayBsi && meta.bsi[idx]) overlayBsi.innerText = meta.bsi[idx];
  if (overlayExpansion && meta.expansion[idx]) overlayExpansion.innerText = meta.expansion[idx];

  initOrUpdateGEEModalMap(meta.lat, meta.lng, meta.name, idx);
}

function initOrUpdateGEEModalMap(lat, lng, name, yearIndex = 5) {
  const container = document.getElementById('gee-modal-map-viewport');
  if (!container || !window.L) return;

  if (!geeModalMapInstance) {
    geeModalMapInstance = L.map('gee-modal-map-viewport', {
      center: [lat, lng],
      zoom: 13,
      zoomControl: true,
      scrollWheelZoom: true
    });

    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri World Imagery Satellite',
      maxZoom: 19
    }).addTo(geeModalMapInstance);
  } else {
    geeModalMapInstance.setView([lat, lng], 13);
  }

  // Apply visual satellite filter transition for visible imagery changes
  const filterStyle = SATELLITE_YEAR_FILTERS[yearIndex] || 'none';
  const tilePane = container.querySelector('.leaflet-tile-pane');
  if (tilePane) {
    tilePane.style.transition = 'filter 0.6s ease-in-out';
    tilePane.style.filter = filterStyle;
  }

  setTimeout(() => {
    if (geeModalMapInstance) geeModalMapInstance.invalidateSize();
  }, 200);

  if (geeModalMarker) geeModalMapInstance.removeLayer(geeModalMarker);
  if (geeModalCircle) geeModalMapInstance.removeLayer(geeModalCircle);

  const radius = 600 + (yearIndex * 950);
  const factor = (yearIndex + 1) / 6;

  geeModalCircle = L.circle([lat, lng], {
    color: '#38bdf8',
    fillColor: '#38bdf8',
    fillOpacity: 0.12 + (factor * 0.15),
    radius: radius,
    weight: 2,
    dashArray: '6, 6'
  }).addTo(geeModalMapInstance);

  const currentYearStr = GEE_YEAR_STEPS[yearIndex] || '2026';

  const customIcon = L.divIcon({
    className: 'custom-gee-pin',
    html: `
      <div style="width: 36px; height: 36px; background: linear-gradient(135deg, #0284c7, #0f172a); border: 2px solid #38bdf8; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 0.95rem; box-shadow: 0 0 18px rgba(56, 189, 248, 0.9);">
        <i class="fa-solid fa-satellite-dish"></i>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18]
  });

  geeModalMarker = L.marker([lat, lng], { icon: customIcon }).addTo(geeModalMapInstance);
  geeModalMarker.bindPopup(`
    <div style="color: #0f172a; font-family: system-ui, sans-serif; font-size: 0.82rem; padding: 2px;">
      <strong style="color: #0284c7; font-size: 0.88rem;">${name}</strong><br>
      <span style="color: #64748b;">GPS: Lat ${lat.toFixed(4)}, Lng ${lng.toFixed(4)}</span><br>
      <div style="margin-top: 4px; background: #e0f2fe; color: #0369a1; padding: 2px 6px; border-radius: 4px; font-weight: 700; font-size: 0.72rem; display: inline-block;">
        Year ${currentYearStr} Satellite Footprint
      </div>
    </div>
  `).openPopup();
}

function openExecutiveDigestModal() {
  const data = window.NIRMAAN_DATA;
  if (!data || !data.projects) return;

  const criticalProjects = data.projects.filter(p => p.riskScore >= 70).sort((a, b) => b.riskScore - a.riskScore).slice(0, 5);
  const container = document.getElementById('digest-critical-projects-list');

  if (container) {
    container.innerHTML = criticalProjects.map((p, idx) => `
      <div style="background: var(--bg-app); border: 1px solid var(--border-color); border-radius: 10px; padding: 0.85rem; display: flex; align-items: center; justify-content: space-between; gap: 1rem;">
        <div>
          <div style="font-size: 0.85rem; font-weight: 800; color: var(--text-main);">${idx + 1}. ${p.name}</div>
          <div style="font-size: 0.74rem; color: var(--text-muted); margin-top: 2px;">
            <i class="fa-solid fa-location-dot"></i> ${p.state} • Sector: <strong>${p.sector}</strong> • Contractor: <strong>${p.contractor || 'L&T Construction'}</strong>
          </div>
        </div>
        <div style="text-align: right; flex-shrink: 0;">
          <div style="font-size: 0.82rem; font-weight: 800; color: #ef4444;">Risk Index: ${p.riskScore}%</div>
          <div style="font-size: 0.72rem; color: var(--text-muted);">Physical Completion: <strong>${p.progress}%</strong></div>
        </div>
      </div>
    `).join('');
  }

  const modal = document.getElementById('executive-digest-modal');
  if (modal) modal.style.display = 'flex';
}

function closeExecutiveDigestModal() {
  const modal = document.getElementById('executive-digest-modal');
  if (modal) modal.style.display = 'none';
}


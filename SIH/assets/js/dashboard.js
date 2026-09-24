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
    window.print();
  });

  // Google Earth Engine 40-Year Time-Lapse Modal Listeners
  document.getElementById('btn-open-gee-modal')?.addEventListener('click', openGEETimelapseModal);
  document.getElementById('btn-close-gee-modal')?.addEventListener('click', closeGEETimelapseModal);
  document.getElementById('gee-project-select')?.addEventListener('change', updateGEEProjectData);
  document.getElementById('gee-modal-slider')?.addEventListener('input', updateGEEYearSlider);
});

const GEE_PROJECT_METADATA = {
  chenab: {
    name: 'Chenab Railway Bridge (Jammu & Kashmir)',
    lat: 33.155, lng: 74.885,
    baselineYear: '1984', baselineTitle: 'Jammu Mountain River Valley', baselineDesc: 'NDVI Vegetation Index: 0.94 (Dense Forest / Pristine Topography). Zero civil footprint.',
    currentYear: '2026', currentTitle: '359m Steel Arch Railway Bridge', currentDesc: 'NDVI: 0.38. Bare Soil & Steel Index: 0.88. World highest railway arch bridge complete.',
    ndvi: '0.38 (Cleared)', bsi: '0.88 (Paved)', expansion: '+420% Expansion'
  },
  navimumbai: {
    name: 'Navi Mumbai International Airport',
    lat: 18.990, lng: 73.076,
    baselineYear: '1984', baselineTitle: 'Panvel Agricultural Delta & Mangroves', baselineDesc: 'NDVI: 0.89 (Coastal Mangrove & Paddy Fields). Zero runway excavation.',
    currentYear: '2026', currentTitle: 'Navi Mumbai International Airport Phase 1', currentDesc: 'NDVI: 0.28 (Paved). 3,700m Code 4F Runway & Terminal Pier 1 Structure Operational.',
    ndvi: '0.28 (Runway Paved)', bsi: '0.94 (Concrete)', expansion: '+650% Expansion'
  },
  zojila: {
    name: 'Zojila Mountain Pass Tunnel',
    lat: 34.296, lng: 75.250,
    baselineYear: '1984', baselineTitle: 'High-Altitude Alpine Mountain Pass', baselineDesc: 'NDVI: 0.65 (Alpine Scrub / Snow Cover). Seasonally cut off for 6 months.',
    currentYear: '2026', currentTitle: '13.15 km All-Weather Zojila Tunnel Portal', currentDesc: 'NDVI: 0.31. Tunnel Excavation Completed. Smart NATM Ventilation & Fire Ducting.',
    ndvi: '0.31 (Scrub Cleared)', bsi: '0.81 (Rock Boring)', expansion: '+310% Expansion'
  },
  bengaluru: {
    name: 'Bengaluru Satellite Ring Road (STRR)',
    lat: 12.971, lng: 77.594,
    baselineYear: '1984', baselineTitle: 'Peri-Urban Agriculture & Lakes', baselineDesc: 'NDVI: 0.91 (Agricultural Land). Zero heavy arterial road paving.',
    currentYear: '2026', currentTitle: '280 km 8-Lane Expressway Corridor', currentDesc: 'NDVI: 0.41 (Cleared). Bituminous Pavement Index: 0.84. Toll Plaza & Flyover Live.',
    ndvi: '0.41 (Bituminous)', bsi: '0.84 (Pavement)', expansion: '+540% Expansion'
  },
  bullettrain: {
    name: 'Mumbai-Ahmedabad High Speed Rail',
    lat: 19.076, lng: 72.877,
    baselineYear: '1984', baselineTitle: 'Urban & Suburbs Greenfield Corridor', baselineDesc: 'NDVI: 0.82 (Suburban Farmland). No elevated pier foundations.',
    currentYear: '2026', currentTitle: 'High-Speed Rail Elevated Viaduct & Pier Track', currentDesc: 'NDVI: 0.35. Segmental Girder Erection Completed. Shinkansen Track Bed Installed.',
    ndvi: '0.35 (Viaduct Pervious)', bsi: '0.89 (Elevated Pier)', expansion: '+480% Expansion'
  }
};

const GEE_YEAR_STEPS = ['1984', '1995', '2005', '2015', '2020', '2026'];
let geeModalMapInstance = null;
let geeModalMarker = null;
let geeModalCircle = null;

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
  if (modal) modal.style.display = 'none';
}

function updateGEEProjectData() {
  const select = document.getElementById('gee-project-select');
  if (!select) return;

  const key = select.value || 'chenab';
  const meta = GEE_PROJECT_METADATA[key] || GEE_PROJECT_METADATA['chenab'];

  const overlayName = document.getElementById('gee-overlay-project-name');
  const overlayNdvi = document.getElementById('gee-overlay-ndvi');
  const overlayBsi = document.getElementById('gee-overlay-bsi');
  const overlayExpansion = document.getElementById('gee-overlay-expansion');

  if (overlayName) overlayName.innerText = meta.name;
  if (overlayNdvi) overlayNdvi.innerText = meta.ndvi;
  if (overlayBsi) overlayBsi.innerText = meta.bsi;
  if (overlayExpansion) overlayExpansion.innerText = meta.expansion;

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

  setTimeout(() => {
    if (geeModalMapInstance) geeModalMapInstance.invalidateSize();
  }, 200);

  if (geeModalMarker) geeModalMapInstance.removeLayer(geeModalMarker);
  if (geeModalCircle) geeModalMapInstance.removeLayer(geeModalCircle);

  const radius = 800 + (yearIndex * 900);
  const factor = (yearIndex + 1) / 6;

  geeModalCircle = L.circle([lat, lng], {
    color: '#38bdf8',
    fillColor: '#38bdf8',
    fillOpacity: 0.12 + (factor * 0.15),
    radius: radius,
    weight: 2,
    dashArray: '6, 6'
  }).addTo(geeModalMapInstance);

  const customIcon = L.divIcon({
    className: 'custom-gee-pin',
    html: `
      <div style="width: 34px; height: 34px; background: linear-gradient(135deg, #0284c7, #0f172a); border: 2px solid #38bdf8; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 0.95rem; box-shadow: 0 0 15px rgba(56, 189, 248, 0.8);">
        <i class="fa-solid fa-satellite-dish"></i>
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17]
  });

  geeModalMarker = L.marker([lat, lng], { icon: customIcon }).addTo(geeModalMapInstance);
  geeModalMarker.bindPopup(`
    <div style="color: #0f172a; font-family: system-ui, sans-serif; font-size: 0.82rem; padding: 2px;">
      <strong style="color: #0284c7; font-size: 0.88rem;">${name}</strong><br>
      <span style="color: #64748b;">GPS: Lat ${lat.toFixed(4)}, Lng ${lng.toFixed(4)}</span><br>
      <div style="margin-top: 4px; background: #e0f2fe; color: #0369a1; padding: 2px 6px; border-radius: 4px; font-weight: 700; font-size: 0.72rem; display: inline-block;">
        Google Earth Engine Satellite Footprint
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


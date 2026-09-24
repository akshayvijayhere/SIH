/* 
   NIRMAAN AI - Interactive Geospatial (GIS) India Map Engine
   Powered by Leaflet.js for MoSPI Infrastructure Monitoring
*/

window.NIRMAAN_MAP = {
  mapInstance: null,
  markersGroup: null,
  currentFilter: 'all',
  isDroneMode: false,

  initMap(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Destroy existing instance if re-initializing
    if (this.mapInstance) {
      this.mapInstance.remove();
      this.mapInstance = null;
    }

    // Centered over India [latitude, longitude], zoom level 5
    this.mapInstance = L.map(containerId, {
      center: [22.3511148, 78.6677428],
      zoom: 5,
      zoomControl: true,
      scrollWheelZoom: false
    });

    // Official open-source OpenStreetMap Tile Layer (no API key required)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19
    }).addTo(this.mapInstance);

    this.markersGroup = L.layerGroup().addTo(this.mapInstance);
    this.footprintGroup = L.layerGroup().addTo(this.mapInstance);

    this.renderMarkers('all');
    this.setupFilterControls();
    this.setup4DTimelineControls();
  },

  currentQuarterIndex: 5,
  quartersData: [
    { label: "Q1 2024 (Land Acquisition Phase)", factor: 0.35, ndvi: "0.85 (Dense Forest)", avgProg: "24.1%", color: "#94a3b8" },
    { label: "Q3 2024 (Earthworks & ROW Clearing)", factor: 0.50, ndvi: "0.71 (Site Cleared)", avgProg: "34.5%", color: "#60a5fa" },
    { label: "Q1 2025 (Foundation & Pier Piling)", factor: 0.65, ndvi: "0.58 (Substructure)", avgProg: "44.8%", color: "#38bdf8" },
    { label: "Q3 2025 (Superstructure Erection)", factor: 0.80, ndvi: "0.49 (Active Build)", avgProg: "55.2%", color: "#f59e0b" },
    { label: "Q1 2026 (Track Laying & Paving)", factor: 0.92, ndvi: "0.45 (Final Phase)", avgProg: "63.0%", color: "#38bdf8" },
    { label: "Q3 2026 (Live Current Telemetry)", factor: 1.00, ndvi: "0.42 (Cleared)", avgProg: "68.4%", color: "#10b981" }
  ],
  playInterval: null,

  renderMarkers(filter = 'all') {
    if (!this.markersGroup || !window.NIRMAAN_DATA || !window.NIRMAAN_DATA.projects) return;

    this.markersGroup.clearLayers();
    if (this.footprintGroup) this.footprintGroup.clearLayers();
    this.currentFilter = filter;

    const projects = window.NIRMAAN_DATA.projects;
    const qSnapshot = this.quartersData[this.currentQuarterIndex] || this.quartersData[5];

    projects.forEach(proj => {
      if (!proj.lat || !proj.lng) return;

      const adjustedProgress = Math.max(5, Math.min(100, Math.round(proj.progress * qSnapshot.factor)));

      const isHigh = proj.riskScore >= 70;
      const isMed = proj.riskScore >= 50 && proj.riskScore < 70;
      const isLow = proj.riskScore < 50;

      // Filter check
      if (filter === 'high' && !isHigh) return;
      if (filter === 'medium' && !isMed) return;
      if (filter === 'low' && !isLow) return;

      let riskCategory = isHigh ? 'high' : (isMed ? 'medium' : 'low');
      let badgeClass = isHigh ? 'badge-danger' : (isMed ? 'badge-warning' : 'badge-success');

      // Add Satellite Footprint Zone (Circle overlay representing construction extent)
      if (this.footprintGroup) {
        const footprintRadius = 15000 + (adjustedProgress * 350); // Grows as progress increases
        const footprintCircle = L.circle([proj.lat, proj.lng], {
          color: isHigh ? '#ef4444' : (isMed ? '#f59e0b' : '#38bdf8'),
          fillColor: isHigh ? '#ef4444' : (isMed ? '#f59e0b' : '#38bdf8'),
          fillOpacity: 0.12 + (qSnapshot.factor * 0.1),
          radius: footprintRadius,
          weight: 1.5,
          dashArray: '4, 4'
        });
        this.footprintGroup.addLayer(footprintCircle);
      }

      let customIcon;

      if (this.isDroneMode) {
        // Drone Inspection Icon with Cyan Radar Pulse
        customIcon = L.divIcon({
          className: 'custom-gis-pin-wrapper',
          html: `
            <div class="gis-marker-pin drone">
              <div class="marker-pulse-ring drone-pulse"></div>
              <i class="fa-solid fa-video" style="font-size: 0.85rem; z-index: 2;"></i>
            </div>
          `,
          iconSize: [36, 36],
          iconAnchor: [18, 18],
          popupAnchor: [0, -20]
        });
      } else {
        // Standard Risk Marker Pin
        customIcon = L.divIcon({
          className: 'custom-gis-pin-wrapper',
          html: `
            <div class="gis-marker-pin ${riskCategory}">
              <div class="marker-pulse-ring"></div>
              <div class="marker-dot-inner"></div>
              <span class="marker-score-label">${proj.riskScore}%</span>
            </div>
          `,
          iconSize: [36, 36],
          iconAnchor: [18, 18],
          popupAnchor: [0, -20]
        });
      }

      let popupContent = '';

      if (this.isDroneMode) {
        // Geotagged Aerial Drone Telemetry Popup
        popupContent = `
          <div class="gis-popup-card" style="background: #0f172a; color: white;">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 6px; margin-bottom: 6px;">
              <span style="font-size: 0.65rem; font-weight: 800; color: #38bdf8; background: rgba(56,189,248,0.15); padding: 2px 8px; border-radius: 10px; border: 1px solid rgba(56,189,248,0.3);">
                <i class="fa-solid fa-plane-up"></i> AERIAL TELEMETRY LOG (${qSnapshot.label.split(' ')[0]} ${qSnapshot.label.split(' ')[1]})
              </span>
              <span style="font-size: 0.68rem; color: #94a3b8; font-weight: 600;">FLIGHT-IND-${proj.id}</span>
            </div>

            <div style="position: relative; width: 100%; height: 110px; background: linear-gradient(135deg, #1e293b, #0f172a); border-radius: 8px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1); display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 10px;">
              <i class="fa-solid fa-satellite-dish" style="font-size: 2rem; color: #38bdf8; margin-bottom: 4px;"></i>
              <div style="font-size: 0.72rem; font-weight: 800; color: #e2e8f0;">4D Orthomosaic Satellite Scan</div>
              <div style="font-size: 0.65rem; color: #38bdf8; margin-top: 2px;"><i class="fa-solid fa-location-crosshairs"></i> Lat: ${proj.lat.toFixed(4)} | Lng: ${proj.lng.toFixed(4)}</div>
            </div>

            <h3 class="gis-popup-title" style="color: white; font-size: 0.9rem;">${proj.name}</h3>
            
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px; font-size: 0.7rem; background: rgba(255,255,255,0.05); padding: 6px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.08);">
              <div><span style="color: #94a3b8;">Physical Completion:</span> <strong style="color: #38bdf8;">${adjustedProgress}%</strong></div>
              <div><span style="color: #94a3b8;">Vegetation Index:</span> <strong style="color: white;">${qSnapshot.ndvi.split(' ')[0]}</strong></div>
              <div><span style="color: #94a3b8;">Machinery Active:</span> <strong style="color: #f59e0b;">${Math.round(14 * qSnapshot.factor)} Heavy Units</strong></div>
              <div><span style="color: #94a3b8;">Satellite Confidence:</span> <strong style="color: #10b981;">99.4% Accurate</strong></div>
            </div>

            <a href="project-detail.html?id=${proj.id}" class="gis-popup-btn" style="background: #0284c7; color: white !important;">
              <span><i class="fa-solid fa-expand"></i> View Full Reconnaissance Report</span>
            </a>
          </div>
        `;
      } else {
        // Standard GIS Popup with 4D Snapshot Info
        popupContent = `
          <div class="gis-popup-card">
            <div class="gis-popup-header">
              <span class="gis-popup-tag ${badgeClass}">${riskCategory.toUpperCase()} RISK (${proj.riskScore}%)</span>
              <span class="gis-popup-id">${proj.id}</span>
            </div>
            <h3 class="gis-popup-title">${proj.name}</h3>
            <div class="gis-popup-meta">
              <span><i class="fa-solid fa-location-dot"></i> ${proj.city}, ${proj.state}</span>
              <span><i class="fa-solid fa-building-flag"></i> ${proj.sector}</span>
            </div>
            <div class="gis-popup-progress">
              <div class="gis-prog-label">
                <span>Completion (${qSnapshot.label.split(' ')[0]} ${qSnapshot.label.split(' ')[1]})</span>
                <strong>${adjustedProgress}%</strong>
              </div>
              <div class="gis-prog-bar">
                <div class="gis-prog-fill ${riskCategory}" style="width: ${adjustedProgress}%;"></div>
              </div>
            </div>
            <div class="gis-popup-budget">
              <div><span>Budget:</span> <strong>${proj.approvedBudget}</strong></div>
              <div><span>Spent:</span> <strong>${proj.spentBudget}</strong></div>
            </div>
            <a href="project-detail.html?id=${proj.id}" class="gis-popup-btn">
              <span>View Detailed Inspection</span>
              <i class="fa-solid fa-arrow-right"></i>
            </a>
          </div>
        `;
      }

      const marker = L.marker([proj.lat, proj.lng], { icon: customIcon });
      marker.bindPopup(popupContent, { maxWidth: 320, className: 'nirmaan-custom-popup' });
      this.markersGroup.addLayer(marker);
    });
  },

  setupFilterControls() {
    const filterBtns = document.querySelectorAll('.gis-filter-btn');
    filterBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        filterBtns.forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        const filterVal = e.currentTarget.getAttribute('data-filter') || 'all';
        this.renderMarkers(filterVal);
      });
    });

    const droneToggleBtn = document.getElementById('toggle-drone-mode-btn');
    if (droneToggleBtn) {
      droneToggleBtn.addEventListener('click', () => {
        this.isDroneMode = !this.isDroneMode;
        if (this.isDroneMode) {
          droneToggleBtn.style.background = 'linear-gradient(135deg, #ef4444, #991b1b)';
          droneToggleBtn.innerHTML = '<i class="fa-solid fa-video"></i> Exit Drone Mode';
          if (window.showGlobalToast) window.showGlobalToast('🚁 Drone Reconnaissance Mode Activated — Showing 11 Geotagged Aerial Telemetry Feeds', 'info');
        } else {
          droneToggleBtn.style.background = 'linear-gradient(135deg, #0284c7, #0f172a)';
          droneToggleBtn.innerHTML = '<i class="fa-solid fa-plane-up"></i> Drone Survey Mode';
          if (window.showGlobalToast) window.showGlobalToast('GIS Standard Risk Layer Activated', 'info');
        }
        this.renderMarkers(this.currentFilter);
      });
    }
  },

  setup4DTimelineControls() {
    const slider = document.getElementById('gis-4d-slider');
    const activeLabel = document.getElementById('timeline-active-quarter');
    const ndviLabel = document.getElementById('timeline-ndvi-val');
    const avgProgLabel = document.getElementById('timeline-avg-progress');
    const playBtn = document.getElementById('btn-play-4d');

    if (!slider) return;

    const updateSnapshot = (idx) => {
      this.currentQuarterIndex = parseInt(idx);
      const snapshot = this.quartersData[this.currentQuarterIndex];
      if (activeLabel) activeLabel.innerText = `Active Snapshot: ${snapshot.label}`;
      if (ndviLabel) ndviLabel.innerText = snapshot.ndvi;
      if (avgProgLabel) avgProgLabel.innerText = snapshot.avgProg;

      this.renderMarkers(this.currentFilter);
    };

    slider.addEventListener('input', (e) => {
      if (this.playInterval) {
        clearInterval(this.playInterval);
        this.playInterval = null;
        if (playBtn) playBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
      }
      updateSnapshot(e.target.value);
    });

    if (playBtn) {
      playBtn.addEventListener('click', () => {
        if (this.playInterval) {
          clearInterval(this.playInterval);
          this.playInterval = null;
          playBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
          if (window.showGlobalToast) window.showGlobalToast('4D Time-Lapse Paused', 'info');
        } else {
          playBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
          if (window.showGlobalToast) window.showGlobalToast('▶️ Playing 4D Satellite Time-Lapse (Q1 2024 ➔ Q3 2026)', 'success');
          
          if (parseInt(slider.value) >= 5) slider.value = 0;

          this.playInterval = setInterval(() => {
            let nextVal = parseInt(slider.value) + 1;
            if (nextVal > 5) {
              clearInterval(this.playInterval);
              this.playInterval = null;
              playBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
              if (window.showGlobalToast) window.showGlobalToast('✅ 4D Time-Lapse Completed — Showing Current Live Telemetry (Q3 2026)', 'success');
              return;
            }
            slider.value = nextVal;
            updateSnapshot(nextVal);
          }, 1200);
        }
      });
    }
  }
};


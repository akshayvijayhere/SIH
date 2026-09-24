/* 
   NIRMAAN AI - Interactive Geospatial (GIS) India Map Engine
   Powered by Leaflet.js for MoSPI Infrastructure Monitoring
*/

window.NIRMAAN_MAP = {
  mapInstance: null,
  markersGroup: null,
  footprintGroup: null,
  currentFilter: 'all',
  isDroneMode: false,
  isSatelliteView: false,
  streetLayer: null,
  satelliteLayer: null,

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

    // High-Resolution Esri World Imagery Satellite Tile Layer (Default)
    this.satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
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
    { label: "2016 (Greenfield Site Baseline)", factor: 0.15, ndvi: "0.92 (Dense Canopy)", avgProg: "8.2%", color: "#94a3b8" },
    { label: "2018 (Land Acquisition & ROW Clearing)", factor: 0.35, ndvi: "0.75 (Site Cleared)", avgProg: "24.1%", color: "#60a5fa" },
    { label: "2020 (Earthworks & Pier Foundation)", factor: 0.55, ndvi: "0.61 (Substructure)", avgProg: "42.5%", color: "#38bdf8" },
    { label: "2022 (Superstructure & Structural Steel)", factor: 0.75, ndvi: "0.48 (Active Build)", avgProg: "58.9%", color: "#f59e0b" },
    { label: "2024 (Track Laying & Civil Completion)", factor: 0.90, ndvi: "0.43 (Final Phase)", avgProg: "64.2%", color: "#38bdf8" },
    { label: "2026 (Live Current Telemetry)", factor: 1.00, ndvi: "0.39 (Operational)", avgProg: "68.4%", color: "#10b981" }
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

      // Standard Risk Marker Pin
      const customIcon = L.divIcon({
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

      // Standard GIS Popup with 4D Snapshot Info
      const popupContent = `
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


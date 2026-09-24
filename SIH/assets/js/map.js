/* 
   NIRMAAN AI - Interactive Geospatial (GIS) India Map Engine
   Powered by Leaflet.js for MoSPI Infrastructure Monitoring
*/

window.NIRMAAN_MAP = {
  mapInstance: null,
  markersGroup: null,
  currentFilter: 'all',

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
    this.renderMarkers('all');
    this.setupFilterControls();
  },

  renderMarkers(filter = 'all') {
    if (!this.markersGroup || !window.NIRMAAN_DATA || !window.NIRMAAN_DATA.projects) return;

    this.markersGroup.clearLayers();
    this.currentFilter = filter;

    const projects = window.NIRMAAN_DATA.projects;

    projects.forEach(proj => {
      if (!proj.lat || !proj.lng) return;

      const isHigh = proj.riskScore >= 70;
      const isMed = proj.riskScore >= 50 && proj.riskScore < 70;
      const isLow = proj.riskScore < 50;

      // Filter check
      if (filter === 'high' && !isHigh) return;
      if (filter === 'medium' && !isMed) return;
      if (filter === 'low' && !isLow) return;

      let riskCategory = isHigh ? 'high' : (isMed ? 'medium' : 'low');
      let markerColor = isHigh ? '#ef4444' : (isMed ? '#f59e0b' : '#10b981');
      let badgeClass = isHigh ? 'badge-danger' : (isMed ? 'badge-warning' : 'badge-success');

      // Custom HTML Div Icon with pulsing aura
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
              <span>Physical Progress</span>
              <strong>${proj.progress}%</strong>
            </div>
            <div class="gis-prog-bar">
              <div class="gis-prog-fill ${riskCategory}" style="width: ${proj.progress}%;"></div>
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
      marker.bindPopup(popupContent, { maxWidth: 300, className: 'nirmaan-custom-popup' });
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
  }
};

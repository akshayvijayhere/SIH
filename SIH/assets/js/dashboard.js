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

  // Setup PM Gati Shakti Interactive Handlers
  setupGatiShaktiHandlers();
});

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

function setupGatiShaktiHandlers() {
  const nmpData = {
    '801': {
      ref: 'NMP/NPG/2026/RES-801',
      title: 'Directives for Murbad-Neral Rail Viaduct ✕ NH-61 Highway Crossing',
      desc: 'Spatial Collision between Railway Viaduct Pier #142 and NHAI Highway Median Right-of-Way in Palghar, MH.',
      m1Name: 'Ministry of Railways (MoR)',
      m1Detail: 'Share 6.5m Viaduct Utility Deck (₹32.5 Cr CAPEX)',
      m2Name: 'Ministry of Road Transport & Highways (MoRTH)',
      m2Detail: 'Integrate Highway Utility Trench (₹32.5 Cr CAPEX)',
      delayShift: '14 Mo ➔ 2 Mo',
      savings: '₹142 Crore'
    },
    '802': {
      ref: 'NMP/NPG/2026/RES-802',
      title: 'Directives for Delhi-Dehradun Expressway ✕ PowerGrid HVDC Line',
      desc: 'Transmission tower height clearance deadlock at Haridwar Tunnel Portal.',
      m1Name: 'Ministry of Road Transport & Highways (MoRTH)',
      m1Detail: 'Construct Low-Profile Tunnel Portal (₹24 Cr CAPEX)',
      m2Name: 'Ministry of Power / PowerGrid',
      m2Detail: 'Install Underground GIS Cable Bypass (₹24 Cr CAPEX)',
      delayShift: '8 Mo ➔ 2 Mo',
      savings: '₹48 Crore'
    }
  };

  // Co-Location Simulation
  document.querySelectorAll('.btn-simulate-colocation').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      const delayEl = document.getElementById(`delay-val-${id}`);
      const costEl = document.getElementById(`cost-val-${id}`);
      const statusEl = document.getElementById(`status-val-${id}`);
      const hintEl = document.getElementById(`savings-hint-${id}`);

      if (id === '801') {
        if (delayEl) { delayEl.innerText = '2 Months (-12 Mo)'; delayEl.style.color = '#34d399'; }
        if (costEl) { costEl.innerText = '₹38 Cr (-₹142 Cr)'; costEl.style.color = '#34d399'; }
        if (statusEl) { statusEl.innerText = 'Co-Location Optimized'; statusEl.style.color = '#34d399'; }
        if (hintEl) { hintEl.innerHTML = '<i class="fa-solid fa-circle-check"></i> <strong>Simulation Active:</strong> ₹142 Crore saved; 12 months delay eliminated via shared viaduct deck.'; }
        if (window.showGlobalToast) window.showGlobalToast('⚙️ PM Gati Shakti Simulation: Shared Viaduct Deck saves ₹142 Crore & 12 Months Delay!', 'success');
      } else if (id === '802') {
        if (delayEl) { delayEl.innerText = '2 Months (-6 Mo)'; delayEl.style.color = '#34d399'; }
        if (costEl) { costEl.innerText = '₹17 Cr (-₹48 Cr)'; costEl.style.color = '#34d399'; }
        if (statusEl) { statusEl.innerText = 'Co-Location Optimized'; statusEl.style.color = '#34d399'; }
        if (hintEl) { hintEl.innerHTML = '<i class="fa-solid fa-circle-check"></i> <strong>Simulation Active:</strong> ₹48 Crore saved; Underground GIS cable bypass confirmed.'; }
        if (window.showGlobalToast) window.showGlobalToast('⚙️ PM Gati Shakti Simulation: Underground GIS Bypass saves ₹48 Crore & 6 Months Delay!', 'success');
      }
    });
  });

  // Issue NPG Directive Modal Triggers
  document.querySelectorAll('.btn-issue-npg-directive').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-id') || '801';
      const info = nmpData[id] || nmpData['801'];

      document.getElementById('npg-modal-ref').innerText = info.ref;
      document.getElementById('npg-modal-title').innerText = info.title;
      document.getElementById('npg-modal-desc').innerText = info.desc;
      document.getElementById('npg-ministry1-name').innerText = info.m1Name;
      document.getElementById('npg-ministry1-detail').innerText = info.m1Detail;
      document.getElementById('npg-ministry2-name').innerText = info.m2Name;
      document.getElementById('npg-ministry2-detail').innerText = info.m2Detail;
      document.getElementById('npg-modal-delay-shift').innerText = info.delayShift;
      document.getElementById('npg-modal-savings').innerText = info.savings;

      const modal = document.getElementById('npg-directive-modal');
      if (modal) modal.style.display = 'flex';
    });
  });

  // Close NPG Modal
  document.getElementById('close-npg-modal')?.addEventListener('click', () => {
    document.getElementById('npg-directive-modal').style.display = 'none';
  });
  document.getElementById('close-npg-footer-btn')?.addEventListener('click', () => {
    document.getElementById('npg-directive-modal').style.display = 'none';
  });

  // Dispatch via WhatsApp Button
  document.getElementById('btn-dispatch-npg-whatsapp')?.addEventListener('click', () => {
    if (window.showGlobalToast) {
      window.showGlobalToast('📱 WhatsApp API Dispatch Sent to Cabinet Secretary & Nodal Officers for Immediate Enforcement!', 'success');
    }
    const btn = document.getElementById('btn-dispatch-npg-whatsapp');
    if (btn) {
      btn.innerHTML = '<i class="fa-solid fa-check-double"></i> Order Dispatched to Cabinet!';
      btn.style.background = '#10b981';
      setTimeout(() => {
        btn.innerHTML = '<i class="fa-brands fa-whatsapp"></i> Dispatch Order to Secretaries';
        btn.style.background = 'linear-gradient(135deg, #25d366, #128c7e)';
      }, 4000);
    }
  });

  // View EGoS Summary Button
  document.getElementById('btn-open-egos-summary')?.addEventListener('click', () => {
    document.querySelectorAll('.btn-issue-npg-directive')[0]?.click();
  });
}


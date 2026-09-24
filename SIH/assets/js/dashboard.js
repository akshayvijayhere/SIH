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


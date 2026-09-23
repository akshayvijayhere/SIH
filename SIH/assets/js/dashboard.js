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
        <td><div class="progress-bar-wrap"><div class="progress-bar-fill ${p.riskScore > 75 ? 'high-risk' : 'medium-risk'}" style="width: ${p.progress}%;"></div></div></td>
        <td><span style="font-weight: 800; color: ${p.riskScore > 75 ? '#ef4444' : '#f59e0b'};">${p.riskScore}%</span></td>
        <td><span class="status-badge ${p.statusClass}">${p.status}</span></td>
        <td><a class="btn-action-sm" href="project-detail.html?id=${p.id}">View</a></td>
      </tr>
    `).join('');
  }
});

/* 
   NIRMAAN AI - Risk Analytics Logic (Screen 5)
*/

document.addEventListener('DOMContentLoaded', async () => {
  if (window.NIRMAAN_API) {
    await window.NIRMAAN_API.getProjects();
    await window.NIRMAAN_API.getSCurveData();
  }

  const data = window.NIRMAAN_DATA;
  if (!data) return;

  if (window.NIRMAAN_CHARTS) {
    window.NIRMAAN_CHARTS.renderDonutChart(
      'analytics-donut-container',
      data.riskDistribution.high.count,
      data.riskDistribution.medium.count,
      data.riskDistribution.low.count
    );

    if (data.sCurveData) {
      window.NIRMAAN_CHARTS.renderSCurveChart('analytics-scurve-canvas', data.sCurveData);

      // Compute dynamic physical progress lag and financial variance
      const len = data.sCurveData.planned ? data.sCurveData.planned.length : 0;
      if (len > 0) {
        const latestPlanned = data.sCurveData.planned[len - 1];
        const latestPhysical = data.sCurveData.actualPhysical[len - 1];
        const latestFinancial = data.sCurveData.financialSpent[len - 1];

        const physLag = latestPhysical - latestPlanned;
        const finVar = latestFinancial - latestPlanned;

        const badgeElem = document.getElementById('scurve-variance-badge');
        if (badgeElem) {
          badgeElem.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> Physical Lag: ${physLag}% | Financial Variance: ${finVar > 0 ? '+' + finVar + '%' : finVar + '%'}`;
        }
      }
    }
  }
});

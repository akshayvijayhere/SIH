/* 
   NIRMAAN AI - Risk Analytics Logic (Screen 5)
*/

document.addEventListener('DOMContentLoaded', () => {
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
    }
  }
});

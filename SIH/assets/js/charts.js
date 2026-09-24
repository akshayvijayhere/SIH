/* 
   NIRMAAN AI - Interactive Chart & Graphic Engines
*/

window.NIRMAAN_CHARTS = {
  renderDonutChart(containerId, high, medium, low) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const total = high + medium + low;
    const highPct = Math.round((high / total) * 100);
    const medPct = Math.round((medium / total) * 100);
    const lowPct = Math.round((low / total) * 100);

    container.innerHTML = `
      <div style="position: relative; width: 140px; height: 140px; display: flex; align-items: center; justify-content: center;">
        <svg width="140" height="140" viewBox="0 0 42 42">
          <circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#e2e8f0" stroke-width="4.5"></circle>
          <circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#ef4444" stroke-width="4.5" stroke-dasharray="${highPct} ${100 - highPct}" stroke-dashoffset="25"></circle>
          <circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#f59e0b" stroke-width="4.5" stroke-dasharray="${medPct} ${100 - medPct}" stroke-dashoffset="${100 - highPct + 25}"></circle>
          <circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#10b981" stroke-width="4.5" stroke-dasharray="${lowPct} ${100 - lowPct}" stroke-dashoffset="${100 - highPct - medPct + 25}"></circle>
        </svg>
        <div style="position: absolute; text-align: center;">
          <div style="font-size: 1.4rem; font-weight: 800; color: var(--text-main); line-height: 1;">${total}</div>
          <div style="font-size: 0.68rem; color: var(--text-muted);">Projects</div>
        </div>
      </div>
    `;
  },

  renderStateBarChart(containerId, stateData) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const maxVal = Math.max(...stateData.map(d => d.highRiskCount));

    container.innerHTML = `
      <div class="state-bar-chart-container">
        ${stateData.map(d => {
          const heightPct = Math.round((d.highRiskCount / maxVal) * 100);
          const stateShortMap = {
            'Uttar Pradesh': 'UP',
            'West Bengal': 'WB',
            'Andhra Pradesh': 'AP',
            'Tamil Nadu': 'TN',
            'Rajasthan': 'Raj',
            'Gujarat': 'Guj',
            'Maharashtra': 'Maha',
            'Delhi': 'Delhi',
            'Bihar': 'Bihar',
            'Karnataka': 'Kar',
            'Assam': 'Assam'
          };
          const label = stateShortMap[d.state] || d.state.split(' ')[0];
          return `
            <div class="bar-col">
              <div style="font-size: 0.7rem; font-weight: 700; color: #ef4444;">${d.highRiskCount}</div>
              <div class="bar-stick" style="height: ${heightPct}%;"></div>
              <div class="bar-label" title="${d.state}">${label}</div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  },

  renderSCurveChart(canvasId, sCurveData) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || !window.Chart || !sCurveData) return;

    const ctx = canvas.getContext('2d');

    // Gradient fills
    const plannedGradient = ctx.createLinearGradient(0, 0, 0, 300);
    plannedGradient.addColorStop(0, 'rgba(59, 130, 246, 0.15)');
    plannedGradient.addColorStop(1, 'rgba(59, 130, 246, 0.0)');

    const physicalGradient = ctx.createLinearGradient(0, 0, 0, 300);
    physicalGradient.addColorStop(0, 'rgba(16, 185, 129, 0.2)');
    physicalGradient.addColorStop(1, 'rgba(16, 185, 129, 0.0)');

    const financialGradient = ctx.createLinearGradient(0, 0, 0, 300);
    financialGradient.addColorStop(0, 'rgba(139, 92, 246, 0.2)');
    financialGradient.addColorStop(1, 'rgba(139, 92, 246, 0.0)');

    new window.Chart(ctx, {
      type: 'line',
      data: {
        labels: sCurveData.labels,
        datasets: [
          {
            label: 'Planned Progress (%)',
            data: sCurveData.planned,
            borderColor: '#3b82f6',
            backgroundColor: plannedGradient,
            borderWidth: 2.5,
            borderDash: [6, 4],
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointHoverRadius: 6
          },
          {
            label: 'Actual Physical Progress (%)',
            data: sCurveData.actualPhysical,
            borderColor: '#10b981',
            backgroundColor: physicalGradient,
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointRadius: 5,
            pointHoverRadius: 7
          },
          {
            label: 'Financial Expenditure (%)',
            data: sCurveData.financialSpent,
            borderColor: '#8b5cf6',
            backgroundColor: financialGradient,
            borderWidth: 2.5,
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointHoverRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false
        },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              font: { family: 'Plus Jakarta Sans', size: 12, weight: '600' },
              usePointStyle: true,
              padding: 15
            }
          },
          tooltip: {
            backgroundColor: '#0f172a',
            titleFont: { family: 'Plus Jakarta Sans', size: 13, weight: '700' },
            bodyFont: { family: 'Inter', size: 12 },
            padding: 12,
            cornerRadius: 10,
            callbacks: {
              label: function(context) {
                return ` ${context.dataset.label}: ${context.parsed.y}%`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { font: { family: 'Inter', size: 11 } }
          },
          y: {
            min: 0,
            max: 100,
            grid: { color: '#e2e8f0' },
            ticks: {
              font: { family: 'Inter', size: 11 },
              callback: value => `${value}%`
            }
          }
        }
      }
    });
  },

  renderProjectVelocityChart(canvasId, project) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || !window.Chart || !project) return;

    const ctx = canvas.getContext('2d');
    const quarters = ['Q1 2025', 'Q2 2025', 'Q3 2025', 'Q4 2025', 'Q1 2026', 'Q2 2026'];
    const plannedCurve = [15, 30, 50, 70, 85, 100];

    // Compute milestone actual curve based on project progress
    const maxVal = project.progress;
    const actualCurve = [
      Math.round(maxVal * 0.15),
      Math.round(maxVal * 0.35),
      Math.round(maxVal * 0.6),
      Math.round(maxVal * 0.8),
      maxVal,
      null
    ];

    new window.Chart(ctx, {
      type: 'line',
      data: {
        labels: quarters,
        datasets: [
          {
            label: 'Planned Schedule Target (%)',
            data: plannedCurve,
            borderColor: '#94a3b8',
            borderWidth: 2,
            borderDash: [5, 5],
            fill: false,
            tension: 0.35
          },
          {
            label: `${project.name} Actual Progress (%)`,
            data: actualCurve,
            borderColor: project.riskScore >= 70 ? '#ef4444' : '#10b981',
            backgroundColor: project.riskScore >= 70 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.35,
            pointRadius: 5
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top' }
        },
        scales: {
          y: {
            min: 0,
            max: 100,
            ticks: { callback: v => `${v}%` }
          }
        }
      }
    });
  }
};


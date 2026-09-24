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

  // Initialize Land Acquisition & Forest Clearance Bottleneck Simulator
  initCascadeSimulator();
});

function initCascadeSimulator() {
  const rowSlider = document.getElementById('sim-row-slider');
  const forestSlider = document.getElementById('sim-forest-slider');
  const weatherSlider = document.getElementById('sim-weather-slider');
  const sectorSelect = document.getElementById('sim-sector-select');
  const resetBtn = document.getElementById('btn-reset-simulator');

  if (!rowSlider || !forestSlider || !weatherSlider) return;

  const runSimulation = () => {
    const rowVal = parseInt(rowSlider.value);
    const forestVal = parseInt(forestSlider.value);
    const weatherVal = parseInt(weatherSlider.value);
    const sectorVal = sectorSelect?.value || 'Roads & Highways';

    // Update Slider Labels
    document.getElementById('sim-row-val').innerText = `${rowVal}% Completed`;
    document.getElementById('sim-forest-val').innerText = `+${forestVal} Months Delay`;
    document.getElementById('sim-weather-val').innerText = `${weatherVal} Days Lost`;

    // Cascade Calculation Math
    const landLagMonths = Math.max(0, (100 - rowVal) * 0.26);
    const forestMonths = forestVal * 1.12;
    const weatherMonths = (weatherVal / 30) * 0.7;

    const totalDelayMonths = parseFloat((landLagMonths + forestMonths + weatherMonths).toFixed(1));

    // Base Sector Outlay
    let baseOutlay = 85000; // ₹ Cr
    if (sectorVal.includes('Railways')) baseOutlay = 125000;
    if (sectorVal.includes('Energy')) baseOutlay = 65000;
    if (sectorVal.includes('Urban')) baseOutlay = 45000;

    // Financial Overrun Math (Inflation escalation ~ 0.95% per month of delay)
    const overrunCost = Math.round(baseOutlay * (totalDelayMonths * 0.0095));
    const overrunPct = parseFloat(((overrunCost / baseOutlay) * 100).toFixed(1));

    // Risk Score Calculation
    let simulatedRisk = Math.round(35 + (totalDelayMonths * 2.4) - (rowVal * 0.2));
    simulatedRisk = Math.max(15, Math.min(98, simulatedRisk));

    // Calculate Completion Date
    const baseDate = new Date(2027, 5, 15); // June 2027
    baseDate.setMonth(baseDate.getMonth() + Math.round(totalDelayMonths));
    const dateString = baseDate.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });

    // Update UI Results
    document.getElementById('sim-res-delay-months').innerText = `+${totalDelayMonths} Months`;
    document.getElementById('sim-res-completion-date').innerText = `Est. Completion: ${dateString}`;

    document.getElementById('sim-res-cost-overrun').innerText = `+₹${overrunCost.toLocaleString()} Cr`;
    document.getElementById('sim-res-overrun-pct').innerText = `+${overrunPct}% above Approved Outlay`;

    const riskIndexEl = document.getElementById('sim-res-risk-index');
    const riskBarEl = document.getElementById('sim-res-risk-bar');

    if (riskIndexEl) {
      let riskLabel = 'LOW RISK';
      let riskColor = '#10b981';
      if (simulatedRisk >= 70) { riskLabel = 'CRITICAL RISK'; riskColor = '#ef4444'; }
      else if (simulatedRisk >= 50) { riskLabel = 'MEDIUM RISK'; riskColor = '#f59e0b'; }

      riskIndexEl.innerHTML = `${simulatedRisk}% (${riskLabel})`;
      riskIndexEl.style.color = riskColor;
    }

    if (riskBarEl) {
      riskBarEl.style.width = `${simulatedRisk}%`;
      riskBarEl.className = `progress-bar-fill ${simulatedRisk >= 70 ? 'high-risk' : (simulatedRisk >= 50 ? 'medium-risk' : 'low-risk')}`;
    }

    // AI Mitigation Directive Text
    const directiveTextEl = document.getElementById('sim-directive-text');
    if (directiveTextEl) {
      let directive = `For <strong>${sectorVal}</strong>, a Right-of-Way clearance of ${rowVal}% paired with +${forestVal} months forestry delay generates a projected <strong>+${totalDelayMonths} months timeline shift</strong> and <strong>+₹${overrunCost.toLocaleString()} Cr capital overrun</strong>. `;
      
      if (simulatedRisk >= 70) {
        directive += `<strong>Action Directive:</strong> Trigger Level 3 MoSPI Cabinet Committee Memorandum. Fast-track PARIVESH 2.0 single-window clearances and issue emergency land compensation disbursements to recover ~4.5 months.`;
      } else if (simulatedRisk >= 50) {
        directive += `<strong>Action Directive:</strong> Convene Level 2 Ministry Review with State Chief Secretary. Reallocate regional contractors to non-disputed linear packages.`;
      } else {
        directive += `<strong>Action Directive:</strong> Execution velocity remains optimal. Maintain standard monthly IPMD S-curve monitoring.`;
      }

      directiveTextEl.innerHTML = directive;
    }
  };

  rowSlider.addEventListener('input', runSimulation);
  forestSlider.addEventListener('input', runSimulation);
  weatherSlider.addEventListener('input', runSimulation);
  sectorSelect?.addEventListener('change', runSimulation);

  resetBtn?.addEventListener('click', () => {
    rowSlider.value = 65;
    forestSlider.value = 6;
    weatherSlider.value = 45;
    if (sectorSelect) sectorSelect.value = 'Roads & Highways';
    runSimulation();
    if (window.showGlobalToast) window.showGlobalToast('Simulator reset to baseline defaults', 'info');
  });

  // Run initial calculation
  runSimulation();

  // Initialize Fraud Anomaly Audit Table
  renderFraudAuditTable();
}

const FRAUD_ANOMALY_DATASET = [
  {
    invId: "INV-8804",
    contractor: "L&T Construction",
    project: "Mumbai-Ahmedabad High Speed Rail",
    amount: "₹142.5 Cr",
    anomaly: "Physical Progress Mismatch: Billed 68% milestone payout, but GIS drone scan verifies only 44% completion.",
    confidence: "94%",
    status: "Active Flag",
    frozen: false
  },
  {
    invId: "INV-8791",
    contractor: "Dilip Buildcon",
    project: "Gorakhpur Link Expressway",
    amount: "₹68.0 Cr",
    anomaly: "Material Price Inflation: Structural steel rebar billed at +38.4% above WPI benchmark index.",
    confidence: "88%",
    status: "Active Flag",
    frozen: false
  },
  {
    invId: "INV-8742",
    contractor: "Hindustan Construction (HCC)",
    project: "Bandra-Worli Sea Link Phase-2",
    amount: "₹95.2 Cr",
    anomaly: "Duplicate Milestone Claim: Pier foundation piling work billed twice under sub-contractor accounts.",
    confidence: "96%",
    status: "Active Flag",
    frozen: false
  },
  {
    invId: "INV-8650",
    contractor: "RVNL Executing Agency",
    project: "Kolkata Metro Expansion",
    amount: "₹36.4 Cr",
    anomaly: "Phantom Labor Billing: Biometric RFID logs reveal 42 workers present vs 140 workers billed.",
    confidence: "82%",
    status: "Active Flag",
    frozen: false
  }
];

function renderFraudAuditTable() {
  const container = document.getElementById('fraud-audit-table-body');
  if (!container) return;

  container.innerHTML = FRAUD_ANOMALY_DATASET.map(item => `
    <tr>
      <td><strong style="font-family: monospace; font-size: 0.85rem; color: #2563eb;">${item.invId}</strong></td>
      <td>
        <strong>${escapeHtml(item.contractor)}</strong>
        <div style="font-size: 0.72rem; color: var(--text-muted);"><i class="fa-solid fa-building"></i> ${escapeHtml(item.project)}</div>
      </td>
      <td><strong style="font-size: 0.9rem; color: var(--text-main);">${item.amount}</strong></td>
      <td><span style="font-size: 0.78rem; color: #ef4444; font-weight: 600;">${escapeHtml(item.anomaly)}</span></td>
      <td><span style="font-weight: 800; color: #ef4444;">${item.confidence}</span></td>
      <td>
        ${item.frozen ? `
          <span style="background: rgba(239, 68, 68, 0.15); color: #dc2626; padding: 4px 10px; border-radius: 12px; font-size: 0.72rem; font-weight: 800; border: 1px solid #fca5a5;">
            <i class="fa-solid fa-lock"></i> PAYMENT FROZEN
          </span>
        ` : `
          <span style="background: rgba(245, 158, 11, 0.15); color: #d97706; padding: 4px 10px; border-radius: 12px; font-size: 0.72rem; font-weight: 800; border: 1px solid #fcd34d;">
            <i class="fa-solid fa-triangle-exclamation"></i> Flagged
          </span>
        `}
      </td>
      <td>
        ${item.frozen ? `
          <button class="btn-action-sm" disabled style="opacity: 0.6; cursor: not-allowed; background: #64748b; color: white;">
            <i class="fa-solid fa-check"></i> Audit Locked
          </button>
        ` : `
          <button class="btn-action-sm" onclick="freezeInvoicePayment('${item.invId}')" style="background-color: #dc2626; color: white;">
            <i class="fa-solid fa-lock"></i> Freeze Payment
          </button>
        `}
      </td>
    </tr>
  `).join('');
}

function freezeInvoicePayment(invId) {
  const item = FRAUD_ANOMALY_DATASET.find(i => i.invId === invId);
  if (item) {
    item.frozen = true;
    renderFraudAuditTable();
    if (window.showGlobalToast) window.showGlobalToast(`🔒 Financial Lock Enforced: Payment for ${invId} (${item.amount}) frozen. Dispatched to MoSPI Special Audit Cell.`, 'danger');
  }
}



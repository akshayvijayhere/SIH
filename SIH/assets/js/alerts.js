/* 
   NIRMAAN AI - MoSPI Multi-Level Governance & Escalation Alert Engine
*/

let activeAlertTab = 'all';

document.addEventListener('DOMContentLoaded', async () => {
  if (window.NIRMAAN_API) {
    await window.NIRMAAN_API.getAlerts();
  }
  initAlertCenter();
});

function initAlertCenter() {
  const data = window.NIRMAAN_DATA;
  if (!data || !data.alerts) return;

  // Enrich alert records with MoSPI escalation levels if not set
  data.alerts.forEach((item) => {
    if (!item.escalationLevel) {
      if (item.type === 'critical') item.escalationLevel = 'Level 3: Cabinet Committee';
      else if (item.type === 'warning') item.escalationLevel = 'Level 2: Ministry Nodal Agency';
      else item.escalationLevel = 'Level 1: Nodal Officer';
    }
  });

  updateBadgeCounts();
  filterAlerts();

  const tabsContainer = document.getElementById('alert-tabs-container');
  if (tabsContainer) {
    tabsContainer.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        tabsContainer.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        activeAlertTab = e.currentTarget.getAttribute('data-tab');
        filterAlerts();
      });
    });
  }

  document.getElementById('state-quick-filter')?.addEventListener('change', filterAlerts);
}

function updateBadgeCounts() {
  const data = window.NIRMAAN_DATA;
  if (!data || !data.alerts) return;

  const activeAlerts = data.alerts.filter(a => a.type !== 'resolved');
  const criticalAlerts = data.alerts.filter(a => a.type === 'critical');
  const warningAlerts = data.alerts.filter(a => a.type === 'warning');
  const delayAlerts = data.alerts.filter(a => a.category === 'delay' && a.type !== 'resolved');
  const costAlerts = data.alerts.filter(a => a.category === 'cost' && a.type !== 'resolved');
  const resolvedAlerts = data.alerts.filter(a => a.type === 'resolved');

  // Update header and sidebar badges
  document.querySelectorAll('.nav-badge, .notification-badge-dot').forEach(el => {
    el.textContent = activeAlerts.length;
    if (activeAlerts.length === 0) {
      el.style.display = 'none';
    } else {
      el.style.display = 'inline-flex';
    }
  });

  // Update tab text labels with counts
  const tabAll = document.querySelector('.tab-btn[data-tab="all"]');
  if (tabAll) tabAll.innerHTML = `Active Alerts (${activeAlerts.length})`;

  const tabCritical = document.querySelector('.tab-btn[data-tab="critical"]');
  if (tabCritical) tabCritical.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> Critical (${criticalAlerts.length})`;

  const tabWarning = document.querySelector('.tab-btn[data-tab="warning"]');
  if (tabWarning) tabWarning.innerHTML = `Level 2 Warning (${warningAlerts.length})`;

  const tabDelay = document.querySelector('.tab-btn[data-tab="delay"]');
  if (tabDelay) tabDelay.innerHTML = `Delay Risk (${delayAlerts.length})`;

  const tabCost = document.querySelector('.tab-btn[data-tab="cost"]');
  if (tabCost) tabCost.innerHTML = `Cost Risk (${costAlerts.length})`;

  const tabResolved = document.querySelector('.tab-btn[data-tab="resolved"]');
  if (tabResolved) tabResolved.innerHTML = `<i class="fa-solid fa-circle-check"></i> Audited & Resolved (${resolvedAlerts.length})`;
}

function filterAlerts() {
  const data = window.NIRMAAN_DATA;
  if (!data || !data.alerts) return;

  const stateQuick = document.getElementById('state-quick-filter')?.value || 'all';

  let filtered = data.alerts.filter(item => {
    if (activeAlertTab === 'resolved') {
      if (item.type !== 'resolved') return false;
    } else {
      // For all active tabs (all active, critical, warning, delay, cost), hide audited/resolved alerts
      if (item.type === 'resolved') return false;
      if (activeAlertTab === 'critical' && item.type !== 'critical') return false;
      if (activeAlertTab === 'warning' && item.type !== 'warning') return false;
      if (activeAlertTab === 'delay' && item.category !== 'delay') return false;
      if (activeAlertTab === 'cost' && item.category !== 'cost') return false;
    }

    if (stateQuick !== 'all' && item.state !== stateQuick) return false;
    return true;
  });

  renderAlerts(filtered);
}

function renderAlerts(alertsList) {
  const container = document.getElementById('alert-feed-list');
  if (!container) return;

  if (!alertsList || alertsList.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 3rem; background: var(--bg-surface); border-radius: 14px; color: var(--text-muted);">
        <i class="fa-solid fa-circle-check" style="font-size: 2.5rem; color: #10b981; margin-bottom: 1rem;"></i>
        <h3>No alerts found matching selected criteria</h3>
        <span style="font-size: 0.8rem;">All infrastructure monitoring parameters are within normal threshold limits.</span>
      </div>
    `;
    return;
  }

  container.innerHTML = alertsList.map(item => {
    let iconClass = 'fa-triangle-exclamation';
    let typeLabel = item.type ? item.type.toUpperCase() : 'ALERT';
    if (item.type === 'info') {
      iconClass = 'fa-circle-info';
    } else if (item.type === 'resolved') {
      iconClass = 'fa-circle-check';
      typeLabel = 'AUDITED & RESOLVED';
    }

    let escBadgeStyle = 'background: #fee2e2; color: #dc2626; border: 1px solid #fca5a5;';
    if (item.type === 'resolved') {
      escBadgeStyle = 'background: #d1fae5; color: #059669; border: 1px solid #6ee7b7;';
    } else if (item.escalationLevel && item.escalationLevel.includes('Level 2')) {
      escBadgeStyle = 'background: #fef3c7; color: #d97706; border: 1px solid #fcd34d;';
    } else if (item.escalationLevel && item.escalationLevel.includes('Level 1')) {
      escBadgeStyle = 'background: #e0f2fe; color: #0284c7; border: 1px solid #7dd3fc;';
    }

    // Categorized escalation button based on current tier
    let escalationBtnHtml = '';
    const currentLevel = item.escalationLevel || 'Level 1: Nodal Officer';

    if (currentLevel.includes('Level 1')) {
      escalationBtnHtml = `
        <button class="btn-action-sm" onclick="escalateAlert('${item.id}')" style="background-color: #d97706; color: white;">
          <i class="fa-solid fa-arrow-up-right-dots"></i> Escalate to Level 2 (Ministry)
        </button>
      `;
    } else if (currentLevel.includes('Level 2')) {
      escalationBtnHtml = `
        <button class="btn-action-sm" onclick="escalateAlert('${item.id}')" style="background-color: #dc2626; color: white;">
          <i class="fa-solid fa-landmark"></i> Escalate to Level 3 (Cabinet)
        </button>
      `;
    } else {
      escalationBtnHtml = `
        <span class="btn-action-sm" style="background: #fee2e2; color: #dc2626; border: 1px solid #fca5a5; font-weight: 800; font-size: 0.72rem; display: inline-flex; align-items: center; gap: 4px;">
          <i class="fa-solid fa-landmark"></i> Escalated to Cabinet (Level 3)
        </span>
        <button class="btn-action-sm" onclick="exportCabinetMemo('${item.id}')" style="background-color: #1e293b; color: white;">
          <i class="fa-solid fa-file-pdf"></i> Cabinet Memo
        </button>
      `;
    }

    // Recipient officer reminder label
    let reminderText = 'Remind Field Officer';
    if (currentLevel.includes('Level 2')) reminderText = 'Remind Ministry Nodal Agency';
    else if (currentLevel.includes('Level 3')) reminderText = 'Remind Cabinet Secretariat';

    return `
      <div class="alert-item-card ${item.type}" style="display: flex; flex-direction: column; gap: 0.75rem; padding: 1.15rem; background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 14px; box-shadow: var(--shadow-sm); margin-bottom: 1rem;">
        <div style="display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem;">
          <div style="display: flex; align-items: center; gap: 0.6rem;">
            <span class="alert-severity-badge ${item.type}">
              <i class="fa-solid ${iconClass}"></i> ${typeLabel}
            </span>
            <span style="font-size: 0.68rem; font-weight: 800; padding: 3px 8px; border-radius: 6px; ${escBadgeStyle}">
              <i class="fa-solid ${item.type === 'resolved' ? 'fa-shield-check' : 'fa-sitemap'}"></i> ${item.type === 'resolved' ? 'Audit Status: Verified' : currentLevel}
            </span>
          </div>
          <span style="font-size: 0.72rem; color: var(--text-muted);"><i class="fa-regular fa-clock"></i> ${item.timeAgo || 'Recently'}</span>
        </div>

        <div>
          <h3 style="font-size: 0.98rem; font-weight: 800; color: var(--text-main); margin-bottom: 2px;">${escapeHtml(item.title)}</h3>
          <p style="font-size: 0.82rem; color: var(--text-muted);">${escapeHtml(item.issue)}</p>
        </div>

        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.75rem; border-top: 1px dashed var(--border-color); padding-top: 0.75rem; font-size: 0.78rem;">
          <div style="display: flex; align-items: center; gap: 1rem; color: var(--text-muted);">
            <span><i class="fa-solid fa-location-dot"></i> ${item.state}</span>
            <span><i class="fa-solid fa-building"></i> ${item.sector}</span>
            <span style="font-weight: 800; color: ${item.type === 'resolved' ? '#059669' : (item.riskPercentage > 60 ? '#ef4444' : '#f59e0b')};">
              Risk: ${item.riskPercentage}%
            </span>
          </div>

          <!-- Action Button Group -->
          <div style="display: flex; align-items: center; gap: 0.4rem; flex-wrap: wrap;">
            ${item.type !== 'resolved' ? `
              ${escalationBtnHtml}
              <button class="btn-action-sm" onclick="notifyOfficer('${item.id}')" style="background-color: var(--color-primary); color: white;">
                <i class="fa-solid fa-paper-plane"></i> ${reminderText}
              </button>
              <button class="btn-action-sm" onclick="resolveAlert('${item.id}')" style="background-color: #059669; color: white;">
                <i class="fa-solid fa-circle-check"></i> Mark Audited
              </button>
            ` : `
              <span style="font-size: 0.75rem; font-weight: 700; color: #059669; background: #d1fae5; padding: 4px 10px; border-radius: 6px; border: 1px solid #6ee7b7; display: inline-flex; align-items: center; gap: 5px;">
                <i class="fa-solid fa-circle-check"></i> Audit Complete (Resolved)
              </span>
              <button class="btn-action-sm" onclick="viewAuditCertificate('${item.id}')" style="background-color: #059669; color: white;">
                <i class="fa-solid fa-qrcode"></i> Verify QR Certificate
              </button>
            `}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

async function escalateAlert(alertId) {
  const data = window.NIRMAAN_DATA;
  if (!data) return;

  const item = data.alerts.find(a => a.id === alertId);
  if (!item) return;

  if (window.NIRMAAN_API) {
    try {
      const res = await window.NIRMAAN_API.escalateAlert(alertId);
      if (res && res.success && res.data) {
        Object.assign(item, res.data);
      }
    } catch (e) {
      console.warn('API escalate alert failed:', e);
    }
  }

  if (!item.escalationLevel || item.escalationLevel.includes('Level 1')) {
    item.escalationLevel = 'Level 2: Ministry Nodal Agency';
    item.type = 'warning';
    showToast(`Escalated "${item.title}" to Level 2 (Ministry Nodal Agency)`, 'warning');
  } else if (item.escalationLevel.includes('Level 2')) {
    item.escalationLevel = 'Level 3: Cabinet Committee';
    item.type = 'critical';
    showToast(`CRITICAL ESCALATION: "${item.title}" dispatched to Cabinet Committee on Infrastructure!`, 'danger');
  }

  updateBadgeCounts();
  filterAlerts();
}

async function resolveAlert(alertId) {
  const data = window.NIRMAAN_DATA;
  if (!data) return;

  const item = data.alerts.find(a => a.id === alertId);
  if (!item) return;

  if (window.NIRMAAN_API) {
    try {
      const res = await window.NIRMAAN_API.resolveAlert(alertId);
      if (res && res.success && res.data) {
        Object.assign(item, res.data);
      }
    } catch (e) {
      console.warn('API resolve alert failed:', e);
    }
  }

  item.type = 'resolved';
  item.riskPercentage = Math.round(item.riskPercentage * 0.4);
  showToast(`Audit Completed for "${item.title}". Moved to Audited & Resolved.`, 'success');
  updateBadgeCounts();
  filterAlerts();
}

function notifyOfficer(alertId) {
  const data = window.NIRMAAN_DATA;
  if (!data) return;

  const item = data.alerts.find(a => a.id === alertId);
  if (item) {
    const currentLevel = item.escalationLevel || 'Level 1: Nodal Officer';
    let recipient = 'Field Nodal Engineer';
    if (currentLevel.includes('Level 2')) recipient = 'Ministry Joint Secretary';
    else if (currentLevel.includes('Level 3')) recipient = 'Cabinet Secretariat Desk';

    showToast(`Urgent MoSPI Notice & SMS dispatched to ${recipient} for "${item.title}".`, 'info');
  }
}

function exportCabinetMemo(alertId) {
  const data = window.NIRMAAN_DATA;
  if (!data) return;

  const alertItem = data.alerts.find(a => a.id === alertId);
  if (!alertItem) return;

  const proj = (data.projects || []).find(p => p.name === alertItem.title) || {
    approvedBudget: '₹2,450 Cr',
    spentBudget: '₹1,680 Cr',
    agency: 'NHAI',
    contractor: 'M/s InfraTech Pvt Ltd'
  };

  const modalDiv = document.createElement('div');
  modalDiv.className = 'cabinet-memo-modal-overlay';
  modalDiv.id = 'cabinet-memo-modal';
  modalDiv.innerHTML = `
    <div class="cabinet-memo-paper">
      <div class="no-print" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 1rem; margin-bottom: 1.5rem;">
        <span style="font-size: 0.82rem; font-weight: 800; color: #dc2626;"><i class="fa-solid fa-file-pdf"></i> Official Government Document Preview</span>
        <div style="display: flex; gap: 0.5rem;">
          <button onclick="window.print()" style="background: #0284c7; color: white; border: none; padding: 0.45rem 1rem; border-radius: 6px; font-weight: 700; font-size: 0.8rem; cursor: pointer;">
            <i class="fa-solid fa-print"></i> Print / Save PDF
          </button>
          <button onclick="document.getElementById('cabinet-memo-modal').remove()" style="background: #64748b; color: white; border: none; padding: 0.45rem 0.85rem; border-radius: 6px; font-weight: 700; font-size: 0.8rem; cursor: pointer;">
            <i class="fa-solid fa-xmark"></i> Close
          </button>
        </div>
      </div>

      <div style="text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 1.25rem; margin-bottom: 1.5rem;">
        <div style="font-size: 1.5rem; margin-bottom: 4px;"><i class="fa-solid fa-landmark"></i></div>
        <h2 style="font-size: 1.15rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; margin: 0;">Government of India</h2>
        <h3 style="font-size: 0.95rem; font-weight: 700; color: #334155; margin: 2px 0;">Ministry of Statistics & Programme Implementation (MoSPI)</h3>
        <p style="font-size: 0.78rem; color: #64748b; margin: 0;">Infrastructure & Project Monitoring Division (IPMD) | Sardar Patel Bhawan, New Delhi</p>
      </div>

      <div style="display: flex; justify-content: space-between; font-size: 0.78rem; font-weight: 700; color: #475569; margin-bottom: 1.25rem;">
        <span>Ref No: MoSPI/IPMD/CCI-NOTE/2026/${alertItem.id}</span>
        <span>Date: 24 September 2026</span>
      </div>

      <div style="background: #fef2f2; border: 1px solid #fecaca; color: #991b1b; padding: 0.6rem 1rem; border-radius: 6px; text-align: center; font-size: 0.85rem; font-weight: 800; margin-bottom: 1.5rem;">
        SECRET / CONFIDENTIAL — FOR CABINET COMMITTEE ON INFRASTRUCTURE (CCI) ONLY
      </div>

      <div style="margin-bottom: 1.25rem;">
        <h4 style="font-size: 0.95rem; font-weight: 800; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin-bottom: 0.5rem;">1. SUBJECT</h4>
        <p style="font-size: 0.85rem; line-height: 1.5; color: #1e293b;">
          Urgent Cabinet Intervention required regarding Level 3 Milestone Delays & Risk Escalation for <strong>${alertItem.title} (${alertItem.state})</strong>.
        </p>
      </div>

      <div style="margin-bottom: 1.25rem;">
        <h4 style="font-size: 0.95rem; font-weight: 800; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin-bottom: 0.75rem;">2. PROJECT SANCTION & PERFORMANCE METRICS</h4>
        <table style="width: 100%; border-collapse: collapse; font-size: 0.82rem; text-align: left;">
          <tr style="border-bottom: 1px solid #e2e8f0; background: #f8fafc;">
            <th style="padding: 6px 10px;">Parameter</th>
            <th style="padding: 6px 10px;">Sanctioned Value</th>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 6px 10px; font-weight: 600;">Implementing Nodal Agency</td>
            <td style="padding: 6px 10px;">${proj.agency || 'NHAI'}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 6px 10px; font-weight: 600;">Primary Contractor</td>
            <td style="padding: 6px 10px;">${proj.contractor || 'M/s InfraTech Pvt Ltd'}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 6px 10px; font-weight: 600;">Approved Financial Budget</td>
            <td style="padding: 6px 10px;">${proj.approvedBudget || '₹2,450 Cr'}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 6px 10px; font-weight: 600;">Actual Expenditure Disbursed</td>
            <td style="padding: 6px 10px;">${proj.spentBudget || '₹1,680 Cr'}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 6px 10px; font-weight: 600;">Evaluated Project Risk Score</td>
            <td style="padding: 6px 10px; font-weight: 800; color: #dc2626;">${alertItem.riskPercentage}% (HIGH RISK)</td>
          </tr>
        </table>
      </div>

      <div style="margin-bottom: 1.25rem;">
        <h4 style="font-size: 0.95rem; font-weight: 800; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin-bottom: 0.5rem;">3. AI ROOT CAUSE & BOTTLENECK FINDINGS</h4>
        <p style="font-size: 0.85rem; line-height: 1.5; color: #334155;">
          ${alertItem.issue} Physical progress is severely bottlenecked due to inter-departmental clearance delays and land acquisition section handovers.
        </p>
      </div>

      <div style="margin-bottom: 2rem;">
        <h4 style="font-size: 0.95rem; font-weight: 800; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin-bottom: 0.5rem;">4. RECOMMENDED CABINET DIRECTIVES</h4>
        <ul style="font-size: 0.83rem; line-height: 1.6; color: #1e293b; padding-left: 1.25rem; margin: 0;">
          <li>Issue direct Cabinet mandate to State Administration (${alertItem.state}) to expedite Right of Way (RoW) clearances within 15 days.</li>
          <li>Instruct Ministry Nodal Agency (${proj.agency || 'NHAI'}) to invoke contract Liquidated Damages (LD) clause for non-performance.</li>
          <li>Release supplementary escrow funds contingent on Milestone 4 completion.</li>
        </ul>
      </div>

      <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 3rem; pt: 1rem; border-top: 1px dashed #cbd5e1;">
        <div style="font-size: 0.75rem; color: #64748b;">
          <div>Verified & Dispatched via NIRMAAN AI Platform</div>
          <div>Digital Signature: SHA256-MOSPI-IPMD-2026-OK8</div>
        </div>
        <div style="text-align: center; font-size: 0.8rem; font-weight: 700;">
          <div style="margin-bottom: 2rem; color: #94a3b8;">[ Signed Digitally ]</div>
          <div>( Nodal Officer )</div>
          <div style="font-size: 0.72rem; color: #64748b; font-weight: 500;">Cabinet Secretariat & MoSPI IPMD Desk</div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modalDiv);
}

function viewAuditCertificate(alertId) {
  const data = window.NIRMAAN_DATA;
  if (!data) return;

  const alertItem = (data.alerts || []).find(a => a.id === alertId) || {
    id: alertId,
    title: 'Infrastructure Project',
    state: 'National Project',
    sector: 'Infrastructure',
    riskPercentage: 28
  };

  const hashVal = `SHA256-MOSPI-IPMD-VERIFIED-2026-${alertItem.id}-98A4F72C`;
  const qrDataUrl = `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(`GOV-INDIA-MOSPI-VERIFIED:${alertItem.id}:HASH=${hashVal}`)}`;

  const modalDiv = document.createElement('div');
  modalDiv.className = 'cabinet-memo-modal-overlay';
  modalDiv.id = 'audit-certificate-modal';
  modalDiv.innerHTML = `
    <div class="cabinet-memo-paper" style="max-width: 680px; border: 2px solid #059669;">
      <div class="no-print" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 1rem; margin-bottom: 1.5rem;">
        <span style="font-size: 0.82rem; font-weight: 800; color: #059669;"><i class="fa-solid fa-shield-check"></i> Cryptographic MoSPI Audit Certificate</span>
        <div style="display: flex; gap: 0.5rem;">
          <button onclick="window.print()" style="background: #059669; color: white; border: none; padding: 0.45rem 1rem; border-radius: 6px; font-weight: 700; font-size: 0.8rem; cursor: pointer;">
            <i class="fa-solid fa-print"></i> Print Certificate
          </button>
          <button onclick="document.getElementById('audit-certificate-modal').remove()" style="background: #64748b; color: white; border: none; padding: 0.45rem 0.85rem; border-radius: 6px; font-weight: 700; font-size: 0.8rem; cursor: pointer;">
            <i class="fa-solid fa-xmark"></i> Close
          </button>
        </div>
      </div>

      <div style="text-align: center; border-bottom: 2px dashed #059669; padding-bottom: 1.25rem; margin-bottom: 1.5rem;">
        <div style="font-size: 2rem; color: #059669; margin-bottom: 4px;"><i class="fa-solid fa-award"></i></div>
        <h2 style="font-size: 1.2rem; font-weight: 800; text-transform: uppercase; color: #0f172a; margin: 0;">Government of India</h2>
        <h3 style="font-size: 0.95rem; font-weight: 700; color: #059669; margin: 2px 0;">Ministry of Statistics & Programme Implementation (MoSPI)</h3>
        <p style="font-size: 0.78rem; color: #64748b; margin: 0;">National Infrastructure Digital Audit & Compliance Registry</p>
      </div>

      <div style="display: flex; align-items: center; justify-content: space-between; gap: 1.5rem; background: #f0fdf4; border: 1px solid #bbf7d0; padding: 1.25rem; border-radius: 12px; margin-bottom: 1.5rem;">
        <div style="flex: 1;">
          <div style="font-size: 0.72rem; font-weight: 800; color: #166534; text-transform: uppercase; letter-spacing: 0.5px;">OFFICIAL COMPLIANCE CERTIFICATE</div>
          <h3 style="font-size: 1.1rem; font-weight: 800; color: #0f172a; margin: 4px 0;">${alertItem.title}</h3>
          <div style="font-size: 0.8rem; color: #374151; margin-top: 4px;">
            <span>State: <strong>${alertItem.state}</strong></span> | 
            <span>Sector: <strong>${alertItem.sector}</strong></span>
          </div>
          <div style="font-size: 0.78rem; color: #166534; font-weight: 700; margin-top: 6px;">
            <i class="fa-solid fa-circle-check"></i> Physical Milestone & Risk Audit Status: VERIFIED & RESOLVED
          </div>
        </div>

        <div style="text-align: center; background: white; padding: 10px; border-radius: 10px; border: 1px solid #86efac; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
          <img src="${qrDataUrl}" alt="MoSPI Verification QR" style="width: 120px; height: 120px; display: block; margin: 0 auto;" />
          <div style="font-size: 0.65rem; font-weight: 800; color: #166534; margin-top: 4px;">Scan to Verify QR</div>
        </div>
      </div>

      <div style="margin-bottom: 1.25rem; font-size: 0.82rem;">
        <h4 style="font-size: 0.9rem; font-weight: 800; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin-bottom: 0.5rem; color: #0f172a;">CRYPTOGRAPHIC SECURITY SPECIFICATIONS</h4>
        <div style="background: #f8fafc; padding: 0.75rem 1rem; border-radius: 8px; border: 1px solid #e2e8f0; font-family: monospace; font-size: 0.75rem; word-break: break-all; color: #1e293b;">
          <strong>SHA-256 Stamp:</strong> ${hashVal}
        </div>
      </div>

      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; font-size: 0.8rem; margin-bottom: 1.5rem;">
        <div style="background: #f8fafc; padding: 0.75rem; border-radius: 8px; border: 1px solid #e2e8f0;">
          <div style="color: #64748b; font-size: 0.72rem;">Compliance Auditor</div>
          <strong style="color: #0f172a;">Officer — MoSPI IPMD Desk</strong>
        </div>
        <div style="background: #f8fafc; padding: 0.75rem; border-radius: 8px; border: 1px solid #e2e8f0;">
          <div style="color: #64748b; font-size: 0.72rem;">Audit Timestamp</div>
          <strong style="color: #0f172a;">24 September 2026, 17:08 IST</strong>
        </div>
      </div>

      <div style="display: flex; justify-content: space-between; align-items: flex-end; pt: 1rem; border-top: 1px dashed #cbd5e1;">
        <div style="font-size: 0.72rem; color: #64748b;">
          <div>National Infrastructure Audit Registry (NIAR)</div>
          <div>Cryptographic Seal: VERIFIED-GOV-IND</div>
        </div>
        <div style="text-align: center; font-size: 0.78rem; font-weight: 700;">
          <div style="margin-bottom: 1.5rem; color: #059669;">[ Digitally Signed & Verified ]</div>
          <div>Director, IPMD</div>
          <div style="font-size: 0.7rem; color: #64748b; font-weight: 500;">Ministry of Statistics & Programme Implementation</div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modalDiv);
}

function showToast(msg, type = 'info') {
  let toastContainer = document.getElementById('nirmaan-toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'nirmaan-toast-container';
    toastContainer.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 9999; display: flex; flex-direction: column; gap: 10px; pointer-events: none;';
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  toast.style.cssText = `
    padding: 12px 18px; border-radius: 10px; font-size: 0.82rem; font-weight: 700; color: white;
    background: ${type === 'danger' ? '#dc2626' : (type === 'warning' ? '#d97706' : (type === 'success' ? '#059669' : '#1a56db'))};
    box-shadow: 0 10px 25px rgba(0,0,0,0.2); transition: all 0.3s ease; pointer-events: auto;
    font-family: 'Plus Jakarta Sans', sans-serif; display: flex; align-items: center; gap: 8px;
  `;
  toast.innerHTML = `<i class="fa-solid fa-bell"></i> ${escapeHtml(msg)}`;
  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-10px)';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.innerText = text;
  return div.innerHTML;
}

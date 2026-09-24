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

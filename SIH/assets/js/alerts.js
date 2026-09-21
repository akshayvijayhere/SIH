/* 
   NIRMAAN AI - MoSPI Multi-Level Governance & Escalation Alert Engine
*/

let activeAlertTab = 'all';

document.addEventListener('DOMContentLoaded', () => {
  initAlertCenter();
});

function initAlertCenter() {
  const data = window.NIRMAAN_DATA;
  if (!data) return;

  // Enrich alert records with MoSPI escalation levels if not set
  data.alerts.forEach((item, idx) => {
    if (!item.escalationLevel) {
      if (item.type === 'critical') item.escalationLevel = 'Level 3: Cabinet Committee';
      else if (item.type === 'warning') item.escalationLevel = 'Level 2: Nodal Agency';
      else item.escalationLevel = 'Level 1: Nodal Officer';
    }
  });

  renderAlerts(data.alerts);

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

function filterAlerts() {
  const data = window.NIRMAAN_DATA;
  if (!data) return;

  const stateQuick = document.getElementById('state-quick-filter')?.value || 'all';

  let filtered = data.alerts.filter(item => {
    if (activeAlertTab !== 'all') {
      if (activeAlertTab === 'critical' && item.type !== 'critical') return false;
      if (activeAlertTab === 'warning' && item.type !== 'warning') return false;
      if (activeAlertTab === 'delay' && item.category !== 'delay') return false;
      if (activeAlertTab === 'cost' && item.category !== 'cost') return false;
      if (activeAlertTab === 'resolved' && item.type !== 'resolved') return false;
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
    if (item.type === 'info') iconClass = 'fa-circle-info';
    else if (item.type === 'resolved') iconClass = 'fa-circle-check';

    let tagClass = 'delay';
    if (item.category === 'cost') tagClass = 'cost';
    else if (item.category === 'progress') tagClass = 'progress';
    else if (item.category === 'reduced') tagClass = 'reduced';

    let escBadgeStyle = 'background: #fee2e2; color: #dc2626; border: 1px solid #fca5a5;';
    if (item.escalationLevel && item.escalationLevel.includes('Level 2')) {
      escBadgeStyle = 'background: #fef3c7; color: #d97706; border: 1px solid #fcd34d;';
    } else if (item.escalationLevel && item.escalationLevel.includes('Level 1')) {
      escBadgeStyle = 'background: #e0f2fe; color: #0284c7; border: 1px solid #7dd3fc;';
    }

    return `
      <div class="alert-item-card ${item.type}" style="display: flex; flex-direction: column; gap: 0.75rem; padding: 1.15rem; background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 14px; box-shadow: var(--shadow-sm); margin-bottom: 1rem;">
        <div style="display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem;">
          <div style="display: flex; align-items: center; gap: 0.6rem;">
            <span class="alert-severity-badge ${item.type}" style="font-size: 0.7rem; font-weight: 800; padding: 3px 8px; border-radius: 6px;">
              <i class="fa-solid ${iconClass}"></i> ${item.type.toUpperCase()}
            </span>
            <span style="font-size: 0.68rem; font-weight: 800; padding: 3px 8px; border-radius: 6px; ${escBadgeStyle}">
              <i class="fa-solid fa-sitemap"></i> ${item.escalationLevel || 'Level 1: Nodal Officer'}
            </span>
          </div>
          <span style="font-size: 0.72rem; color: var(--text-muted);"><i class="fa-regular fa-clock"></i> ${item.timeAgo}</span>
        </div>

        <div>
          <h3 style="font-size: 0.98rem; font-weight: 800; color: var(--text-main); margin-bottom: 2px;">${escapeHtml(item.title)}</h3>
          <p style="font-size: 0.82rem; color: var(--text-muted);">${escapeHtml(item.issue)}</p>
        </div>

        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.75rem; border-top: 1px dashed var(--border-color); padding-top: 0.75rem; font-size: 0.78rem;">
          <div style="display: flex; align-items: center; gap: 1rem; color: var(--text-muted);">
            <span><i class="fa-solid fa-location-dot"></i> ${item.state}</span>
            <span><i class="fa-solid fa-building"></i> ${item.sector}</span>
            <span style="font-weight: 800; color: ${item.riskPercentage > 60 ? '#ef4444' : '#f59e0b'};">Risk: ${item.riskPercentage}%</span>
          </div>

          <!-- Action Button Group -->
          <div style="display: flex; align-items: center; gap: 0.4rem;">
            ${item.type !== 'resolved' ? `
              <button class="btn-action-sm" onclick="escalateAlert('${item.id}')" style="background-color: #dc2626; color: white;">
                <i class="fa-solid fa-arrow-up-right-dots"></i> Escalate to Cabinet
              </button>
              <button class="btn-action-sm" onclick="notifyOfficer('${item.id}')" style="background-color: var(--color-primary); color: white;">
                <i class="fa-solid fa-paper-plane"></i> Remind Field Officer
              </button>
              <button class="btn-action-sm" onclick="resolveAlert('${item.id}')" style="background-color: #059669; color: white;">
                <i class="fa-solid fa-circle-check"></i> Mark Audited
              </button>
            ` : `
              <span style="font-size: 0.75rem; font-weight: 700; color: #059669;"><i class="fa-solid fa-check"></i> Audit Complete</span>
            `}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function escalateAlert(alertId) {
  const data = window.NIRMAAN_DATA;
  if (!data) return;

  const item = data.alerts.find(a => a.id === alertId);
  if (item) {
    if (item.escalationLevel.includes('Level 1')) {
      item.escalationLevel = 'Level 2: Ministry Nodal Agency';
      showToast(`Escalated ${item.title} to Level 2 (Ministry Nodal Agency)`, 'warning');
    } else {
      item.escalationLevel = 'Level 3: Cabinet Committee';
      item.type = 'critical';
      showToast(`CRITICAL ESCALATION: ${item.title} dispatched to Cabinet Committee on Infrastructure!`, 'danger');
    }
    filterAlerts();
  }
}

function resolveAlert(alertId) {
  const data = window.NIRMAAN_DATA;
  if (!data) return;

  const item = data.alerts.find(a => a.id === alertId);
  if (item) {
    item.type = 'resolved';
    item.riskPercentage = Math.round(item.riskPercentage * 0.4);
    showToast(`Audit Completed for ${item.title}. Risk status set to Resolved.`, 'success');
    filterAlerts();
  }
}

function notifyOfficer(alertId) {
  const data = window.NIRMAAN_DATA;
  if (!data) return;

  const item = data.alerts.find(a => a.id === alertId);
  if (item) {
    showToast(`Urgent MoSPI Notice & SMS dispatched to Field Nodal Engineer for ${item.title}.`, 'info');
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

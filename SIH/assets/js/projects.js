/* 
   NIRMAAN AI - Projects Directory Engine
   Multi-criteria filtering, search, CSV/PDF export, and Side-by-Side Project Comparison Matrix for MoSPI
*/

let selectedProjectIds = new Set();
let currentFilteredProjects = [];

document.addEventListener('DOMContentLoaded', async () => {
  if (window.NIRMAAN_API) {
    await window.NIRMAAN_API.getProjects();
  }

  // Parse URL search parameters on initial load
  const urlParams = new URLSearchParams(window.location.search);
  const searchParam = urlParams.get('search');
  const sectorParam = urlParams.get('sector');
  const stateParam = urlParams.get('state');

  const searchInput = document.getElementById('projects-search-input');
  const sectorSelect = document.getElementById('projects-filter-sector');
  const stateSelect = document.getElementById('projects-filter-state');

  if (searchParam && searchInput) searchInput.value = searchParam;
  if (sectorParam && sectorSelect) sectorSelect.value = sectorParam;
  if (stateParam && stateSelect) stateSelect.value = stateParam;

  renderProjectsTable();

  // Attach Filter Listeners
  document.getElementById('projects-filter-state')?.addEventListener('change', renderProjectsTable);
  document.getElementById('projects-filter-sector')?.addEventListener('change', renderProjectsTable);
  document.getElementById('projects-filter-risk')?.addEventListener('change', renderProjectsTable);

  // Search input listeners
  const topbarSearch = document.querySelector('.topbar-search input');

  if (searchInput) {
    searchInput.addEventListener('input', renderProjectsTable);
  }
  if (topbarSearch) {
    topbarSearch.addEventListener('input', (e) => {
      if (searchInput) searchInput.value = e.target.value;
      renderProjectsTable();
    });
  }

  // Select all checkbox listener
  document.getElementById('select-all-compare')?.addEventListener('change', (e) => {
    const isChecked = e.target.checked;
    const checkboxes = document.querySelectorAll('.project-compare-checkbox');
    checkboxes.forEach(cb => {
      cb.checked = isChecked;
      if (isChecked) {
        selectedProjectIds.add(cb.dataset.id);
      } else {
        selectedProjectIds.delete(cb.dataset.id);
      }
    });
    updateCompareButtonState();
  });

  // Export CSV button
  document.getElementById('btn-export-csv')?.addEventListener('click', exportProjectsToCSV);
  
  // Print / PDF Report button
  document.getElementById('btn-export-pdf')?.addEventListener('click', () => {
    window.print();
  });

  // Compare Projects Button listener
  document.getElementById('btn-compare-projects')?.addEventListener('click', openComparisonModal);

  // Modal Close Listeners
  document.getElementById('close-compare-modal')?.addEventListener('click', closeComparisonModal);
  document.getElementById('btn-close-compare-footer')?.addEventListener('click', closeComparisonModal);

  // Print comparison modal
  document.getElementById('btn-print-comparison')?.addEventListener('click', () => {
    window.print();
  });
});

function updateCompareButtonState() {
  const btn = document.getElementById('btn-compare-projects');
  if (!btn) return;

  const count = selectedProjectIds.size;
  btn.innerHTML = `<i class="fa-solid fa-code-compare"></i> Compare (${count})`;

  if (count >= 2 && count <= 4) {
    btn.disabled = false;
    btn.style.opacity = '1';
    btn.style.cursor = 'pointer';
    btn.title = `Compare ${count} selected projects side-by-side`;
  } else {
    btn.disabled = true;
    btn.style.opacity = '0.6';
    btn.style.cursor = 'not-allowed';
    if (count < 2) {
      btn.title = 'Select at least 2 projects to compare side-by-side';
    } else {
      btn.title = 'You can compare maximum 4 projects simultaneously';
    }
  }
}

function renderProjectsTable() {
  const container = document.getElementById('projects-table-body');
  if (!container) return;

  const data = window.NIRMAAN_DATA;
  if (!data || !data.projects) return;

  const stateFilter = document.getElementById('projects-filter-state')?.value || 'all';
  const sectorFilter = document.getElementById('projects-filter-sector')?.value || 'all';
  const riskFilter = document.getElementById('projects-filter-risk')?.value || 'all';
  const searchText = (document.getElementById('projects-search-input')?.value || document.querySelector('.topbar-search input')?.value || '').toLowerCase().trim();

  currentFilteredProjects = data.projects.filter(p => {
    if (stateFilter !== 'all' && p.state !== stateFilter) return false;
    if (sectorFilter !== 'all' && p.sector !== sectorFilter) return false;
    if (riskFilter === 'high' && p.riskScore < 70) return false;
    if (riskFilter === 'medium' && (p.riskScore < 50 || p.riskScore >= 70)) return false;
    if (riskFilter === 'low' && p.riskScore >= 50) return false;

    if (searchText) {
      const matchName = p.name.toLowerCase().includes(searchText);
      const matchState = p.state.toLowerCase().includes(searchText);
      const matchCity = (p.city || '').toLowerCase().includes(searchText);
      const matchSector = p.sector.toLowerCase().includes(searchText);
      const matchAgency = (p.agency || '').toLowerCase().includes(searchText);
      const matchContractor = (p.contractor || '').toLowerCase().includes(searchText);

      if (!matchName && !matchState && !matchCity && !matchSector && !matchAgency && !matchContractor) {
        return false;
      }
    }
    return true;
  });

  // Update counter label
  const counterLabel = document.getElementById('projects-count-label');
  if (counterLabel) {
    if (currentFilteredProjects.length < data.projects.length) {
      counterLabel.innerText = `Showing ${currentFilteredProjects.length} of ${data.projects.length} loaded projects (${data.stats.totalProjects} total MoSPI monitored)`;
    } else {
      counterLabel.innerText = `Showing all ${data.projects.length} primary mega projects (${data.stats.totalProjects} total MoSPI monitored)`;
    }
  }

  if (currentFilteredProjects.length === 0) {
    container.innerHTML = `
      <tr>
        <td colspan="10" style="text-align: center; padding: 2.5rem; color: var(--text-muted);">
          <i class="fa-solid fa-folder-open" style="font-size: 2rem; margin-bottom: 0.5rem; color: #cbd5e1;"></i>
          <p style="font-weight: 600;">No infrastructure projects match the selected filters.</p>
          <span style="font-size: 0.78rem;">Try clearing search or changing state/sector options.</span>
        </td>
      </tr>
    `;
    return;
  }

  container.innerHTML = currentFilteredProjects.map((p, idx) => {
    const isChecked = selectedProjectIds.has(p.id) ? 'checked' : '';
    return `
      <tr>
        <td style="text-align: center;">
          <input type="checkbox" class="project-compare-checkbox" data-id="${p.id}" ${isChecked} style="cursor: pointer;">
        </td>
        <td>${idx + 1}</td>
        <td>
          <strong>${escapeHtml(p.name)}</strong>
          <div style="font-size: 0.72rem; color: var(--text-muted);"><i class="fa-solid fa-building-flag"></i> ${p.agency ? escapeHtml(p.agency) + ' • ' : ''}${escapeHtml(p.city || p.state)}</div>
        </td>
        <td>${p.state}</td>
        <td>${p.sector}</td>
        <td>
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <div class="progress-bar-wrap" style="width: 80px;"><div class="progress-bar-fill" style="width: ${p.progress}%;"></div></div>
            <span style="font-weight: 700;">${p.progress}%</span>
          </div>
        </td>
        <td><span style="font-weight: 800; color: ${p.riskScore >= 70 ? '#ef4444' : (p.riskScore >= 50 ? '#f59e0b' : '#10b981')};">${p.riskScore}%</span></td>
        <td><span class="status-badge ${p.statusClass}">${p.status}</span></td>
        <td>${p.estCompletion}</td>
        <td>
          <a class="btn-action-sm" href="project-detail.html?id=${p.id}">
            Inspect <i class="fa-solid fa-arrow-right"></i>
          </a>
        </td>
      </tr>
    `;
  }).join('');

  // Attach individual checkbox listeners
  document.querySelectorAll('.project-compare-checkbox').forEach(cb => {
    cb.addEventListener('change', (e) => {
      const pId = e.target.dataset.id;
      if (e.target.checked) {
        if (selectedProjectIds.size >= 4) {
          e.target.checked = false;
          alert('You can compare a maximum of 4 projects simultaneously in the side-by-side matrix.');
          return;
        }
        selectedProjectIds.add(pId);
      } else {
        selectedProjectIds.delete(pId);
      }
      updateCompareButtonState();
    });
  });

  updateCompareButtonState();
}

function openComparisonModal() {
  if (selectedProjectIds.size < 2) return;

  const data = window.NIRMAAN_DATA;
  if (!data || !data.projects) return;

  const selectedProjects = data.projects.filter(p => selectedProjectIds.has(p.id));
  const gridContainer = document.getElementById('compare-grid-container');
  if (!gridContainer) return;

  // Responsive grid layout based on number of projects (2, 3, or 4)
  gridContainer.style.display = 'grid';
  gridContainer.style.gridTemplateColumns = `repeat(${selectedProjects.length}, 1fr)`;
  gridContainer.style.gap = '1.25rem';

  gridContainer.innerHTML = selectedProjects.map(p => {
    const approvedNum = parseFloat((p.approvedBudget || '0').replace(/[^0-9.]/g, '')) || 1000;
    const spentNum = parseFloat((p.spentBudget || '0').replace(/[^0-9.]/g, '')) || 500;
    const progressFrac = Math.max(0.05, p.progress / 100);
    const estTotalCost = Math.round(spentNum / progressFrac);
    const costOverrunPercent = Math.max(0, Math.round(((estTotalCost - approvedNum) / approvedNum) * 100));

    const riskColor = p.riskScore >= 70 ? '#ef4444' : (p.riskScore >= 50 ? '#f59e0b' : '#10b981');

    return `
      <div style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 16px; padding: 1.25rem; display: flex; flex-direction: column; gap: 1rem; box-shadow: var(--shadow-sm); position: relative;">
        <!-- Header badge -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 0.5rem;">
          <span style="font-size: 0.72rem; font-weight: 700; background: rgba(59, 130, 246, 0.1); color: #2563eb; padding: 3px 10px; border-radius: 6px; text-transform: uppercase;">${escapeHtml(p.sector)}</span>
          <span class="status-badge ${p.statusClass}" style="font-size: 0.7rem;">${p.status}</span>
        </div>

        <div>
          <h3 style="font-size: 1.05rem; font-weight: 800; color: var(--text-main); margin-bottom: 0.25rem; line-height: 1.3;">${escapeHtml(p.name)}</h3>
          <div style="font-size: 0.78rem; color: var(--text-muted);"><i class="fa-solid fa-location-dot"></i> ${escapeHtml(p.city || p.state)}, ${p.state}</div>
        </div>

        <!-- Metric Cards -->
        <div style="background: var(--bg-app); border: 1px solid var(--border-color); border-radius: 12px; padding: 0.85rem; display: flex; flex-direction: column; gap: 0.65rem;">
          <!-- Progress -->
          <div>
            <div style="display: flex; justify-content: space-between; font-size: 0.78rem; font-weight: 700; margin-bottom: 0.3rem;">
              <span>Physical Completion</span>
              <span style="color: #2563eb;">${p.progress}%</span>
            </div>
            <div class="progress-bar-wrap" style="height: 8px;"><div class="progress-bar-fill" style="width: ${p.progress}%;"></div></div>
          </div>

          <!-- Risk Score -->
          <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.8rem; border-top: 1px dashed var(--border-color); padding-top: 0.5rem;">
            <span style="color: var(--text-muted);">AI Risk Index</span>
            <span style="font-weight: 800; font-size: 1.1rem; color: ${riskColor};">${p.riskScore}%</span>
          </div>

          <!-- Target Completion -->
          <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.78rem; border-top: 1px dashed var(--border-color); padding-top: 0.5rem;">
            <span style="color: var(--text-muted);">Target Deadline</span>
            <span style="font-weight: 700; color: var(--text-main);">${p.estCompletion}</span>
          </div>
        </div>

        <!-- Financial Breakdown -->
        <div style="border: 1px solid var(--border-color); border-radius: 12px; padding: 0.85rem; display: flex; flex-direction: column; gap: 0.5rem;">
          <div style="font-size: 0.75rem; font-weight: 800; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.5px;">Financial EAC Breakdown</div>
          
          <div style="display: flex; justify-content: space-between; font-size: 0.78rem;">
            <span style="color: var(--text-muted);">Approved Budget:</span>
            <span style="font-weight: 700;">${p.approvedBudget}</span>
          </div>

          <div style="display: flex; justify-content: space-between; font-size: 0.78rem;">
            <span style="color: var(--text-muted);">Spent to Date:</span>
            <span style="font-weight: 700;">${p.spentBudget}</span>
          </div>

          <div style="display: flex; justify-content: space-between; font-size: 0.78rem; background: ${costOverrunPercent > 10 ? 'rgba(239, 68, 68, 0.08)' : 'rgba(16, 185, 129, 0.08)'}; padding: 4px 8px; border-radius: 6px;">
            <span style="font-weight: 600; color: ${costOverrunPercent > 10 ? '#ef4444' : '#10b981'};">Est. EAC Cost Overrun:</span>
            <span style="font-weight: 800; color: ${costOverrunPercent > 10 ? '#ef4444' : '#10b981'};">+${costOverrunPercent}%</span>
          </div>
        </div>

        <!-- Governance Info -->
        <div style="font-size: 0.76rem; color: var(--text-muted); display: flex; flex-direction: column; gap: 0.3rem;">
          <div><strong style="color: var(--text-main);">Nodal Agency:</strong> ${escapeHtml(p.agency || 'Ministry of Road Transport')}</div>
          <div><strong style="color: var(--text-main);">Primary Contractor:</strong> ${escapeHtml(p.contractor || 'L&T Construction')}</div>
        </div>

        <!-- Action inspect button -->
        <a class="btn-action-sm" href="project-detail.html?id=${p.id}" target="_blank" style="margin-top: auto; text-align: center; justify-content: center; background-color: var(--bg-app); border: 1px solid var(--border-color); color: var(--text-main);">
          Open Full Audit <i class="fa-solid fa-arrow-up-right-from-square" style="font-size: 0.75rem;"></i>
        </a>
      </div>
    `;
  }).join('');

  // Generate dynamic AI Synthesis
  generateAISynthesis(selectedProjects);

  // Show modal
  const modal = document.getElementById('compare-modal');
  if (modal) {
    modal.style.display = 'flex';
  }
}

function generateAISynthesis(projects) {
  const aiTextEl = document.getElementById('compare-ai-text');
  if (!aiTextEl) return;

  // Sort projects by risk score descending
  const sortedByRisk = [...projects].sort((a, b) => b.riskScore - a.riskScore);
  const highestRisk = sortedByRisk[0];
  const lowestRisk = sortedByRisk[sortedByRisk.length - 1];

  // Sort by physical progress ascending
  const sortedByProgress = [...projects].sort((a, b) => a.progress - b.progress);
  const lowestProgress = sortedByProgress[0];

  let summary = `Analysis of <strong>${projects.length} selected mega infrastructure projects</strong> indicates significant divergence in physical velocity and fiscal execution. `;
  summary += `<strong>${highestRisk.name}</strong> exhibits the highest risk score (<strong>${highestRisk.riskScore}% Risk Index</strong>) driven by schedule bottlenecks and contractor delays under ${highestRisk.contractor || 'assigned contractor'}. `;
  
  if (lowestProgress.id !== highestRisk.id) {
    summary += `Meanwhile, <strong>${lowestProgress.name}</strong> lags in physical execution at only <strong>${lowestProgress.progress}% completion</strong>. `;
  }

  summary += `Conversely, <strong>${lowestRisk.name}</strong> demonstrates optimal operational stability with a low risk score of <strong>${lowestRisk.riskScore}%</strong>. MoSPI IPMD recommends reallocating regional monitoring resources toward <strong>${highestRisk.name}</strong> to mitigate projected EAC budget variance.`;

  aiTextEl.innerHTML = summary;
}

function closeComparisonModal() {
  const modal = document.getElementById('compare-modal');
  if (modal) {
    modal.style.display = 'none';
  }
}

function exportProjectsToCSV() {
  const projectsToExport = currentFilteredProjects.length > 0 ? currentFilteredProjects : (window.NIRMAAN_DATA?.projects || []);

  const headers = ['Project ID', 'Project Name', 'State', 'City', 'Sector', 'Physical Progress %', 'Risk Score %', 'Status', 'Approved Budget', 'Spent Budget', 'Nodal Agency', 'Contractor', 'Est Completion'];

  const rows = projectsToExport.map(p => [
    `"${p.id}"`,
    `"${p.name.replace(/"/g, '""')}"`,
    `"${p.state}"`,
    `"${p.city || ''}"`,
    `"${p.sector}"`,
    `"${p.progress}%"`,
    `"${p.riskScore}%"`,
    `"${p.status}"`,
    `"${p.approvedBudget}"`,
    `"${p.spentBudget}"`,
    `"${p.agency || ''}"`,
    `"${p.contractor || ''}"`,
    `"${p.estCompletion}"`
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);

  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `MoSPI_Infrastructure_Projects_Report_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.innerText = text;
  return div.innerHTML;
}

/* 
   NIRMAAN AI - Projects Directory Engine
   Multi-criteria filtering, search, and CSV/PDF export for MoSPI
*/

document.addEventListener('DOMContentLoaded', async () => {
  if (window.NIRMAAN_API) {
    await window.NIRMAAN_API.getProjects();
  }
  renderProjectsTable();

  // Attach Filter Listeners
  document.getElementById('projects-filter-state')?.addEventListener('change', renderProjectsTable);
  document.getElementById('projects-filter-sector')?.addEventListener('change', renderProjectsTable);
  document.getElementById('projects-filter-risk')?.addEventListener('change', renderProjectsTable);

  // Search input listeners
  const searchInput = document.getElementById('projects-search-input');
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

  // Export CSV button
  document.getElementById('btn-export-csv')?.addEventListener('click', exportProjectsToCSV);
  
  // Print / PDF Report button
  document.getElementById('btn-export-pdf')?.addEventListener('click', () => {
    window.print();
  });
});

let currentFilteredProjects = [];

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
    counterLabel.innerText = `Showing ${currentFilteredProjects.length} of ${data.stats.totalProjects} national projects`;
  }

  if (currentFilteredProjects.length === 0) {
    container.innerHTML = `
      <tr>
        <td colspan="9" style="text-align: center; padding: 2.5rem; color: var(--text-muted);">
          <i class="fa-solid fa-folder-open" style="font-size: 2rem; margin-bottom: 0.5rem; color: #cbd5e1;"></i>
          <p style="font-weight: 600;">No infrastructure projects match the selected filters.</p>
          <span style="font-size: 0.78rem;">Try clearing search or changing state/sector options.</span>
        </td>
      </tr>
    `;
    return;
  }

  container.innerHTML = currentFilteredProjects.map((p, idx) => `
    <tr>
      <td>${idx + 1}</td>
      <td>
        <strong>${escapeHtml(p.name)}</strong>
        <div style="font-size: 0.72rem; color: var(--text-muted);"><i class="fa-solid fa-location-dot"></i> ${p.city || p.state}, ${p.state}</div>
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
  `).join('');
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

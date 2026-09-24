/* 
   NIRMAAN AI - Contractor & Nodal Agency Intelligence Engine
   MoSPI Performance Ratings, AI Health Scores, and Tender Eligibility Auditing
*/

const CONTRACTOR_DATASET = [
  {
    id: "CONT-001",
    name: "Larsen & Toubro (L&T Construction)",
    type: "EPC Contractor",
    projectsCount: 14,
    capitalOutlay: "₹1,42,500 Cr",
    velocity: 86.4,
    healthScore: 88,
    rating: "Tier-1 Preferred",
    disputes: "2 Active Arbitrations",
    penaltiesIssued: "₹45 Cr",
    keyProjects: ["Mumbai-Ahmedabad High Speed Rail", "Delhi-Meerut RRTS", "Dedicated Freight Corridor"],
    recommendation: "Approved for mega tenders ≥ ₹5,000 Cr. High structural safety score (99.2%)."
  },
  {
    id: "CONT-002",
    name: "Tata Projects Limited",
    type: "EPC Contractor",
    projectsCount: 9,
    capitalOutlay: "₹68,200 Cr",
    velocity: 89.1,
    healthScore: 91,
    rating: "Tier-1 Preferred",
    disputes: "0 Active",
    penaltiesIssued: "₹0 Cr",
    keyProjects: ["Noida International Airport", "Pune Metro Rail Phase-2"],
    recommendation: "Excellent milestone adherence. Preferred contractor for greenfield aviation & transit."
  },
  {
    id: "CONT-003",
    name: "Afcons Infrastructure Ltd.",
    type: "EPC Contractor",
    projectsCount: 6,
    capitalOutlay: "₹45,800 Cr",
    velocity: 82.5,
    healthScore: 84,
    rating: "Tier-1 Preferred",
    disputes: "1 Dispute",
    penaltiesIssued: "₹12 Cr",
    keyProjects: ["Chenab Rail Bridge", "Zojila Tunnel Bypass"],
    recommendation: "Specialized in complex Himalayan tunneling and long-span steel bridges."
  },
  {
    id: "CONT-004",
    name: "Rail Vikas Nigam Limited (RVNL)",
    type: "PSU Execution",
    projectsCount: 18,
    capitalOutlay: "₹95,400 Cr",
    velocity: 78.2,
    healthScore: 79,
    rating: "Conditional Approval",
    disputes: "4 Disputes",
    penaltiesIssued: "₹85 Cr",
    keyProjects: ["Rishikesh-Karnaprayag Rail Line", "Kolkata Metro Expansion"],
    recommendation: "Requires ROW (Right-of-Way) land clearance monitoring support from State Govt."
  },
  {
    id: "CONT-005",
    name: "National Highways Authority of India (NHAI)",
    type: "Nodal Agency",
    projectsCount: 42,
    capitalOutlay: "₹2,10,000 Cr",
    velocity: 88.0,
    healthScore: 86,
    rating: "Tier-1 Preferred",
    disputes: "3 Disputes",
    penaltiesIssued: "₹30 Cr",
    keyProjects: ["Delhi-Mumbai Expressway", "Bengaluru-Chennai Expressway"],
    recommendation: "Top-tier nodal execution agency with automated FASTag & drone inspection compliance."
  },
  {
    id: "CONT-006",
    name: "Dilip Buildcon Limited",
    type: "EPC Contractor",
    projectsCount: 8,
    capitalOutlay: "₹28,600 Cr",
    velocity: 71.4,
    healthScore: 68,
    rating: "Conditional Approval",
    disputes: "2 Disputes",
    penaltiesIssued: "₹65 Cr",
    keyProjects: ["Bhopal Metro Phase-1", "Gorakhpur Link Expressway"],
    recommendation: "Under watch for machinery mobilization in Q3 2026. Weekly S-curve reporting enforced."
  },
  {
    id: "CONT-007",
    name: "Hindustan Construction Co. (HCC)",
    type: "EPC Contractor",
    projectsCount: 5,
    capitalOutlay: "₹34,100 Cr",
    velocity: 58.2,
    healthScore: 54,
    rating: "Under Watch",
    disputes: "5 Active Arbitrations",
    penaltiesIssued: "₹248 Cr",
    keyProjects: ["Teesta Low Dam Stage-IV", "Bandra-Worli Sea Link Phase-2"],
    recommendation: "High liquidity risk & prolonged arbitration. MoSPI recommends joint-venture oversight."
  },
  {
    id: "CONT-008",
    name: "NCC Limited",
    type: "EPC Contractor",
    projectsCount: 11,
    capitalOutlay: "₹52,300 Cr",
    velocity: 84.0,
    healthScore: 82,
    rating: "Tier-1 Preferred",
    disputes: "1 Dispute",
    penaltiesIssued: "₹18 Cr",
    keyProjects: ["Nagpur Metro Rail", "Visakhapatnam Water Supply"],
    recommendation: "Strong execution in urban water infrastructure and elevated metro viaducts."
  }
];

let currentFilteredContractors = [...CONTRACTOR_DATASET];

document.addEventListener('DOMContentLoaded', () => {
  renderContractorsTable();

  // Filter Listeners
  document.getElementById('contractor-search-input')?.addEventListener('input', renderContractorsTable);
  document.getElementById('contractor-filter-category')?.addEventListener('change', renderContractorsTable);
  document.getElementById('contractor-filter-rating')?.addEventListener('change', renderContractorsTable);

  // Topbar search input
  const topbarSearch = document.querySelector('.topbar-search input');
  if (topbarSearch) {
    topbarSearch.addEventListener('input', (e) => {
      const searchInput = document.getElementById('contractor-search-input');
      if (searchInput) searchInput.value = e.target.value;
      renderContractorsTable();
    });
  }

  // Print PDF button
  document.getElementById('btn-export-contractor-pdf')?.addEventListener('click', () => {
    window.print();
  });

  // Modal Close buttons
  document.getElementById('close-contractor-modal')?.addEventListener('click', closeContractorModal);
  document.getElementById('btn-close-contractor-modal')?.addEventListener('click', closeContractorModal);
});

function renderContractorsTable() {
  const container = document.getElementById('contractors-table-body');
  if (!container) return;

  const searchText = (document.getElementById('contractor-search-input')?.value || '').toLowerCase().trim();
  const categoryFilter = document.getElementById('contractor-filter-category')?.value || 'all';
  const ratingFilter = document.getElementById('contractor-filter-rating')?.value || 'all';

  currentFilteredContractors = CONTRACTOR_DATASET.filter(c => {
    if (categoryFilter !== 'all' && c.type !== categoryFilter) return false;
    if (ratingFilter !== 'all' && c.rating !== ratingFilter) return false;

    if (searchText) {
      const matchName = c.name.toLowerCase().includes(searchText);
      const matchType = c.type.toLowerCase().includes(searchText);
      const matchProjects = c.keyProjects.some(kp => kp.toLowerCase().includes(searchText));
      if (!matchName && !matchType && !matchProjects) return false;
    }
    return true;
  });

  if (currentFilteredContractors.length === 0) {
    container.innerHTML = `
      <tr>
        <td colspan="9" style="text-align: center; padding: 2.5rem; color: var(--text-muted);">
          <i class="fa-solid fa-user-shield" style="font-size: 2rem; margin-bottom: 0.5rem; color: #cbd5e1;"></i>
          <p style="font-weight: 600;">No contractors match the selected filters.</p>
        </td>
      </tr>
    `;
    return;
  }

  container.innerHTML = currentFilteredContractors.map((c, idx) => {
    let ratingBadge = '';
    if (c.rating === 'Tier-1 Preferred') {
      ratingBadge = `<span style="background: rgba(16, 185, 129, 0.12); color: #10b981; padding: 4px 10px; border-radius: 20px; font-size: 0.72rem; font-weight: 800; border: 1px solid rgba(16, 185, 129, 0.3); display: inline-flex; align-items: center; gap: 5px;"><i class="fa-solid fa-circle-check"></i> Tier-1 Preferred</span>`;
    } else if (c.rating === 'Conditional Approval' || c.rating === 'Conditional') {
      ratingBadge = `<span style="background: rgba(245, 158, 11, 0.12); color: #d97706; padding: 4px 10px; border-radius: 20px; font-size: 0.72rem; font-weight: 800; border: 1px solid rgba(245, 158, 11, 0.3); display: inline-flex; align-items: center; gap: 5px;"><i class="fa-solid fa-triangle-exclamation"></i> Conditional</span>`;
    } else {
      ratingBadge = `<span style="background: rgba(239, 68, 68, 0.12); color: #ef4444; padding: 4px 10px; border-radius: 20px; font-size: 0.72rem; font-weight: 800; border: 1px solid rgba(239, 68, 68, 0.3); display: inline-flex; align-items: center; gap: 5px;"><i class="fa-solid fa-circle-xmark"></i> Under Watch</span>`;
    }

    const healthColor = c.healthScore >= 80 ? '#10b981' : (c.healthScore >= 60 ? '#f59e0b' : '#ef4444');
    const healthBg = c.healthScore >= 80 ? 'rgba(16, 185, 129, 0.12)' : (c.healthScore >= 60 ? 'rgba(245, 158, 11, 0.12)' : 'rgba(239, 68, 68, 0.12)');

    // Entity Icon / Badge Color based on name
    let entityAvatar = '';
    if (c.name.includes('Larsen')) entityAvatar = `<div style="width: 38px; height: 38px; border-radius: 10px; background: linear-gradient(135deg, #2563eb, #1d4ed8); color: white; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.8rem; flex-shrink: 0; box-shadow: 0 3px 8px rgba(37, 99, 235, 0.3);">L&T</div>`;
    else if (c.name.includes('Tata')) entityAvatar = `<div style="width: 38px; height: 38px; border-radius: 10px; background: linear-gradient(135deg, #0284c7, #0369a1); color: white; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.75rem; flex-shrink: 0; box-shadow: 0 3px 8px rgba(2, 132, 199, 0.3);">TATA</div>`;
    else if (c.name.includes('Afcons')) entityAvatar = `<div style="width: 38px; height: 38px; border-radius: 10px; background: linear-gradient(135deg, #8b5cf6, #6d28d9); color: white; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.78rem; flex-shrink: 0; box-shadow: 0 3px 8px rgba(139, 92, 246, 0.3);">AF</div>`;
    else if (c.name.includes('Rail Vikas')) entityAvatar = `<div style="width: 38px; height: 38px; border-radius: 10px; background: linear-gradient(135deg, #f59e0b, #d97706); color: white; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.7rem; flex-shrink: 0; box-shadow: 0 3px 8px rgba(245, 158, 11, 0.3);">RVNL</div>`;
    else if (c.name.includes('National Highways')) entityAvatar = `<div style="width: 38px; height: 38px; border-radius: 10px; background: linear-gradient(135deg, #10b981, #047857); color: white; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.7rem; flex-shrink: 0; box-shadow: 0 3px 8px rgba(16, 185, 129, 0.3);">NHAI</div>`;
    else if (c.name.includes('Dilip')) entityAvatar = `<div style="width: 38px; height: 38px; border-radius: 10px; background: linear-gradient(135deg, #ec4899, #be185d); color: white; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.75rem; flex-shrink: 0; box-shadow: 0 3px 8px rgba(236, 72, 153, 0.3);">DBL</div>`;
    else if (c.name.includes('Hindustan Construction')) entityAvatar = `<div style="width: 38px; height: 38px; border-radius: 10px; background: linear-gradient(135deg, #ef4444, #b91c1c); color: white; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.75rem; flex-shrink: 0; box-shadow: 0 3px 8px rgba(239, 68, 68, 0.3);">HCC</div>`;
    else entityAvatar = `<div style="width: 38px; height: 38px; border-radius: 10px; background: linear-gradient(135deg, #64748b, #334155); color: white; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.75rem; flex-shrink: 0;">NCC</div>`;

    // Type icon
    let typeIcon = 'fa-building';
    if (c.type === 'Nodal Agency') typeIcon = 'fa-landmark';
    else if (c.type === 'PSU Execution') typeIcon = 'fa-train';

    // Dispute badge
    let disputeBadge = '';
    if (c.disputes.includes('0') || c.disputes.toLowerCase().includes('clean')) {
      disputeBadge = `<span style="color: #10b981; font-size: 0.76rem; font-weight: 700; background: rgba(16, 185, 129, 0.1); padding: 3px 8px; border-radius: 6px;"><i class="fa-solid fa-shield-check"></i> Clean Record</span>`;
    } else if (c.disputes.includes('1') || c.disputes.includes('2')) {
      disputeBadge = `<span style="color: #f59e0b; font-size: 0.76rem; font-weight: 700; background: rgba(245, 158, 11, 0.1); padding: 3px 8px; border-radius: 6px;"><i class="fa-solid fa-gavel"></i> ${c.disputes}</span>`;
    } else {
      disputeBadge = `<span style="color: #ef4444; font-size: 0.76rem; font-weight: 700; background: rgba(239, 68, 68, 0.1); padding: 3px 8px; border-radius: 6px;"><i class="fa-solid fa-triangle-exclamation"></i> ${c.disputes}</span>`;
    }

    return `
      <tr style="border-bottom: 1px solid var(--border-color); transition: background 0.2s ease;">
        <td style="padding: 1rem; font-size: 0.8rem; font-weight: 700; color: var(--text-muted);">${idx + 1}</td>
        <td style="padding: 1rem;">
          <div style="display: flex; align-items: center; gap: 0.85rem;">
            ${entityAvatar}
            <div>
              <div style="font-size: 0.88rem; font-weight: 800; color: var(--text-main); margin-bottom: 2px;">${escapeHtml(c.name)}</div>
              <div style="font-size: 0.73rem; color: #2563eb; font-weight: 700;">
                <i class="fa-solid fa-coins"></i> Capital Outlay: <strong>${c.capitalOutlay}</strong>
              </div>
            </div>
          </div>
        </td>
        <td style="padding: 1rem;">
          <span style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); background: var(--bg-app); border: 1px solid var(--border-color); padding: 3px 8px; border-radius: 6px; display: inline-flex; align-items: center; gap: 5px;">
            <i class="fa-solid ${typeIcon}"></i> ${c.type}
          </span>
        </td>
        <td style="padding: 1rem;">
          <span style="font-weight: 800; font-size: 0.85rem; color: var(--text-main);">${c.projectsCount} Mega Projects</span>
        </td>
        <td style="padding: 1rem;">
          <div style="display: flex; align-items: center; gap: 0.6rem;">
            <div class="progress-bar-wrap" style="width: 75px; height: 8px; background: rgba(0,0,0,0.08); border-radius: 4px; overflow: hidden;"><div class="progress-bar-fill" style="width: ${c.velocity}%; height: 100%; background: linear-gradient(90deg, #2563eb, #38bdf8); border-radius: 4px;"></div></div>
            <span style="font-weight: 800; font-size: 0.82rem; color: var(--text-main);">${c.velocity}%</span>
          </div>
        </td>
        <td style="padding: 1rem;">
          <span style="font-weight: 800; font-size: 0.85rem; color: ${healthColor}; background: ${healthBg}; border: 1px solid ${healthColor}40; padding: 4px 10px; border-radius: 8px; display: inline-block;">
            ${c.healthScore} / 100
          </span>
        </td>
        <td style="padding: 1rem;">${ratingBadge}</td>
        <td style="padding: 1rem;">${disputeBadge}</td>
        <td style="padding: 1rem; text-align: right;">
          <button class="btn-action-sm" onclick="openContractorModal('${c.id}')" style="background: linear-gradient(135deg, #1e293b, #0f172a); color: white; border: 1px solid rgba(255,255,255,0.15); padding: 0.4rem 0.85rem; border-radius: 8px; font-weight: 700; font-size: 0.75rem; cursor: pointer; box-shadow: var(--shadow-sm); transition: all 0.2s;">
            Audit Profile <i class="fa-solid fa-arrow-right" style="margin-left: 3px;"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function openContractorModal(cId) {
  const contractor = CONTRACTOR_DATASET.find(c => c.id === cId);
  if (!contractor) return;

  document.getElementById('modal-contractor-name').innerText = contractor.name;
  
  const body = document.getElementById('modal-contractor-body');
  if (!body) return;

  const healthColor = contractor.healthScore >= 80 ? '#10b981' : (contractor.healthScore >= 60 ? '#f59e0b' : '#ef4444');

  body.innerHTML = `
    <!-- Top Stats Banner -->
    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; background: var(--bg-app); border: 1px solid var(--border-color); border-radius: 14px; padding: 1rem; text-align: center;">
      <div>
        <div style="font-size: 0.75rem; color: var(--text-muted);">AI Health Index</div>
        <div style="font-size: 1.8rem; font-weight: 800; color: ${healthColor}; margin-top: 2px;">${contractor.healthScore} / 100</div>
      </div>
      <div>
        <div style="font-size: 0.75rem; color: var(--text-muted);">On-Time Execution Velocity</div>
        <div style="font-size: 1.8rem; font-weight: 800; color: #2563eb; margin-top: 2px;">${contractor.velocity}%</div>
      </div>
      <div>
        <div style="font-size: 0.75rem; color: var(--text-muted);">Liquidated Penalties</div>
        <div style="font-size: 1.8rem; font-weight: 800; color: #ef4444; margin-top: 2px;">${contractor.penaltiesIssued}</div>
      </div>
    </div>

    <!-- Active Projects List -->
    <div style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 14px; padding: 1.15rem;">
      <h4 style="font-size: 0.9rem; font-weight: 800; color: var(--text-main); margin-bottom: 0.5rem;"><i class="fa-solid fa-list-check" style="color: #2563eb;"></i> Key Monitored Mega Infrastructure Projects</h4>
      <ul style="margin: 0; padding-left: 1.2rem; font-size: 0.83rem; color: var(--text-main); line-height: 1.6;">
        ${contractor.keyProjects.map(kp => `<li><strong>${escapeHtml(kp)}</strong></li>`).join('')}
      </ul>
    </div>

    <!-- MoSPI Tender Advisory & Recommendation -->
    <div style="background: linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(16, 185, 129, 0.08) 100%); border: 1px solid rgba(59, 130, 246, 0.2); border-radius: 14px; padding: 1.15rem;">
      <div style="display: flex; align-items: center; gap: 0.5rem; font-weight: 800; font-size: 0.88rem; color: #2563eb; margin-bottom: 0.3rem;">
        <i class="fa-solid fa-wand-magic-sparkles"></i> MoSPI Technical Evaluation Advisory
      </div>
      <p style="font-size: 0.83rem; color: var(--text-main); margin: 0; line-height: 1.5;">${contractor.recommendation}</p>
    </div>
  `;

  const modal = document.getElementById('contractor-modal');
  if (modal) modal.style.display = 'flex';
}

function closeContractorModal() {
  const modal = document.getElementById('contractor-modal');
  if (modal) modal.style.display = 'none';
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.innerText = text;
  return div.innerHTML;
}

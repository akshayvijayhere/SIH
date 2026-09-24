/* 
   NIRMAAN AI - Common Page Helper, Navigation Manager & Voice Engine
*/

document.addEventListener('DOMContentLoaded', () => {
  // Restore Theme on Page Load
  const savedTheme = localStorage.getItem('nirmaan_theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);

  // Set Dynamic Current Date across headers
  const dateElem = document.getElementById('current-live-date');
  if (dateElem) {
    const today = new Date();
    dateElem.innerText = today.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  // Highlight active page in sidebar navigation
  const currentPath = window.location.pathname.split('/').pop().split('?')[0] || 'login.html';
  
  const navLinks = document.querySelectorAll('.app-sidebar .nav-item');
  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPath || (currentPath === '' && href === 'dashboard.html') || (currentPath === 'project-detail.html' && href === 'projects.html')) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // Topbar Search Handler & Voice Search Button Injection
  const topbarSearchWrap = document.querySelector('.app-topbar .topbar-search');
  if (topbarSearchWrap) {
    const topbarInput = topbarSearchWrap.querySelector('input');

    // Add Microphone Voice Search Button
    if (!topbarSearchWrap.querySelector('.topbar-mic-btn')) {
      const micBtn = document.createElement('button');
      micBtn.className = 'topbar-mic-btn';
      micBtn.id = 'global-voice-search-btn';
      micBtn.title = 'Voice Search (Hindi / English)';
      micBtn.innerHTML = '<i class="fa-solid fa-microphone"></i>';
      topbarSearchWrap.appendChild(micBtn);

      micBtn.addEventListener('click', () => {
        startGlobalVoiceSearch(topbarInput, micBtn, currentPath);
      });
    }

    if (topbarInput && currentPath !== 'projects.html') {
      topbarInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const query = e.target.value.trim();
          if (query) {
            window.location.href = `projects.html?search=${encodeURIComponent(query)}`;
          }
        }
      });
    }
  }

  // User Profile click navigates to settings.html
  document.getElementById('profile-dropdown-btn')?.addEventListener('click', () => {
    window.location.href = 'settings.html';
  });

  // Initialize Global AI Governance Copilot Widget
  initNirmaanCopilot();
});

/* ==========================================================================
   NIRMAAN AI - Global Floating Governance Copilot Engine
   ========================================================================== */
function initNirmaanCopilot() {
  if (document.getElementById('nirmaan-copilot-fab')) return;

  // Create FAB
  const fab = document.createElement('div');
  fab.id = 'nirmaan-copilot-fab';
  fab.className = 'copilot-fab';
  fab.innerHTML = `
    <div class="copilot-fab-icon">
      <i class="fa-solid fa-robot"></i>
      <div class="copilot-status-dot"></div>
    </div>
    <span class="copilot-fab-label">NIRMAAN AI Copilot</span>
  `;
  document.body.appendChild(fab);

  // Create Drawer Popup
  const drawer = document.createElement('div');
  drawer.id = 'nirmaan-copilot-drawer';
  drawer.className = 'copilot-drawer hidden';
  drawer.innerHTML = `
    <div class="copilot-header">
      <div style="display: flex; align-items: center; gap: 0.65rem;">
        <div style="width: 34px; height: 34px; border-radius: 50%; background: #2563eb; color: white; display: flex; align-items: center; justify-content: center; font-size: 1rem;">
          <i class="fa-solid fa-robot"></i>
        </div>
        <div>
          <h4 style="font-size: 0.95rem; font-weight: 800; color: white; margin: 0;">NIRMAAN AI Copilot</h4>
          <span style="font-size: 0.68rem; color: #10b981; display: flex; align-items: center; gap: 4px; font-weight: 600;">
            <i class="fa-solid fa-circle" style="font-size: 0.5rem;"></i> Active MoSPI Intelligence
          </span>
        </div>
      </div>
      <button id="copilot-close-btn" style="color: #94a3b8; background: transparent; border: none; font-size: 1.1rem; cursor: pointer;"><i class="fa-solid fa-xmark"></i></button>
    </div>

    <!-- Quick Prompt Chips -->
    <div class="copilot-chips-wrap">
      <button class="copilot-chip" data-prompt="Projects with >15% cost overrun"><i class="fa-solid fa-bolt" style="color: #f59e0b;"></i> >15% Cost Overrun</button>
      <button class="copilot-chip" data-prompt="Show top 3 delayed rail projects"><i class="fa-solid fa-train" style="color: #3b82f6;"></i> Top Delayed Rail</button>
      <button class="copilot-chip" data-prompt="Generate MoSPI Cabinet Memorandum summary"><i class="fa-solid fa-file-contract" style="color: #10b981;"></i> Cabinet Note Summary</button>
      <button class="copilot-chip" data-prompt="Which contractor has the highest risk score?"><i class="fa-solid fa-triangle-exclamation" style="color: #ef4444;"></i> Highest Risk Contractor</button>
      <button class="copilot-chip" data-prompt="High-risk projects in Maharashtra"><i class="fa-solid fa-location-dot" style="color: #a855f7;"></i> Maharashtra High Risk</button>
    </div>

    <!-- Chat Messages Log -->
    <div class="copilot-messages-log" id="copilot-log">
      <div class="copilot-msg ai">
        <div class="copilot-avatar ai"><i class="fa-solid fa-robot"></i></div>
        <div class="copilot-bubble">
          <strong>Namaste Officer 🙏</strong><br>
          I am your <strong>NIRMAAN AI Governance Copilot</strong> for MoSPI. Ask me any question regarding project delays, financial overruns, contractors, or national sector risk metrics.
        </div>
      </div>
    </div>

    <!-- Input Bar -->
    <div class="copilot-input-bar">
      <input type="text" id="copilot-user-input" placeholder="Ask NIRMAAN AI Copilot (e.g. 'Show budget overruns')...">
      <button class="topbar-mic-btn" id="copilot-mic-btn" title="Voice Input" style="position: static; transform: none; font-size: 1rem;"><i class="fa-solid fa-microphone"></i></button>
      <button class="copilot-send-btn" id="copilot-send-btn"><i class="fa-solid fa-paper-plane"></i></button>
    </div>
  `;
  document.body.appendChild(drawer);

  // Toggle drawer open/close
  fab.addEventListener('click', toggleCopilotDrawer);
  document.getElementById('copilot-close-btn')?.addEventListener('click', toggleCopilotDrawer);

  // Quick Chips handler
  document.querySelectorAll('.copilot-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const promptText = chip.dataset.prompt;
      submitCopilotQuery(promptText);
    });
  });

  // Input & Send button
  const inputElem = document.getElementById('copilot-user-input');
  const sendBtn = document.getElementById('copilot-send-btn');
  const micBtn = document.getElementById('copilot-mic-btn');

  if (sendBtn && inputElem) {
    sendBtn.addEventListener('click', () => {
      const val = inputElem.value.trim();
      if (val) {
        submitCopilotQuery(val);
        inputElem.value = '';
      }
    });

    inputElem.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        sendBtn.click();
      }
    });
  }

  // Copilot Voice Search button
  if (micBtn && inputElem) {
    micBtn.addEventListener('click', () => {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        showGlobalToast('Voice search not supported in browser', 'warning');
        return;
      }
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-IN';
      micBtn.style.color = '#ef4444';
      showGlobalToast('🎤 Copilot Listening...', 'info');
      recognition.start();

      recognition.onresult = (e) => {
        micBtn.style.color = '';
        const text = e.results[0][0].transcript;
        if (text) {
          inputElem.value = text;
          submitCopilotQuery(text);
          inputElem.value = '';
        }
      };
      recognition.onerror = () => { micBtn.style.color = ''; };
      recognition.onend = () => { micBtn.style.color = ''; };
    });
  }
}

function toggleCopilotDrawer() {
  const drawer = document.getElementById('nirmaan-copilot-drawer');
  if (drawer) {
    drawer.classList.toggle('hidden');
    if (!drawer.classList.contains('hidden')) {
      document.getElementById('copilot-user-input')?.focus();
    }
  }
}

function submitCopilotQuery(queryText) {
  const log = document.getElementById('copilot-log');
  if (!log) return;

  // Add User message
  const userMsg = document.createElement('div');
  userMsg.className = 'copilot-msg user';
  userMsg.innerHTML = `
    <div class="copilot-avatar user"><i class="fa-solid fa-user"></i></div>
    <div class="copilot-bubble">${escapeHtml(queryText)}</div>
  `;
  log.appendChild(userMsg);
  log.scrollTop = log.scrollHeight;

  // Add Thinking indicator
  const thinkingMsg = document.createElement('div');
  thinkingMsg.className = 'copilot-msg ai';
  thinkingMsg.id = 'copilot-thinking';
  thinkingMsg.innerHTML = `
    <div class="copilot-avatar ai"><i class="fa-solid fa-robot"></i></div>
    <div class="copilot-bubble" style="color: var(--text-muted); font-style: italic;">
      <i class="fa-solid fa-spinner fa-spin"></i> Analyzing MoSPI database & risk velocity metrics...
    </div>
  `;
  log.appendChild(thinkingMsg);
  log.scrollTop = log.scrollHeight;

  // Process response with simulated delay
  setTimeout(() => {
    thinkingMsg.remove();
    const responseHtml = generateCopilotAIAnswer(queryText);
    const aiMsg = document.createElement('div');
    aiMsg.className = 'copilot-msg ai';
    aiMsg.innerHTML = `
      <div class="copilot-avatar ai"><i class="fa-solid fa-robot"></i></div>
      <div class="copilot-bubble">${responseHtml}</div>
    `;
    log.appendChild(aiMsg);
    log.scrollTop = log.scrollHeight;
  }, 700);
}

function generateCopilotAIAnswer(queryText) {
  const q = queryText.toLowerCase();
  const data = window.NIRMAAN_DATA;
  const projects = data?.projects || [];

  if (q.includes('cost overrun') || q.includes('>15%') || q.includes('budget overrun')) {
    const overrunProjects = projects.filter(p => {
      const approved = parseFloat((p.approvedBudget || '0').replace(/[^0-9.]/g, '')) || 1000;
      const spent = parseFloat((p.spentBudget || '0').replace(/[^0-9.]/g, '')) || 500;
      const progressFrac = Math.max(0.05, p.progress / 100);
      const estTotal = spent / progressFrac;
      const overrun = ((estTotal - approved) / approved) * 100;
      return overrun >= 15;
    });

    if (overrunProjects.length === 0) {
      return `No mega projects currently exhibit >15% projected cost overrun based on physical velocity.`;
    }

    let html = `<strong>Projects with >15% Projected EAC Cost Overrun:</strong><br><ul style="margin: 0.4rem 0 0 1rem; padding: 0;">`;
    overrunProjects.slice(0, 3).forEach(p => {
      html += `<li style="margin-bottom: 0.35rem;">
        <strong>${escapeHtml(p.name)}</strong> (${p.sector}, ${p.state})<br>
        <span style="font-size: 0.76rem; color: #ef4444; font-weight: 700;">Risk: ${p.riskScore}% | Approved: ${p.approvedBudget}</span>
        <a href="project-detail.html?id=${p.id}" style="font-size: 0.72rem; text-decoration: underline; margin-left: 6px;">Inspect <i class="fa-solid fa-arrow-up-right-from-square"></i></a>
      </li>`;
    });
    html += `</ul>`;
    return html;
  }

  if (q.includes('delayed rail') || q.includes('railways') || q.includes('train')) {
    const railProjects = projects.filter(p => p.sector === 'Railways' || p.name.toLowerCase().includes('bullet') || p.name.toLowerCase().includes('rrts') || p.name.toLowerCase().includes('metro'));
    const sorted = railProjects.sort((a, b) => b.riskScore - a.riskScore);

    let html = `<strong>Top Monitored Railway & Transit Bottlenecks:</strong><br><ul style="margin: 0.4rem 0 0 1rem; padding: 0;">`;
    sorted.slice(0, 3).forEach(p => {
      html += `<li style="margin-bottom: 0.35rem;">
        <strong>${escapeHtml(p.name)}</strong> (${p.state})<br>
        <span style="font-size: 0.76rem; color: ${p.riskScore >= 70 ? '#ef4444' : '#f59e0b'}; font-weight: 700;">Completion: ${p.progress}% | Risk: ${p.riskScore}%</span>
        <a href="project-detail.html?id=${p.id}" style="font-size: 0.72rem; text-decoration: underline; margin-left: 6px;">Inspect <i class="fa-solid fa-arrow-up-right-from-square"></i></a>
      </li>`;
    });
    html += `</ul>`;
    return html;
  }

  if (q.includes('cabinet') || q.includes('memorandum') || q.includes('mospi cabinet')) {
    const totalBudget = data?.stats?.totalApprovedBudget || '₹4,25,000 Cr';
    const criticalCount = projects.filter(p => p.riskScore >= 70).length;

    return `
      <strong>MoSPI Level 3 Cabinet Memorandum Executive Note:</strong><br>
      • <strong>Monitored Portfolio:</strong> ${data?.stats?.totalProjects || 1572} Central Sector Projects (≥ ₹150 Cr)<br>
      • <strong>Total Capital Outlay:</strong> ${totalBudget}<br>
      • <strong>Critical Escalations:</strong> ${criticalCount} High-Risk Projects flagged for Cabinet Review.<br>
      <a href="alerts.html" style="display: inline-block; margin-top: 6px; font-weight: 700; color: #2563eb;">Open MoSPI Escalation Matrix & Print PDF <i class="fa-solid fa-arrow-right"></i></a>
    `;
  }

  if (q.includes('contractor') || q.includes('highest risk contractor')) {
    return `
      <strong>MoSPI Contractor Risk & Penalty Summary:</strong><br>
      • <strong>Highest Risk Contractor:</strong> L&T Construction / Joint Ventures (Avg Risk Score: 68%)<br>
      • <strong>Key Bottlenecks:</strong> Land Acquisition ROW delays on Mumbai-Ahmedabad High-Speed Rail & Eastern Dedicated Freight Corridor.<br>
      • <strong>Penalty Audit:</strong> Liquidated damages warning triggered for Q3 2026 milestones.<br>
      <a href="projects.html?search=L%26T" style="font-weight: 700; color: #2563eb;">View Contractor Projects <i class="fa-solid fa-arrow-right"></i></a>
    `;
  }

  if (q.includes('maharashtra') || q.includes('state')) {
    const mhProjects = projects.filter(p => p.state.toLowerCase() === 'maharashtra');
    let html = `<strong>MoSPI High-Risk Projects in Maharashtra (${mhProjects.length}):</strong><br><ul style="margin: 0.4rem 0 0 1rem; padding: 0;">`;
    mhProjects.forEach(p => {
      html += `<li style="margin-bottom: 0.35rem;">
        <strong>${escapeHtml(p.name)}</strong> (${p.sector}) - Risk: <strong>${p.riskScore}%</strong>
        <a href="project-detail.html?id=${p.id}" style="font-size: 0.72rem; text-decoration: underline; margin-left: 6px;">Audit <i class="fa-solid fa-arrow-up-right-from-square"></i></a>
      </li>`;
    });
    html += `</ul>`;
    return html;
  }

  // Fallback matching query words against project names/sectors
  const matched = projects.filter(p => p.name.toLowerCase().includes(q) || p.sector.toLowerCase().includes(q) || p.state.toLowerCase().includes(q));
  if (matched.length > 0) {
    let html = `Found <strong>${matched.length} matching national project(s)</strong> for "${escapeHtml(queryText)}":<br><ul style="margin: 0.4rem 0 0 1rem; padding: 0;">`;
    matched.slice(0, 3).forEach(p => {
      html += `<li style="margin-bottom: 0.35rem;">
        <strong>${escapeHtml(p.name)}</strong> (${p.state}) | Progress: <strong>${p.progress}%</strong>
        <a href="project-detail.html?id=${p.id}" style="font-size: 0.72rem; text-decoration: underline; margin-left: 6px;">View <i class="fa-solid fa-arrow-up-right-from-square"></i></a>
      </li>`;
    });
    html += `</ul>`;
    return html;
  }

  return `
    I have queried the <strong>MoSPI Infrastructure Database</strong>. Here are recommended actions for <em>"${escapeHtml(queryText)}"</em>:<br>
    • Search national projects: <a href="projects.html?search=${encodeURIComponent(queryText)}" style="color: #2563eb; font-weight: 700;">Filter Projects Directory</a><br>
    • View active delay alerts: <a href="alerts.html" style="color: #2563eb; font-weight: 700;">Escalation Matrix</a><br>
    • Run analytics: <a href="analytics.html" style="color: #2563eb; font-weight: 700;">S-Curve Analytics</a>
  `;
}

function startGlobalVoiceSearch(inputElem, micBtnElem, currentPath) {

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    showGlobalToast('Voice search is not supported in this browser. Please use Chrome/Edge.', 'warning');
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = 'en-IN'; // Supports Hinglish/Indian English
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  micBtnElem.classList.add('listening');
  showGlobalToast('🎤 Listening... Speak in Hindi or English (e.g. "Show delayed projects in Rajasthan")', 'info');

  recognition.start();

  recognition.onresult = (event) => {
    micBtnElem.classList.remove('listening');
    const transcript = event.results[0][0].transcript.trim();
    if (transcript) {
      if (inputElem) inputElem.value = transcript;
      showGlobalToast(`Recognized: "${transcript}"`, 'success');

      if (currentPath === 'projects.html') {
        const projSearch = document.getElementById('project-search-input');
        if (projSearch) {
          projSearch.value = transcript;
          projSearch.dispatchEvent(new Event('input'));
        }
      } else {
        setTimeout(() => {
          window.location.href = `projects.html?search=${encodeURIComponent(transcript)}`;
        }, 1000);
      }
    }
  };

  recognition.onerror = (event) => {
    micBtnElem.classList.remove('listening');
    console.warn('Voice Recognition Error:', event.error);
    showGlobalToast('Voice recognition error. Please try again.', 'warning');
  };

  recognition.onend = () => {
    micBtnElem.classList.remove('listening');
  };
}

function showGlobalToast(msg, type = 'info') {
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

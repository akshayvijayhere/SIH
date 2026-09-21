/* 
   NIRMAAN AI - Interactive AI Assistant Engine
   Natural Language Infrastructure Project Query Processor for MoSPI
*/

document.addEventListener('DOMContentLoaded', () => {
  initAIAssistant();
});

function initAIAssistant() {
  const chatForm = document.getElementById('ai-chat-form');
  const chatInput = document.getElementById('ai-input-field');

  if (chatForm && chatInput) {
    chatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const val = chatInput.value.trim();
      if (!val) return;
      handleAIQuery(val);
      chatInput.value = '';
    });
  }

  // Handle Quick Action Pill buttons
  document.querySelectorAll('.prompt-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const prompt = e.currentTarget.getAttribute('data-prompt');
      if (prompt) handleAIQuery(prompt);
    });
  });
}

function handleAIQuery(queryText) {
  const container = document.getElementById('chat-messages-container');
  if (!container) return;

  const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // 1. Append User Bubble
  container.insertAdjacentHTML('beforeend', `
    <div class="chat-message-row user">
      <div class="chat-avatar user"><i class="fa-solid fa-user"></i></div>
      <div>
        <div class="chat-bubble">${escapeHtml(queryText)}</div>
        <div class="chat-timestamp">${timeStr}</div>
      </div>
    </div>
  `);
  container.scrollTop = container.scrollHeight;

  // 2. Show Typing Indicator
  const typingId = 'typing-' + Date.now();
  container.insertAdjacentHTML('beforeend', `
    <div class="chat-message-row bot" id="${typingId}">
      <div class="chat-avatar bot"><i class="fa-solid fa-robot"></i></div>
      <div class="chat-bubble typing-bubble">
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
        <span style="font-size: 0.78rem; color: var(--text-muted); margin-left: 6px;">NIRMAAN AI is querying MoSPI database...</span>
      </div>
    </div>
  `);
  container.scrollTop = container.scrollHeight;

  // 3. Process Query & Append Bot Response
  setTimeout(() => {
    const typingElem = document.getElementById(typingId);
    if (typingElem) typingElem.remove();

    const botHtml = generateSmartBotResponse(queryText, timeStr);
    container.insertAdjacentHTML('beforeend', botHtml);
    container.scrollTop = container.scrollHeight;
  }, 600);
}

function generateSmartBotResponse(queryText, timeStr) {
  const data = window.NIRMAAN_DATA;
  const projects = (data && data.projects) ? data.projects : [];
  const queryLower = queryText.toLowerCase();

  // Intent parsing
  const isHighRisk = queryLower.includes('high risk') || queryLower.includes('critical') || queryLower.includes('delay risk');
  const isDelayed = queryLower.includes('delayed') || queryLower.includes('delay');
  const isCostRisk = queryLower.includes('cost overrun') || queryLower.includes('budget') || queryLower.includes('cost');
  const isOnTrack = queryLower.includes('on track') || queryLower.includes('low risk');

  // Sector detection
  const sectors = ['roads', 'railways', 'bridges', 'energy', 'water', 'urban transport', 'irrigation', 'ports'];
  const matchedSector = sectors.find(s => queryLower.includes(s));

  // State detection
  const states = ['rajasthan', 'uttar pradesh', 'bihar', 'gujarat', 'maharashtra', 'delhi', 'karnataka', 'andhra pradesh', 'west bengal', 'assam', 'tamil nadu'];
  const matchedState = states.find(st => queryLower.includes(st));

  // Filter project database
  let filtered = projects.filter(p => {
    let match = true;
    if (isHighRisk && p.riskScore < 70) match = false;
    if (isDelayed && p.status !== 'Delayed') match = false;
    if (isCostRisk && p.costRisk < 60) match = false;
    if (isOnTrack && p.riskScore >= 50) match = false;
    if (matchedSector && !p.sector.toLowerCase().includes(matchedSector)) match = false;
    if (matchedState && !p.state.toLowerCase().includes(matchedState)) match = false;
    return match;
  });

  // Fallback if strict filter yields 0 results
  if (filtered.length === 0 && (matchedState || matchedSector)) {
    filtered = projects.filter(p => {
      if (matchedState && p.state.toLowerCase().includes(matchedState)) return true;
      if (matchedSector && p.sector.toLowerCase().includes(matchedSector)) return true;
      return false;
    });
  }

  let responseBody = '';

  if (filtered.length > 0) {
    responseBody = `
      <p>I found <strong>${filtered.length} project(s)</strong> matching your criteria in the MoSPI national database:</p>
      <div class="ai-project-cards-grid">
        ${filtered.map(p => {
          const badgeClass = p.riskScore >= 70 ? 'danger' : (p.riskScore >= 50 ? 'warning' : 'success');
          return `
            <div class="ai-result-card">
              <div class="ai-card-header">
                <div>
                  <h4 class="ai-card-name">${escapeHtml(p.name)}</h4>
                  <span class="ai-card-loc"><i class="fa-solid fa-location-dot"></i> ${p.city || p.state}, ${p.state}</span>
                </div>
                <span class="ai-card-risk-badge ${badgeClass}">${p.riskScore}% RISK</span>
              </div>
              <div class="ai-card-progress-row">
                <div style="font-size: 0.72rem; display: flex; justify-content: space-between;">
                  <span>Physical Progress</span>
                  <strong>${p.progress}%</strong>
                </div>
                <div class="gis-prog-bar"><div class="gis-prog-fill ${badgeClass}" style="width:${p.progress}%;"></div></div>
              </div>
              <div class="ai-card-footer">
                <div><span>Approved:</span> <strong>${p.approvedBudget}</strong></div>
                <a href="project-detail.html?id=${p.id}" class="ai-card-btn">Inspect <i class="fa-solid fa-arrow-right"></i></a>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  } else if (queryLower.includes('summary') || queryLower.includes('report') || queryLower.includes('status')) {
    responseBody = `
      <p><strong>MoSPI National Infrastructure Overview Summary:</strong></p>
      <ul style="margin-top: 6px; padding-left: 1rem; font-size: 0.82rem; line-height: 1.6;">
        <li>Total Projects Monitored: <strong>1,981 Projects</strong> ($\ge ₹150\text{ Cr}$)</li>
        <li>High Risk Projects: <strong style="color: #ef4444;">151 Projects (8%)</strong></li>
        <li>Delay Risk Threshold Exceeded: <strong>298 Projects</strong></li>
        <li>Top Lagging Sector: <strong>Roads & Highways (Physical progress lag of 22%)</strong></li>
      </ul>
    `;
  } else {
    responseBody = `
      <p>I analyzed the infrastructure database for <strong>"${escapeHtml(queryText)}"</strong>.</p>
      <p style="margin-top: 6px;">Currently monitoring <strong>1,981 central sector projects</strong> across India. You can filter by state (e.g. <em>Rajasthan, Bihar, UP</em>), risk (e.g. <em>High risk, Delayed</em>), or sector (e.g. <em>Railways, Energy</em>).</p>
    `;
  }

  return `
    <div class="chat-message-row bot">
      <div class="chat-avatar bot"><i class="fa-solid fa-robot"></i></div>
      <div style="flex: 1;">
        <div class="chat-bubble">
          <div style="font-size: 0.8rem; font-weight: 800; color: var(--color-primary); margin-bottom: 6px;"><i class="fa-solid fa-sparkles"></i> NIRMAAN AI Assistant</div>
          ${responseBody}
        </div>
        <div class="chat-timestamp">${timeStr}</div>
      </div>
    </div>
  `;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.innerText = text;
  return div.innerHTML;
}

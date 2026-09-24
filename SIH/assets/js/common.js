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
});

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

      if (currentPath === 'ai-assistant.html') {
        const aiPrompt = document.getElementById('prompt-input');
        if (aiPrompt) {
          aiPrompt.value = transcript;
          document.getElementById('send-prompt-btn')?.click();
        }
      } else if (currentPath === 'projects.html') {
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

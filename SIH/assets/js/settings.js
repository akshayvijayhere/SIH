/* 
   NIRMAAN AI - Settings Logic & Interactive Control Manager
*/

document.addEventListener('DOMContentLoaded', () => {
  // Tab Switcher Handler
  const tabButtons = document.querySelectorAll('.settings-sub-sidebar .settings-menu-item');
  const tabPanels = document.querySelectorAll('.settings-content-body .settings-tab-panel');

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-tab');
      if (!targetId) return;

      // Update sidebar button active states
      tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Update panel visibility
      tabPanels.forEach(panel => {
        if (panel.id === targetId) {
          panel.classList.add('active');
        } else {
          panel.classList.remove('active');
        }
      });
    });
  });

  // Theme Switcher Handler
  const themeControl = document.getElementById('theme-mode-switcher');
  if (themeControl) {
    const currentSavedTheme = localStorage.getItem('nirmaan_theme') || 'light';
    themeControl.querySelectorAll('.theme-option-btn').forEach(b => {
      if (b.getAttribute('data-theme') === currentSavedTheme) b.classList.add('active');
      else b.classList.remove('active');
    });

    themeControl.querySelectorAll('.theme-option-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        themeControl.querySelectorAll('.theme-option-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const theme = btn.getAttribute('data-theme');
        setTheme(theme);
      });
    });
  }

  // Sign Out Buttons
  document.querySelectorAll('#btn-sign-out').forEach(btn => {
    btn.addEventListener('click', () => {
      if (confirm('Sign out from NIRMAAN AI Executive Portal?')) {
        window.location.href = 'login.html';
      }
    });
  });
});

function setTheme(themeMode) {
  const html = document.documentElement;
  let activeTheme = themeMode;
  if (themeMode === 'system') {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    activeTheme = isDark ? 'dark' : 'light';
  }
  html.setAttribute('data-theme', activeTheme);
  localStorage.setItem('nirmaan_theme', activeTheme);
}

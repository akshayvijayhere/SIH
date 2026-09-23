/* 
   NIRMAAN AI - Settings Logic & Theme Manager
*/

document.addEventListener('DOMContentLoaded', () => {
  const menuItems = document.querySelectorAll('.settings-sub-sidebar .settings-menu-item');
  menuItems.forEach(item => {
    item.addEventListener('click', () => {
      menuItems.forEach(m => m.classList.remove('active'));
      item.classList.add('active');
    });
  });

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

  document.getElementById('btn-sign-out')?.addEventListener('click', () => {
    if (confirm('Sign out from NIRMAAN AI Portal?')) {
      window.location.href = 'login.html';
    }
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

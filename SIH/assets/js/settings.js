/* 
   NIRMAAN AI - Profile & Theme Settings Manager
*/

document.addEventListener('DOMContentLoaded', () => {
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

  // Sign Out Handler
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
  const activeTheme = themeMode === 'dark' ? 'dark' : 'light';
  html.setAttribute('data-theme', activeTheme);
  localStorage.setItem('nirmaan_theme', activeTheme);
}

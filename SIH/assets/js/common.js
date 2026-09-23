/* 
   NIRMAAN AI - Common Page Helper & Navigation Manager
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

  // Topbar Search Handler across all pages
  const topbarInput = document.querySelector('.app-topbar .topbar-search input');
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

  // User Profile click navigates to settings.html
  document.getElementById('profile-dropdown-btn')?.addEventListener('click', () => {
    window.location.href = 'settings.html';
  });
});

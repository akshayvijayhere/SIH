/* 
   NIRMAAN AI - Single Page Application Router
*/

window.NIRMAAN_ROUTER = {
  activeView: 'view-login',

  navigateTo(viewId, params = {}) {
    const allViews = document.querySelectorAll('.page-view, #view-login');
    allViews.forEach(v => v.classList.add('hidden'));

    const targetView = document.getElementById(viewId);
    if (targetView) {
      targetView.classList.remove('hidden');
      this.activeView = viewId;
    }

    // Handle Login vs Dashboard Shell
    const shell = document.getElementById('dashboard-shell');
    const loginView = document.getElementById('view-login');

    if (viewId === 'view-login') {
      if (shell) shell.classList.add('hidden');
      if (loginView) loginView.classList.remove('hidden');
    } else {
      if (loginView) loginView.classList.add('hidden');
      if (shell) shell.classList.remove('hidden');
    }

    // Update active sidebar nav button
    const navItems = document.querySelectorAll('.app-sidebar .nav-item');
    navItems.forEach(item => {
      if (item.getAttribute('data-view') === viewId) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    // Trigger view initializers if needed
    if (viewId === 'view-dashboard' && typeof initDashboard === 'function') initDashboard();
    if (viewId === 'view-projects' && typeof initProjectsView === 'function') initProjectsView();
    if (viewId === 'view-project-detail' && typeof initProjectDetailView === 'function') initProjectDetailView(params.projectId);
    if (viewId === 'view-analytics' && typeof initAnalyticsView === 'function') initAnalyticsView();
    if (viewId === 'view-alerts' && typeof initAlertCenter === 'function') initAlertCenter();
    if (viewId === 'view-settings' && typeof initSettings === 'function') initSettings();

    window.scrollTo(0, 0);
  }
};

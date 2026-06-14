import { authService } from './api.js';
import LoginView from './views/LoginView.js';
import DashboardView from './views/DashboardView.js';
import RegisterView from './views/RegisterView.js';
import VehiclesView from './views/VehiclesView.js';
import ContactsView from './views/ContactsView.js';
import SOSView from './views/SOSView.js';

const appState = {
  user: null,
};

// Simple router
const routes = {
  '/': { view: DashboardView, protected: true },
  '/login': { view: LoginView, protected: false },
  '/register': { view: RegisterView, protected: false },
  '/vehicles': { view: VehiclesView, protected: true },
  '/contacts': { view: ContactsView, protected: true },
  '/sos': { view: SOSView, protected: true },
};

async function router() {
  const path = window.location.pathname;
  const route = routes[path] || routes['/'];
  
  const appRoot = document.getElementById('app-root');
  const navbar = document.getElementById('navbar');

  if (route.protected && !appState.user) {
    navigateTo('/login');
    return;
  }

  if (path === '/login' && appState.user) {
    navigateTo('/');
    return;
  }

  // Toggle navbar visibility
  navbar.style.display = appState.user ? 'block' : 'none';

  // Render view
  appRoot.innerHTML = route.view.render();
  if (route.view.afterRender) {
    route.view.afterRender(appState);
  }

  // Refresh icons
  if (window.lucide) {
    lucide.createIcons();
  }
}

export function navigateTo(url) {
  history.pushState(null, null, url);
  router();
}

// Expose globally to avoid circular dependencies
window.navigateTo = navigateTo;

// Intercept link clicks immediately
document.body.addEventListener('click', e => {
  const link = e.target.closest('[data-link]');
  if (link) {
    e.preventDefault();
    navigateTo(link.getAttribute('href'));
  }
});

// Handle logout
document.getElementById('logout-btn').addEventListener('click', async () => {
  try {
    await authService.logout();
    appState.user = null;
    navigateTo('/login');
  } catch (e) {
    console.error(e);
  }
});

// Handle browser back/forward
window.addEventListener('popstate', router);

// Initialize app immediately
(async () => {
  appState.user = await authService.checkAuth();
  router();
})();

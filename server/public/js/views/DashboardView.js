import { api } from '../api.js';

function getComplianceDot(dueDate) {
  if (!dueDate) return 'background: #64748B;';
  const diffTime = new Date(dueDate) - new Date();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'background: #EF4444;';
  if (diffDays <= 7) return 'background: #F59E0B;';
  if (diffDays <= 30) return 'background: #3B82F6;';
  return 'background: #10B981;';
}

function getComplianceLabel(dueDate) {
  if (!dueDate) return 'Unknown';
  const diffTime = new Date(dueDate) - new Date();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'Expired';
  if (diffDays === 0) return 'Expires Today';
  if (diffDays === 1) return 'Tomorrow';
  return `${diffDays}d left`;
}

function getComplianceBadgeStyle(dueDate) {
  if (!dueDate) return 'background: rgba(255,255,255,0.08); color: var(--color-text-muted);';
  const diffTime = new Date(dueDate) - new Date();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'background: rgba(239,68,68,0.15); color: var(--color-danger); border: 1px solid rgba(239,68,68,0.3);';
  if (diffDays <= 7) return 'background: rgba(245,158,11,0.15); color: var(--color-warning); border: 1px solid rgba(245,158,11,0.3);';
  return 'background: rgba(16,185,129,0.15); color: var(--color-success); border: 1px solid rgba(16,185,129,0.3);';
}

const DashboardView = {
  render() {
    const today = new Date();
    const dateStr = today.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    return `
      <div class="page-enter" id="dashboard-page">
        <!-- Welcome Header -->
        <div class="flex justify-between items-center mb-6">
          <div>
            <h1 id="greeting" class="text-2xl font-bold">Namaste! 🙏</h1>
            <p class="text-text-secondary text-sm mt-1">${dateStr}</p>
          </div>
        </div>

        <!-- Quick Stats Grid -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px;">
          <!-- Card 1 -->
          <a href="/vehicles" data-link class="glass-card" style="padding: 20px; display: flex; justify-content: space-between; align-items: center; text-decoration: none; color: inherit; border-radius: 16px;">
            <div>
              <p style="font-size: 13px; color: var(--color-text-secondary); font-weight: 500;">Total Vehicles</p>
              <p id="stat-vehicles" class="text-3xl font-bold mt-1" style="color: var(--color-text-primary);">0</p>
            </div>
            <div class="gradient-primary" style="width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; border-radius: 12px; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);">
              <i data-lucide="car" style="color: white; width: 22px; height: 22px;"></i>
            </div>
          </a>

          <!-- Card 2 -->
          <a href="/contacts" data-link class="glass-card" style="padding: 20px; display: flex; justify-content: space-between; align-items: center; text-decoration: none; color: inherit; border-radius: 16px;">
            <div>
              <p style="font-size: 13px; color: var(--color-text-secondary); font-weight: 500;">SOS Contacts</p>
              <p id="stat-contacts" class="text-3xl font-bold mt-1" style="color: var(--color-text-primary);">0</p>
            </div>
            <div style="background: linear-gradient(135deg, #EC4899, #8B5CF6); width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; border-radius: 12px; box-shadow: 0 4px 12px rgba(236, 72, 153, 0.3);">
              <i data-lucide="users" style="color: white; width: 22px; height: 22px;"></i>
            </div>
          </a>
        </div>

        <div style="display: grid; grid-template-columns: 1fr; gap: 24px; margin-bottom: 24px;">
          <!-- Compliance Alerts Card -->
          <div class="glass-card" style="padding: 24px; border-radius: 16px;">
            <div class="flex justify-between items-center mb-4">
              <h2 class="text-lg font-bold flex items-center gap-2">
                <i data-lucide="alert-triangle" style="color: var(--color-accent); width: 20px; height: 20px;"></i>
                Compliance Expirations
              </h2>
            </div>
            <div id="compliance-alerts-container" style="display: flex; flex-direction: column; gap: 12px;">
              Loading compliance alert states...
            </div>
          </div>
        </div>

        <!-- SOS Quick Access Banner -->
        <a href="/sos" data-link class="glass-card" style="display: flex; align-items: center; justify-content: space-between; padding: 20px; border-radius: 16px; border: 1px solid rgba(239, 68, 68, 0.3); text-decoration: none; color: inherit;">
          <div class="flex items-center gap-4">
            <div class="sos-btn" style="width: 50px; height: 50px; border-radius: 14px; background: linear-gradient(135deg, #EF4444, #B91C1C); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(239, 68, 68, 0.4);">
              <i data-lucide="alert-triangle" style="color: white; width: 24px; height: 24px;"></i>
            </div>
            <div>
              <h3 class="font-bold text-lg text-text-primary">Emergency Distress SOS</h3>
              <p class="text-text-secondary text-sm">Send instant location updates to all active emergency contacts</p>
            </div>
          </div>
          <i data-lucide="chevron-right" style="color: var(--color-text-muted);"></i>
        </a>
      </div>
    `;
  },

  async afterRender(appState) {
    if (appState.user) {
      document.getElementById('greeting').textContent = `Namaste, ${appState.user.name.split(' ')[0]}! 🙏`;
    }

    const statVehicles = document.getElementById('stat-vehicles');
    const statContacts = document.getElementById('stat-contacts');
    const alertsContainer = document.getElementById('compliance-alerts-container');

    try {
      // Load vehicles
      const vData = await api.get('/vehicles');
      const vehicles = vData.vehicles || vData || [];
      statVehicles.textContent = vehicles.length;

      // Load contacts
      const cData = await api.get('/contacts');
      const contacts = cData || [];
      statContacts.textContent = contacts.length;

      // Parse compliance alerts
      const today = new Date();
      const complianceAlerts = [];

      vehicles.forEach(v => {
        const name = `${v.make} ${v.model}`;
        if (v.insuranceExpiry) {
          const diff = Math.ceil((new Date(v.insuranceExpiry) - today) / 86400000);
          if (diff <= 30) {
            complianceAlerts.push({ vehicle: name, reg: v.registrationNumber, type: 'Insurance', dueDate: v.insuranceExpiry, diff, icon: 'shield' });
          }
        }
        if (v.pucExpiry) {
          const diff = Math.ceil((new Date(v.pucExpiry) - today) / 86400000);
          if (diff <= 30) {
            complianceAlerts.push({ vehicle: name, reg: v.registrationNumber, type: 'PUC', dueDate: v.pucExpiry, diff, icon: 'file-check' });
          }
        }
        if (v.nextServiceDate) {
          const diff = Math.ceil((new Date(v.nextServiceDate) - today) / 86400000);
          if (diff <= 30) {
            complianceAlerts.push({ vehicle: name, reg: v.registrationNumber, type: 'Service', dueDate: v.nextServiceDate, diff, icon: 'wrench' });
          }
        }
      });

      // Sort soonest first
      complianceAlerts.sort((a, b) => a.diff - b.diff);

      if (complianceAlerts.length === 0) {
        alertsContainer.innerHTML = `
          <div style="text-align: center; padding: 24px 0;">
            <i data-lucide="shield" style="color: var(--color-success); width: 40px; height: 40px; margin: 0 auto 12px; opacity: 0.8;"></i>
            <p style="font-weight: bold; color: var(--color-text-primary);">All systems clear! ✅</p>
            <p style="font-size: 12px; color: var(--color-text-muted); margin-top: 4px;">No upcoming document or service expirations</p>
          </div>
        `;
      } else {
        alertsContainer.innerHTML = complianceAlerts.map(a => `
          <div class="flex justify-between items-center" style="padding: 12px; border-radius: 12px; background: rgba(30, 41, 59, 0.4); border: 1px solid var(--color-border);">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="width: 36px; height: 36px; border-radius: 8px; background: rgba(245,158,11,0.1); display: flex; align-items: center; justify-content: center;">
                <i data-lucide="${a.icon}" style="color: var(--color-accent); width: 18px; height: 18px;"></i>
              </div>
              <div>
                <span style="font-weight: bold; font-size: 14px;">${a.vehicle}</span>
                <p style="font-size: 11px; color: var(--color-text-secondary); margin-top: 2px;">
                  ${a.type} • Expiring ${new Date(a.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                </p>
              </div>
            </div>
            <span class="badge" style="${getComplianceBadgeStyle(a.dueDate)} border-radius: 4px; padding: 2px 6px; font-size: 11px;">
              ${getComplianceLabel(a.dueDate)}
            </span>
          </div>
        `).join('');
      }

    } catch (err) {
      alertsContainer.innerHTML = `<p class="text-danger">Failed to load overview statistics: ${err.message}</p>`;
    }

    if (window.lucide) {
      lucide.createIcons();
    }
  }
};

export default DashboardView;

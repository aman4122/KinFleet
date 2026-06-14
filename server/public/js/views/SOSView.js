import { api } from '../api.js';

const SOSView = {
  vehicles: [],
  selectedVehicle: 'none',
  sosContacts: [],
  location: null,
  locationError: '',
  triggering: false,

  render() {
    return `
      <div class="page-enter flex flex-col items-center justify-center" id="sos-page" style="min-height: 80vh; padding: 20px;">
        <div style="width: 100%; max-width: 450px; display: flex; flex-direction: column; gap: 24px;">
          
          <div class="text-center" style="display: flex; flex-direction: column; gap: 8px;">
            <h1 class="text-3xl font-extrabold text-danger" style="letter-spacing: 1px;">EMERGENCY SOS</h1>
            <p class="text-text-secondary text-sm">Tap the button below to instantly broadcast your distress location to your emergency contacts.</p>
          </div>

          <!-- Pulsing Red SOS Button -->
          <div class="flex justify-center my-6" style="display: flex; justify-content: center; position: relative;">
            <button id="sos-trigger-btn" class="sos-btn" style="width: 200px; height: 200px; border-radius: 50%; border: none; background: linear-gradient(135deg, #EF4444, #B91C1C); display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 10px 30px rgba(239, 68, 68, 0.4); position: relative; z-index: 10;">
              <i id="sos-icon" data-lucide="alert-triangle" style="color: white; width: 64px; height: 64px;"></i>
              <span id="sos-status-label" style="margin-top: 12px; color: white; font-weight: bold; font-size: 14px; letter-spacing: 1.5px; text-transform: uppercase;">TAP FOR HELP</span>
            </button>
          </div>

          <div id="sos-notification" class="error-message" style="display: none; background: rgba(16, 185, 129, 0.15); color: var(--color-success); border-color: rgba(16, 185, 129, 0.3); font-weight: bold; text-align: center; padding: 12px; border-radius: 8px;"></div>

          <div class="glass-card" style="padding: 20px; border-radius: 16px; border: 1px solid rgba(239, 68, 68, 0.2);">
            <div class="form-group">
              <label for="sos-vehicle-select">Vehicle in Distress (Optional)</label>
              <select id="sos-vehicle-select" style="width: 100%; height: 42px; background: var(--color-surface-card); color: var(--color-text-primary); border: 1px solid var(--color-border); border-radius: 8px; padding: 0 12px; margin-bottom: 16px;">
                <option value="none">Not in a vehicle / Unlisted</option>
              </select>
            </div>

            <!-- Location Status Card -->
            <div class="flex items-start gap-3" style="padding: 12px; border-radius: 8px; background: rgba(15, 23, 42, 0.4); border: 1px solid var(--color-border); margin-bottom: 12px;">
              <i id="location-indicator" data-lucide="map-pin" style="margin-top: 2px;"></i>
              <div>
                <span id="location-title" style="font-weight: bold; font-size: 13px;">Detecting Location...</span>
                <p id="location-coords" style="font-size: 11px; color: var(--color-text-muted); margin-top: 2px;">Waiting for GPS coordinates...</p>
                <button id="retry-location-btn" style="display: none; background: none; border: none; color: var(--color-primary-light); font-size: 11px; font-weight: bold; cursor: pointer; padding: 0; margin-top: 4px; text-decoration: underline;">Retry Detection</button>
              </div>
            </div>

            <!-- Contact Notification Status Card -->
            <div class="flex items-start gap-3" style="padding: 12px; border-radius: 8px; background: rgba(15, 23, 42, 0.4); border: 1px solid var(--color-border);">
              <i data-lucide="bell" style="color: var(--color-accent); margin-top: 2px; width: 18px; height: 18px;"></i>
              <div>
                <span id="contacts-title" style="font-weight: bold; font-size: 13px;">Preparing Contacts...</span>
                <p id="contacts-list" style="font-size: 11px; color: var(--color-text-muted); margin-top: 2px;">No active SOS contacts configured.</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    `;
  },

  async afterRender(appState) {
    const triggerBtn = document.getElementById('sos-trigger-btn');
    const label = document.getElementById('sos-status-label');
    const icon = document.getElementById('sos-icon');
    const notifyDiv = document.getElementById('sos-notification');
    const vehicleSelect = document.getElementById('sos-vehicle-select');
    
    const locIndicator = document.getElementById('location-indicator');
    const locTitle = document.getElementById('location-title');
    const locCoords = document.getElementById('location-coords');
    const retryBtn = document.getElementById('retry-location-btn');
    
    const contactsTitle = document.getElementById('contacts-title');
    const contactsList = document.getElementById('contacts-list');

    // Reset view states
    this.triggering = false;

    // Load data
    try {
      const [vData, cData] = await Promise.all([
        api.get('/vehicles'),
        api.get('/contacts')
      ]);

      this.vehicles = vData.data?.vehicles || vData.vehicles || vData || [];
      const allContacts = cData.data?.contacts || cData.contacts || cData || [];
      this.sosContacts = allContacts.filter(c => c.isSosContact);

      // Hydrate vehicle select
      this.vehicles.forEach(v => {
        const opt = document.createElement('option');
        opt.value = v._id;
        opt.textContent = `${v.make} ${v.model} (${v.registrationNumber})`;
        vehicleSelect.appendChild(opt);
      });

      // Hydrate contacts card
      if (this.sosContacts.length === 0) {
        contactsTitle.textContent = 'No SOS Contacts';
        contactsList.textContent = 'Please add contacts in the "Contacts" tab before using SOS!';
      } else {
        contactsTitle.textContent = `SOS Broadcasting Active`;
        contactsList.textContent = `Will notify: ${this.sosContacts.map(c => c.name).join(', ')}`;
      }

    } catch (err) {
      console.error(err);
    }

    // Geolocation handlers
    const fetchLocation = () => {
      locTitle.textContent = 'Detecting Location...';
      locCoords.textContent = 'Acquiring GPS fix...';
      locIndicator.style.color = 'var(--color-text-muted)';
      retryBtn.style.display = 'none';

      if (!navigator.geolocation) {
        this.locationError = 'GPS not supported';
        locTitle.textContent = 'GPS Not Supported';
        locCoords.textContent = 'Please use a modern GPS-enabled browser.';
        locIndicator.style.color = '#EF4444';
        return;
      }

      navigator.geolocation.getCurrentPosition(
        position => {
          this.location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          locTitle.textContent = 'Location Ready';
          locCoords.textContent = `${this.location.lat.toFixed(6)}, ${this.location.lng.toFixed(6)}`;
          locIndicator.style.color = '#10B981';
        },
        err => {
          this.locationError = 'Please enable location permissions';
          locTitle.textContent = 'GPS Access Denied';
          locCoords.textContent = 'Location is required to send emergency alerts.';
          locIndicator.style.color = '#EF4444';
          retryBtn.style.display = 'block';
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    };

    fetchLocation();
    retryBtn.addEventListener('click', fetchLocation);

    // SOS broadcast trigger
    triggerBtn.addEventListener('click', async () => {
      if (this.triggering) return;

      if (!this.location) {
        notifyDiv.textContent = 'GPS location is missing. Detecting location...';
        notifyDiv.style.background = 'rgba(239, 68, 68, 0.15)';
        notifyDiv.style.color = 'var(--color-danger)';
        notifyDiv.style.borderColor = 'rgba(239, 68, 68, 0.3)';
        notifyDiv.style.display = 'block';
        fetchLocation();
        return;
      }

      if (this.sosContacts.length === 0) {
        notifyDiv.textContent = 'Add SOS contacts first in the Contacts tab!';
        notifyDiv.style.background = 'rgba(239, 68, 68, 0.15)';
        notifyDiv.style.color = 'var(--color-danger)';
        notifyDiv.style.borderColor = 'rgba(239, 68, 68, 0.3)';
        notifyDiv.style.display = 'block';
        return;
      }

      this.triggering = true;
      notifyDiv.style.display = 'none';
      label.textContent = 'BROADCASTING...';
      icon.setAttribute('data-lucide', 'loader-2');
      if (window.lucide) lucide.createIcons();
      icon.classList.add('animate-spin');

      try {
        const vehicleVal = vehicleSelect.value === 'none' ? undefined : vehicleSelect.value;
        await api.post('/sos/trigger', {
          lat: this.location.lat,
          lng: this.location.lng,
          vehicleId: vehicleVal
        });

        notifyDiv.textContent = 'EMERGENCY ALERTS BROADCASTED SUCCESSFULY! 🚨';
        notifyDiv.style.background = 'rgba(16, 185, 129, 0.15)';
        notifyDiv.style.color = 'var(--color-success)';
        notifyDiv.style.borderColor = 'rgba(16, 185, 129, 0.3)';
        notifyDiv.style.display = 'block';
      } catch (err) {
        notifyDiv.textContent = `Alert failed: ${err.message}. Please dial 112 directly!`;
        notifyDiv.style.background = 'rgba(239, 68, 68, 0.15)';
        notifyDiv.style.color = 'var(--color-danger)';
        notifyDiv.style.borderColor = 'rgba(239, 68, 68, 0.3)';
        notifyDiv.style.display = 'block';
      } finally {
        this.triggering = false;
        label.textContent = 'TAP FOR HELP';
        icon.setAttribute('data-lucide', 'alert-triangle');
        icon.classList.remove('animate-spin');
        if (window.lucide) lucide.createIcons();
      }
    });

    if (window.lucide) {
      lucide.createIcons();
    }
  }
};

export default SOSView;

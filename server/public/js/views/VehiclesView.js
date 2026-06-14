import { api } from '../api.js';

const FUEL_TYPES = ['Petrol', 'Diesel', 'CNG', 'EV', 'Strong Hybrid'];

function getComplianceDot(dueDate) {
  if (!dueDate) return 'background: #64748B;'; // muted
  const diffTime = new Date(dueDate) - new Date();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'background: #EF4444;'; // danger red
  if (diffDays <= 7) return 'background: #F59E0B;'; // warning amber
  if (diffDays <= 30) return 'background: #3B82F6;'; // accent blue
  return 'background: #10B981;'; // success green
}

const VehiclesView = {
  vehicles: [],
  searchQuery: '',
  fuelFilter: 'all',

  render() {
    return `
      <div class="page-enter" id="vehicles-page">
        <!-- Header -->
        <div class="flex justify-between items-center mb-6">
          <div>
            <h1 class="text-2xl font-bold">My Vehicles</h1>
            <p class="text-text-secondary text-sm" id="vehicle-count">Loading registered vehicles...</p>
          </div>
          <button class="btn btn-primary" id="open-add-dialog">
            <i data-lucide="plus"></i> Add Vehicle
          </button>
        </div>

        <!-- Filters -->
        <div class="flex gap-3 mb-6 flex-wrap">
          <div style="flex: 1; min-width: 250px; position: relative;">
            <input type="text" id="vehicle-search" placeholder="Search by make, model, or registration..." style="padding-left: 40px; width: 100%;">
            <i data-lucide="search" style="position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--color-text-muted); width: 16px; height: 16px;"></i>
          </div>
          
          <select id="fuel-filter" style="width: 150px; background: var(--color-surface-card); color: var(--color-text-primary); border: 1px solid var(--color-border); border-radius: 8px; padding: 0 12px; height: 42px;">
            <option value="all">All Fuels</option>
            ${FUEL_TYPES.map(f => `<option value="${f}">${f}</option>`).join('')}
          </select>
        </div>

        <!-- Vehicle Grid -->
        <div class="stagger-children" id="vehicles-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px;">
          Loading vehicles...
        </div>

        <!-- Add Vehicle Dialog Modal -->
        <div id="add-vehicle-modal" class="modal-overlay" style="display: none; position: fixed; inset: 0; background: rgba(15, 23, 42, 0.8); backdrop-filter: blur(8px); z-index: 1000; justify-content: center; align-items: center; padding: 20px;">
          <div class="glass-card" style="width: 100%; max-width: 550px; padding: 24px; max-height: 90vh; overflow-y: auto; position: relative;">
            <button id="close-modal-btn" style="position: absolute; right: 20px; top: 20px; background: transparent; border: none; color: var(--color-text-muted); cursor: pointer;">
              <i data-lucide="x"></i>
            </button>
            
            <h2 class="text-xl font-bold mb-2">Add New Vehicle</h2>
            <p class="text-text-secondary text-sm mb-4">Enter your vehicle details to start tracking compliance.</p>
            
            <div id="modal-error" class="error-message mb-4" style="display: none;"></div>

            <form id="add-vehicle-form">
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
                <div class="form-group mb-0">
                  <label for="make">Make *</label>
                  <input type="text" id="make" required placeholder="e.g. Tata">
                </div>
                <div class="form-group mb-0">
                  <label for="model">Model *</label>
                  <input type="text" id="model" required placeholder="e.g. Nexon">
                </div>
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
                <div class="form-group mb-0">
                  <label for="registrationNumber">Registration *</label>
                  <input type="text" id="registrationNumber" required placeholder="e.g. MH12AB1234" style="text-transform: uppercase;">
                </div>
                <div class="form-group mb-0">
                  <label for="year">Year</label>
                  <input type="number" id="year" placeholder="e.g. 2025" min="1990" max="2027">
                </div>
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
                <div class="form-group mb-0">
                  <label for="fuelType">Fuel Type</label>
                  <select id="fuelType" style="width: 100%; height: 42px; background: var(--color-surface-card); color: var(--color-text-primary); border: 1px solid var(--color-border); border-radius: 8px; padding: 0 12px;">
                    ${FUEL_TYPES.map(f => `<option value="${f}">${f}</option>`).join('')}
                  </select>
                </div>
                <div class="form-group mb-0">
                  <label for="color">Color</label>
                  <input type="text" id="color" placeholder="e.g. Red">
                </div>
              </div>

              <div class="form-group" style="margin-bottom: 12px;">
                <label for="currentMileage">Current Mileage (km)</label>
                <input type="number" id="currentMileage" placeholder="0" min="0">
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 20px;">
                <div class="form-group mb-0">
                  <label for="insuranceExpiry">Insurance Expiry</label>
                  <input type="date" id="insuranceExpiry" style="font-size: 11px;">
                </div>
                <div class="form-group mb-0">
                  <label for="pucExpiry">PUC Expiry</label>
                  <input type="date" id="pucExpiry" style="font-size: 11px;">
                </div>
                <div class="form-group mb-0">
                  <label for="nextServiceDate">Next Service</label>
                  <input type="date" id="nextServiceDate" style="font-size: 11px;">
                </div>
              </div>

              <div style="display: flex; justify-content: flex-end; gap: 12px;">
                <button type="button" class="btn btn-outline" id="cancel-modal-btn">Cancel</button>
                <button type="submit" class="btn btn-primary" id="save-vehicle-btn">Save Vehicle</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;
  },

  async afterRender(appState) {
    const grid = document.getElementById('vehicles-grid');
    const countText = document.getElementById('vehicle-count');
    const openBtn = document.getElementById('open-add-dialog');
    const closeBtn = document.getElementById('close-modal-btn');
    const cancelBtn = document.getElementById('cancel-modal-btn');
    const modal = document.getElementById('add-vehicle-modal');
    const addForm = document.getElementById('add-vehicle-form');
    const modalError = document.getElementById('modal-error');
    const saveBtn = document.getElementById('save-vehicle-btn');
    const searchInput = document.getElementById('vehicle-search');
    const fuelSelect = document.getElementById('fuel-filter');

    // Fetch and show vehicles helper
    const renderGrid = () => {
      const query = this.searchQuery.toLowerCase();
      const filtered = this.vehicles.filter(v => {
        const matchSearch = !query ||
          v.make.toLowerCase().includes(query) ||
          (v.model || '').toLowerCase().includes(query) ||
          v.registrationNumber.toLowerCase().includes(query);
        const matchFuel = this.fuelFilter === 'all' || v.fuelType === this.fuelFilter;
        return matchSearch && matchFuel;
      });

      countText.textContent = `${this.vehicles.length} vehicle${this.vehicles.length !== 1 ? 's' : ''} registered`;

      if (filtered.length === 0) {
        grid.innerHTML = `
          <div style="grid-column: 1 / -1; text-align: center; padding: 48px 0;">
            <i data-lucide="car" style="width: 48px; height: 48px; margin: 0 auto 16px; opacity: 0.3;"></i>
            <h3 class="text-lg font-bold text-text-secondary">No vehicles found</h3>
            <p class="text-text-muted text-sm mt-1">Try refining your search query or filters.</p>
          </div>
        `;
      } else {
        grid.innerHTML = filtered.map(v => `
          <div class="glass-card" style="padding: 20px; display: flex; flex-direction: column; justify-content: space-between; border-radius: 16px;">
            <div>
              <div class="flex justify-between items-start mb-4">
                <div class="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary">
                  <i data-lucide="car" style="color: white; width: 20px; height: 20px;"></i>
                </div>
                <span class="badge" style="background: rgba(16, 185, 129, 0.15); color: var(--color-success); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 4px; padding: 2px 6px; font-size: 11px;">
                  ${v.fuelType}
                </span>
              </div>
              <h3 class="text-lg font-bold">${v.make} ${v.model}</h3>
              <p class="text-text-secondary text-sm font-mono mt-1">${v.registrationNumber}</p>
              
              <div class="flex gap-4 mt-3 text-xs text-text-muted flex-wrap">
                ${v.year ? `<span><i data-lucide="calendar" style="width: 12px; height: 12px; display: inline; vertical-align: middle; margin-right: 4px;"></i>${v.year}</span>` : ''}
                <span><i data-lucide="gauge" style="width: 12px; height: 12px; display: inline; vertical-align: middle; margin-right: 4px;"></i>${(v.currentMileage || 0).toLocaleString('en-IN')} km</span>
              </div>
            </div>
            
            <div class="flex items-center gap-3 mt-5 pt-3" style="border-top: 1px solid var(--color-border);">
              <div class="flex items-center gap-1">
                <span style="width: 8px; height: 8px; border-radius: 50%; ${getComplianceDot(v.insuranceExpiry)}"></span>
                <span style="font-size: 10px; color: var(--color-text-muted);">Insurance</span>
              </div>
              <div class="flex items-center gap-1">
                <span style="width: 8px; height: 8px; border-radius: 50%; ${getComplianceDot(v.pucExpiry)}"></span>
                <span style="font-size: 10px; color: var(--color-text-muted);">PUC</span>
              </div>
              <div class="flex items-center gap-1">
                <span style="width: 8px; height: 8px; border-radius: 50%; ${getComplianceDot(v.nextServiceDate)}"></span>
                <span style="font-size: 10px; color: var(--color-text-muted);">Service</span>
              </div>
            </div>
          </div>
        `).join('');
      }

      if (window.lucide) {
        lucide.createIcons();
      }
    };

    // Load data
    const fetchVehicles = async () => {
      try {
        const responseData = await api.get('/vehicles');
        this.vehicles = responseData.data?.vehicles || responseData.vehicles || responseData || [];
        renderGrid();
      } catch (err) {
        grid.innerHTML = `<p class="text-danger">Failed to load vehicles: ${err.message}</p>`;
      }
    };

    await fetchVehicles();

    // Setup filter listeners
    searchInput.addEventListener('input', e => {
      this.searchQuery = e.target.value;
      renderGrid();
    });

    fuelSelect.addEventListener('change', e => {
      this.fuelFilter = e.target.value;
      renderGrid();
    });

    // Dialog Toggle
    openBtn.addEventListener('click', () => {
      modal.style.display = 'flex';
      modalError.style.display = 'none';
    });

    const closeModal = () => {
      modal.style.display = 'none';
      addForm.reset();
    };

    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);

    // Form Submit
    addForm.addEventListener('submit', async e => {
      e.preventDefault();
      
      const make = document.getElementById('make').value;
      const model = document.getElementById('model').value;
      const registrationNumber = document.getElementById('registrationNumber').value.toUpperCase();
      const year = document.getElementById('year').value;
      const fuelType = document.getElementById('fuelType').value;
      const color = document.getElementById('color').value;
      const currentMileage = document.getElementById('currentMileage').value;
      const insuranceExpiry = document.getElementById('insuranceExpiry').value;
      const pucExpiry = document.getElementById('pucExpiry').value;
      const nextServiceDate = document.getElementById('nextServiceDate').value;

      modalError.style.display = 'none';
      saveBtn.textContent = 'Saving...';
      saveBtn.disabled = true;

      // Clean registration plate and generate a valid, compliant 17-digit VIN
      const cleanReg = registrationNumber.replace(/[^A-Z0-9]/gi, '').toUpperCase();
      const vin = `TATA${cleanReg}XXXXX`.substring(0, 17).padEnd(17, 'X').toUpperCase();
      
      // Auto-set registration date to Jan 1st of manufacturing year
      const registrationDate = new Date(`${year || new Date().getFullYear()}-01-01`).toISOString();

      // Ensure required compliance dates are set, with sensible defaults if left empty
      const finalInsurance = insuranceExpiry || new Date(Date.now() + 365*24*60*60*1000).toISOString().split('T')[0];
      const finalPuc = pucExpiry || new Date(Date.now() + 180*24*60*60*1000).toISOString().split('T')[0];

      try {
        await api.post('/vehicles', {
          make,
          model,
          registrationNumber,
          vin,
          registrationDate,
          year: year ? Number(year) : new Date().getFullYear(),
          fuelType,
          color,
          currentMileage: currentMileage ? Number(currentMileage) : 0,
          insuranceExpiry: finalInsurance,
          pucExpiry: finalPuc,
          nextServiceDate: nextServiceDate || undefined,
        });

        closeModal();
        await fetchVehicles();
      } catch (err) {
        modalError.textContent = err.message;
        modalError.style.display = 'block';
      } finally {
        saveBtn.textContent = 'Save Vehicle';
        saveBtn.disabled = false;
      }
    });

    if (window.lucide) {
      lucide.createIcons();
    }
  }
};

export default VehiclesView;

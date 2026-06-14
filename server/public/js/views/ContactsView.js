import { api } from '../api.js';

const RELATIONSHIP_TYPES = ['Family', 'Fleet Manager', 'Roadside Assistance', 'Mechanic', 'Insurance Agent', 'Other'];

const ContactsView = {
  contacts: [],

  render() {
    return `
      <div class="page-enter" id="contacts-page">
        <!-- Header -->
        <div class="flex justify-between items-center mb-6">
          <div>
            <h1 class="text-2xl font-bold">Emergency Contacts</h1>
            <p class="text-text-secondary text-sm" id="contacts-count">Loading contacts...</p>
          </div>
          <button class="btn btn-primary" id="open-contact-dialog">
            <i data-lucide="user-plus"></i> Add Contact
          </button>
        </div>

        <!-- Contacts Grid -->
        <div class="stagger-children" id="contacts-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px;">
          Loading emergency contacts...
        </div>

        <!-- Add Contact Dialog Modal -->
        <div id="add-contact-modal" class="modal-overlay" style="display: none; position: fixed; inset: 0; background: rgba(15, 23, 42, 0.8); backdrop-filter: blur(8px); z-index: 1000; justify-content: center; align-items: center; padding: 20px;">
          <div class="glass-card" style="width: 100%; max-width: 500px; padding: 24px; position: relative;">
            <button id="close-modal-btn" style="position: absolute; right: 20px; top: 20px; background: transparent; border: none; color: var(--color-text-muted); cursor: pointer;">
              <i data-lucide="x"></i>
            </button>
            
            <h2 class="text-xl font-bold mb-2">Add Emergency Contact</h2>
            <p class="text-text-secondary text-sm mb-4">Add emergency contacts to ensure they receive immediate distress alerts.</p>
            
            <div id="modal-error" class="error-message mb-4" style="display: none;"></div>

            <form id="add-contact-form">
              <div class="form-group">
                <label for="c-name">Full Name *</label>
                <input type="text" id="c-name" required placeholder="e.g. Rahul Sharma">
              </div>

              <div class="form-group">
                <label for="c-phone">Phone Number (10 digits) *</label>
                <div style="display: flex; gap: 8px;">
                  <span class="btn btn-outline" style="padding: 10px; cursor: default; background: rgba(30, 41, 59, 0.4);">+91</span>
                  <input type="tel" id="c-phone" required placeholder="9876543210" style="flex: 1;" maxlength="10">
                </div>
              </div>

              <div class="form-group">
                <label for="c-relationship">Relationship</label>
                <select id="c-relationship" style="width: 100%; height: 42px; background: var(--color-surface-card); color: var(--color-text-primary); border: 1px solid var(--color-border); border-radius: 8px; padding: 0 12px; margin-bottom: 12px;">
                  ${RELATIONSHIP_TYPES.map(r => `<option value="${r}">${r}</option>`).join('')}
                </select>
              </div>

              <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px; background: rgba(15, 23, 42, 0.4); padding: 12px; border-radius: 8px; border: 1px solid var(--color-border);">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <div>
                    <span style="font-weight: bold; color: var(--color-danger); font-size: 14px;">SOS Alerts</span>
                    <p style="font-size: 11px; color: var(--color-text-muted); margin-top: 2px;">Receive automated WhatsApp distress messages</p>
                  </div>
                  <input type="checkbox" id="c-sos" checked style="width: 20px; height: 20px; cursor: pointer;">
                </div>
                
                <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--color-border); padding-top: 12px;">
                  <div>
                    <span style="font-weight: bold; color: var(--color-success); font-size: 14px;">WhatsApp Active</span>
                    <p style="font-size: 11px; color: var(--color-text-muted); margin-top: 2px;">Check if WhatsApp is active on this phone number</p>
                  </div>
                  <input type="checkbox" id="c-whatsapp" checked style="width: 20px; height: 20px; cursor: pointer;">
                </div>
              </div>

              <div style="display: flex; justify-content: flex-end; gap: 12px;">
                <button type="button" class="btn btn-outline" id="cancel-modal-btn">Cancel</button>
                <button type="submit" class="btn btn-primary" id="save-contact-btn">Save Contact</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;
  },

  async afterRender(appState) {
    const grid = document.getElementById('contacts-grid');
    const countText = document.getElementById('contacts-count');
    const openBtn = document.getElementById('open-contact-dialog');
    const closeBtn = document.getElementById('close-modal-btn');
    const cancelBtn = document.getElementById('cancel-modal-btn');
    const modal = document.getElementById('add-contact-modal');
    const addForm = document.getElementById('add-contact-form');
    const modalError = document.getElementById('modal-error');
    const saveBtn = document.getElementById('save-contact-btn');

    const renderGrid = () => {
      countText.textContent = `${this.contacts.length} emergency contact${this.contacts.length !== 1 ? 's' : ''} saved`;

      if (this.contacts.length === 0) {
        grid.innerHTML = `
          <div style="grid-column: 1 / -1; text-align: center; padding: 48px 0;">
            <i data-lucide="user-plus" style="width: 48px; height: 48px; margin: 0 auto 16px; opacity: 0.3;"></i>
            <h3 class="text-lg font-bold text-text-secondary">No emergency contacts</h3>
            <p class="text-text-muted text-sm mt-1">Add your trusted contacts to receive location updates in an emergency.</p>
          </div>
        `;
      } else {
        grid.innerHTML = this.contacts.map(c => `
          <div class="glass-card" style="padding: 20px; display: flex; flex-direction: column; justify-content: space-between; border-radius: 16px;">
            <div>
              <div class="flex justify-between items-start mb-4">
                <div>
                  <h3 class="text-lg font-bold">${c.name}</h3>
                  <span class="badge" style="background: rgba(255, 255, 255, 0.08); border: 1px solid var(--color-border); border-radius: 4px; padding: 2px 6px; font-size: 11px; display: inline-block; margin-top: 4px;">
                    ${c.relationship}
                  </span>
                </div>
                ${c.isSosContact ? `
                  <span class="badge" style="background: rgba(239, 68, 68, 0.15); color: var(--color-danger); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 4px; padding: 2px 6px; font-size: 11px; display: flex; align-items: center; gap: 4px; animation: pulse 2s infinite;">
                    <i data-lucide="alert-triangle" style="width: 12px; height: 12px;"></i> SOS Active
                  </span>
                ` : ''}
              </div>
              
              <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 12px;">
                <div style="display: flex; align-items: center; gap: 8px; font-size: 14px; color: var(--color-text-secondary);">
                  <i data-lucide="phone" style="width: 14px; height: 14px;"></i>
                  <span class="font-mono">${c.phone}</span>
                </div>
                ${c.whatsappEnabled ? `
                  <div style="display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--color-success);">
                    <i data-lucide="message-square" style="width: 14px; height: 14px;"></i>
                    <span>WhatsApp Enabled</span>
                  </div>
                ` : ''}
              </div>
            </div>
            
            <div style="display: flex; justify-content: flex-end; border-top: 1px solid var(--color-border); margin-top: 20px; padding-top: 12px;">
              <button class="btn btn-outline btn-sm delete-btn" data-id="${c._id}" style="color: var(--color-danger); border-color: rgba(239, 68, 68, 0.3); background: transparent;">
                <i data-lucide="trash-2" style="width: 12px; height: 12px; display: inline; margin-right: 4px; vertical-align: middle;"></i> Delete
              </button>
            </div>
          </div>
        `).join('');

        // Attach delete listeners
        grid.querySelectorAll('.delete-btn').forEach(btn => {
          btn.addEventListener('click', async e => {
            const id = btn.getAttribute('data-id');
            if (confirm('Are you sure you want to remove this emergency contact?')) {
              try {
                await api.request(`/contacts/${id}`, { method: 'DELETE' });
                await fetchContacts();
              } catch (err) {
                alert(`Error deleting contact: ${err.message}`);
              }
            }
          });
        });
      }

      if (window.lucide) {
        lucide.createIcons();
      }
    };

    // Fetch and load contacts
    const fetchContacts = async () => {
      try {
        const responseData = await api.get('/contacts');
        this.contacts = responseData.data?.contacts || responseData.contacts || responseData || [];
        renderGrid();
      } catch (err) {
        grid.innerHTML = `<p class="text-danger">Failed to load contacts: ${err.message}</p>`;
      }
    };

    await fetchContacts();

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

    // Add Form Submit
    addForm.addEventListener('submit', async e => {
      e.preventDefault();

      const name = document.getElementById('c-name').value;
      const phone = document.getElementById('c-phone').value;
      const relationship = document.getElementById('c-relationship').value;
      const isSosContact = document.getElementById('c-sos').checked;
      const whatsappEnabled = document.getElementById('c-whatsapp').checked;

      if (!/^[6-9]\d{9}$/.test(phone)) {
        modalError.textContent = 'Enter a valid 10-digit Indian mobile number';
        modalError.style.display = 'block';
        return;
      }

      modalError.style.display = 'none';
      saveBtn.textContent = 'Saving...';
      saveBtn.disabled = true;

      try {
        await api.post('/contacts', {
          name,
          phone: `+91${phone}`,
          relationship,
          isSosContact,
          whatsappEnabled
        });
        
        closeModal();
        await fetchContacts();
      } catch (err) {
        modalError.textContent = err.message;
        modalError.style.display = 'block';
      } finally {
        saveBtn.textContent = 'Save Contact';
        saveBtn.disabled = false;
      }
    });

    if (window.lucide) {
      lucide.createIcons();
    }
  }
};

export default ContactsView;

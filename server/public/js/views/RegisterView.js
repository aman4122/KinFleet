import { authService } from '../api.js';

const RegisterView = {
  render() {
    return `
      <div class="auth-container page-enter">
        <div class="auth-box glass-card">
          <div class="text-center mb-6">
            <h1 class="gradient-text">Create Account</h1>
            <p class="text-text-secondary">Join VahanTrack today</p>
          </div>
          
          <div id="register-error" class="error-message" style="display: none;"></div>
          
          <form id="register-form">
            <div class="form-group">
              <label for="name">Full Name</label>
              <input type="text" id="name" required placeholder="Rahul Sharma">
            </div>
            
            <div class="form-group">
              <label for="email">Email Address</label>
              <input type="email" id="email" required placeholder="rahul@example.com">
            </div>
            
            <div class="form-group">
              <label for="phone">Phone Number</label>
              <div style="display: flex; gap: 8px;">
                <span class="btn btn-outline" style="padding: 10px; cursor: default; background: rgba(30, 41, 59, 0.4);">+91</span>
                <input type="tel" id="phone" required placeholder="9876543210" style="flex: 1;" maxlength="10">
              </div>
            </div>
            
            <div class="form-group">
              <label for="password">Password</label>
              <input type="password" id="password" required placeholder="••••••••">
            </div>
            
            <div class="form-group mb-6">
              <label for="confirmPassword">Confirm Password</label>
              <input type="password" id="confirmPassword" required placeholder="••••••••">
            </div>
            
            <button type="submit" class="btn btn-primary w-full" id="submit-btn">
              Create Account
            </button>
          </form>
          
          <div class="text-center mt-4">
            <p class="text-text-secondary text-sm">
              Already have an account? <a href="/login" data-link class="text-primary hover:underline">Sign In</a>
            </p>
          </div>
        </div>
      </div>
    `;
  },
  
  afterRender(appState) {
    const form = document.getElementById('register-form');
    const errorDiv = document.getElementById('register-error');
    const submitBtn = document.getElementById('submit-btn');
    
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const name = document.getElementById('name').value;
      const email = document.getElementById('email').value;
      const phone = document.getElementById('phone').value;
      const password = document.getElementById('password').value;
      const confirmPassword = document.getElementById('confirmPassword').value;
      
      errorDiv.style.display = 'none';
      
      if (!/^[6-9]\d{9}$/.test(phone)) {
        errorDiv.textContent = 'Enter a valid 10-digit Indian mobile number';
        errorDiv.style.display = 'block';
        return;
      }
      
      if (password.length < 6) {
        errorDiv.textContent = 'Password must be at least 6 characters long';
        errorDiv.style.display = 'block';
        return;
      }
      
      if (password !== confirmPassword) {
        errorDiv.textContent = 'Passwords do not match';
        errorDiv.style.display = 'block';
        return;
      }
      
      submitBtn.textContent = 'Creating Account...';
      submitBtn.disabled = true;
      
      try {
        const response = await authService.register(name, email, `+91${phone}`, password);
        appState.user = response.data?.user || response.user;
        window.navigateTo('/');
      } catch (err) {
        errorDiv.textContent = err.message;
        errorDiv.style.display = 'block';
        submitBtn.textContent = 'Create Account';
        submitBtn.disabled = false;
      }
    });
  }
};

export default RegisterView;

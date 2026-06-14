import { authService } from '../api.js';

const LoginView = {
  render() {
    return `
      <div class="auth-container page-enter">
        <div class="auth-box glass-card">
          <div class="text-center mb-6">
            <h1 class="gradient-text">VahanTrack</h1>
            <p class="text-text-secondary">Sign in to manage your vehicles</p>
          </div>
          
          <div id="login-error" class="error-message"></div>
          
          <form id="login-form">
            <div class="form-group">
              <label for="email">Email</label>
              <input type="email" id="email" required placeholder="you@example.com">
            </div>
            
            <div class="form-group mb-6">
              <label for="password">Password</label>
              <input type="password" id="password" required placeholder="••••••••">
            </div>
            
            <button type="submit" class="btn btn-primary w-full" id="submit-btn">
              Sign In
            </button>
          </form>
          <div class="text-center mt-4">
            <p class="text-text-secondary text-sm">
              Don't have an account? <a href="/register" data-link class="text-primary hover:underline">Register</a>
            </p>
          </div>
        </div>
      </div>
    `;
  },
  
  afterRender(appState) {
    const form = document.getElementById('login-form');
    const errorDiv = document.getElementById('login-error');
    const submitBtn = document.getElementById('submit-btn');
    
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      
      errorDiv.style.display = 'none';
      submitBtn.textContent = 'Signing in...';
      submitBtn.disabled = true;
      
      try {
        const response = await authService.login(email, password);
        appState.user = response.data?.user || response.user;
        window.navigateTo('/');
      } catch (err) {
        errorDiv.textContent = err.message;
        errorDiv.style.display = 'block';
        submitBtn.textContent = 'Sign In';
        submitBtn.disabled = false;
      }
    });
  }
};

export default LoginView;

<script lang="ts">
  import { enhance } from '$app/forms';
  let { form } = $props();
</script>

<div class="login-container glass-panel">
  <div class="login-header">
    <h2>Welcome Back</h2>
    <p>Sign in to access Patronage</p>
  </div>

  <form method="POST" action="?/login" use:enhance class="login-form">
    {#if form?.incorrect}
      <div class="error-msg">Invalid login or password.</div>
    {/if}
    {#if form?.missing}
      <div class="error-msg">Login and password are required.</div>
    {/if}

    <div class="form-group">
      <label class="form-label" for="email">Login</label>
      <input 
        class="input-field" 
        type="text" 
        id="email" 
        name="email" 
        value={form?.email ?? ''}
        placeholder="Enter your login" 
        required 
      />
    </div>

    <div class="form-group">
      <label class="form-label" for="password">Password</label>
      <input 
        class="input-field" 
        type="password" 
        id="password" 
        name="password" 
        placeholder="••••••••" 
        required 
      />
    </div>

    <button type="submit" class="btn btn-primary login-btn">
      Sign In
    </button>
  </form>
</div>

<style>
  .login-container {
    width: 100%;
    max-width: 400px;
    padding: 2.5rem;
  }

  .login-header {
    text-align: center;
    margin-bottom: 2rem;
  }

  .login-header h2 {
    font-size: 1.8rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
  }

  .login-header p {
    color: var(--text-secondary);
  }

  .login-form {
    display: flex;
    flex-direction: column;
  }

  .error-msg {
    background: rgba(239, 68, 68, 0.1);
    color: var(--danger-color);
    padding: 0.75rem;
    border-radius: var(--radius-sm);
    margin-bottom: 1.5rem;
    font-size: 0.9rem;
    text-align: center;
    border: 1px solid rgba(239, 68, 68, 0.2);
  }

  .login-btn {
    margin-top: 1rem;
    width: 100%;
    padding: 0.85rem;
  }
</style>

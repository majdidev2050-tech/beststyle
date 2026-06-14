<script lang="ts">
  import '../app.css';
  import { page } from '$app/stores';
  
  let { children, data } = $props();
  
  // Exclude sidebar on login page
  let isAuthPage = $derived($page.url.pathname === '/login');
  // Client portal : layout minimal dédié (aussi pour l'espace client user)
  let isClientPortal = $derived(
    $page.url.pathname.startsWith('/client-portal') ||
    $page.url.pathname.startsWith('/projects/list_project_cl')
  );

  let isClient = $derived(!!data.client && !data.user);
</script>

<svelte:head>
  <title>Patronage | Modern Project Management</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
</svelte:head>

{#if isAuthPage}
  <main class="auth-layout">
    {@render children()}
  </main>

{:else if isClientPortal || isClient}
  <!-- Layout minimal pour les clients connectés -->
  <div class="client-layout">
    <header class="client-header glass-panel">
      <div class="client-header-inner">
        <div class="logo">
          <span class="logo-icon">✨</span>
          <h2>Patronage</h2>
          <span class="client-badge">Espace Client</span>
        </div>
        <div class="client-info">
          {#if data.client}
            <span class="client-name">{data.client.companyName}</span>
          {:else if data.user}
            <span class="client-name">{data.user.firstName} {data.user.lastName}</span>
          {/if}
          <form method="POST" action="/login?/logout" style="display:inline;">
            <button class="btn-logout">Se déconnecter</button>
          </form>
        </div>
      </div>
    </header>
    <main class="client-main">
      {@render children()}
    </main>
  </div>

{:else}
  <!-- Layout admin normal avec sidebar -->
  <div class="app-layout">
    <aside class="sidebar glass-panel">
      <div class="sidebar-header">
        <div class="logo">
          <span class="logo-icon">✨</span>
          <h2>Patronage</h2>
        </div>
      </div>
      
      <nav class="sidebar-nav">
        <a href="/" class="nav-item" class:active={$page.url.pathname === '/'}>
          Dashboard
        </a>
        <a href={data.user?.role === 'CLIENT' ? '/projects/list_project_cl' : '/projects'} class="nav-item" class:active={$page.url.pathname.startsWith('/projects')}>
          Projets
        </a>
        <a href="/clients" class="nav-item" class:active={$page.url.pathname.startsWith('/clients')}>
          Clients
        </a>
        <a href="/payments" class="nav-item" class:active={$page.url.pathname.startsWith('/payments')}>
          Paiements
        </a>
        <a href="/users" class="nav-item" class:active={$page.url.pathname.startsWith('/users')}>
          Équipe
        </a>
        <a href="/photos" class="nav-item" class:active={$page.url.pathname.startsWith('/photos')}>
          Photos
        </a>
      </nav>
      
      <div class="sidebar-footer">
        <form method="POST" action="/login?/logout">
          <button class="nav-item logout-btn">Se déconnecter</button>
        </form>
      </div>
    </aside>
    
    <main class="main-content">
      {@render children()}
    </main>
  </div>
{/if}

<style>
  /* ── Admin Layout ─────────────────────────────── */
  .app-layout {
    display: flex;
    min-height: 100vh;
  }
  
  .auth-layout {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: radial-gradient(circle at top right, #1e1b4b, var(--bg-primary));
  }

  .sidebar {
    width: 260px;
    margin: 1rem;
    display: flex;
    flex-direction: column;
    padding: 1.5rem;
    position: sticky;
    top: 1rem;
    height: calc(100vh - 2rem);
  }

  .sidebar-header {
    margin-bottom: 2.5rem;
  }

  .logo {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  
  .logo h2 {
    font-size: 1.25rem;
    font-weight: 700;
    letter-spacing: -0.02em;
  }

  .sidebar-nav {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    flex: 1;
  }

  .nav-item {
    padding: 0.8rem 1rem;
    border-radius: var(--radius-sm);
    color: var(--text-secondary);
    font-weight: 500;
    transition: all var(--transition);
    display: block;
    width: 100%;
    text-align: left;
    background: transparent;
    border: none;
    cursor: pointer;
    font-size: 1rem;
  }

  .nav-item:hover, .nav-item.active {
    background: rgba(255, 255, 255, 0.05);
    color: var(--text-primary);
  }

  .nav-item.active {
    position: relative;
  }

  .nav-item.active::before {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    height: 60%;
    width: 3px;
    background: var(--accent-color);
    border-radius: 0 4px 4px 0;
    box-shadow: 0 0 10px var(--accent-glow);
  }

  .main-content {
    flex: 1;
    padding: 2rem 3rem;
    max-width: 1200px;
  }
  
  .logout-btn {
    color: var(--danger-color);
  }
  
  .logout-btn:hover {
    background: rgba(239, 68, 68, 0.1);
    color: #f87171;
  }

  /* ── Client Layout ────────────────────────────── */
  .client-layout {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background: var(--bg-primary);
  }

  .client-header {
    margin: 1rem 1rem 0;
    border-radius: var(--radius);
    padding: 1rem 2rem;
    position: sticky;
    top: 1rem;
    z-index: 100;
  }

  .client-header-inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .client-badge {
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    background: rgba(99, 102, 241, 0.15);
    color: var(--accent-color);
    border: 1px solid rgba(99, 102, 241, 0.25);
    padding: 0.2rem 0.6rem;
    border-radius: 100px;
    margin-left: 0.25rem;
  }

  .client-info {
    display: flex;
    align-items: center;
    gap: 1.25rem;
  }

  .client-name {
    font-weight: 600;
    font-size: 0.95rem;
    color: var(--text-primary);
  }

  .btn-logout {
    background: transparent;
    border: 1px solid var(--border-color);
    color: var(--text-secondary);
    padding: 0.45rem 1rem;
    border-radius: var(--radius-sm);
    font-size: 0.85rem;
    cursor: pointer;
    transition: all var(--transition);
    font-family: var(--font-main);
  }

  .btn-logout:hover {
    background: rgba(239, 68, 68, 0.08);
    border-color: var(--danger-color);
    color: #f87171;
  }

  .client-main {
    flex: 1;
    padding: 2rem 2.5rem;
    max-width: 1100px;
    width: 100%;
    margin: 0 auto;
  }

  @media (max-width: 768px) {
    .client-header {
      margin: 0.5rem 0.5rem 0;
      padding: 0.75rem 1rem;
    }
    .client-main {
      padding: 1.25rem 1rem;
    }
    .client-badge {
      display: none;
    }
  }
</style>

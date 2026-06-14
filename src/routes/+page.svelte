<script lang="ts">
  let { data } = $props();
</script>

<div class="dashboard">
  <h1 class="page-title">Tableau de bord</h1>
  
  <div class="welcome-banner glass-panel">
    <div class="welcome-content">
      <h2>Bienvenue, {data.user?.firstName} ! 👋</h2>
      <p>Voici ce qui se passe avec vos projets aujourd'hui.</p>
    </div>
  </div>

  <div class="stats-grid">
    <div class="stat-card glass-panel">
      <h3>Projets actifs</h3>
      <div class="stat-value">{data.stats?.activeProjects ?? 0}</div>
    </div>
    <div class="stat-card glass-panel">
      <h3>Paiements en attente</h3>
      <div class="stat-value">{data.stats?.pendingPayments ?? 0}</div>
    </div>
    <div class="stat-card glass-panel">
      <h3>Total clients</h3>
      <div class="stat-value">{data.stats?.totalClients ?? 0}</div>
    </div>
  </div>
</div>

<style>
  .dashboard {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .welcome-banner {
    padding: 2rem;
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(15, 17, 26, 0));
    border-left: 4px solid var(--accent-color);
  }

  .welcome-banner h2 {
    font-size: 1.5rem;
    margin-bottom: 0.5rem;
  }

  .welcome-banner p {
    color: var(--text-secondary);
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
  }

  .stat-card {
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .stat-card h3 {
    font-size: 1rem;
    color: var(--text-secondary);
    font-weight: 500;
  }

  .stat-value {
    font-size: 2.5rem;
    font-weight: 700;
    color: var(--text-primary);
  }
</style>

<script lang="ts">
  let { data } = $props();
  const client = $derived(data.client);
  const projects = $derived(data.projects);
</script>

<svelte:head>
  <title>Mon Espace Client | {client?.companyName ?? ''}</title>
</svelte:head>

<div class="portal-header">
  <div class="welcome-block">
    <div class="avatar-circle">
      {(client?.companyName ?? 'C')[0].toUpperCase()}
    </div>
    <div>
      <h1 class="page-title">Bienvenue, {client?.companyName}</h1>
      <p class="text-secondary">Voici l'état de vos projets en cours.</p>
    </div>
  </div>
  <form method="POST" action="/login?/logout">
    <button class="btn btn-secondary logout-btn">Se déconnecter</button>
  </form>
</div>

<div class="stats-row">
  <div class="stat-card glass-panel">
    <span class="stat-value">{projects.length}</span>
    <span class="stat-label">Projets au total</span>
  </div>
  <div class="stat-card glass-panel">
    <span class="stat-value">{projects.filter(p => p.statusProject === 'ACTIVE').length}</span>
    <span class="stat-label">Projets actifs</span>
  </div>
  <div class="stat-card glass-panel">
    <span class="stat-value">{projects.filter(p => p.statusProject === 'COMPLETED').length}</span>
    <span class="stat-label">Terminés</span>
  </div>
</div>

{#if projects.length === 0}
  <div class="empty-state glass-panel">
    <div class="empty-icon">📂</div>
    <h2>Aucun projet pour le moment</h2>
    <p class="text-secondary">Vos projets apparaîtront ici dès qu'ils seront créés.</p>
  </div>
{:else}
  <div class="projects-grid">
    {#each projects as project}
      <div class="project-card glass-panel">
        <div class="card-header">
          <div class="card-title-row">
            <h3 class="project-name">{project.projectName}</h3>
            <span class="badge badge-status-{project.statusProject.toLowerCase()}">{project.statusProject}</span>
          </div>
          {#if project.description}
            <p class="project-desc text-secondary">{project.description}</p>
          {/if}
        </div>

        <div class="progress-section">
          <div class="progress-label">
            <span>Avancement</span>
            <strong>{project.progressPercentage}%</strong>
          </div>
          <div class="progress-bar-wrapper">
            <div class="progress-bar" style="width: {project.progressPercentage}%"></div>
          </div>
        </div>

        <div class="card-meta">
          <div class="meta-item">
            <span class="meta-label">Priorité</span>
            <span class="badge badge-priority-{project.priority.toLowerCase()}">{project.priority}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Budget</span>
            <span class="meta-value">{(Number(project.budgetAmount) || 0).toFixed(3)} DT</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Dépensé</span>
            <span class="meta-value">{(Number(project.spentAmount) || 0).toFixed(3)} DT</span>
          </div>
        </div>

        {#if project.startDate || project.dueDate}
          <div class="card-dates">
            <span class="date-item">📅 Début : {project.startDate ?? '—'}</span>
            <span class="date-item">🏁 Fin prévue : {project.dueDate ?? '—'}</span>
          </div>
        {/if}
      </div>
    {/each}
  </div>
{/if}

<style>
  .portal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2.5rem;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .welcome-block {
    display: flex;
    align-items: center;
    gap: 1.25rem;
  }

  .avatar-circle {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--accent-color), #7c3aed);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    font-weight: 700;
    color: white;
    box-shadow: 0 0 20px var(--accent-glow);
    flex-shrink: 0;
  }

  .logout-btn {
    font-size: 0.9rem;
    padding: 0.5rem 1.25rem;
  }

  /* Stats Row */
  .stats-row {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1.25rem;
    margin-bottom: 2.5rem;
  }

  .stat-card {
    padding: 1.5rem 2rem;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    border-radius: var(--radius);
  }

  .stat-value {
    font-size: 2.5rem;
    font-weight: 700;
    color: var(--accent-color);
    line-height: 1;
  }

  .stat-label {
    font-size: 0.85rem;
    color: var(--text-secondary);
    font-weight: 500;
  }

  /* Projects Grid */
  .projects-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
    gap: 1.5rem;
  }

  .project-card {
    padding: 1.75rem;
    border-radius: var(--radius);
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }

  .project-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 32px rgba(99, 102, 241, 0.1);
  }

  .card-header {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .card-title-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .project-name {
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0;
  }

  .project-desc {
    font-size: 0.875rem;
    line-height: 1.5;
    margin: 0;
  }

  /* Progress */
  .progress-section {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .progress-label {
    display: flex;
    justify-content: space-between;
    font-size: 0.85rem;
    color: var(--text-secondary);
  }

  .progress-label strong {
    color: var(--text-primary);
  }

  .progress-bar-wrapper {
    height: 8px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 100px;
    overflow: hidden;
  }

  .progress-bar {
    height: 100%;
    background: linear-gradient(90deg, var(--accent-color), #7c3aed);
    box-shadow: 0 0 8px var(--accent-glow);
    border-radius: 100px;
    transition: width 0.6s cubic-bezier(0.16, 1, 0.3, 1);
  }

  /* Meta */
  .card-meta {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.75rem;
    padding: 1rem;
    background: rgba(255, 255, 255, 0.02);
    border-radius: var(--radius-sm);
    border: 1px solid var(--border-color);
  }

  .meta-item {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .meta-label {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-secondary);
  }

  .meta-value {
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--text-primary);
  }

  /* Dates */
  .card-dates {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .date-item {
    font-size: 0.82rem;
    color: var(--text-secondary);
  }

  /* Badges */
  .badge {
    padding: 0.25rem 0.75rem;
    border-radius: 100px;
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 0.03em;
    display: inline-block;
    white-space: nowrap;
  }

  .badge-status-planning { background: rgba(99, 102, 241, 0.15); color: #a5b4fc; }
  .badge-status-active { background: rgba(16, 185, 129, 0.15); color: #6ee7b7; }
  .badge-status-on_hold { background: rgba(245, 158, 11, 0.15); color: #fcd34d; }
  .badge-status-completed { background: rgba(59, 130, 246, 0.15); color: #93c5fd; }
  .badge-status-cancelled { background: rgba(107, 114, 128, 0.15); color: #d1d5db; }

  .badge-priority-low { background: rgba(156, 163, 175, 0.15); color: #e5e7eb; }
  .badge-priority-medium { background: rgba(59, 130, 246, 0.15); color: #93c5fd; }
  .badge-priority-high { background: rgba(245, 158, 11, 0.15); color: #fcd34d; }
  .badge-priority-urgent { background: rgba(239, 68, 68, 0.15); color: #fca5a5; }

  /* Empty State */
  .empty-state {
    padding: 4rem 2rem;
    text-align: center;
    border-radius: var(--radius);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }

  .empty-icon {
    font-size: 3rem;
  }

  .empty-state h2 {
    margin: 0;
    font-size: 1.4rem;
  }

  .text-secondary {
    color: var(--text-secondary);
    margin: 0;
  }

  @media (max-width: 768px) {
    .stats-row {
      grid-template-columns: 1fr;
    }
    .projects-grid {
      grid-template-columns: 1fr;
    }
    .card-meta {
      grid-template-columns: 1fr 1fr;
    }
  }
</style>

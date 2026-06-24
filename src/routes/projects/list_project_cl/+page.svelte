<script lang="ts">
  let { data } = $props();

  let showDetailModal = $state(false);
  let selectedProject = $state<any>(null);
  let filterStatus = $state('ALL');

  function openDetailModal(project: any) {
    selectedProject = project;
    showDetailModal = true;
  }

  const statusLabels: Record<string, string> = {
    NEW_PROJECT: 'Nouveau',
    IN_PROGRESS: 'En cours',
    PENDING_VALIDATION: 'À valider',
    READY_TO_PRINT: 'Prêt à imprimer',
    PRINTED: 'Imprimé',
    DELIVERED: 'Livré',
    PENDING_PAYMENT: 'En attente de paiement',
    CANCELLED: 'Annulé'
  };

  const priorityLabels: Record<string, string> = {
    LOW: 'Faible',
    MEDIUM: 'Moyen',
    HIGH: 'Élevé',
    URGENT: 'Urgent'
  };

  const filteredProjects = $derived(
    filterStatus === 'ALL'
      ? data.projects
      : data.projects.filter((p: any) => p.statusProject === filterStatus)
  );

  const stats = $derived({
    total: data.projects.length,
    active: data.projects.filter((p: any) => p.statusProject === 'IN_PROGRESS').length,
    completed: data.projects.filter((p: any) => p.statusProject === 'DELIVERED').length,
    planning: data.projects.filter((p: any) => p.statusProject === 'NEW_PROJECT').length,
  });
</script>

<svelte:head>
  <title>Mes Projets | Espace Client</title>
</svelte:head>

<!-- En-tête de page -->
<div class="page-hero">
  <div class="hero-content">
    <div class="hero-icon">📂</div>
    <div>
      <h1 class="hero-title">Mes Projets</h1>
      <p class="hero-subtitle">Consultez l'avancement et les détails de vos projets en lecture seule.</p>
    </div>
  </div>
  <div class="readonly-badge">
    <span class="lock-icon">🔒</span>
    Mode consultation
  </div>
</div>

<!-- Statistiques -->
<div class="stats-grid">
  <button class="stat-card glass-panel {filterStatus === 'ALL' ? 'stat-active' : ''}" onclick={() => filterStatus = 'ALL'}>
    <div class="stat-number">{stats.total}</div>
    <div class="stat-label">Total projets</div>
  </button>
  <button class="stat-card glass-panel {filterStatus === 'IN_PROGRESS' ? 'stat-active' : ''}" onclick={() => filterStatus = 'IN_PROGRESS'}>
    <div class="stat-number active-num">{stats.active}</div>
    <div class="stat-label">En cours</div>
  </button>
  <button class="stat-card glass-panel {filterStatus === 'NEW_PROJECT' ? 'stat-active' : ''}" onclick={() => filterStatus = 'NEW_PROJECT'}>
    <div class="stat-number plan-num">{stats.planning}</div>
    <div class="stat-label">Nouveau</div>
  </button>
  <button class="stat-card glass-panel {filterStatus === 'DELIVERED' ? 'stat-active' : ''}" onclick={() => filterStatus = 'DELIVERED'}>
    <div class="stat-number done-num">{stats.completed}</div>
    <div class="stat-label">Livrés</div>
  </button>
</div>

<!-- Liste des projets -->
{#if filteredProjects.length === 0}
  <div class="empty-state glass-panel">
    <div class="empty-icon">🔍</div>
    <h2>Aucun projet trouvé</h2>
    <p class="text-secondary">
      {filterStatus === 'ALL'
        ? "Aucun projet n'est associé à votre compte pour le moment."
        : `Aucun projet avec le statut "${statusLabels[filterStatus] ?? filterStatus}".`}
    </p>
    {#if filterStatus !== 'ALL'}
      <button class="btn btn-secondary" onclick={() => filterStatus = 'ALL'}>Voir tous les projets</button>
    {/if}
  </div>
{:else}
  <div class="projects-list">
    {#each filteredProjects as project}
      <div class="project-row glass-panel" role="button" tabindex="0"
           onclick={() => openDetailModal(project)}
           onkeydown={(e) => e.key === 'Enter' && openDetailModal(project)}>

        <!-- Indicateur de statut (barre latérale colorée) -->
        <div class="status-stripe status-{project.statusProject.toLowerCase()}"></div>

        <!-- Corps de la carte -->
        <div class="project-body">
          <div class="project-main">
            <div class="project-title-row">
              <h3 class="project-title">{project.projectName}</h3>
              <span class="badge badge-status-{project.statusProject.toLowerCase()}">
                {statusLabels[project.statusProject] ?? project.statusProject}
              </span>
            </div>
            <div class="project-meta-row">
              <span class="meta-chip">🏢 {project.clientCompanyName || project.companyName || '—'}</span>
              {#if project.reference}
                <span class="meta-chip">🔖 {project.reference}</span>
              {/if}
              <span class="meta-chip priority-{project.priority.toLowerCase()}">
                ⚡ {priorityLabels[project.priority] ?? project.priority}
              </span>
            </div>
            {#if project.description}
              <p class="project-desc">{project.description}</p>
            {/if}
          </div>

          <div class="project-right">
            <!-- Barre de progression -->
            <div class="progress-block">
              <div class="progress-header">
                <span class="progress-label-text">Avancement</span>
                <span class="progress-value">{project.progressPercentage}%</span>
              </div>
              <div class="progress-track">
                <div class="progress-fill" style="width: {project.progressPercentage}%"></div>
              </div>
            </div>

            <!-- Dates -->
            <div class="dates-block">
              {#if project.startDate}
                <span class="date-chip">📅 {project.startDate}</span>
              {/if}
              {#if project.dueDate}
                <span class="date-chip deadline">🏁 {project.dueDate}</span>
              {/if}
            </div>

            <button class="btn-detail" title="Voir les détails">
              Détails →
            </button>
          </div>
        </div>
      </div>
    {/each}
  </div>
{/if}

<!-- MODAL DÉTAILS (lecture seule) -->
{#if showDetailModal && selectedProject}
  <div class="modal-backdrop" role="dialog" aria-modal="true" aria-label="Détails du projet"
       tabindex="-1"
       onclick={(e) => { if ((e.target as Element).classList.contains('modal-backdrop')) showDetailModal = false; }}
       onkeydown={(e) => { if (e.key === 'Escape') showDetailModal = false; }}>
    <div class="modal glass-panel">
      <div class="modal-header">
        <div class="modal-title-group">
          <h2 class="modal-title">{selectedProject.projectName}</h2>
          <span class="badge badge-status-{selectedProject.statusProject.toLowerCase()}">
            {statusLabels[selectedProject.statusProject] ?? selectedProject.statusProject}
          </span>
        </div>
        <button class="btn-close" onclick={() => showDetailModal = false} aria-label="Fermer">✕</button>
      </div>

      <div class="modal-body">
        <!-- Section principale -->
        <div class="detail-section">
          <div class="detail-grid">
            <div class="detail-item">
              <span class="detail-label">Client</span>
              <span class="detail-value">{selectedProject.clientCompanyName || selectedProject.companyName || '—'}</span>
            </div>
            {#if selectedProject.reference}
              <div class="detail-item">
                <span class="detail-label">Référence</span>
                <span class="detail-value mono">{selectedProject.reference}</span>
              </div>
            {/if}
            <div class="detail-item">
              <span class="detail-label">Priorité</span>
              <span class="detail-value">
                <span class="badge badge-priority-{selectedProject.priority.toLowerCase()}">
                  {priorityLabels[selectedProject.priority] ?? selectedProject.priority}
                </span>
              </span>
            </div>
          </div>

          {#if selectedProject.description}
            <div class="detail-desc">
              <span class="detail-label">Description</span>
              <p class="detail-desc-text">{selectedProject.description}</p>
            </div>
          {/if}
        </div>

        <!-- Avancement -->
        <div class="detail-section">
          <div class="section-title">Avancement du projet</div>
          <div class="progress-header" style="margin-bottom: 0.5rem;">
            <span class="progress-label-text">Progression</span>
            <span class="progress-value large">{selectedProject.progressPercentage}%</span>
          </div>
          <div class="progress-track large-track">
            <div class="progress-fill" style="width: {selectedProject.progressPercentage}%"></div>
          </div>
        </div>

        <!-- Budget (sans montants sensibles, juste avancement relatif) -->
        <div class="detail-section">
          <div class="section-title">Budget</div>
          <div class="detail-grid">
            <div class="detail-item">
              <span class="detail-label">Budget alloué</span>
              <span class="detail-value budget-val">{(Number(selectedProject.budgetAmount) || 0).toFixed(3)} DT</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Montant dépensé</span>
              <span class="detail-value spent-val">{(Number(selectedProject.spentAmount) || 0).toFixed(3)} DT</span>
            </div>
          </div>
        </div>

        <!-- Dates -->
        <div class="detail-section">
          <div class="section-title">Calendrier</div>
          <div class="detail-grid">
            <div class="detail-item">
              <span class="detail-label">Date de début</span>
              <span class="detail-value">{selectedProject.startDate || '—'}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Date limite</span>
              <span class="detail-value">{selectedProject.dueDate || '—'}</span>
            </div>
            {#if selectedProject.completedAt}
              <div class="detail-item">
                <span class="detail-label">Terminé le</span>
                <span class="detail-value">{selectedProject.completedAt}</span>
              </div>
            {/if}
            <div class="detail-item">
              <span class="detail-label">Dernière mise à jour</span>
              <span class="detail-value">{selectedProject.updatedAt || '—'}</span>
            </div>
          </div>
        </div>

        <!-- Info technique (discrète) -->
        <div class="detail-section meta-section">
          <div class="detail-item">
            <span class="detail-label">Identifiant projet</span>
            <span class="detail-value mono small">{selectedProject.uuid}</span>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <div class="readonly-notice">🔒 Consultation uniquement — aucune modification possible</div>
        <button type="button" class="btn btn-primary" onclick={() => showDetailModal = false}>Fermer</button>
      </div>
    </div>
  </div>
{/if}

<style>
  /* ── Hero ── */
  .page-hero {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 2rem;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .hero-content {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .hero-icon {
    font-size: 2.25rem;
    line-height: 1;
  }

  .hero-title {
    margin: 0 0 0.2rem;
    font-size: 1.75rem;
    font-weight: 700;
    color: var(--text-primary);
  }

  .hero-subtitle {
    margin: 0;
    font-size: 0.9rem;
    color: var(--text-secondary);
  }

  .readonly-badge {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.45rem 1rem;
    background: rgba(99, 102, 241, 0.08);
    border: 1px solid rgba(99, 102, 241, 0.2);
    border-radius: 100px;
    font-size: 0.82rem;
    font-weight: 600;
    color: var(--accent-color);
    letter-spacing: 0.02em;
  }

  .lock-icon { font-size: 0.85rem; }

  /* ── Stats ── */
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .stat-card {
    padding: 1.25rem 1.5rem;
    border-radius: var(--radius);
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    cursor: pointer;
    transition: all 0.2s ease;
    border: 1px solid transparent;
    background: transparent;
    text-align: left;
    width: 100%;
  }

  .stat-card:hover {
    border-color: rgba(99, 102, 241, 0.2);
    transform: translateY(-1px);
  }

  .stat-card.stat-active {
    border-color: var(--accent-color);
    background: rgba(99, 102, 241, 0.08);
  }

  .stat-number {
    font-size: 2rem;
    font-weight: 700;
    color: var(--text-primary);
    line-height: 1;
  }

  .active-num { color: #6ee7b7; }
  .plan-num { color: #a5b4fc; }
  .done-num { color: #93c5fd; }

  .stat-label {
    font-size: 0.8rem;
    color: var(--text-secondary);
    font-weight: 500;
  }

  /* ── Projects List ── */
  .projects-list {
    display: flex;
    flex-direction: column;
    gap: 0.875rem;
  }

  .project-row {
    display: flex;
    align-items: stretch;
    border-radius: var(--radius);
    overflow: hidden;
    cursor: pointer;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    min-height: 90px;
  }

  .project-row:hover {
    transform: translateX(3px);
    box-shadow: 0 4px 24px rgba(99, 102, 241, 0.1);
  }

  .status-stripe {
    width: 4px;
    flex-shrink: 0;
  }

  .status-new_project { background: #6366f1; }
  .status-in_progress { background: #f59e0b; }
  .status-pending_validation { background: #10b981; }
  .status-ready_to_print { background: #06b6d4; }
  .status-printed { background: #3b82f6; }
  .status-delivered { background: #10b981; }
  .status-pending_payment { background: #ef4444; }
  .status-cancelled { background: #6b7280; }

  .project-body {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.25rem 1.5rem;
    gap: 2rem;
  }

  .project-main {
    flex: 1;
    min-width: 0;
  }

  .project-title-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 0.5rem;
    flex-wrap: wrap;
  }

  .project-title {
    font-size: 1.05rem;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0;
    line-height: 1.3;
  }

  .project-meta-row {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
    margin-bottom: 0.4rem;
  }

  .meta-chip {
    font-size: 0.78rem;
    color: var(--text-secondary);
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid var(--border-color);
    padding: 0.18rem 0.6rem;
    border-radius: 100px;
  }

  .priority-urgent { color: #fca5a5; border-color: rgba(239, 68, 68, 0.3); }
  .priority-high { color: #fcd34d; border-color: rgba(245, 158, 11, 0.3); }

  .project-desc {
    margin: 0;
    font-size: 0.82rem;
    color: var(--text-secondary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 420px;
  }

  .project-right {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.6rem;
    min-width: 200px;
    flex-shrink: 0;
  }

  /* ── Progress ── */
  .progress-block {
    width: 100%;
  }

  .progress-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.35rem;
  }

  .progress-label-text {
    font-size: 0.75rem;
    color: var(--text-secondary);
  }

  .progress-value {
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--text-primary);
  }

  .progress-value.large { font-size: 1.1rem; }

  .progress-track {
    height: 5px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 100px;
    overflow: hidden;
  }

  .large-track { height: 10px; }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--accent-color), #7c3aed);
    box-shadow: 0 0 8px var(--accent-glow);
    border-radius: 100px;
    transition: width 0.6s cubic-bezier(0.16, 1, 0.3, 1);
  }

  /* ── Dates ── */
  .dates-block {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  .date-chip {
    font-size: 0.75rem;
    color: var(--text-secondary);
  }

  .date-chip.deadline { color: #fcd34d; }

  .btn-detail {
    font-size: 0.8rem;
    color: var(--accent-color);
    background: rgba(99, 102, 241, 0.1);
    border: 1px solid rgba(99, 102, 241, 0.2);
    padding: 0.35rem 0.9rem;
    border-radius: 100px;
    cursor: pointer;
    transition: all 0.2s ease;
    font-weight: 600;
    font-family: var(--font-main);
  }

  .btn-detail:hover {
    background: rgba(99, 102, 241, 0.2);
  }

  /* ── Empty State ── */
  .empty-state {
    padding: 4rem 2rem;
    text-align: center;
    border-radius: var(--radius);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }

  .empty-icon { font-size: 3rem; }

  .empty-state h2 {
    margin: 0;
    font-size: 1.3rem;
    color: var(--text-primary);
  }

  .text-secondary { color: var(--text-secondary); margin: 0; }

  /* ── Modal ── */
  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.65);
    backdrop-filter: blur(6px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 1rem;
  }

  .modal {
    width: 100%;
    max-width: 580px;
    max-height: 90vh;
    overflow-y: auto;
    border-radius: var(--radius);
    animation: slideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  }

  @keyframes slideIn {
    from { opacity: 0; transform: translateY(16px) scale(0.97); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }

  .modal-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
    padding: 1.75rem 1.75rem 1.25rem;
    border-bottom: 1px solid var(--border-color);
  }

  .modal-title-group {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .modal-title {
    font-size: 1.25rem;
    font-weight: 700;
    margin: 0;
    color: var(--text-primary);
  }

  .btn-close {
    background: transparent;
    border: none;
    color: var(--text-secondary);
    font-size: 1.2rem;
    cursor: pointer;
    padding: 0.25rem;
    line-height: 1;
    border-radius: 4px;
    transition: color 0.15s;
    flex-shrink: 0;
  }

  .btn-close:hover { color: var(--text-primary); }

  .modal-body {
    padding: 1.5rem 1.75rem;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .detail-section {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding-bottom: 1.25rem;
    border-bottom: 1px solid var(--border-color);
  }

  .detail-section:last-child { border-bottom: none; padding-bottom: 0; }

  .meta-section { opacity: 0.6; }

  .section-title {
    font-size: 0.78rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-secondary);
    font-weight: 600;
  }

  .detail-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }

  .detail-item {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }

  .detail-label {
    font-size: 0.75rem;
    color: var(--text-secondary);
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .detail-value {
    font-size: 0.95rem;
    color: var(--text-primary);
    font-weight: 500;
  }

  .detail-value.mono {
    font-family: monospace;
    font-size: 0.85rem;
  }

  .detail-value.small { font-size: 0.75rem; word-break: break-all; }

  .detail-desc { display: flex; flex-direction: column; gap: 0.25rem; }
  .detail-desc-text {
    margin: 0;
    font-size: 0.9rem;
    color: var(--text-primary);
    line-height: 1.6;
  }

  .budget-val { color: #6ee7b7; font-weight: 700; }
  .spent-val { color: #fcd34d; font-weight: 700; }

  .modal-footer {
    padding: 1rem 1.75rem 1.75rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    border-top: 1px solid var(--border-color);
  }

  .readonly-notice {
    font-size: 0.78rem;
    color: var(--text-secondary);
    display: flex;
    align-items: center;
    gap: 0.35rem;
  }

  /* ── Badges ── */
  .badge {
    padding: 0.22rem 0.7rem;
    border-radius: 100px;
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 0.03em;
    display: inline-block;
    white-space: nowrap;
  }

  .badge-status-new_project { background: rgba(99, 102, 241, 0.15); color: #4f46e5; }
  .badge-status-in_progress { background: rgba(245, 158, 11, 0.15); color: #d97706; }
  .badge-status-pending_validation { background: rgba(16, 185, 129, 0.15); color: #059669; }
  .badge-status-ready_to_print { background: rgba(6, 182, 212, 0.15); color: #0891b2; }
  .badge-status-printed { background: rgba(59, 130, 246, 0.15); color: #2563eb; }
  .badge-status-delivered { background: rgba(16, 185, 129, 0.15); color: #10b981; }
  .badge-status-pending_payment { background: rgba(239, 68, 68, 0.15); color: #dc2626; }
  .badge-status-cancelled { background: rgba(107, 114, 128, 0.15); color: #4b5563; }

  .badge-priority-low { background: rgba(156, 163, 175, 0.15); color: #e5e7eb; }
  .badge-priority-medium { background: rgba(59, 130, 246, 0.15); color: #93c5fd; }
  .badge-priority-high { background: rgba(245, 158, 11, 0.15); color: #fcd34d; }
  .badge-priority-urgent { background: rgba(239, 68, 68, 0.15); color: #fca5a5; }

  /* ── Buttons ── */
  .btn {
    padding: 0.6rem 1.4rem;
    border-radius: var(--radius-sm);
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    border: none;
    font-family: var(--font-main);
    transition: all 0.2s ease;
  }

  .btn-primary {
    background: var(--accent-color);
    color: white;
  }

  .btn-primary:hover { opacity: 0.9; }

  .btn-secondary {
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid var(--border-color);
    color: var(--text-primary);
  }

  .btn-secondary:hover { background: rgba(255, 255, 255, 0.1); }

  /* ── Responsive ── */
  @media (max-width: 768px) {
    .stats-grid { grid-template-columns: 1fr 1fr; }
    .project-body { flex-direction: column; align-items: flex-start; gap: 1rem; }
    .project-right { min-width: 100%; align-items: flex-start; }
    .detail-grid { grid-template-columns: 1fr; }
    .modal-footer { flex-direction: column; align-items: flex-start; }
  }

  @media (max-width: 480px) {
    .stats-grid { grid-template-columns: 1fr; }
    .page-hero { flex-direction: column; align-items: flex-start; }
  }
</style>

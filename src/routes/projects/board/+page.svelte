<script lang="ts">
  import { enhance } from '$app/forms';

  let { data } = $props();

  let showAddColumnModal = $state(false);
  let activeDragProjectId = $state<string | number | null>(null);
  let activeDragOverWorkflowName = $state<string | null>(null);

  // Column renaming state
  let editingColumnId = $state<string | null>(null);
  let renameValue = $state('');

  // Optimistic updates for seamless transitions
  let projectsList = $state(data.projects);
  $effect(() => {
    projectsList = data.projects;
  });

  // Drag and drop event handlers
  function handleDragStart(e: DragEvent, projectId: string | number) {
    activeDragProjectId = projectId;
    e.dataTransfer?.setData('text/plain', projectId.toString());
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
    }
  }

  function handleDragEnd() {
    activeDragProjectId = null;
    activeDragOverWorkflowName = null;
  }

  function handleDragOver(e: DragEvent, workflowName: string) {
    e.preventDefault();
    if (activeDragOverWorkflowName !== workflowName) {
      activeDragOverWorkflowName = workflowName;
    }
  }

  async function handleDrop(e: DragEvent, workflowName: string) {
    e.preventDefault();
    const projectIdStr = e.dataTransfer?.getData('text/plain');
    const projectId = projectIdStr ? parseInt(projectIdStr) : activeDragProjectId;
    
    if (projectId !== null && projectId !== undefined) {
      // Optimistically update status in local UI state
      projectsList = projectsList.map(p => {
        if (p.id.toString() === projectId.toString()) {
          return { ...p, workflowName };
        }
        return p;
      });

      // Send to server
      const formData = new FormData();
      formData.append('projectId', projectId.toString());
      formData.append('workflowName', workflowName);

      try {
        await fetch('?/updateProjectStep', {
          method: 'POST',
          body: formData
        });
      } catch (err) {
        console.error('Failed to sync workflow step change to server:', err);
      }
    }
    
    activeDragOverWorkflowName = null;
    activeDragProjectId = null;
  }

  // Handle dropdown selection change directly
  async function handleDropdownChange(projectId: string | number, workflowName: string) {
    projectsList = projectsList.map(p => {
      if (p.id.toString() === projectId.toString()) {
        return { ...p, workflowName };
      }
      return p;
    });

    const formData = new FormData();
    formData.append('projectId', projectId.toString());
    formData.append('workflowName', workflowName);

    try {
      await fetch('?/updateProjectStep', {
        method: 'POST',
        body: formData
      });
    } catch (err) {
      console.error('Failed to sync workflow step change to server:', err);
    }
  }

  function startRename(columnId: string, name: string) {
    editingColumnId = columnId;
    renameValue = name;
  }

  function cancelRename() {
    editingColumnId = null;
    renameValue = '';
  }
</script>

<div class="projects-container">
  <div class="projects-navigation">
    <h1 class="page-title" style="margin-bottom: 0.25rem;">Projects Board</h1>
    <p class="text-secondary" style="margin-bottom: 1.5rem;">Track, drag-and-drop, and configure your project workflow columns.</p>
    
    <!-- View Switcher Tabs -->
    <div class="tabs">
      <a href="/projects" class="tab-link">List View</a>
      <a href="/projects/board" class="tab-link active">Board View</a>
    </div>
  </div>

  <div class="board-header">
    <div class="board-summary">
      <span class="badge-total">{projectsList.length} total projects</span>
    </div>
    <button class="btn btn-secondary" onclick={() => showAddColumnModal = true}>
      + Add Column
    </button>
  </div>

  <!-- KANBAN BOARD WRAPPER -->
  <div class="kanban-board-wrapper">
    <div class="kanban-board">
      {#each data.workflows as column, i}
        {@const columnProjects = projectsList.filter(p => p.workflowName === column.workflowName)}
        
        <div 
          class="kanban-column glass-panel"
          class:drag-over={activeDragOverWorkflowName === column.workflowName}
          ondragover={(e) => handleDragOver(e, column.workflowName)}
          ondragleave={() => activeDragOverWorkflowName = null}
          ondrop={(e) => handleDrop(e, column.workflowName)}
        >
          <!-- Column Header -->
          <div class="column-header">
            {#if editingColumnId === column.id}
              <!-- Rename Inline Form -->
              <form method="POST" action="?/renameWorkflowStep" use:enhance={() => {
                return async ({ update }) => {
                  await update();
                  editingColumnId = null;
                };
              }} class="rename-form">
                <input type="hidden" name="id" value={column.id} />
                <input class="input-field rename-input" type="text" name="workflowName" bind:value={renameValue} required autofocus style="text-transform: uppercase;" />
                <button type="submit" class="btn-action-check">✓</button>
                <button type="button" class="btn-action-cancel" onclick={cancelRename}>✕</button>
              </form>
            {:else}
              <!-- Standard Header Details -->
              <div class="column-title-row">
                <div class="column-header-info">
                  <h3 onclick={() => startRename(column.id, column.workflowName)} title="Click to rename" class="clickable-header">
                    {column.workflowName}
                  </h3>
                  <span class="count-badge">{columnProjects.length}</span>
                </div>
                
                <div class="column-actions">
                  <!-- Reordering: Left -->
                  <form method="POST" action="?/moveWorkflowStep" use:enhance style="display:inline;">
                    <input type="hidden" name="id" value={column.id} />
                    <input type="hidden" name="direction" value="left" />
                    <button class="btn-column-control" disabled={i === 0} title="Move Left">◀</button>
                  </form>
                  
                  <!-- Reordering: Right -->
                  <form method="POST" action="?/moveWorkflowStep" use:enhance style="display:inline;">
                    <input type="hidden" name="id" value={column.id} />
                    <input type="hidden" name="direction" value="right" />
                    <button class="btn-column-control" disabled={i === data.workflows.length - 1} title="Move Right">▶</button>
                  </form>

                  <!-- Rename Toggle Button -->
                  <button class="btn-column-control" onclick={() => startRename(column.id, column.workflowName)} title="Rename Step">✏️</button>

                  <!-- Delete Step -->
                  <form method="POST" action="?/deleteWorkflowStep" use:enhance style="display:inline;">
                    <input type="hidden" name="id" value={column.id} />
                    <button class="btn-column-control danger" title="Delete Column">✕</button>
                  </form>
                </div>
              </div>
            {/if}
          </div>

          <!-- Cards list -->
          <div class="cards-list">
            {#each columnProjects as project}
              <div 
                class="project-card glass-panel"
                class:dragging={activeDragProjectId === project.id}
                draggable="true"
                ondragstart={(e) => handleDragStart(e, project.id)}
                ondragend={handleDragEnd}
              >
                <div class="card-header">
                  <span class="priority-badge badge-priority-{project.priority.toLowerCase()}">{project.priority}</span>
                  
                  <!-- Column changer dropdown -->
                  <select 
                    class="status-dropdown" 
                    value={project.workflowName}
                    onchange={(e: any) => handleDropdownChange(project.id, e.target.value)}
                  >
                    {#each data.workflows as w}
                      <option value={w.workflowName}>{w.workflowName}</option>
                    {/each}
                  </select>
                </div>

                <div class="card-body">
                  <h4>{project.projectName}</h4>
                  <span class="client-name">{project.clientCompanyName || project.companyName || 'Sans client'}</span>
                  {#if project.description}
                    <p class="description">{project.description}</p>
                  {/if}
                </div>

                <div class="card-progress">
                  <div class="progress-bar-wrapper">
                    <div class="progress-bar" style="width: {project.progressPercentage}%"></div>
                  </div>
                  <span class="progress-percent">{project.progressPercentage}%</span>
                </div>

                <div class="card-footer">
                  <div class="card-financials">
                    <span class="budget">{project.budgetAmount} DT</span>
                  </div>
                  <div class="card-dates">
                    {#if project.dueDate}
                      <span class="due-date">Limite : {project.dueDate}</span>
                    {:else}
                      <span class="no-due">Pas de date limite</span>
                    {/if}
                  </div>
                </div>
              </div>
            {/each}

            {#if columnProjects.length === 0}
              <div class="empty-column-placeholder">
                Drag projects here
              </div>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  </div>
</div>

<!-- ADD COLUMN MODAL -->
{#if showAddColumnModal}
  <div class="modal-backdrop">
    <div class="modal glass-panel">
      <div class="modal-header">
        <h3>Add Board Column</h3>
        <button class="btn-close" onclick={() => showAddColumnModal = false}>✕</button>
      </div>
      <form method="POST" action="?/createWorkflowStep" use:enhance={() => {
        return async ({ update }) => {
          await update();
          showAddColumnModal = false;
        };
      }}>
        <div class="form-group">
          <label class="form-label" for="workflowName">Column / Step Name *</label>
          <input class="input-field" type="text" id="workflowName" name="workflowName" placeholder="e.g. TESTING" required style="text-transform: uppercase;" />
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" onclick={() => showAddColumnModal = false}>Cancel</button>
          <button type="submit" class="btn btn-primary">Create Column</button>
        </div>
      </form>
    </div>
  </div>
{/if}

<style>
  .projects-container {
    display: flex;
    flex-direction: column;
    height: calc(100vh - 4rem);
  }

  .text-secondary {
    color: var(--text-secondary);
  }

  /* View Switcher Tabs */
  .tabs {
    display: flex;
    gap: 0.5rem;
    border-bottom: 1px solid var(--border-color);
    padding-bottom: 0.5rem;
  }

  .tab-link {
    padding: 0.5rem 1rem;
    border-radius: var(--radius-sm);
    color: var(--text-secondary);
    font-weight: 500;
    transition: all var(--transition);
  }

  .tab-link:hover, .tab-link.active {
    color: var(--text-primary);
    background: rgba(255, 255, 255, 0.05);
  }

  .tab-link.active {
    background: rgba(99, 102, 241, 0.1);
    color: var(--accent-color);
    border: 1px solid rgba(99, 102, 241, 0.2);
  }

  /* Board Header */
  .board-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin: 1.5rem 0;
  }

  .badge-total {
    padding: 0.25rem 0.75rem;
    border-radius: 100px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid var(--border-color);
    font-size: 0.85rem;
    color: var(--text-secondary);
  }

  /* KANBAN BOARD WRAPPER */
  .kanban-board-wrapper {
    flex: 1;
    overflow-x: auto;
    overflow-y: hidden;
    padding-bottom: 1rem;
  }

  .kanban-board {
    display: flex;
    gap: 1.25rem;
    height: 100%;
    align-items: flex-start;
  }

  .kanban-column {
    width: 325px;
    min-width: 325px;
    max-height: 100%;
    display: flex;
    flex-direction: column;
    padding: 1.25rem;
    background: rgba(26, 29, 39, 0.4);
    transition: all var(--transition);
    border-color: rgba(255, 255, 255, 0.05);
    border-radius: var(--radius-md);
  }

  .kanban-column.drag-over {
    border-color: var(--accent-color);
    box-shadow: 0 0 15px var(--accent-glow);
    background: rgba(99, 102, 241, 0.05);
  }

  /* Column Header */
  .column-header {
    margin-bottom: 1.25rem;
    height: 38px;
    display: flex;
    align-items: center;
  }

  .column-title-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
  }

  .column-header-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .column-header h3 {
    font-size: 0.95rem;
    font-weight: 700;
    letter-spacing: 0.05em;
    color: var(--text-primary);
  }

  .clickable-header {
    cursor: pointer;
    transition: color 0.2s;
  }

  .clickable-header:hover {
    color: var(--accent-color);
  }

  .count-badge {
    font-size: 0.75rem;
    font-weight: 600;
    padding: 0.15rem 0.5rem;
    border-radius: 100px;
    background: rgba(255, 255, 255, 0.08);
    color: var(--text-secondary);
  }

  .column-actions {
    display: flex;
    gap: 0.25rem;
    align-items: center;
  }

  .btn-column-control {
    background: transparent;
    border: none;
    cursor: pointer;
    color: var(--text-secondary);
    font-size: 0.75rem;
    opacity: 0.5;
    transition: all var(--transition);
    padding: 0.25rem;
    border-radius: 4px;
  }

  .btn-column-control:hover:not(:disabled) {
    opacity: 1;
    background: rgba(255, 255, 255, 0.05);
    color: var(--text-primary);
  }

  .btn-column-control.danger:hover {
    color: var(--danger-color);
    background: rgba(239, 68, 68, 0.1);
  }

  .btn-column-control:disabled {
    opacity: 0.15;
    cursor: not-allowed;
  }

  /* Rename Form */
  .rename-form {
    display: flex;
    gap: 0.35rem;
    align-items: center;
    width: 100%;
  }

  .rename-input {
    padding: 0.25rem 0.5rem;
    font-size: 0.85rem;
    height: 32px;
  }

  .btn-action-check, .btn-action-cancel {
    background: transparent;
    border: none;
    font-size: 0.95rem;
    cursor: pointer;
    padding: 0.25rem;
    border-radius: 4px;
    transition: background 0.2s;
  }

  .btn-action-check {
    color: var(--success-color);
  }
  .btn-action-check:hover {
    background: rgba(16, 185, 129, 0.1);
  }

  .btn-action-cancel {
    color: var(--text-secondary);
  }
  .btn-action-cancel:hover {
    background: rgba(255, 255, 255, 0.05);
  }

  /* Cards list */
  .cards-list {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
    padding-right: 0.25rem;
    min-height: 150px;
  }

  /* Custom scrollbar for column card lists */
  .cards-list::-webkit-scrollbar {
    width: 6px;
  }
  .cards-list::-webkit-scrollbar-track {
    background: transparent;
  }
  .cards-list::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 100px;
  }

  /* Project Card */
  .project-card {
    padding: 1.25rem;
    background: var(--bg-glass);
    border-color: rgba(255, 255, 255, 0.07);
    cursor: grab;
    transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease;
    user-select: none;
  }

  .project-card:hover {
    transform: translateY(-2px);
    border-color: rgba(255, 255, 255, 0.15);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  }

  .project-card:active {
    cursor: grabbing;
  }

  .project-card.dragging {
    opacity: 0.4;
    cursor: grabbing;
  }

  /* Card Header */
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
  }

  .priority-badge {
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.05em;
    padding: 0.15rem 0.5rem;
    border-radius: 4px;
  }

  .badge-priority-low { background: rgba(156, 163, 175, 0.15); color: #e5e7eb; }
  .badge-priority-medium { background: rgba(59, 130, 246, 0.15); color: #93c5fd; }
  .badge-priority-high { background: rgba(245, 158, 11, 0.15); color: #fcd34d; }
  .badge-priority-urgent { background: rgba(239, 68, 68, 0.15); color: #fca5a5; }

  .status-dropdown {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid var(--border-color);
    border-radius: 4px;
    color: var(--text-secondary);
    font-size: 0.75rem;
    padding: 0.1rem 0.35rem;
    cursor: pointer;
    font-weight: 500;
    max-width: 110px;
  }

  .status-dropdown:focus {
    outline: none;
    border-color: var(--accent-color);
  }

  /* Card Body */
  .card-body h4 {
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 0.15rem;
    line-height: 1.3;
  }

  .client-name {
    font-size: 0.8rem;
    color: var(--text-secondary);
    display: block;
    margin-bottom: 0.75rem;
  }

  .description {
    font-size: 0.8rem;
    color: var(--text-secondary);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    margin-bottom: 0.85rem;
    line-height: 1.4;
  }

  /* Card Progress */
  .card-progress {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.85rem;
  }

  .progress-bar-wrapper {
    flex: 1;
    height: 4px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 100px;
    overflow: hidden;
  }

  .progress-bar {
    height: 100%;
    background: var(--accent-color);
    box-shadow: 0 0 5px var(--accent-glow);
    border-radius: 100px;
  }

  .progress-percent {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--text-secondary);
  }

  /* Card Footer */
  .card-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 1px solid rgba(255, 255, 255, 0.05);
    padding-top: 0.75rem;
    font-size: 0.8rem;
  }

  .budget {
    font-weight: 600;
    color: var(--text-primary);
  }

  .due-date {
    color: #fca5a5;
    font-weight: 500;
  }

  .no-due {
    color: var(--text-secondary);
  }

  /* Empty placeholder */
  .empty-column-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100px;
    border: 2px dashed rgba(255, 255, 255, 0.03);
    border-radius: var(--radius-sm);
    color: rgba(255, 255, 255, 0.15);
    font-size: 0.85rem;
    pointer-events: none;
  }

  /* Modal Styles */
  .modal-backdrop {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .modal {
    width: 100%;
    max-width: 450px;
    padding: 2rem;
    animation: modalSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  }

  @keyframes modalSlideIn {
    from { opacity: 0; transform: translateY(20px) scale(0.95); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
  }

  .btn-close {
    background: transparent;
    border: none;
    color: var(--text-secondary);
    font-size: 1.25rem;
    cursor: pointer;
  }

  .btn-close:hover {
    color: var(--text-primary);
  }

  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    margin-top: 2rem;
  }
</style>

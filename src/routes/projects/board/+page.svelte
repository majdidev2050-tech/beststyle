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
	let projectsList = $state<any[]>([]);
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
			projectsList = projectsList.map((p) => {
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
		projectsList = projectsList.map((p) => {
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
		<h1 class="page-title" style="margin-bottom: 0.25rem;">Tableau des projets</h1>
		<p class="text-secondary" style="margin-bottom: 1.5rem;">
			Suivez, déplacez et configurez les étapes de votre flux de travail.
		</p>

		<div class="tabs">
			<a href="/projects" class="tab-link">Vue liste</a>
			<a href="/projects/board" class="tab-link active">Vue tableau</a>
		</div>
	</div>

	<div class="board-header">
		<div class="board-summary">
			<span class="badge-total"
				>{projectsList.length} projet{projectsList.length > 1 ? 's' : ''} au total</span
			>
		</div>
		<button class="btn btn-secondary" onclick={() => (showAddColumnModal = true)}>
			+ Ajouter une colonne
		</button>
	</div>

	<div class="kanban-board-wrapper">
		<div class="kanban-board">
			{#each data.workflows as column, i}
				{@const columnProjects = projectsList.filter((p) => p.workflowName === column.workflowName)}

				<div
					class="kanban-column"
					role="region"
					aria-label={column.workflowName}
					class:drag-over={activeDragOverWorkflowName === column.workflowName}
					ondragover={(e) => handleDragOver(e, column.workflowName)}
					ondragleave={() => (activeDragOverWorkflowName = null)}
					ondrop={(e) => handleDrop(e, column.workflowName)}
				>
					<div class="column-header">
						{#if editingColumnId === column.id}
							<form
								method="POST"
								action="?/renameWorkflowStep"
								use:enhance={() => {
									return async ({ update }) => {
										await update();
										editingColumnId = null;
									};
								}}
								class="rename-form"
							>
								<input type="hidden" name="id" value={column.id} />
								<!-- svelte-ignore a11y_no_autofocus -->
								<input
									class="input-field rename-input"
									type="text"
									name="workflowName"
									bind:value={renameValue}
									required
									autofocus
								/>
								<button type="submit" class="btn-action-check">✓</button>
								<button type="button" class="btn-action-cancel" onclick={cancelRename}>✕</button>
							</form>
						{:else}
							<div class="column-title-row">
								<div class="column-header-info">
									<!-- svelte-ignore a11y_click_events_have_key_events -->
									<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
									<h3
										onclick={() => startRename(column.id, column.workflowName)}
										title="Cliquez pour renommer"
										class="clickable-header"
									>
										{column.workflowName}
									</h3>
									<span class="count-badge">{columnProjects.length}</span>
								</div>

								<div class="column-actions">
									<form
										method="POST"
										action="?/moveWorkflowStep"
										use:enhance
										style="display:inline;"
									>
										<input type="hidden" name="id" value={column.id} />
										<input type="hidden" name="direction" value="left" />
										<button class="btn-column-control" disabled={i === 0} title="Déplacer à gauche"
											>◀</button
										>
									</form>

									<form
										method="POST"
										action="?/moveWorkflowStep"
										use:enhance
										style="display:inline;"
									>
										<input type="hidden" name="id" value={column.id} />
										<input type="hidden" name="direction" value="right" />
										<button
											class="btn-column-control"
											disabled={i === data.workflows.length - 1}
											title="Déplacer à droite">▶</button
										>
									</form>

									<button
										class="btn-column-control"
										onclick={() => startRename(column.id, column.workflowName)}
										title="Renommer l'étape">✏️</button
									>

									<form
										method="POST"
										action="?/deleteWorkflowStep"
										use:enhance
										style="display:inline;"
									>
										<input type="hidden" name="id" value={column.id} />
										<button class="btn-column-control danger" title="Supprimer la colonne">✕</button
										>
									</form>
								</div>
							</div>
						{/if}
					</div>

					<div class="cards-list" role="list">
						{#each columnProjects as project}
							<div
								class="project-card"
								role="listitem"
								class:dragging={activeDragProjectId === project.id}
								draggable="true"
								ondragstart={(e) => handleDragStart(e, project.id)}
								ondragend={handleDragEnd}
							>
								<div class="card-header">
									<span class="priority-badge badge-priority-{project.priority.toLowerCase()}"
										>{project.priority}</span
									>

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
									<span class="client-name"
										>{project.clientCompanyName || project.companyName || 'Sans client'}</span
									>
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
										<span class="budget">{(Number(project.budgetAmount) || 0).toFixed(3)} DT</span>
									</div>
									<div class="card-dates">
										{#if project.dueDate}
											<span class="due-date">Limite : {project.dueDate}</span>
										{:else}
											<span class="no-due">Aucune échéance</span>
										{/if}
									</div>
								</div>
							</div>
						{/each}

						{#if columnProjects.length === 0}
							<div class="empty-column-placeholder">Déposez des projets ici</div>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	</div>
</div>

{#if showAddColumnModal}
	<div class="modal-backdrop">
		<div class="modal">
			<div class="modal-header">
				<h3>Ajouter une colonne</h3>
				<button class="btn-close" onclick={() => (showAddColumnModal = false)}>✕</button>
			</div>
			<form
				method="POST"
				action="?/createWorkflowStep"
				use:enhance={() => {
					return async ({ update }) => {
						await update();
						showAddColumnModal = false;
					};
				}}
			>
				<div class="form-group">
					<label class="form-label" for="workflowName">Nom de la colonne *</label>
					<input
						class="input-field"
						type="text"
						id="workflowName"
						name="workflowName"
						placeholder="ex. RELEVE"
						required
					/>
				</div>
				<div class="modal-footer">
					<button
						type="button"
						class="btn btn-secondary"
						onclick={() => (showAddColumnModal = false)}>Annuler</button
					>
					<button type="submit" class="btn btn-primary">Créer la colonne</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<style>
	/* --- Ajusté pour occuper 100% de la largeur du Layout à droite --- */
	.projects-container {
		display: flex;
		flex-direction: column;
		height: calc(100vh - 4rem);
		width: 100%;
		padding: 2rem 2.5rem; /* Même padding que vos autres pages pour un alignement au pixel près */
		box-sizing: border-box;
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
		text-decoration: none;
	}

	.tab-link:hover,
	.tab-link.active {
		color: var(--text-primary);
		background: var(--bg-secondary);
	}

	.tab-link.active {
		background: rgba(79, 70, 229, 0.1);
		color: var(--accent-color);
		border: 1px solid rgba(79, 70, 229, 0.15);
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
		background: var(--bg-secondary);
		border: 1px solid var(--border-color);
		font-size: 0.85rem;
		color: var(--text-secondary);
		font-weight: 500;
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
		width: 315px;
		min-width: 315px;
		max-height: 100%;
		display: flex;
		flex-direction: column;
		padding: 1.25rem 1rem;
		background: #f1f5f9;
		border: 1px solid #e2e8f0;
		transition: all var(--transition);
		border-radius: var(--radius-md);
	}

	.kanban-column.drag-over {
		border-color: var(--accent-color);
		box-shadow: 0 0 0 3px var(--accent-glow);
		background: rgba(79, 70, 229, 0.04);
	}

	/* Column Header */
	.column-header {
		margin-bottom: 1rem;
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
		font-size: 0.88rem;
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
		font-weight: 700;
		padding: 0.15rem 0.5rem;
		border-radius: 100px;
		background: #cbd5e1;
		color: #334155;
	}

	.column-actions {
		display: flex;
		gap: 0.15rem;
		align-items: center;
	}

	.btn-column-control {
		background: transparent;
		border: none;
		cursor: pointer;
		color: var(--text-secondary);
		font-size: 0.75rem;
		opacity: 0.6;
		transition: all var(--transition);
		padding: 0.25rem;
		border-radius: 4px;
	}

	.btn-column-control:hover:not(:disabled) {
		opacity: 1;
		background: rgba(0, 0, 0, 0.05);
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

	.btn-action-check,
	.btn-action-cancel {
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
		background: rgba(0, 0, 0, 0.05);
	}

	/* Cards list */
	.cards-list {
		flex: 1;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding-right: 0.15rem;
		min-height: 150px;
	}

	.cards-list::-webkit-scrollbar {
		width: 5px;
	}
	.cards-list::-webkit-scrollbar-track {
		background: transparent;
	}
	.cards-list::-webkit-scrollbar-thumb {
		background: #cbd5e1;
		border-radius: 100px;
	}

	/* Project Card */
	.project-card {
		padding: 1.15rem 1rem;
		background: var(--bg-secondary);
		border: 1px solid var(--border-color);
		border-radius: var(--radius-md);
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
		cursor: grab;
		transition:
			transform 0.2s ease,
			box-shadow 0.2s ease,
			border-color 0.2s ease;
		user-select: none;
	}

	.project-card:hover {
		transform: translateY(-2px);
		border-color: #cbd5e1;
		box-shadow:
			0 10px 15px -3px rgba(0, 0, 0, 0.05),
			0 4px 6px -4px rgba(0, 0, 0, 0.05);
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
		font-size: 0.68rem;
		font-weight: 700;
		letter-spacing: 0.03em;
		padding: 0.15rem 0.45rem;
		border-radius: 4px;
		text-transform: uppercase;
	}

	.badge-priority-low {
		background: #f1f5f9;
		color: #475569;
	}
	.badge-priority-medium {
		background: #e0f2fe;
		color: #0369a1;
	}
	.badge-priority-high {
		background: #fef3c7;
		color: #b45309;
	}
	.badge-priority-urgent {
		background: #fee2e2;
		color: #b91c1c;
	}

	.status-dropdown {
		background: #f8fafc;
		border: 1px solid var(--border-color);
		border-radius: 4px;
		color: var(--text-secondary);
		font-size: 0.75rem;
		padding: 0.15rem 0.35rem;
		cursor: pointer;
		font-weight: 600;
		max-width: 120px;
		outline: none;
	}

	.status-dropdown:focus {
		border-color: var(--accent-color);
	}

	/* Card Body */
	.card-body h4 {
		font-size: 0.92rem;
		font-weight: 700;
		color: var(--text-primary);
		margin-bottom: 0.15rem;
		line-height: 1.3;
	}

	.client-name {
		font-size: 0.8rem;
		color: var(--text-secondary);
		display: block;
		margin-bottom: 0.65rem;
		font-weight: 500;
	}

	.description {
		font-size: 0.8rem;
		color: var(--text-secondary);
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
		margin-bottom: 0.75rem;
		line-height: 1.4;
	}

	/* Card Progress */
	.card-progress {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.75rem;
	}

	.progress-bar-wrapper {
		flex: 1;
		height: 5px;
		background: #f1f5f9;
		border-radius: 100px;
		overflow: hidden;
	}

	.progress-bar {
		height: 100%;
		background: var(--accent-color);
		border-radius: 100px;
	}

	.progress-percent {
		font-size: 0.75rem;
		font-weight: 700;
		color: var(--text-primary);
	}

	/* Card Footer */
	.card-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		border-top: 1px solid #f1f5f9;
		padding-top: 0.65rem;
		font-size: 0.78rem;
	}

	.budget {
		font-weight: 700;
		color: var(--text-primary);
	}

	.due-date {
		color: #dc2626;
		font-weight: 600;
	}

	.no-due {
		color: var(--text-secondary);
	}

	/* Empty placeholder */
	.empty-column-placeholder {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 90px;
		border: 2px dashed #cbd5e1;
		border-radius: var(--radius-sm);
		color: #94a3b8;
		font-size: 0.82rem;
		pointer-events: none;
		background: rgba(255, 255, 255, 0.4);
	}

	/* Modal Core Layout */
	.modal-backdrop {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(15, 23, 42, 0.3);
		backdrop-filter: blur(6px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
	}

	.modal {
		background: var(--bg-secondary);
		width: 100%;
		max-width: 440px;
		padding: 1.75rem;
		border: 1px solid var(--border-color);
		border-radius: var(--radius-md);
		box-shadow:
			0 20px 25px -5px rgba(0, 0, 0, 0.1),
			0 10px 10px -5px rgba(0, 0, 0, 0.04);
		animation: modalSlideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
	}

	@keyframes modalSlideIn {
		from {
			opacity: 0;
			transform: translateY(12px) scale(0.98);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.25rem;
	}

	.modal-header h3 {
		font-size: 1.15rem;
		font-weight: 800;
		color: var(--text-primary);
	}

	.btn-close {
		background: transparent;
		border: none;
		color: var(--text-secondary);
		font-size: 1.15rem;
		cursor: pointer;
		transition: color 0.2s;
	}

	.btn-close:hover {
		color: var(--text-primary);
	}

	.modal-footer {
		display: flex;
		justify-content: flex-end;
		gap: 0.75rem;
		margin-top: 1.75rem;
	}
</style>

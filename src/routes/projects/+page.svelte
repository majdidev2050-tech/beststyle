<script lang="ts">
	import { enhance } from '$app/forms';

	let { data } = $props();

	let showCreateModal = $state(false);
	let showEditModal = $state(false);
	let selectedProject = $state<any>(null);

	interface ImageFile {
		file: File;
		preview: string;
	}
	let selectedImages = $state<ImageFile[]>([]);

	function handleFileChange(event: Event) {
		const files = (event.target as HTMLInputElement).files;
		if (files) {
			for (let i = 0; i < files.length; i++) {
				const file = files[i];
				selectedImages.push({
					file,
					preview: URL.createObjectURL(file)
				});
			}
		}
		// Reset file input value so same files can be re-selected if removed
		(event.target as HTMLInputElement).value = '';
	}

	function removeFile(index: number) {
		URL.revokeObjectURL(selectedImages[index].preview);
		selectedImages = selectedImages.filter((_, i) => i !== index);
	}

	function openEditModal(project: any) {
		selectedProject = { ...project };
		showEditModal = true;
	}
</script>

<div class="projects-navigation" style="margin-bottom: 1.5rem;">
	<h1 class="page-title" style="margin-bottom: 0.25rem;">Projets</h1>
	<p class="text-secondary" style="margin-bottom: 1rem;">
		Suivez, gérez et mettez à jour les projets clients actifs.
	</p>

	<div class="tabs">
		<a href="/projects" class="tab-link active">Vue liste</a>
		<a href="/projects/board" class="tab-link">Vue tableau</a>
	</div>
</div>

<div
	class="page-header"
	style="margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: center;"
>
	<div>
		<span class="badge-total">
			{#if data.searchText || data.dateDebut || data.dateFin}
				{data.projects.length} résultat{data.projects.length > 1 ? 's' : ''} trouvé{data.projects.length > 1 ? 's' : ''}
			{:else}
				{data.projects.length} projet{data.projects.length > 1 ? 's' : ''} au total (max 100)
			{/if}
		</span>
	</div>
	{#if !data.readonly}
		<button class="btn btn-primary" onclick={() => (showCreateModal = true)}>
			+ Nouveau projet
		</button>
	{/if}
</div>

<form method="GET" class="search-form glass-panel" style="margin-bottom: 1.5rem; display: grid; grid-template-columns: 1.5fr 1fr 1fr auto; gap: 0.75rem; align-items: center; padding: 0.75rem 1rem;">
	<div style="position: relative; display: flex; align-items: center;">
		<span style="position: absolute; left: 0.75rem; color: var(--text-secondary); pointer-events: none;">🔍</span>
		<input
			type="text"
			name="search_text"
			value={data.searchText || ''}
			placeholder="Rechercher nom, client, statut, priorité, référence..."
			class="input-field"
			style="padding-left: 2.2rem; width: 100%; margin-bottom: 0;"
		/>
	</div>
	<div style="display: flex; align-items: center; gap: 0.5rem;">
		<span style="font-size: 0.85rem; color: var(--text-secondary); white-space: nowrap;">Du</span>
		<input
			type="date"
			name="date_debut"
			value={data.dateDebut || ''}
			class="input-field"
			style="width: 100%; margin-bottom: 0;"
		/>
	</div>
	<div style="display: flex; align-items: center; gap: 0.5rem;">
		<span style="font-size: 0.85rem; color: var(--text-secondary); white-space: nowrap;">Au</span>
		<input
			type="date"
			name="date_fin"
			value={data.dateFin || ''}
			class="input-field"
			style="width: 100%; margin-bottom: 0;"
		/>
	</div>
	<div style="display: flex; gap: 0.5rem;">
		<button type="submit" class="btn btn-primary" style="margin: 0; padding: 0.5rem 1.25rem; white-space: nowrap;">Filtrer</button>
		{#if data.searchText || data.dateDebut || data.dateFin}
			<a href="?" class="btn btn-secondary" style="margin: 0; padding: 0.5rem 1rem; display: inline-flex; align-items: center; justify-content: center; text-decoration: none; font-size: 0.85rem; height: 38px; box-sizing: border-box;">✕ Réinitialiser</a>
		{/if}
	</div>
</form>

<div class="glass-panel table-container">
	<table class="data-table">
		<thead>
			<tr>
				<th>Nom du projet</th>
				<th>Client</th>
				<th>Statut</th>
				<th>Priorité</th>
				<th>Avancement</th>
				<th>Budget / Dépensé</th>
				<th>Dates</th>
				<th>Actions</th>
			</tr>
		</thead>
		<tbody>
			{#each data.projects as project}
				<tr>
					<td>
						<span class="fw-600 project-name">{project.projectName}</span>
					</td>
					<td>
						<span class="text-client"
							>{project.clientCompanyName || project.companyName || 'Sans client'}</span
						>
					</td>
					<td>
						<span class="badge badge-status-{project.statusProject.toLowerCase()}"
							>{project.statusProject}</span
						>
					</td>
					<td>
						<span class="badge badge-priority-{project.priority.toLowerCase()}"
							>{project.priority}</span
						>
					</td>
					<td>
						<div class="progress-container">
							<div class="progress-bar-wrapper">
								<div class="progress-bar" style="width: {project.progressPercentage}%"></div>
							</div>
							<span class="progress-text">{project.progressPercentage}%</span>
						</div>
					</td>
					<td>
						<div class="financials">
							<span class="budget">{project.budgetAmount} €</span>
							<span class="spent text-secondary">{project.spentAmount} € dépensé</span>
						</div>
					</td>
					<td>
						<div class="dates">
							{#if project.startDate || project.dueDate}
								<span class="date-range"
									>{project.startDate || '—'} to {project.dueDate || '—'}</span
								>
							{:else}
								<span class="text-secondary">Aucune date définie</span>
							{/if}
						</div>
					</td>
					<td>
						<div class="actions-group">
							{#if !data.readonly}
								<button class="btn-icon" onclick={() => openEditModal(project)} title="Modifier"
									>✏️</button
								>
								<form method="POST" action="?/delete" use:enhance style="display:inline;">
									<input type="hidden" name="id" value={project.id} />
									<button class="btn-icon danger" title="Delete">🗑️</button>
								</form>
							{:else}
								<button class="btn-icon" onclick={() => openEditModal(project)} title="Détails"
									>👁️</button
								>
							{/if}
						</div>
					</td>
				</tr>
			{/each}
			{#if data.projects.length === 0}
				<tr>
					<td colspan="8" class="text-center py-4 text-secondary">
						{#if data.searchText || data.dateDebut || data.dateFin}
							Aucun projet ne correspond aux filtres de recherche actifs.
						{:else}
							Aucun projet trouvé. Cliquez sur "+ Nouveau projet" pour en créer un.
						{/if}
					</td>
				</tr>
			{/if}
		</tbody>
	</table>
</div>

<!-- CREATE PROJECT MODAL -->
{#if showCreateModal}
	<div class="modal-backdrop">
		<div class="modal glass-panel">
			<div class="modal-header">
				<h3>Créer un projet</h3>
				<button class="btn-close" onclick={() => (showCreateModal = false)}>✕</button>
			</div>
			<form
				method="POST"
				action="?/create"
				enctype="multipart/form-data"
				use:enhance={({ formData }) => {
					formData.delete('images');
					for (const img of selectedImages) {
						formData.append('images', img.file);
					}
					return async ({ update }) => {
						await update();
						showCreateModal = false;
						selectedImages.forEach(img => URL.revokeObjectURL(img.preview));
						selectedImages = [];
					};
				}}
			>
				<!-- uuid, created_at, updated_at, created_by : générés automatiquement côté serveur -->
				<div class="form-group">
					<label class="form-label" for="projectName">Nom du projet *</label>
					<input class="input-field" type="text" id="projectName" name="projectName" required />
				</div>
				<div class="form-group">
					<label class="form-label" for="clientId">Client *</label>
					<select class="input-field" id="clientId" name="clientId" required>
						<option value="" disabled selected>Sélectionner un client...</option>
						{#each data.clients as client}
							<option value={client.id}>{client.companyName}</option>
						{/each}
					</select>
				</div>
				<div class="form-group">
					<label class="form-label" for="description">Description</label>
					<textarea class="input-field textarea-field" id="description" name="description" rows="2"
					></textarea>
				</div>
				<div class="form-row">
					<div class="form-group">
						<label class="form-label" for="statusProject">Statut</label>
						<select class="input-field" id="statusProject" name="statusProject">
							<option value="PLANNING">Planification</option>
							<option value="ACTIVE">Actif</option>
							<option value="ON_HOLD">En pause</option>
							<option value="COMPLETED">Terminé</option>
							<option value="CANCELLED">Annulé</option>
						</select>
					</div>
					<div class="form-group">
						<label class="form-label" for="priority">Priorité</label>
						<select class="input-field" id="priority" name="priority">
							<option value="LOW">Faible</option>
							<option value="MEDIUM" selected>Moyen</option>
							<option value="HIGH">Élevé</option>
							<option value="URGENT">Urgent</option>
						</select>
					</div>
				</div>
				<div class="form-row">
					<div class="form-group">
						<label class="form-label" for="budgetAmount">Budget (DT)</label>
						<input
							class="input-field"
							type="number"
							step="0.01"
							id="budgetAmount"
							name="budgetAmount"
							value="0"
						/>
					</div>
					<div class="form-group">
						<label class="form-label" for="reference">Référence</label>
						<input
							class="input-field"
							type="text"
							id="reference"
							name="reference"
							placeholder="ex. REF-2024-001"
						/>
					</div>
				</div>
				<div class="form-row">
					<div class="form-group">
						<label class="form-label" for="startDate">Date de début</label>
						<input class="input-field" type="date" id="startDate" name="startDate" />
					</div>
					<div class="form-group">
						<label class="form-label" for="dueDate">Date limite</label>
						<input class="input-field" type="date" id="dueDate" name="dueDate" />
					</div>
				</div>

				<!-- IMAGE UPLOAD MODULE -->
				<div class="form-group image-upload-section">
					<label class="form-label">Images du projet</label>
					<div class="image-upload-wrapper">
						<label class="image-upload-dropzone">
							<span class="upload-icon">📷</span>
							<span class="upload-text">Ajouter des images</span>
							<span class="upload-hint">PNG, JPG ou GIF</span>
							<input
								type="file"
								name="images"
								multiple
								accept="image/*"
								onchange={handleFileChange}
								style="display: none;"
							/>
						</label>
					</div>

					{#if selectedImages.length > 0}
						<div class="image-preview-grid">
							{#each selectedImages as img, idx}
								<div class="image-preview-card">
									<img src={img.preview} alt="Aperçu" class="preview-img" />
									<button type="button" class="btn-remove-preview" onclick={() => removeFile(idx)} title="Supprimer">
										✕
									</button>
								</div>
							{/each}
						</div>
					{/if}
				</div>

				<div class="modal-footer">
					<button type="button" class="btn btn-secondary" onclick={() => (showCreateModal = false)}
						>Annuler</button
					>
					<button type="submit" class="btn btn-primary">Créer le projet</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- EDIT PROJECT MODAL -->
{#if showEditModal && selectedProject}
	<div class="modal-backdrop">
		<div class="modal glass-panel">
			<div class="modal-header">
				<h3>{data.readonly ? 'Détails du projet' : 'Modifier le projet'}</h3>
				<button class="btn-close" onclick={() => (showEditModal = false)}>✕</button>
			</div>
			<form
				method="POST"
				action="?/update"
				use:enhance={() => {
					return async ({ update }) => {
						await update();
						showEditModal = false;
					};
				}}
			>
				<input type="hidden" name="id" value={selectedProject.id} />

				<!-- Champs en lecture seule -->
				<div class="readonly-info">
					<div class="readonly-row">
						<span class="readonly-label">UUID</span>
						<span class="readonly-value mono">{selectedProject.uuid}</span>
					</div>
					<div class="readonly-row">
						<span class="readonly-label">Créé par</span>
						<span class="readonly-value">{selectedProject.createdBy || '—'}</span>
					</div>
					<div class="readonly-row">
						<span class="readonly-label">Créé le</span>
						<span class="readonly-value">{selectedProject.createdAt}</span>
					</div>
					<div class="readonly-row">
						<span class="readonly-label">Modifié le</span>
						<span class="readonly-value">{selectedProject.updatedAt}</span>
					</div>
				</div>

				<div class="form-group">
					<label class="form-label" for="edit_projectName">Nom du projet *</label>
					<input
						class="input-field"
						type="text"
						id="edit_projectName"
						name="projectName"
						bind:value={selectedProject.projectName}
						required
						disabled={data.readonly}
					/>
				</div>
				<div class="form-group">
					<label class="form-label" for="edit_clientId">Client *</label>
					<select
						class="input-field"
						id="edit_clientId"
						name="clientId"
						bind:value={selectedProject.clientId}
						required
						disabled={data.readonly}
					>
						{#each data.clients as client}
							<option value={client.id}>{client.companyName}</option>
						{/each}
					</select>
				</div>
				<div class="form-group">
					<label class="form-label" for="edit_description">Description</label>
					<textarea
						class="input-field textarea-field"
						id="edit_description"
						name="description"
						rows="2"
						bind:value={selectedProject.description}
						disabled={data.readonly}
					></textarea>
				</div>
				<div class="form-row">
					<div class="form-group">
						<label class="form-label" for="edit_statusProject">Statut</label>
						<select
							class="input-field"
							id="edit_statusProject"
							name="statusProject"
							bind:value={selectedProject.statusProject}
							disabled={data.readonly}
						>
							<option value="PLANNING">Planification</option>
							<option value="ACTIVE">Actif</option>
							<option value="ON_HOLD">En pause</option>
							<option value="COMPLETED">Terminé</option>
							<option value="CANCELLED">Annulé</option>
						</select>
					</div>
					<div class="form-group">
						<label class="form-label" for="edit_priority">Priorité</label>
						<select
							class="input-field"
							id="edit_priority"
							name="priority"
							bind:value={selectedProject.priority}
							disabled={data.readonly}
						>
							<option value="LOW">Faible</option>
							<option value="MEDIUM">Moyen</option>
							<option value="HIGH">Élevé</option>
							<option value="URGENT">Urgent</option>
						</select>
					</div>
				</div>
				<div class="form-row">
					<div class="form-group">
						<label class="form-label" for="edit_budgetAmount">Budget (DT)</label>
						<input
							class="input-field"
							type="number"
							step="0.01"
							id="edit_budgetAmount"
							name="budgetAmount"
							bind:value={selectedProject.budgetAmount}
							disabled={data.readonly}
						/>
					</div>
					<div class="form-group">
						<label class="form-label" for="edit_spentAmount">Dépensé (DT)</label>
						<input
							class="input-field"
							type="number"
							step="0.01"
							id="edit_spentAmount"
							name="spentAmount"
							bind:value={selectedProject.spentAmount}
							disabled={data.readonly}
						/>
					</div>
				</div>
				<div class="form-group">
					<label class="form-label" for="edit_progressPercentage"
						>Avancement ({selectedProject.progressPercentage}%)</label
					>
					<input
						type="range"
						class="input-field"
						id="edit_progressPercentage"
						name="progressPercentage"
						min="0"
						max="100"
						bind:value={selectedProject.progressPercentage}
						disabled={data.readonly}
					/>
				</div>
				<div class="form-row">
					<div class="form-group">
						<label class="form-label" for="edit_reference">Référence</label>
						<input
							class="input-field"
							type="text"
							id="edit_reference"
							name="reference"
							bind:value={selectedProject.reference}
							disabled={data.readonly}
						/>
					</div>
				</div>
				<div class="form-row">
					<div class="form-group">
						<label class="form-label" for="edit_startDate">Date de début</label>
						<input
							class="input-field"
							type="date"
							id="edit_startDate"
							name="startDate"
							bind:value={selectedProject.startDate}
							disabled={data.readonly}
						/>
					</div>
					<div class="form-group">
						<label class="form-label" for="edit_dueDate">Date limite</label>
						<input
							class="input-field"
							type="date"
							id="edit_dueDate"
							name="dueDate"
							bind:value={selectedProject.dueDate}
							disabled={data.readonly}
						/>
					</div>
				</div>
				<div class="modal-footer">
					<button type="button" class="btn btn-secondary" onclick={() => (showEditModal = false)}
						>Fermer</button
					>
					{#if !data.readonly}
						<button type="submit" class="btn btn-primary">Enregistrer</button>
					{/if}
				</div>
			</form>
		</div>
	</div>
{/if}

<style>
	/* Image Upload & Preview styles */
	.image-upload-section {
		margin-top: 1.25rem;
		margin-bottom: 1.25rem;
	}

	.image-upload-wrapper {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.image-upload-dropzone {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 1.5rem;
		border: 2px dashed rgba(255, 255, 255, 0.15);
		border-radius: var(--radius-sm);
		background: rgba(255, 255, 255, 0.02);
		cursor: pointer;
		transition: all var(--transition);
		text-align: center;
	}

	.image-upload-dropzone:hover {
		background: rgba(255, 255, 255, 0.05);
		border-color: var(--accent-color);
	}

	.upload-icon {
		font-size: 1.75rem;
		margin-bottom: 0.5rem;
	}

	.upload-text {
		font-size: 0.95rem;
		font-weight: 500;
		color: var(--text-primary);
	}

	.upload-hint {
		font-size: 0.8rem;
		color: var(--text-secondary);
		margin-top: 0.25rem;
	}

	.image-preview-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
		gap: 0.75rem;
		margin-top: 1rem;
		background: rgba(0, 0, 0, 0.2);
		padding: 0.75rem;
		border-radius: var(--radius-sm);
		border: 1px solid var(--border-color);
	}

	.image-preview-card {
		position: relative;
		width: 100%;
		aspect-ratio: 1;
		border-radius: var(--radius-sm);
		overflow: hidden;
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	.preview-img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.btn-remove-preview {
		position: absolute;
		top: 4px;
		right: 4px;
		width: 20px;
		height: 20px;
		border-radius: 50%;
		background: rgba(0, 0, 0, 0.6);
		color: white;
		border: none;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.75rem;
		line-height: 1;
		transition: background 0.2s;
	}

	.btn-remove-preview:hover {
		background: rgba(239, 68, 68, 0.9);
	}

	/* Readonly info block */
	.readonly-info {
		background: rgba(255, 255, 255, 0.02);
		border: 1px solid var(--border-color);
		border-radius: var(--radius-sm);
		padding: 0.75rem 1rem;
		margin-bottom: 1.25rem;
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.readonly-row {
		display: flex;
		gap: 0.75rem;
		align-items: baseline;
		font-size: 0.82rem;
	}

	.readonly-label {
		color: var(--text-secondary);
		min-width: 90px;
		font-weight: 500;
	}

	.readonly-value {
		color: var(--text-primary);
		opacity: 0.75;
	}

	.readonly-value.mono {
		font-family: monospace;
		font-size: 0.78rem;
		word-break: break-all;
	}

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

	.tab-link:hover,
	.tab-link.active {
		color: var(--text-primary);
		background: rgba(255, 255, 255, 0.05);
	}

	.tab-link.active {
		background: rgba(99, 102, 241, 0.1);
		color: var(--accent-color);
		border: 1px solid rgba(99, 102, 241, 0.2);
	}

	.badge-total {
		padding: 0.25rem 0.75rem;
		border-radius: 100px;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid var(--border-color);
		font-size: 0.85rem;
		color: var(--text-secondary);
	}

	.page-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;
	}

	.text-secondary {
		color: var(--text-secondary);
	}

	.text-center {
		text-align: center;
	}
	.py-4 {
		padding-top: 2rem;
		padding-bottom: 2rem;
	}
	.fw-600 {
		font-weight: 600;
	}

	.project-name {
		color: var(--text-primary);
		font-size: 1rem;
	}

	.text-client {
		font-size: 0.95rem;
		color: var(--text-primary);
	}

	.table-container {
		overflow-x: auto;
	}

	.data-table {
		width: 100%;
		border-collapse: collapse;
		text-align: left;
	}

	.data-table th,
	.data-table td {
		padding: 1rem 1.5rem;
		border-bottom: 1px solid var(--border-color);
		vertical-align: middle;
	}

	.data-table th {
		font-size: 0.85rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--text-secondary);
		font-weight: 600;
	}

	.data-table tr:last-child td {
		border-bottom: none;
	}

	.data-table tbody tr {
		transition: background var(--transition);
	}

	.data-table tbody tr:hover {
		background: rgba(255, 255, 255, 0.02);
	}

	.badge {
		padding: 0.25rem 0.75rem;
		border-radius: 100px;
		font-size: 0.75rem;
		font-weight: 600;
		letter-spacing: 0.02em;
		display: inline-block;
		text-align: center;
	}

	/* Status Badges */
	.badge-status-planning {
		background: rgba(99, 102, 241, 0.15);
		color: #a5b4fc;
	}
	.badge-status-active {
		background: rgba(16, 185, 129, 0.15);
		color: #6ee7b7;
	}
	.badge-status-on_hold {
		background: rgba(245, 158, 11, 0.15);
		color: #fcd34d;
	}
	.badge-status-completed {
		background: rgba(59, 130, 246, 0.15);
		color: #93c5fd;
	}
	.badge-status-cancelled {
		background: rgba(107, 114, 128, 0.15);
		color: #d1d5db;
	}

	/* Priority Badges */
	.badge-priority-low {
		background: rgba(156, 163, 175, 0.15);
		color: #e5e7eb;
	}
	.badge-priority-medium {
		background: rgba(59, 130, 246, 0.15);
		color: #93c5fd;
	}
	.badge-priority-high {
		background: rgba(245, 158, 11, 0.15);
		color: #fcd34d;
	}
	.badge-priority-urgent {
		background: rgba(239, 68, 68, 0.15);
		color: #fca5a5;
	}

	/* Progress Bar */
	.progress-container {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		min-width: 120px;
	}

	.progress-bar-wrapper {
		flex: 1;
		height: 6px;
		background: rgba(255, 255, 255, 0.05);
		border-radius: 100px;
		overflow: hidden;
	}

	.progress-bar {
		height: 100%;
		background: var(--accent-color);
		box-shadow: 0 0 8px var(--accent-glow);
		border-radius: 100px;
		transition: width 0.4s ease;
	}

	.progress-text {
		font-size: 0.8rem;
		font-weight: 500;
		color: var(--text-secondary);
	}

	/* Financials */
	.financials {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.budget {
		font-weight: 600;
		color: var(--text-primary);
	}

	.spent {
		font-size: 0.8rem;
	}

	/* Dates */
	.dates {
		font-size: 0.85rem;
		color: var(--text-primary);
	}

	.actions-group {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}

	.btn-icon {
		background: transparent;
		border: none;
		cursor: pointer;
		font-size: 1.1rem;
		padding: 0.4rem;
		border-radius: var(--radius-sm);
		transition: all var(--transition);
		opacity: 0.7;
		display: inline-flex;
		align-items: center;
		justify-content: center;
	}

	.btn-icon:hover {
		opacity: 1;
		background: rgba(255, 255, 255, 0.05);
	}

	.btn-icon.danger:hover {
		background: rgba(239, 68, 68, 0.1);
	}

	/* Form & Modal Extensions */
	.form-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
	}

	.textarea-field {
		resize: vertical;
		font-family: var(--font-main);
	}

	/* Modal Styles */
	.modal-backdrop {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.6);
		backdrop-filter: blur(4px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
	}

	.modal {
		width: 100%;
		max-width: 550px;
		padding: 2rem;
		max-height: 90vh;
		overflow-y: auto;
		animation: modalSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
	}

	@keyframes modalSlideIn {
		from {
			opacity: 0;
			transform: translateY(20px) scale(0.95);
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
		margin-bottom: 1.5rem;
		border-bottom: 1px solid var(--border-color);
		padding-bottom: 0.75rem;
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
		border-top: 1px solid var(--border-color);
		padding-top: 1rem;
	}
</style>

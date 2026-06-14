<script lang="ts">
	import { enhance } from '$app/forms';
	let { data, form } = $props();

	let showCreateModal = $state(false);
	let showEditModal = $state(false);
	let selectedUser = $state<any>(null);

	function openEditModal(user: any) {
		selectedUser = { ...user };
		showEditModal = true;
	}
</script>

<div class="page-header">
	<div>
		<h1 class="page-title" style="margin-bottom: 0.5rem;">Membres de l'équipe</h1>
		<p class="text-secondary">Gérez votre équipe et leurs niveaux d'accès.</p>
	</div>
	<button class="btn btn-primary" onclick={() => (showCreateModal = true)}>
		+ Nouveau membre
	</button>
</div>

<form method="GET" class="search-form glass-panel" style="margin-bottom: 1.5rem; display: flex; gap: 0.75rem; align-items: center; padding: 0.75rem 1rem;">
	<div style="flex: 1; position: relative; display: flex; align-items: center;">
		<span style="position: absolute; left: 0.75rem; color: var(--text-secondary); pointer-events: none;">🔍</span>
		<input
			type="text"
			name="search_text"
			value={data.searchText || ''}
			placeholder="Rechercher par nom, prénom, email, rôle..."
			class="input-field"
			style="padding-left: 2.2rem; width: 100%; margin-bottom: 0;"
		/>
	</div>
	<button type="submit" class="btn btn-primary" style="margin: 0; padding: 0.5rem 1.25rem; white-space: nowrap;">Rechercher</button>
	{#if data.searchText}
		<a href="?search_text=" class="btn btn-secondary" style="margin: 0; padding: 0.5rem 1rem; display: inline-flex; align-items: center; justify-content: center; text-decoration: none; font-size: 0.85rem; height: 38px; box-sizing: border-box;">✕ Effacer</a>
	{/if}
</form>

<div style="margin-bottom: 1rem; font-size: 0.9rem; color: var(--text-secondary);">
	{#if data.searchText}
		{data.users.length} résultat{data.users.length > 1 ? 's' : ''} pour "{data.searchText}"
	{:else}
		{data.users.length} membre{data.users.length > 1 ? 's' : ''} au total (max 100)
	{/if}
</div>

<div class="glass-panel table-container">
	<table class="data-table">
		<thead>
			<tr>
				<th>Nom</th>
				<th>Email</th>
				<th>Rôle</th>
				<th>Statut</th>
				<th>Actions</th>
			</tr>
		</thead>
		<tbody>
			{#each data.users as user}
				<tr>
					<td>
						<div class="user-info">
							<div class="avatar">{user.firstName[0]}{user.lastName[0]}</div>
							<span class="fw-500">{user.firstName} {user.lastName}</span>
						</div>
					</td>
					<td class="text-secondary">{user.email}</td>
					<td>
						<span class="badge badge-{user.role.toLowerCase()}">{user.role}</span>
					</td>
					<td>
						{#if user.isActive === 1}
							<span class="status status-active">Actif</span>
						{:else}
							<span class="status status-inactive">Inactif</span>
						{/if}
					</td>
					<td>
						<div style="display: flex; gap: 0.5rem; align-items: center;">
							<button class="btn-icon" onclick={() => openEditModal(user)} title="Edit">✏️</button>
							<form method="POST" action="?/delete" use:enhance style="display:inline;">
								<input type="hidden" name="userName" value={user.userName} />
								<button class="btn-icon danger" title="Delete">🗑️</button>
							</form>
						</div>
					</td>
				</tr>
			{/each}
			{#if data.users.length === 0}
				<tr>
					<td colspan="5" class="text-center py-4 text-secondary">
						{#if data.searchText}
							Aucun membre ne correspond à votre recherche.
						{:else}
							Aucun membre trouvé.
						{/if}
					</td>
				</tr>
			{/if}
		</tbody>
	</table>
</div>

{#if showCreateModal}
	<div class="modal-backdrop">
		<div class="modal glass-panel">
			<div class="modal-header">
				<h3>Ajouter un membre</h3>
				<button class="btn-close" onclick={() => (showCreateModal = false)}>✕</button>
			</div>
			<form
				method="POST"
				action="?/create"
				use:enhance={() => {
					return async ({ update }) => {
						await update();
						showCreateModal = false;
					};
				}}
			>
				<!-- created_at, updated_at : générés automatiquement côté serveur -->
				<div class="form-group">
					<label class="form-label" for="userName">Nom d'utilisateur *</label>
					<input
						class="input-field"
						type="text"
						id="userName"
						name="userName"
						required
						placeholder="ex. jean.dupont"
					/>
				</div>
				<div class="form-row">
					<div class="form-group">
						<label class="form-label" for="firstName">Prénom *</label>
						<input class="input-field" type="text" id="firstName" name="firstName" required />
					</div>
					<div class="form-group">
						<label class="form-label" for="lastName">Nom *</label>
						<input class="input-field" type="text" id="lastName" name="lastName" required />
					</div>
				</div>
				<div class="form-group">
					<label class="form-label" for="email">Email *</label>
					<input class="input-field" type="email" id="email" name="email" required />
				</div>
				<div class="form-group">
					<label class="form-label" for="password">Mot de passe *</label>
					<input
						class="input-field"
						type="password"
						id="password"
						name="password"
						placeholder="Entrer un mot de passe"
						required
					/>
				</div>
				<div class="form-group">
					<label class="form-label" for="role">Rôle</label>
					<select class="input-field" id="role" name="role">
						<option value="EMPLOYEE">Employé</option>
						<option value="MANAGER">Manager</option>
						<option value="ADMIN">Admin</option>
					</select>
				</div>
				<div class="modal-footer">
					<button type="button" class="btn btn-secondary" onclick={() => (showCreateModal = false)}
						>Annuler</button
					>
					<button type="submit" class="btn btn-primary">Créer le membre</button>
				</div>
			</form>
		</div>
	</div>
{/if}

{#if showEditModal && selectedUser}
	<div class="modal-backdrop">
		<div class="modal glass-panel">
			<div class="modal-header">
				<h3>Modifier le membre</h3>
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
				<input type="hidden" name="userName" value={selectedUser.userName} />

				<!-- Champs en lecture seule -->
				<div class="readonly-info">
					<div class="readonly-row">
						<span class="readonly-label">Nom d'util.</span>
						<span class="readonly-value mono">{selectedUser.userName}</span>
					</div>
					<div class="readonly-row">
						<span class="readonly-label">Créé le</span>
						<span class="readonly-value">{selectedUser.createdAt}</span>
					</div>
					<div class="readonly-row">
						<span class="readonly-label">Modifié le</span>
						<span class="readonly-value">{selectedUser.updatedAt}</span>
					</div>
				</div>

				<div class="form-row">
					<div class="form-group">
						<label class="form-label" for="edit_firstName">Prénom *</label>
						<input
							class="input-field"
							type="text"
							id="edit_firstName"
							name="firstName"
							bind:value={selectedUser.firstName}
							required
						/>
					</div>
					<div class="form-group">
						<label class="form-label" for="edit_lastName">Nom *</label>
						<input
							class="input-field"
							type="text"
							id="edit_lastName"
							name="lastName"
							bind:value={selectedUser.lastName}
							required
						/>
					</div>
				</div>
				<div class="form-group">
					<label class="form-label" for="edit_email">Email *</label>
					<input
						class="input-field"
						type="email"
						id="edit_email"
						name="email"
						bind:value={selectedUser.email}
						required
					/>
				</div>
				<div class="form-group">
					<label class="form-label" for="edit_role">Rôle</label>
					<select class="input-field" id="edit_role" name="role" bind:value={selectedUser.role}>
						<option value="EMPLOYEE">Employé</option>
						<option value="MANAGER">Manager</option>
						<option value="ADMIN">Admin</option>
						<option value="SUPER_ADMIN">Super Admin</option>
					</select>
				</div>
				<div class="form-group">
					<label class="form-label" for="edit_isActive">Statut</label>
					<select
						class="input-field"
						id="edit_isActive"
						name="isActive"
						bind:value={selectedUser.isActive}
					>
						<option value={1}>Actif</option>
						<option value={0}>Inactif</option>
					</select>
				</div>
				<div class="modal-footer">
					<button type="button" class="btn btn-secondary" onclick={() => (showEditModal = false)}
						>Annuler</button
					>
					<button type="submit" class="btn btn-primary">Enregistrer</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<style>
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
	.fw-500 {
		font-weight: 500;
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

	.user-info {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.avatar {
		width: 36px;
		height: 36px;
		border-radius: 50%;
		background: linear-gradient(135deg, var(--accent-color), #818cf8);
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 600;
		font-size: 0.9rem;
	}

	.badge {
		padding: 0.25rem 0.75rem;
		border-radius: 100px;
		font-size: 0.75rem;
		font-weight: 600;
		letter-spacing: 0.02em;
	}

	.badge-super_admin,
	.badge-admin {
		background: rgba(239, 68, 68, 0.15);
		color: #fca5a5;
	}
	.badge-manager {
		background: rgba(245, 158, 11, 0.15);
		color: #fcd34d;
	}
	.badge-employee {
		background: rgba(59, 130, 246, 0.15);
		color: #93c5fd;
	}

	.status {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		font-size: 0.85rem;
	}

	.status::before {
		content: '';
		width: 8px;
		height: 8px;
		border-radius: 50%;
	}

	.status-active::before {
		background: var(--success-color);
		box-shadow: 0 0 8px var(--success-color);
	}
	.status-inactive::before {
		background: var(--danger-color);
	}

	.btn-icon {
		background: transparent;
		border: none;
		cursor: pointer;
		font-size: 1.1rem;
		padding: 0.5rem;
		border-radius: var(--radius-sm);
		transition: all var(--transition);
		opacity: 0.7;
	}

	.btn-icon:hover {
		opacity: 1;
		background: rgba(255, 255, 255, 0.05);
	}

	.btn-icon.danger:hover {
		background: rgba(239, 68, 68, 0.1);
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
		max-width: 500px;
		padding: 2rem;
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

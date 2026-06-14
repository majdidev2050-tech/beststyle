<script lang="ts">
	import { enhance } from '$app/forms';

	let { data } = $props();

	let showCreateModal = $state(false);
	let showEditModal = $state(false);
	let selectedClient = $state<any>(null);

	function openEditModal(client: any) {
		selectedClient = { ...client };
		showEditModal = true;
	}
</script>

<div class="page-header">
	<div>
		<h1 class="page-title" style="margin-bottom: 0.5rem;">Clients</h1>
		<p class="text-secondary">Gérez vos clients et leurs coordonnées.</p>
	</div>
	{#if !data.readonly}
		<button class="btn btn-primary" onclick={() => (showCreateModal = true)}>
			+ Nouveau client
		</button>
	{/if}
</div>

<form method="GET" class="search-form glass-panel" style="margin-bottom: 1.5rem; display: flex; gap: 0.75rem; align-items: center; padding: 0.75rem 1rem;">
	<div style="flex: 1; position: relative; display: flex; align-items: center;">
		<span style="position: absolute; left: 0.75rem; color: var(--text-secondary); pointer-events: none;">🔍</span>
		<input
			type="text"
			name="search_text"
			value={data.searchText || ''}
			placeholder="Rechercher par entreprise, contact, email, téléphone, N° TVA..."
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
		{data.clients.length} résultat{data.clients.length > 1 ? 's' : ''} pour "{data.searchText}"
	{:else}
		{data.clients.length} client{data.clients.length > 1 ? 's' : ''} au total (max 100)
	{/if}
</div>

<div class="glass-panel table-container">
	<table class="data-table">
		<thead>
			<tr>
				<th>Entreprise</th>
				<th>Contact</th>
				<th>Email</th>
				<th>Téléphone</th>
				<th>N° TVA</th>
				<th>Portail</th>
				<th>Actions</th>
			</tr>
		</thead>
		<tbody>
			{#each data.clients as client}
				<tr>
					<td>
						<span class="fw-600 company-name">{client.companyName}</span>
					</td>
					<td>{client.contactName || '—'}</td>
					<td class="text-secondary">{client.contactEmail || '—'}</td>
					<td class="text-secondary">{client.contactPhone || '—'}</td>
					<td>
						<span class="badge-vat">{client.vatNumber || '—'}</span>
					</td>
					<td>
						{#if client.userLogin && client.passwordHash}
							<span class="badge-portal active" title="Login: {client.userLogin}">🔑 Actif</span>
						{:else}
							<span class="badge-portal inactive">— Inactif</span>
						{/if}
					</td>
					<td>
						<div class="actions-group">
							{#if !data.readonly}
								<button class="btn-icon" onclick={() => openEditModal(client)} title="Modifier"
									>✏️</button
								>
								<form method="POST" action="?/delete" use:enhance style="display:inline;">
									<input type="hidden" name="id" value={client.id} />
									<button class="btn-icon danger" title="Delete">🗑️</button>
								</form>
							{:else}
								<button class="btn-icon" onclick={() => openEditModal(client)} title="Détails"
									>👁️</button
								>
							{/if}
						</div>
					</td>
				</tr>
			{/each}
			{#if data.clients.length === 0}
				<tr>
					<td colspan="7" class="text-center py-4 text-secondary">
						{#if data.searchText}
							Aucun client ne correspond à votre recherche.
						{:else}
							Aucun client trouvé. Cliquez sur "+ Nouveau client" pour commencer.
						{/if}
					</td>
				</tr>
			{/if}
		</tbody>
	</table>
</div>

<!-- CREATE MODAL -->
{#if showCreateModal}
	<div class="modal-backdrop">
		<div class="modal glass-panel">
			<div class="modal-header">
				<h3>Ajouter un client</h3>
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
				<!-- uuid, created_at, updated_at, created_by : générés automatiquement côté serveur -->
				<div class="form-group">
					<label class="form-label" for="companyName">Nom de l'entreprise *</label>
					<input class="input-field" type="text" id="companyName" name="companyName" required />
				</div>
				<div class="form-group">
					<label class="form-label" for="contactName">Nom du contact</label>
					<input class="input-field" type="text" id="contactName" name="contactName" />
				</div>
				<div class="form-group">
					<label class="form-label" for="contactEmail">Email</label>
					<input class="input-field" type="email" id="contactEmail" name="contactEmail" />
				</div>
				<!-- Section accès portail client -->
				<div class="portal-section">
					<div class="portal-section-title">🔑 Accès portail client</div>
					<p class="portal-hint">
						Renseignez le login ET le mot de passe pour activer l'accès au portail client. Laissez
						vide pour désactiver.
					</p>
					<div class="form-row">
						<div class="form-group">
							<label class="form-label" for="userLogin">Login client</label>
							<input
								class="input-field"
								type="text"
								id="userLogin"
								name="userLogin"
								placeholder="ex. acme.corp"
								autocomplete="off"
							/>
						</div>
						<div class="form-group">
							<label class="form-label" for="passwordHash">Mot de passe</label>
							<input
								class="input-field"
								type="password"
								id="passwordHash"
								name="passwordHash"
								autocomplete="new-password"
							/>
						</div>
					</div>
				</div>
				<div class="form-group">
					<label class="form-label" for="contactPhone">Téléphone</label>
					<input class="input-field" type="text" id="contactPhone" name="contactPhone" />
				</div>
				<div class="form-group">
					<label class="form-label" for="billingAddress">Adresse de facturation</label>
					<textarea
						class="input-field textarea-field"
						id="billingAddress"
						name="billingAddress"
						rows="2"
					></textarea>
				</div>
				<div class="form-group">
					<label class="form-label" for="vatNumber">N° TVA</label>
					<input
						class="input-field"
						type="text"
						id="vatNumber"
						name="vatNumber"
						placeholder="ex. TN123456789"
					/>
				</div>
				<div class="form-group">
					<label class="form-label" for="notes">Notes</label>
					<textarea class="input-field textarea-field" id="notes" name="notes" rows="2"></textarea>
				</div>
				<div class="form-group">
					<label class="form-label" for="usersAccess"
						>Accès utilisateurs (séparés par des virgules ou espaces)</label
					>
					<input
						class="input-field"
						type="text"
						id="usersAccess"
						name="usersAccess"
						placeholder="ex. jean.dupont, sophie.martin"
					/>
				</div>
				<div class="modal-footer">
					<button type="button" class="btn btn-secondary" onclick={() => (showCreateModal = false)}
						>Annuler</button
					>
					<button type="submit" class="btn btn-primary">Créer le client</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- EDIT MODAL -->
{#if showEditModal && selectedClient}
	<div class="modal-backdrop">
		<div class="modal glass-panel">
			<div class="modal-header">
				<h3>{data.readonly ? 'Détails du client' : 'Modifier le client'}</h3>
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
				<input type="hidden" name="id" value={selectedClient.id} />

				<!-- Champs en lecture seule -->
				<div class="readonly-info">
					<div class="readonly-row">
						<span class="readonly-label">UUID</span>
						<span class="readonly-value mono">{selectedClient.uuid}</span>
					</div>
					<div class="readonly-row">
						<span class="readonly-label">Créé par</span>
						<span class="readonly-value">{selectedClient.createdBy || '—'}</span>
					</div>
					<div class="readonly-row">
						<span class="readonly-label">Créé le</span>
						<span class="readonly-value">{selectedClient.createdAt}</span>
					</div>
					<div class="readonly-row">
						<span class="readonly-label">Modifié le</span>
						<span class="readonly-value">{selectedClient.updatedAt}</span>
					</div>
				</div>

				<div class="form-group">
					<label class="form-label" for="edit_companyName">Nom de l'entreprise *</label>
					<input
						class="input-field"
						type="text"
						id="edit_companyName"
						name="companyName"
						bind:value={selectedClient.companyName}
						required
						disabled={data.readonly}
					/>
				</div>
				<div class="form-group">
					<label class="form-label" for="edit_contactName">Nom du contact</label>
					<input
						class="input-field"
						type="text"
						id="edit_contactName"
						name="contactName"
						bind:value={selectedClient.contactName}
						disabled={data.readonly}
					/>
				</div>
				<div class="form-group">
					<label class="form-label" for="edit_contactEmail">Email</label>
					<input
						class="input-field"
						type="email"
						id="edit_contactEmail"
						name="contactEmail"
						bind:value={selectedClient.contactEmail}
						disabled={data.readonly}
					/>
				</div>
				<!-- Section accès portail client -->
				<div class="portal-section">
					<div class="portal-section-title">🔑 Accès portail client</div>
					{#if selectedClient.userLogin && selectedClient.passwordHash}
						<p class="portal-hint active">
							✅ Accès actif — login : <strong>{selectedClient.userLogin}</strong>
						</p>
					{:else}
						<p class="portal-hint">
							Aucun accès configuré. Renseignez login + mot de passe pour activer.
						</p>
					{/if}
					{#if !data.readonly}
						<div class="form-row">
							<div class="form-group">
								<label class="form-label" for="edit_userLogin">Login client</label>
								<input
									class="input-field"
									type="text"
									id="edit_userLogin"
									name="userLogin"
									bind:value={selectedClient.userLogin}
									placeholder="ex. acme.corp"
									autocomplete="off"
								/>
							</div>
							<div class="form-group">
								<label class="form-label" for="edit_passwordHash">Nouveau mot de passe</label>
								<input
									class="input-field"
									type="password"
									id="edit_passwordHash"
									name="passwordHash"
									placeholder="Laisser vide pour conserver"
									autocomplete="new-password"
								/>
							</div>
						</div>
					{:else}
						<div class="form-group">
							<label class="form-label" for="view_userLogin">Login client</label>
							<input
								class="input-field"
								type="text"
								id="view_userLogin"
								value={selectedClient.userLogin || '—'}
								disabled
							/>
						</div>
					{/if}
				</div>
				<div class="form-group">
					<label class="form-label" for="edit_contactPhone">Téléphone</label>
					<input
						class="input-field"
						type="text"
						id="edit_contactPhone"
						name="contactPhone"
						bind:value={selectedClient.contactPhone}
						disabled={data.readonly}
					/>
				</div>
				<div class="form-group">
					<label class="form-label" for="edit_billingAddress">Adresse de facturation</label>
					<textarea
						class="input-field textarea-field"
						id="edit_billingAddress"
						name="billingAddress"
						rows="2"
						bind:value={selectedClient.billingAddress}
						disabled={data.readonly}
					></textarea>
				</div>
				<div class="form-group">
					<label class="form-label" for="edit_vatNumber">N° TVA</label>
					<input
						class="input-field"
						type="text"
						id="edit_vatNumber"
						name="vatNumber"
						bind:value={selectedClient.vatNumber}
						disabled={data.readonly}
					/>
				</div>
				<div class="form-group">
					<label class="form-label" for="edit_notes">Notes</label>
					<textarea
						class="input-field textarea-field"
						id="edit_notes"
						name="notes"
						rows="2"
						bind:value={selectedClient.notes}
						disabled={data.readonly}
					></textarea>
				</div>
				<div class="form-group">
					<label class="form-label" for="edit_usersAccess"
						>Accès utilisateurs (séparés par des virgules ou espaces)</label
					>
					<input
						class="input-field"
						type="text"
						id="edit_usersAccess"
						name="usersAccess"
						bind:value={selectedClient.usersAccess}
						disabled={data.readonly}
						placeholder="ex. jean.dupont, sophie.martin"
					/>
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
	/* ── Portal Access Section ── */
	.portal-section {
		background: rgba(99, 102, 241, 0.04);
		border: 1px solid rgba(99, 102, 241, 0.15);
		border-radius: var(--radius-sm);
		padding: 1rem 1.25rem;
		margin-bottom: 0.75rem;
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
	}

	.portal-section-title {
		font-size: 0.82rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--accent-color);
	}

	.portal-hint {
		font-size: 0.8rem;
		color: var(--text-secondary);
		margin: 0;
		line-height: 1.4;
	}

	.portal-hint.active {
		color: #6ee7b7;
	}

	.badge-portal {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		padding: 0.22rem 0.65rem;
		border-radius: 100px;
		font-size: 0.72rem;
		font-weight: 600;
		letter-spacing: 0.02em;
		white-space: nowrap;
	}

	.badge-portal.active {
		background: rgba(16, 185, 129, 0.12);
		color: #6ee7b7;
		border: 1px solid rgba(16, 185, 129, 0.2);
	}

	.badge-portal.inactive {
		background: rgba(107, 114, 128, 0.08);
		color: var(--text-secondary);
		border: 1px solid var(--border-color);
	}

	.page-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;
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

	.company-name {
		color: var(--text-primary);
		font-size: 1rem;
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

	.badge-vat {
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid var(--border-color);
		font-size: 0.8rem;
		font-family: monospace;
		color: var(--text-secondary);
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

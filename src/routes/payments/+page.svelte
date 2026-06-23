<script lang="ts">
	import { enhance } from '$app/forms';

	let { data } = $props();

	let showCreateModal = $state(false);
	let showEditModal = $state(false);
	let selectedPayment = $state<any>(null);

	// For helping auto-select client when choosing a project
	let createProjectId = $state<string | number>('');
	let createClientId = $state<string | number>('');
	let editProjectId = $state<string | number>('');
	let editClientId = $state<string | number>('');

	$effect(() => {
		if (createProjectId) {
			const proj = data.projects.find((p) => p.id.toString() === createProjectId.toString());
			if (proj) {
				createClientId = proj.clientId;
			}
		}
	});

	$effect(() => {
		if (editProjectId) {
			const proj = data.projects.find((p) => p.id.toString() === editProjectId.toString());
			if (proj) {
				editClientId = proj.clientId;
			}
		}
	});

	function openEditModal(payment: any) {
		selectedPayment = { ...payment };
		editProjectId = payment.projectId;
		editClientId = payment.clientId;
		showEditModal = true;
	}
</script>

<div class="page-header">
	<div>
		<h1 class="page-title" style="margin-bottom: 0.5rem;">Paiements</h1>
		<p class="text-secondary">
			Suivez la facturation clients, le registre des transactions et les factures.
		</p>
	</div>
	{#if !data.readonly}
		<button
			class="btn btn-primary"
			onclick={() => {
				createProjectId = '';
				createClientId = '';
				showCreateModal = true;
			}}
		>
			+ Enregistrer un paiement
		</button>
	{/if}
</div>

<div style="margin-bottom: 1rem; display: flex; justify-content: space-between; align-items: center;">
	<span class="badge-total" style="padding: 0.25rem 0.75rem; border-radius: 100px; background: rgba(255, 255, 255, 0.05); border: 1px solid var(--border-color); font-size: 0.85rem; color: var(--text-secondary);">
		{#if data.searchText || data.dateDebut || data.dateFin}
			{data.payments.length} résultat{data.payments.length > 1 ? 's' : ''} trouvé{data.payments.length > 1 ? 's' : ''}
		{:else}
			{data.payments.length} paiement{data.payments.length > 1 ? 's' : ''} au total (max 100)
		{/if}
	</span>
</div>

<form method="GET" class="search-form glass-panel" style="margin-bottom: 1.5rem; display: grid; grid-template-columns: 1.5fr 1fr 1fr auto; gap: 0.75rem; align-items: center; padding: 0.75rem 1rem;">
	<div style="position: relative; display: flex; align-items: center;">
		<span style="position: absolute; left: 0.75rem; color: var(--text-secondary); pointer-events: none;">🔍</span>
		<input
			type="text"
			name="search_text"
			value={data.searchText || ''}
			placeholder="Rechercher client, projet, N° facture, type, statut..."
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
				<th>Nom client</th>
				<th>Nom projet</th>
				<th>Montant</th>
				<th>Type</th>
				<th>Statut</th>
				<th>Facture</th>
				<th>Actions</th>
			</tr>
		</thead>
		<tbody>
			{#each data.payments as payment}
				<tr>
					<td>
						<span class="fw-600 client-name">{payment.companyName || '—'}</span>
					</td>
					<td>
						<span class="project-name-text">{payment.projectName || '—'}</span>
					</td>
					<td>
						<span class="amount-value">{(Number(payment.amount) || 0).toFixed(3)} DT</span>
					</td>
					<td>
						<span class="badge-type">{payment.paymentType.replace('_', ' ')}</span>
					</td>
					<td>
						<span class="badge badge-status-{payment.statusPayment.toLowerCase()}"
							>{payment.statusPayment}</span
						>
					</td>
					<td class="text-secondary">{payment.invoiceNumber || '-'}</td>
					<td>
						<div class="actions-group">
							{#if !data.readonly}
								<button class="btn-icon" onclick={() => openEditModal(payment)} title="Modifier"
									>✏️</button
								>
								<form method="POST" action="?/delete" use:enhance style="display:inline;">
									<input type="hidden" name="id" value={payment.id} />
									<button class="btn-icon danger" title="Delete">🗑️</button>
								</form>
							{:else}
								<button class="btn-icon" onclick={() => openEditModal(payment)} title="Détails"
									>👁️</button
								>
							{/if}
						</div>
					</td>
				</tr>
			{/each}
			{#if data.payments.length === 0}
				<tr>
					<td colspan="9" class="text-center py-4 text-secondary">
						{#if data.searchText || data.dateDebut || data.dateFin}
							Aucun paiement ne correspond aux filtres de recherche actifs.
						{:else}
							Aucune transaction enregistrée. Cliquez sur "+ Enregistrer un paiement" pour en saisir une.
						{/if}
					</td>
				</tr>
			{/if}
		</tbody>
	</table>
</div>

<!-- LOG PAYMENT MODAL -->
{#if showCreateModal}
	<div class="modal-backdrop">
		<div class="modal glass-panel">
			<div class="modal-header">
				<h3>Enregistrer un paiement</h3>
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
					<label class="form-label" for="create_projectId">Projet *</label>
					<select
						class="input-field"
						id="create_projectId"
						name="projectId"
						bind:value={createProjectId}
						required
					>
						<option value="" disabled selected>Sélectionner un projet...</option>
						{#each data.projects as project}
							<option value={project.id}
								>{project.projectName} ({data.clients.find((c) => c.id === project.clientId)
									?.companyName || 'Sans client'})</option
							>
						{/each}
					</select>
				</div>

				<div class="form-group">
					<label class="form-label" for="create_clientId">Client *</label>
					<select
						class="input-field"
						id="create_clientId"
						name="clientId"
						bind:value={createClientId}
						required
					>
						<option value="" disabled selected>Sélectionner un client...</option>
						{#each data.clients as client}
							<option value={client.id}>{client.companyName}</option>
						{/each}
					</select>
				</div>

				<div class="form-row">
					<div class="form-group">
						<label class="form-label" for="amount">Montant (DT) *</label>
						<input
							class="input-field"
							type="number"
							step="0.001"
							id="amount"
							name="amount"
							required
						/>
					</div>
					<div class="form-group">
						<label class="form-label" for="paymentType">Mode de paiement</label>
						<select class="input-field" id="paymentType" name="paymentType">
							<option value="ESPECE" selected>Espèce</option>
							<option value="CHEQUE">Chèque</option>
							<option value="VIREMENT">Virement</option>
						</select>
					</div>
				</div>

				<div class="form-row">
					<div class="form-group">
						<label class="form-label" for="statusPayment">Statut</label>
						<select class="input-field" id="statusPayment" name="statusPayment">
							<option value="PENDING" selected>En attente</option>
							<option value="PAID">Payé</option>
							<option value="FAILED">Échoué</option>
							<option value="CANCELLED">Annulé</option>
						</select>
					</div>
					<div class="form-group">
						<label class="form-label" for="invoiceNumber">N° de facture</label>
						<input
							class="input-field"
							type="text"
							id="invoiceNumber"
							name="invoiceNumber"
							placeholder="ex. INV-0021"
						/>
					</div>
				</div>

				<div class="form-row">
					<div class="form-group">
						<label class="form-label" for="paymentDate">Date de paiement</label>
						<input class="input-field" type="date" id="paymentDate" name="paymentDate" />
					</div>
					<div class="form-group">
						<label class="form-label" for="dueDate">Date limite</label>
						<input class="input-field" type="date" id="dueDate" name="dueDate" />
					</div>
				</div>

				<div class="form-group">
					<label class="form-label" for="notes">Notes</label>
					<textarea class="input-field textarea-field" id="notes" name="notes" rows="2"></textarea>
				</div>

				<div class="modal-footer">
					<button type="button" class="btn btn-secondary" onclick={() => (showCreateModal = false)}
						>Annuler</button
					>
					<button type="submit" class="btn btn-primary">Enregistrer</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- EDIT PAYMENT MODAL -->
{#if showEditModal && selectedPayment}
	<div class="modal-backdrop">
		<div class="modal glass-panel">
			<div class="modal-header">
				<h3>{data.readonly ? 'Détails du paiement' : 'Modifier le paiement'}</h3>
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
				<input type="hidden" name="id" value={selectedPayment.id} />

				<!-- Champs en lecture seule -->
				<div class="readonly-info">
					<div class="readonly-row">
						<span class="readonly-label">UUID</span>
						<span class="readonly-value mono">{selectedPayment.uuid}</span>
					</div>
					<div class="readonly-row">
						<span class="readonly-label">Créé par</span>
						<span class="readonly-value">{selectedPayment.createdBy || '—'}</span>
					</div>
					<div class="readonly-row">
						<span class="readonly-label">Créé le</span>
						<span class="readonly-value">{selectedPayment.createdAt}</span>
					</div>
					<div class="readonly-row">
						<span class="readonly-label">Modifié le</span>
						<span class="readonly-value">{selectedPayment.updatedAt}</span>
					</div>
				</div>

				<div class="form-group">
					<label class="form-label" for="edit_projectId">Projet *</label>
					<select
						class="input-field"
						id="edit_projectId"
						name="projectId"
						bind:value={editProjectId}
						required
						disabled={data.readonly}
					>
						{#each data.projects as project}
							<option value={project.id}
								>{project.projectName} ({data.clients.find((c) => c.id === project.clientId)
									?.companyName || 'Sans client'})</option
							>
						{/each}
					</select>
				</div>

				<div class="form-group">
					<label class="form-label" for="edit_clientId">Client *</label>
					<select
						class="input-field"
						id="edit_clientId"
						name="clientId"
						bind:value={editClientId}
						required
						disabled={data.readonly}
					>
						{#each data.clients as client}
							<option value={client.id}>{client.companyName}</option>
						{/each}
					</select>
				</div>

				<div class="form-row">
					<div class="form-group">
						<label class="form-label" for="edit_amount">Montant (DT) *</label>
						<input
							class="input-field"
							type="number"
							step="0.001"
							id="edit_amount"
							name="amount"
							bind:value={selectedPayment.amount}
							required
							disabled={data.readonly}
						/>
					</div>
					<div class="form-group">
						<label class="form-label" for="edit_paymentType">Mode de paiement</label>
						<select
							class="input-field"
							id="edit_paymentType"
							name="paymentType"
							bind:value={selectedPayment.paymentType}
							disabled={data.readonly}
						>
							<option value="ESPECE">Espèce</option>
							<option value="CHEQUE">Chèque</option>
							<option value="VIREMENT">Virement</option>
						</select>
					</div>
				</div>

				<div class="form-row">
					<div class="form-group">
						<label class="form-label" for="edit_statusPayment">Statut</label>
						<select
							class="input-field"
							id="edit_statusPayment"
							name="statusPayment"
							bind:value={selectedPayment.statusPayment}
							disabled={data.readonly}
						>
							<option value="PENDING">En attente</option>
							<option value="PAID">Payé</option>
							<option value="FAILED">Échoué</option>
							<option value="CANCELLED">Annulé</option>
						</select>
					</div>
					<div class="form-group">
						<label class="form-label" for="edit_invoiceNumber">N° de facture</label>
						<input
							class="input-field"
							type="text"
							id="edit_invoiceNumber"
							name="invoiceNumber"
							bind:value={selectedPayment.invoiceNumber}
							disabled={data.readonly}
						/>
					</div>
				</div>

				<div class="form-row">
					<div class="form-group">
						<label class="form-label" for="edit_paymentDate">Date de paiement</label>
						<input
							class="input-field"
							type="date"
							id="edit_paymentDate"
							name="paymentDate"
							bind:value={selectedPayment.paymentDate}
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
							bind:value={selectedPayment.dueDate}
							disabled={data.readonly}
						/>
					</div>
				</div>

				<div class="form-group">
					<label class="form-label" for="edit_notes">Notes</label>
					<textarea
						class="input-field textarea-field"
						id="edit_notes"
						name="notes"
						rows="2"
						bind:value={selectedPayment.notes}
						disabled={data.readonly}
					></textarea>
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
	.fw-600 {
		font-weight: 600;
	}

	.client-name {
		color: var(--text-primary);
		font-size: 1rem;
	}

	.project-name-text {
		font-size: 0.95rem;
		color: var(--text-primary);
	}

	.amount-value {
		font-weight: 600;
		color: var(--success-color);
	}

	.invoice-number {
		font-family: monospace;
		color: var(--text-secondary);
		font-size: 0.9rem;
	}

	.badge-type,
	.badge-method {
		font-size: 0.8rem;
		padding: 0.2rem 0.5rem;
		background: rgba(255, 255, 255, 0.04);
		border: 1px solid var(--border-color);
		border-radius: 4px;
		color: var(--text-secondary);
		text-transform: capitalize;
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
	.badge-status-pending {
		background: rgba(245, 158, 11, 0.15);
		color: #fcd34d;
	}
	.badge-status-paid {
		background: rgba(16, 185, 129, 0.15);
		color: #6ee7b7;
	}
	.badge-status-failed {
		background: rgba(239, 68, 68, 0.15);
		color: #fca5a5;
	}
	.badge-status-cancelled {
		background: rgba(107, 114, 128, 0.15);
		color: #d1d5db;
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

<script lang="ts">
	import type { PageData } from './$types';

	import { page } from '$app/stores';

	let { data } = $props();

	// Form state

	let search_text = $state(data.search_text || '');

	let date_debut = $state(data.date_debut || '');

	let date_fin = $state(data.date_fin || '');

	$effect(() => {
		search_text = data.search_text || '';

		date_debut = data.date_debut || '';

		date_fin = data.date_fin || '';
	});

	// Handle form submission

	function handleSubmit(e: Event) {
		e.preventDefault();

		const searchParams = new URLSearchParams();

		if (search_text) searchParams.append('search_text', search_text);

		if (date_debut) searchParams.append('date_debut', date_debut);

		if (date_fin) searchParams.append('date_fin', date_fin);

		// Navigate to the same page with new query params

		const url = `/photos?${searchParams.toString()}`;

		window.history.pushState({}, '', url);
	}
</script>

<div class="page-header">
	<h1>Photos</h1>

	<span class="badge">{data.photos.length} résultats</span>
</div>

<!-- Search Form -->

<form class="search-form" onsubmit={handleSubmit}>
	<div class="form-group">
		<input
			type="text"
			placeholder="Rechercher par projet..."
			bind:value={search_text}
			class="form-input"
		/>
	</div>

	<div class="date-filters">
		<div class="form-group">
			<label for="date_debut">Date debut</label>

			<input type="date" id="date_debut" bind:value={date_debut} class="form-input" />
		</div>

		<div class="form-group">
			<label for="date_fin">Date fin</label>

			<input type="date" id="date_fin" bind:value={date_fin} class="form-input" />
		</div>
	</div>

	<button type="submit" class="btn btn-primary">Filtrer</button>
</form>

<!-- Photo Gallery -->

<div class="photo-grid">
	{#if data.photos.length === 0}
		<p>Aucune photo trouvée.</p>
	{:else}
		{#each data.photos as photo (photo.id)}
			<div class="photo-card">
				<img src={photo.url} alt={photo.fileName} class="photo-image" />

				<div class="photo-info">
					<h3>{photo.projectName}</h3>

					<p class="file-name">{photo.fileName}</p>

					{#if photo.startDate}
						<p class="start-date">
							Début : {new Date(photo.startDate).toLocaleDateString('fr-FR')}
						</p>
					{/if}

					<p class="description">{photo.description}</p>
				</div>
			</div>
		{/each}
	{/if}
</div>

<style>
	.page-header {
		display: flex;

		justify-content: space-between;

		align-items: center;

		margin-bottom: 1.5rem;
	}

	.search-form {
		display: flex;

		flex-wrap: wrap;

		gap: 1rem;

		margin-bottom: 2rem;

		padding: 1.5rem;

		background: rgba(255, 255, 255, 0.05);

		border-radius: var(--radius);
	}

	.form-group {
		flex: 1;

		min-width: 200px;
	}

	.form-input {
		width: 100%;

		padding: 0.75rem;

		border-radius: var(--radius-sm);

		border: 1px solid var(--border-color);

		background: rgba(255, 255, 255, 0.08);

		color: var(--text-primary);

		font-family: var(--font-main);
	}

	.form-input:focus {
		outline: none;

		border-color: var(--accent-color);
	}

	.date-filters {
		display: flex;

		gap: 1rem;

		flex: 2;

		min-width: 300px;
	}

	.btn {
		padding: 0.75rem 1.5rem;

		border-radius: var(--radius-sm);

		border: none;

		font-family: var(--font-main);

		font-weight: 500;

		cursor: pointer;

		transition: all var(--transition);
	}

	.btn-primary {
		background: var(--accent-color);

		color: white;
	}

	.btn-primary:hover {
		opacity: 0.9;

		transform: translateY(-2px);
	}

	.photo-grid {
		display: grid;

		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));

		gap: 1.5rem;
	}

	.photo-card {
		background: rgba(255, 255, 255, 0.05);

		border-radius: var(--radius);

		overflow: hidden;

		transition: all var(--transition);

		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	}

	.photo-card:hover {
		transform: translateY(-4px);

		box-shadow: 0 8px 15px rgba(0, 0, 0, 0.2);
	}

	.photo-image {
		width: 100%;

		height: 200px;

		object-fit: cover;
	}

	.photo-info {
		padding: 1rem;
	}

	.photo-info h3 {
		margin: 0 0 0.5rem 0;

		font-size: 1.1rem;
	}

	.file-name {
		margin: 0.25rem 0;

		color: var(--text-secondary);

		font-size: 0.9rem;
	}

	.start-date {
		margin: 0.25rem 0;

		color: var(--accent-color);

		font-size: 0.9rem;
	}

	.description {
		margin: 0.5rem 0 0 0;

		color: var(--text-secondary);

		font-size: 0.9rem;

		line-height: 1.4;
	}
</style>

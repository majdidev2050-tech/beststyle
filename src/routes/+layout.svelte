<script lang="ts">
	import '../app.css';
	import { page } from '$app/stores';

	let { children, data } = $props();

	// Exclude sidebar on login page
	let isAuthPage = $derived($page.url.pathname === '/login');
	// Client portal : layout minimal dédié (aussi pour l'espace client user)
	let isClientPortal = $derived(
		$page.url.pathname.startsWith('/client-portal') ||
			$page.url.pathname.startsWith('/projects/list_project_cl')
	);

	let isClient = $derived(!!data.client && !data.user);
</script>

<svelte:head>
	<title>Patronage | Modern Project Management</title>
	<link
		href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

{#if isAuthPage}
	<main class="auth-layout">
		{@render children()}
	</main>
{:else if isClientPortal || isClient}
	<div class="client-layout">
		<header class="client-header">
			<div class="client-header-inner">
				<div class="logo">
					<span class="logo-icon">✨</span>
					<h2>Patronage</h2>
					<span class="client-badge">Espace Client</span>
				</div>
				<div class="client-info">
					{#if data.client}
						<span class="client-name">{data.client.companyName}</span>
					{:else if data.user}
						<span class="client-name">{data.user.firstName} {data.user.lastName}</span>
					{/if}
					<form method="POST" action="/login?/logout" style="display:inline;">
						<button class="btn-logout">Se déconnecter</button>
					</form>
				</div>
			</div>
		</header>
		<main class="client-main">
			{@render children()}
		</main>
	</div>
{:else}
	<div class="app-layout">
		<aside class="sidebar">
			<div class="sidebar-header">
				<div class="logo">
					<span class="logo-icon">✨</span>
					<h2>Patronage</h2>
				</div>
			</div>

			<nav class="sidebar-nav">
				<a href="/" class="nav-item" class:active={$page.url.pathname === '/'}> Dashboard </a>
				<a
					href={data.user?.role === 'CLIENT' ? '/projects/list_project_cl' : '/projects'}
					class="nav-item"
					class:active={$page.url.pathname.startsWith('/projects')}
				>
					Projets
				</a>
				<a
					href="/clients"
					class="nav-item"
					class:active={$page.url.pathname.startsWith('/clients')}
				>
					Clients
				</a>
				<a
					href="/payments"
					class="nav-item"
					class:active={$page.url.pathname.startsWith('/payments')}
				>
					Paiements
				</a>
				<a href="/users" class="nav-item" class:active={$page.url.pathname.startsWith('/users')}>
					Équipe
				</a>
				<a href="/photos" class="nav-item" class:active={$page.url.pathname.startsWith('/photos')}>
					Photos
				</a>
			</nav>

			<div class="sidebar-footer">
				<form method="POST" action="/login?/logout">
					<button class="nav-item logout-btn">Se déconnecter</button>
				</form>
			</div>
		</aside>

		<main class="main-content">
			{@render children()}
		</main>
	</div>
{/if}

<style>
	/* ── Admin Layout Fixé pour l'adaptabilité ────────────────── */
	.app-layout {
		display: flex;
		width: 100vw;
		height: 100vh;
		overflow: hidden; /* Empêche les doubles scrollbars de la page globale */
		background-color: var(--bg-primary);
	}

	.auth-layout {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		background: radial-gradient(circle at top right, #f1f5f9, var(--bg-primary));
	}

	.sidebar {
		width: 260px;
		min-width: 260px; /* Empêche le menu de se rétrécir */
		height: 100%;
		display: flex;
		flex-direction: column;
		padding: 2rem 1.5rem;
		background: var(--bg-secondary);
		border-right: 1px solid var(--border-color);
	}

	.sidebar-header {
		margin-bottom: 2.5rem;
	}

	.logo {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.logo h2 {
		font-size: 1.25rem;
		font-weight: 800;
		letter-spacing: -0.02em;
		color: var(--text-primary);
	}

	.sidebar-nav {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		flex: 1;
	}

	.nav-item {
		padding: 0.75rem 1rem;
		border-radius: var(--radius-sm);
		color: var(--text-secondary);
		font-weight: 600;
		transition: all var(--transition);
		display: block;
		width: 100%;
		text-align: left;
		background: transparent;
		border: none;
		cursor: pointer;
		font-size: 0.95rem;
		text-decoration: none;
	}

	.nav-item:hover {
		background: var(--bg-primary);
		color: var(--text-primary);
	}

	.nav-item.active {
		background: rgba(79, 70, 229, 0.08);
		color: var(--accent-color);
	}

	.nav-item.active::before {
		content: '';
		position: absolute;
		left: 0;
		top: 50%;
		transform: translateY(-50%);
		height: 60%;
		width: 3px;
		background: var(--accent-color);
		border-radius: 0 4px 4px 0;
	}

	/* LE FIX : Prise en charge moderne de l'espace à droite */
	.main-content {
		flex: 1;
		min-width: 0; /* TRÈS IMPORTANT : empêche l'éclatement de la grille flex à cause de contenus larges */
		height: 100%;
		overflow-y: auto; /* Défilement de la page géré ici uniquement */
	}

	.logout-btn {
		color: var(--danger-color);
		font-weight: 600;
	}

	.logout-btn:hover {
		background: #fee2e2;
		color: #b91c1c;
	}

	/* ── Client Layout (Modernisé) ────────────────────────────── */
	.client-layout {
		height: 100vh;
		display: flex;
		flex-direction: column;
		background: var(--bg-primary);
		overflow: hidden;
	}

	.client-header {
		background: var(--bg-secondary);
		border-bottom: 1px solid var(--border-color);
		padding: 1rem 2rem;
		width: 100%;
	}

	.client-header-inner {
		display: flex;
		align-items: center;
		justify-content: space-between;
		max-width: var(--max-width, 1280px);
		margin: 0 auto;
		width: 100%;
	}

	.client-badge {
		font-size: 0.68rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		background: rgba(79, 70, 229, 0.1);
		color: var(--accent-color);
		border: 1px solid rgba(79, 70, 229, 0.15);
		padding: 0.2rem 0.6rem;
		border-radius: 100px;
		margin-left: 0.5rem;
	}

	.client-info {
		display: flex;
		align-items: center;
		gap: 1.25rem;
	}

	.client-name {
		font-weight: 700;
		font-size: 0.95rem;
		color: var(--text-primary);
	}

	.btn-logout {
		background: var(--bg-primary);
		border: 1px solid var(--border-color);
		color: var(--text-secondary);
		padding: 0.5rem 1rem;
		border-radius: var(--radius-sm);
		font-size: 0.85rem;
		cursor: pointer;
		transition: all var(--transition);
		font-family: var(--font-main);
		font-weight: 600;
	}

	.btn-logout:hover {
		background: #fee2e2;
		border-color: #fca5a5;
		color: #b91c1c;
	}

	.client-main {
		flex: 1;
		overflow-y: auto;
		width: 100%;
	}

	@media (max-width: 768px) {
		.client-header {
			padding: 1rem;
		}
		.client-badge {
			display: none;
		}
	}
</style>

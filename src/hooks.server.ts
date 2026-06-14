import { createDb } from '$lib/server/db';
import { users, clients } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { jwtVerify } from 'jose';
import type { Handle } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

// Use environment variable for JWT secret
const JWT_SECRET = env.JWT_SECRET || 'super-secret-jwt-key-dev-only'; // In production, use environment variable

// Routes accessibles uniquement aux clients
const CLIENT_ONLY_ROUTES = ['/client-portal'];
// Routes accessibles uniquement aux users (pas aux clients)
const USER_ONLY_ROUTES = ['/', '/projects', '/clients', '/payments', '/users'];

export const handle: Handle = async ({ event, resolve }) => {
	// Validate database connection exists
	if (!event.platform?.env?.DB) {
		console.error('Database connection not available');
		return new Response('Internal Server Error', { status: 500 });
	}
	
	event.locals.db = createDb(event.platform.env.DB);

	// Auth via JWT in cookie
	const token = event.cookies.get('session_token');
	event.locals.user = null;
	event.locals.client = null;

	if (token) {
		try {
			const secret = new TextEncoder().encode(JWT_SECRET);
			const { payload } = await jwtVerify(token, secret);
			// userId contient désormais le userName pour les users, ou l'uuid pour les clients
			const decoded = payload as { userId: string; type: 'user' | 'client'; exp?: number };

			// Check token expiration
			if (decoded.exp && decoded.exp < Date.now() / 1000) {
				event.cookies.delete('session_token', { path: '/' });
				return new Response('Session expired', { status: 401 });
			}

			if (decoded.type === 'client') {
				// Session client → recherche par uuid
				const client = await event.locals.db
					.select()
					.from(clients)
					.where(eq(clients.uuid, decoded.userId))
					.get();
				if (client) {
					event.locals.client = client;
				}
			} else {
				// Session user → recherche par userName (PK)
				const user = await event.locals.db
					.select()
					.from(users)
					.where(eq(users.userName, decoded.userId))
					.get();
				if (user && user.isActive === 1) {
					event.locals.user = user;
				}
			}
		} catch (err: any) {
			// Invalid token - clear cookie and log error
			event.cookies.delete('session_token', { path: '/' });
			console.error('Authentication error:', err.message);
		}
	}

	const path = event.url.pathname;

	// Pas connecté → login
	if (path !== '/login' && !event.locals.user && !event.locals.client) {
		return new Response('Redirect', { status: 303, headers: { Location: '/login' } });
	}

	// Client connecté → accès limité au portail client
	if (event.locals.client && !event.locals.user) {
		// Use precise path matching instead of startsWith
		const isAllowed = 
			path === '/login' ||
			path === '/client-portal' ||  // Exact match instead of prefix
			path.startsWith('/client-portal/');

		if (!isAllowed) {
			return new Response('Redirect', { status: 303, headers: { Location: '/client-portal' } });
		}
	}

	return resolve(event);
};

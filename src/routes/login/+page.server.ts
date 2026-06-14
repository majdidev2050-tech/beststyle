import { fail, redirect } from '@sveltejs/kit';
import { users, clients } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { SignJWT } from 'jose';

const JWT_SECRET = 'super-secret-jwt-key-dev-only';

export const actions = {
	login: async ({ request, locals, cookies }) => {
		const data = await request.formData();
		const email = data.get('email')?.toString();
		const password = data.get('password')?.toString();

		if (!email || !password) {
			return fail(400, { email, missing: true });
		}

		const secret = new TextEncoder().encode(JWT_SECRET);

		// 1. Essayer d'abord de trouver un user
		const user = await locals.db.select().from(users).where(eq(users.email, email)).get();

		if (user && user.passwordHash === password) {
			// Connexion user réussie — userId = userName (PK)
			const token = await new SignJWT({ userId: user.userName, type: 'user' })
				.setProtectedHeader({ alg: 'HS256' })
				.setIssuedAt()
				.setExpirationTime('7d')
				.sign(secret);

			cookies.set('session_token', token, {
				path: '/',
				httpOnly: true,
				sameSite: 'lax',
				secure: process.env.NODE_ENV === 'production',
				maxAge: 60 * 60 * 24 * 7
			});

			throw redirect(303, '/');
		}

		// 2. Essayer de trouver un client par user_login
		// Condition : user_login ET password_hash doivent être non-null et non-vides
		if (!user) {
			const loginValue = email; // le champ "email" du formulaire sert de login client aussi
			const client = await locals.db
				.select()
				.from(clients)
				.where(eq(clients.userLogin, loginValue))
				.get();

			// Accès autorisé uniquement si user_login ET password_hash sont renseignés
			if (
				client &&
				client.userLogin && client.userLogin.trim() !== '' &&
				client.passwordHash && client.passwordHash.trim() !== '' &&
				client.passwordHash === password
			) {
				// Connexion client réussie — userId = uuid du client
				const token = await new SignJWT({ userId: client.uuid, type: 'client' })
					.setProtectedHeader({ alg: 'HS256' })
					.setIssuedAt()
					.setExpirationTime('7d')
					.sign(secret);

				cookies.set('session_token', token, {
					path: '/',
					httpOnly: true,
					sameSite: 'lax',
					secure: process.env.NODE_ENV === 'production',
					maxAge: 60 * 60 * 24 * 7
				});

				throw redirect(303, '/client-portal');
			}
		}

		// 3. Bootstrap premier SUPER_ADMIN si aucun user n'existe
		const allUsers = await locals.db.select().from(users).all();
		if (allUsers.length === 0) {
			const bootstrapUserName = email.split('@')[0].toLowerCase().replace(/[^a-z0-9.]/g, '.');
			await locals.db.insert(users).values({
				userName: bootstrapUserName,
				firstName: 'Admin',
				lastName: 'User',
				email: email,
				passwordHash: password,
				role: 'SUPER_ADMIN'
			});

			const token = await new SignJWT({ userId: bootstrapUserName, type: 'user' })
				.setProtectedHeader({ alg: 'HS256' })
				.setIssuedAt()
				.setExpirationTime('7d')
				.sign(secret);

			cookies.set('session_token', token, {
				path: '/',
				httpOnly: true,
				sameSite: 'lax',
				secure: process.env.NODE_ENV === 'production',
				maxAge: 60 * 60 * 24 * 7
			});

			throw redirect(303, '/');
		}

		return fail(400, { email, incorrect: true });
	},

	logout: async ({ cookies }) => {
		cookies.delete('session_token', { path: '/' });
		throw redirect(303, '/login');
	}
};

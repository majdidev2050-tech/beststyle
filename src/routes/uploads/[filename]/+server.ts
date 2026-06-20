import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, platform }) => {
	const filename = params.filename;
	if (!filename) {
		throw error(400, 'Invalid filename');
	}

	const bucket = platform?.env?.BUCKET;
	if (!bucket) {
		throw error(500, 'R2 storage not configured');
	}

	const object = await bucket.get(filename);
	if (!object) {
		throw error(404, 'File not found');
	}

	const headers = new Headers();
	object.writeHttpMetadata(headers);
	headers.set('etag', object.httpEtag);
	headers.set('cache-control', 'public, max-age=31536000');

	return new Response(object.body, {
		headers
	});
};

import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ url, request }) => {
	const action: string | null = url.searchParams.get('action');
	const request_body = await request.json();
	
	if (action == null) {
		return error(400, 'Bad request!');
	}

	return new Response('');
};

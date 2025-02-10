import { createNewSession } from '$lib/server/redis_server';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ getClientAddress }) => {
	const newly_created_session: String = await createNewSession(getClientAddress());
	let sess_id: string | boolean | undefined;
	await createNewSession(getClientAddress()).then(
		(r) => (sess_id = r.toString()),
		(r) => (sess_id = false)
	);
	if (sess_id == undefined) {
		return json({ error: 'An error occurred while creating a new session!' });
	}

	return json(
		typeof sess_id == 'string'
			? { new_session_id: newly_created_session }
			: { error: 'An error occurred while creating a new session!' }
	);
};

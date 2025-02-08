import { createNewSession } from '$lib/server/redis_server';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ getClientAddress }) => {
	const newly_created_session: String = await createNewSession(getClientAddress());
	return json({ new_session_id: newly_created_session });
};

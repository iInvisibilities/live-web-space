import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSessionData, updateSessionData } from '$lib/server/redis_server';
import { addViewer, isAlreadyViewer, type WebSession } from '$lib/manager/web_session';
import { provideTicket } from '$lib/manager/join_tickets_manager';

export const POST: RequestHandler = async ({ getClientAddress, request }) => {
	const { session_id } = await request.json();
	const clientAddr = getClientAddress();
	if (session_id == undefined) {
		return error(400, 'Bad request!');
	}

	let session_to_join: WebSession | null = await getSessionData(session_id);
	if (session_to_join == null) {
		return error(400, 'Bad request!');
	}

	if (isAlreadyViewer(session_to_join, clientAddr)) {
		return json({ is_admin: session_to_join.creator_ip == clientAddr });
	}

	session_to_join = addViewer(session_to_join, clientAddr);
	await updateSessionData(session_id, session_to_join);

	provideTicket(clientAddr, session_id);
	// MAKE THE USER ISSUE THE WEBSOCKET CONNECTION FROM WITHIN HIS CLIENT.

	return json({ is_admin: session_to_join.creator_ip == clientAddr });
};

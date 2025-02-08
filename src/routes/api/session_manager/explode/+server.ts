import {
	destroySession,
	getOwnSession,
	getSessionData,
	isSessionCreator
} from '$lib/server/redis_server';
import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { kickViewer } from '$lib/manager/websocket_interpreter';

export const POST: RequestHandler = async ({ getClientAddress, request }) => {
	const own_session_id = await getOwnSession(getClientAddress());

	if (own_session_id == null) {
		return error(401, "You don't have an open session!");
	}

	const own_session = await getSessionData(own_session_id);
	if (own_session == null) {
		return error(401, "You don't have an open session!");
	}

	own_session.viewer_ips.forEach(kickViewer);
	await destroySession(own_session_id);

	return json('Successfully exploded your session!');
};

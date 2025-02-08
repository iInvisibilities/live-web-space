import { getOwnSession, getSessionData, updateSessionData } from '$lib/server/redis_server';
import { removeViewer } from '$lib/manager/web_session';
import { error, json, type RequestHandler } from '@sveltejs/kit';
import { kickViewer } from '$lib/manager/websocket_interpreter';

export const POST: RequestHandler = async ({ getClientAddress, request }) => {
	const kicker_session_id = await getOwnSession(getClientAddress());
	if (kicker_session_id == null) {
		return error(401, 'You are not a session creator!');
	}

	let kicker_session = await getSessionData(kicker_session_id);
	if (kicker_session == undefined) {
		return error(401, 'You are not a session creator!');
	}

	const { viewer_to_kick } = await request.json();
	if (viewer_to_kick == undefined) {
		return error(400, 'Bad request!');
	}

	kicker_session = removeViewer(kicker_session, viewer_to_kick);
	await updateSessionData(kicker_session_id, kicker_session);

	// CLOSES THE VIEWER'S WEBSOCKET SESSION
	kickViewer(viewer_to_kick);

	return json('Successfully kicked ' + viewer_to_kick + ' from your session!');
};

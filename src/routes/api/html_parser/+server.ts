import { updateViewerView } from '$lib/manager/websocket_interpreter';
import { getOwnSession, getSessionData } from '$lib/server/redis_server';
import { json } from '@sveltejs/kit';
import { randomUUID } from 'crypto';
import { JSDOM } from 'jsdom';

export const POST = async ({ getClientAddress, request }) => {
	const body = await request.json();
	const { html_content_to_be_serialized } = body;
	if (html_content_to_be_serialized == undefined) {
		return new Response('Bad request!', { status: 400 });
	}

	const viewers_created_session_id = await getOwnSession(getClientAddress());
	if (viewers_created_session_id == null) {
		return new Response('Unauthorized!', { status: 401 });
	}

	const viewers_created_session = await getSessionData(viewers_created_session_id);
	if (viewers_created_session == null) {
		return new Response('man how the', { status: 401 });
	}

	const parsed_html_body = new JSDOM(html_content_to_be_serialized).window.document.body;

	const fresh_html = new JSDOM('');

	if (parsed_html_body == null) {
		return new Response('Bad request!', { status: 400 });
	}
	for (let i = 0; i < parsed_html_body.childNodes.length; i++) {
		const child = parsed_html_body.childNodes.item(i);
		child.id = randomUUID().toString().replace(/-/g, '');

		fresh_html.window.document.body.appendChild(child);
	}

	// broadcast newly added element to all session viewers!
	viewers_created_session.viewer_ips.forEach((session_viewer) => {
		updateViewerView(<string>session_viewer, {
			type: 'ELEMENT_ADDED',
			html: fresh_html.window.document.body.innerHTML,
			coordinates: undefined
		});
	});

	return json({ serialized_html: fresh_html.window.document.body.innerHTML });
};

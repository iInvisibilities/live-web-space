import { SECRET_BRIDGE_KEY } from '$env/static/private';
import {
	destroySession,
	getOwnSession,
	getSessionData,
	updateSessionData
} from '$lib/server/redis_server';
import type {
	ClientEvent,
	SocketEvent,
	UpdateViewEvent,
	UserEvent,
	UserInteractEvent,
	UserUpdateViewEvent
} from '$lib/shared_types';
import { WebSocket } from 'ws';
import type { MessageEvent } from 'ws';
import { removeViewer } from './web_session';
import { hasTicket, ticketUsed } from './join_tickets_manager';

export let ws: WebSocket;

export const waiting_to_connect_back: String[] = [];

export const connectToWebSocket = () => {
	if (ws != undefined) {
		console.log('WebSocket already connected, skipping...');
		return;
	}

	ws = new WebSocket('ws://localhost:3000/admin', SECRET_BRIDGE_KEY);
	ws.onopen = function () {
		ws.send('something');
	};

	ws.onmessage = (event: MessageEvent) => {
		let socket_touch: UserEvent | UserInteractEvent;
		try {
			socket_touch = JSON.parse(event.data.toString());
		} catch (error) {
			ws.send('Unvalid JSON!');
			return;
		}
		const event_type: ClientEvent | SocketEvent | undefined = socket_touch['event_type'];

		if (
			event_type == undefined ||
			socket_touch['viewer_ip'] == undefined ||
			socket_touch['session_id'] == undefined ||
			(socket_touch['event_type'] == 'USER_INTERACT_ATTEMPT' &&
				(<UserInteractEvent>socket_touch)['interaction_data'] == undefined)
		) {
			ws.send('Unvalid!');
			return;
		}

		switch (event_type) {
			case 'USER_JOIN_ATTEMPT':
				handleViewerJoinAttemptEvent(socket_touch['viewer_ip'], socket_touch['session_id']);
				break;
			case 'USER_LEAVE_ATTEMPT':
				handleViewerLeaveAttemptEvent(socket_touch['viewer_ip'], socket_touch['session_id']);
				break;
			case 'USER_INTERACT_ATTEMPT':
				handleViewerInteractAttemptEvent(
					socket_touch['viewer_ip'],
					socket_touch['session_id'],
					<UpdateViewEvent>(<UserInteractEvent>socket_touch)['interaction_data']
				);
				break;
			default:
				ws.send('Unvalid!');
				return;
		}
	};

	console.log('Connected to the WebSocket server!');
};

// This event should only be triggered once the user hit the /api/session_manager/join endpoint
// So it's going to get triggererd AFTER the user has been added to the redis cache!
export const handleViewerJoinAttemptEvent = async (viewer_ip: string, session_id: string) => {
	let viewer_redis_stored_session = await getSessionData(session_id);
	if (viewer_redis_stored_session == null) return;

	if (
		viewer_redis_stored_session.creator_ip == viewer_ip &&
		waiting_to_connect_back.includes(viewer_ip)
	) {
		console.log('A session creator joined back the session');
		waiting_to_connect_back.splice(waiting_to_connect_back.indexOf(viewer_ip), 1);
		return;
	}

	if (
		(viewer_redis_stored_session.creator_ip != viewer_ip &&
			!viewer_redis_stored_session.viewer_ips.includes(viewer_ip)) ||
		!hasTicket(viewer_ip, session_id)
	) {
		kickViewer(viewer_ip);
		ticketUsed(viewer_ip);
	}
};
export const handleViewerLeaveAttemptEvent = async (viewer_ip: string, session_id: string) => {
	let viewer_redis_stored_session = await getSessionData(session_id);
	if (viewer_redis_stored_session == null) return;

	if (viewer_redis_stored_session.creator_ip == viewer_ip) {
		viewer_redis_stored_session.viewer_ips.forEach((viewer_ip_user) =>
			notifyViewer(
				viewer_ip_user,
				"The session creator left, if they don't connect back in 10 minutes, the session will be terminated and everyone will get kicked out."
			)
		);
		waiting_to_connect_back.push(viewer_ip);
		console.log('A session creator left the session');

		setTimeout(() => {
			if (viewer_redis_stored_session == null) return;

			if (waiting_to_connect_back.includes(viewer_ip)) {
				console.log("Session creator still ain't in the session");
				waiting_to_connect_back.splice(waiting_to_connect_back.indexOf(viewer_ip), 1);
				viewer_redis_stored_session.viewer_ips.forEach(kickViewer);
				destroySession(session_id);
			}
		}, 10000);
	}

	if (viewer_redis_stored_session.viewer_ips.includes(viewer_ip)) {
		viewer_redis_stored_session = removeViewer(viewer_redis_stored_session, viewer_ip);
		await updateSessionData(session_id, viewer_redis_stored_session);
	}
};

export const handleViewerInteractAttemptEvent = async (
	viewer_ip: string,
	session_id: string,
	interaction_data: UpdateViewEvent
) => {
	const viewer_session = await getOwnSession(viewer_ip);
	if (viewer_session == null || viewer_session != session_id) return;
	const session_data = await getSessionData(session_id);
	if (session_data == null) return;

	session_data.viewer_ips.forEach((innocent_viewer_ip) =>
		updateViewerView(<string>innocent_viewer_ip, interaction_data)
	);
};

export const notifyViewer = (viewer_ip: String, notification_message: String) => {
	const notification_event = {
		event_type: 'NOTIFICATION',
		viewer_ip: viewer_ip,
		notification_message: notification_message
	};

	ws.send(Buffer.from(JSON.stringify(notification_event)));
};

export const kickViewer = (viewer_ip: String) => {
	const kick_event = {
		event_type: 'KICK_VIEWER_EVENT',
		viewer_ip: viewer_ip
	};

	ws.send(Buffer.from(JSON.stringify(kick_event)));
};

export const updateViewerView = (viewer_ip: string, view_update_meta: UpdateViewEvent) => {
	const update_view_event: UserUpdateViewEvent = {
		event_type: 'UPDATE_VIEW',
		viewer_ip: viewer_ip,
		view_update_meta: view_update_meta
	};

	ws.send(Buffer.from(JSON.stringify(update_view_event)));
};

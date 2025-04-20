import { WebSocketServer } from 'ws';
import type WebSocket from 'ws';
import process from 'process';
import { UserEvent, UserInteractEvent } from './shared_types';

const SECRET_BRIDGE_KEY: string | undefined = process.env.SECRET_BRIDGE_KEY;

if (SECRET_BRIDGE_KEY == undefined) {
	console.log('how are you doing :)');
	process.exit();
}

const wss = new WebSocketServer({ port: 3000 });
let admin_socket: WebSocket | null = null;

const viewers: Map<string, WebSocket> = new Map();

wss.on('connection', async (socket, request) => {
	if ((request.url ?? '') == '/admin') {
		if (admin_socket != null) {
			console.log('An admin is already connected!, skipping through this connection.');

			return;
		}
		const auth_string = request.headers['sec-websocket-protocol'] ?? '';

		if (auth_string == '') {
			socket.close(1003, 'No auth string provided');
			return;
		}

		if (auth_string != SECRET_BRIDGE_KEY) {
			socket.close(1003, 'Not svelte server!');
			return;
		}

		admin_socket = socket;
		socket.on('message', (data) => admin_sent_command(data));
		socket.on('close', () => {
			console.log('Admin left, closing system...');
			wss.close();
			process.exit();
		});
		console.log('Admin joined, system should now be up and running!');

		return;
	}

	if (admin_socket == null) {
		socket.close(1002, "Admin didn't connect yet please wait for the server to fully open!");
		return;
	}

	let session_id: string = (request.url ?? '/').substring(1);
	if (session_id == '') {
		socket.close(1003, 'No session id provided!');
		return;
	}

	const joinAttemptEvent: UserEvent = {
		event_type: 'USER_JOIN_ATTEMPT',
		viewer_ip: request.socket.remoteAddress ?? '',
		session_id: session_id
	};
	admin_socket.send(Buffer.from(JSON.stringify(joinAttemptEvent)));

	socket.on('close', () => {
		const leaveAttemptEvent: UserEvent = {
			event_type: 'USER_LEAVE_ATTEMPT',
			viewer_ip: request.socket.remoteAddress ?? '',
			session_id: session_id
		};
		if (admin_socket != null) {
			admin_socket.send(Buffer.from(JSON.stringify(leaveAttemptEvent)));
		}
	});

	socket.on('message', (data) => {
		const interaction_data = JSON.parse(data.toString())['interaction_data'];
		if (interaction_data == undefined) {
			socket.close(undefined, 'naughty');
			return;
		}

		const userInteractEvent: UserInteractEvent = {
			event_type: 'USER_INTERACT_ATTEMPT',
			viewer_ip: request.socket.remoteAddress ?? '',
			session_id: session_id,
			interaction_data: interaction_data
		};

		if (admin_socket != null) {
			admin_socket.send(Buffer.from(JSON.stringify(userInteractEvent)));
		}
	});
});

const admin_sent_command = (data: WebSocket.RawData) => {
	let admin_command: object;
	try {
		admin_command = JSON.parse(data.toString());
	} catch (error) {
		admin_socket?.send('Unvalid JSON!');
		return;
	}

	if (admin_command['event_type'] == undefined) return;

	const viewer_ip = admin_command['viewer_ip'];
	const viewer_socket_conn: WebSocket | undefined = viewers.get(viewer_ip);
	if (viewer_socket_conn == undefined) return;

	switch (admin_command['event_type']) {
		case 'KICK_VIEWER_EVENT':
			viewer_socket_conn.send(
				Buffer.from(
					JSON.stringify({
						event_type: 'NOTIFICATION',
						notification_message: 'You got kicked.'
					})
				)
			);
			viewer_socket_conn.close();
			viewers.delete(viewer_ip);
			break;
		case 'UPDATE_VIEW':
			viewer_socket_conn.send(
				Buffer.from(
					JSON.stringify({
						event_type: 'UPDATE_VIEW',
						view_update_meta: admin_command['view_update_meta']
					})
				)
			);
			break;
		case 'NOTIFICATION':
			viewer_socket_conn.send(
				Buffer.from(
					JSON.stringify({
						event_type: 'NOTIFICATION',
						notification_message: admin_command['notification_message']
					})
				)
			);
	}
};

export type SocketEvent = 'USER_JOIN_ATTEMPT' | 'USER_LEAVE_ATTEMPT' | 'USER_INTERACT_ATTEMPT';
export type ClientEvent = 'KICK_VIEWER_EVENT' | 'UPDATE_VIEW';

export type NotSoSharedTypeButOnlyCommuncatedThroughWebSocketAndViewers =
	| 'UPDATE_VIEW'
	| 'YOU_GOT_KICKED_BABYYY'
	| 'VIEWER_LEFT';

export type UserEvent = {
	event_type: SocketEvent | ClientEvent;
	viewer_ip: string;
	session_id: string;
};

export type UserInteractEvent = {
	event_type: 'USER_INTERACT_ATTEMPT';
	viewer_ip: string;
	session_id: string;
	interaction_data: object;
};

export type UserUpdateViewEvent = {
	event_type: 'UPDATE_VIEW';
	viewer_ip: string;
	view_update_meta: object;
};

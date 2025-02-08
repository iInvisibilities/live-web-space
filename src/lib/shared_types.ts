export type SocketEvent = 'USER_JOIN_ATTEMPT' | 'USER_LEAVE_ATTEMPT' | 'USER_INTERACT_ATTEMPT';
export type ClientEvent = 'KICK_VIEWER_EVENT' | 'UPDATE_VIEW';

export type ElementMovement = { id: string; x: number; y: number };

export type UpdateViewEvent = {
	type: 'ELEMENT_ADDED' | 'ELEMENT_REMOVED' | 'ELEMENT_MOVED';
	html: string | undefined;
	coordinates: [ElementMovement] | undefined;
};

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

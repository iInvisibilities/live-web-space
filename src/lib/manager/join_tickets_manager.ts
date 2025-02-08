import { tickets_map } from '../../hooks.server';

export const provideTicket = (viewer_ip: string, session_id: string) => {
	tickets_map.set(viewer_ip, session_id);
};

export const hasTicket = (supposed_viewer_ip: string, session_id: string): boolean =>
	tickets_map.has(supposed_viewer_ip) && tickets_map.get(supposed_viewer_ip) == session_id;

export const ticketUsed = (viewer_ip: string) => tickets_map.delete(viewer_ip);

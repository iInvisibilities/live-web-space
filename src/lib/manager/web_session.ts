export interface WebSession {
	creator_ip: string;
	viewer_ips: Array<String>;
}

export const toObj = (creator_ip: string, viewer_ips: Array<String>): WebSession => {
	return { creator_ip, viewer_ips };
};

export const isAlreadyViewer = (sessionObj: WebSession, viewer_ip: string): boolean => {
	return sessionObj.creator_ip == viewer_ip || sessionObj.viewer_ips.indexOf(viewer_ip) != -1;
};

export const addViewer = (sessionObj: WebSession, viewer_ip: string): WebSession => {
	const viewers: Array<String> = sessionObj['viewer_ips'];
	viewers.push(viewer_ip);
	sessionObj['viewer_ips'] = viewers;

	return sessionObj;
};

export const removeViewer = (sessionObj: WebSession, viewer_ip: string): WebSession => {
	const viewers: Array<String> = sessionObj['viewer_ips'];
	viewers.splice(viewers.indexOf(viewer_ip), 1);
	sessionObj['viewer_ips'] = viewers;

	return sessionObj;
};

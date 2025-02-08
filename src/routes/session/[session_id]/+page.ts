import type { PageLoad } from './$types';

export const ssr = false;

export const load: PageLoad = async ({ params, fetch }) => {
	const session_id: string = params.session_id;

	let is_admin: boolean = false;

	const join_request = await fetch('/api/session_manager/join', {
		method: 'POST',
		body: JSON.stringify({ session_id: session_id })
	});

	if (join_request.ok) {
		let join_json = await join_request.json();
		is_admin = join_json['is_admin'];
	}

	return { can_join: join_request.ok, is_admin: is_admin, session_id: session_id };
};

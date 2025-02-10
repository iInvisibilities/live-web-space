import type { WebSession } from '../manager/web_session';
import { randomUUID } from 'crypto';
import Redis from 'ioredis';
import { deserialize, serialize } from 'v8';
import { REDIS_URI } from '$env/static/private';

export let redis: Redis;

export const connectToRedis = () => {
	if (redis != undefined) {
		console.log('Redis already connected, skipping!');
		return;
	}

	redis = new Redis(REDIS_URI);
	console.log('Connected to the redis server!');
};

export const createNewSession = async (creator_ip: string): Promise<String> => {
	return new Promise(async (resolve, reject) => {
		const current_session_count = (await redis.dbsize()) / 2;
		if (current_session_count >= 100) {
			reject('Too many sessions are already created, please return back soon!');
			return;
		}

		const new_session: WebSession = { creator_ip, viewer_ips: [] };
		const new_session_id = randomUUID();
		let session_creation_process = await redis.set(new_session_id, serialize(new_session));
		if (session_creation_process != 'OK') {
			reject("Session couldn't be created!");
			return;
		}

		let session_signing_process = await redis.set(creator_ip, new_session_id);
		if (session_signing_process != 'OK') {
			reject("Session couldn't be created (signing phase)!");
			await redis.del(new_session_id);
			return;
		}

		// max redis session lifespan
		await redis.expire(new_session_id, 7200);
		await redis.expire(creator_ip, 7200);

		resolve(new_session_id);
	});
};

export const getOwnSession = async (viewer_ip: string) => {
	return await redis.get(viewer_ip);
};

export const isSessionCreator = async (session_id: string, viewer_ip: string) => {
	const viewer_ip_owned_session = await redis.get(viewer_ip);
	if (viewer_ip_owned_session != null && viewer_ip_owned_session == session_id) {
		return true;
	}

	return false;
};

export const destroySession = async (session_id: string) => {
	const session_buffer: Buffer<ArrayBufferLike> | null = await redis.getBuffer(session_id);
	if (session_buffer == null) return;

	const session_data: WebSession = deserialize(session_buffer);
	if (session_data == null) return;

	await redis.del(session_data.creator_ip);
	await redis.del(session_id);
};

export const updateSessionData = async (session_id: string, updated_session: WebSession) => {
	await redis.set(session_id, serialize(updated_session));
};

export const getSessionData = async (session_id: string): Promise<WebSession | null> => {
	return new Promise(async (resolve, reject) => {
		const session_buffer: Buffer<ArrayBufferLike> | null = await redis.getBuffer(session_id);
		if (session_buffer == null) {
			resolve(null);
		} else resolve(deserialize(session_buffer));
	});
};

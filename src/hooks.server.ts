import { connectToWebSocket } from '$lib/manager/websocket_interpreter';
import { connectToRedis } from '$lib/server/redis_server';
import type { ServerInit } from '@sveltejs/kit';

export let tickets_map: Map<String, String>;

export const init: ServerInit = async () => {
	tickets_map = new Map();

	connectToRedis();
	connectToWebSocket();
};

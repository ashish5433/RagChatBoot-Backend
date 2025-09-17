import { createClient } from 'redis';
import dotenv from 'dotenv';
dotenv.config();

const REDIS_URL = process.env.REDIS_URL;
let client;

export async function initRedis() {
    if (client && client.isOpen) return;
    client = createClient({ url: REDIS_URL });
    client.on('error', (err) => console.log('Redis Client Error', err));
    await client.connect();
    console.log('Connected to Redis');
}

function getSessionKey(sessionId) {
    return `session:${sessionId}`;
}


export async function getFullSessionHistory(sessionId) {
    if (!client) await initRedis();
    const key = getSessionKey(sessionId);
    const history = await client.lRange(key, 0, -1);
    return history.map(item => JSON.parse(item));
}


export async function getSessionHistory(sessionId, limit = 2) {
    if (!client) await initRedis();
    const key = getSessionKey(sessionId);
    const history = await client.lRange(key, -limit, -1);
    return history.map(item => JSON.parse(item));
}

export async function pushSessionEntry(sessionId, entry) {
    if (!client) await initRedis();
    const key = getSessionKey(sessionId);
    await client.rPush(key, JSON.stringify(entry));
    await client.lTrim(key, -100, -1);

    await client.expire(key,  60 * 60);
}

export async function clearSessionHistory(sessionId) {
    if (!client) await initRedis();
    const key = getSessionKey(sessionId);
    await client.del(key);
}

initRedis().catch(console.error);